"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "./prisma";
import { ScheduleBlockType } from "@prisma/client";
import { canTransitionTo } from "./appointmentState";

export type AppointmentStatus = 
  | "AGENDADA" 
  | "CONFIRMADA" 
  | "EN_ATENCION" 
  | "REALIZADA" 
  | "CANCELADA" 
  | "NO_ASISTIO" 
  | "REAGENDADA";

export type ActionResult = {
  success: boolean;
  error?: string;
  data?: { id: string };
};

// Función auxiliar para detectar conflictos de horario en Prisma
async function checkScheduleConflicts(params: {
  startDate: Date;
  endDate: Date;
  professionalId?: string | null;
  boxId?: string | null;
  patientId?: string | null;
  excludeAppointmentId?: string;
}): Promise<string | null> {
  const { startDate, endDate, professionalId, boxId, patientId, excludeAppointmentId } = params;

  // 1. Validar conflicto de paciente
  if (patientId) {
    const patientConflict = await prisma.appointment.findFirst({
      where: {
        id: excludeAppointmentId ? { not: excludeAppointmentId } : undefined,
        patientId,
        status: { in: ["AGENDADA", "CONFIRMADA", "EN_ATENCION"] },
        date: { lt: endDate },
        endDate: { gt: startDate },
      },
    });
    if (patientConflict) {
      return "El paciente ya tiene otra cita agendada en este mismo horario.";
    }
  }

  // 2. Validar conflicto de profesional
  if (professionalId) {
    const profConflict = await prisma.appointment.findFirst({
      where: {
        id: excludeAppointmentId ? { not: excludeAppointmentId } : undefined,
        professionalId,
        status: { in: ["AGENDADA", "CONFIRMADA", "EN_ATENCION"] },
        date: { lt: endDate },
        endDate: { gt: startDate },
      },
    });
    if (profConflict) {
      return "El profesional seleccionado ya tiene una cita asignada en este horario.";
    }
  }

  // 3. Validar conflicto de Box de atención
  if (boxId) {
    const boxConflict = await prisma.appointment.findFirst({
      where: {
        id: excludeAppointmentId ? { not: excludeAppointmentId } : undefined,
        boxId,
        status: { in: ["AGENDADA", "CONFIRMADA", "EN_ATENCION"] },
        date: { lt: endDate },
        endDate: { gt: startDate },
      },
    });
    if (boxConflict) {
      return "El Box de atención seleccionado ya se encuentra ocupado en este horario.";
    }
  }

  // 4. Validar Bloqueos de agenda
  const blockConflict = await prisma.scheduleBlock.findFirst({
    where: {
      startDate: { lt: endDate },
      endDate: { gt: startDate },
      OR: [
        { professionalId: professionalId || undefined },
        { boxId: boxId || undefined },
        { professionalId: null, boxId: null },
      ],
    },
  });

  if (blockConflict) {
    return `Horario bloqueado por motivo: "${blockConflict.reason}".`;
  }

  return null;
}

export async function createAppointment(data: {
  patientId: string;
  professionalId: string;
  boxId: string;
  procedureId: string;
  date: string;
  durationMin: number;
  isOverbook?: boolean;
  overbookReason?: string;
  userRole?: string;
}): Promise<ActionResult> {
  try {
    const startDate = new Date(data.date);
    const duration = Number(data.durationMin) || 30;
    const endDate = new Date(startDate.getTime() + duration * 60000);

    // Regla de negocio: Validación de Sobrecupo
    if (data.isOverbook) {
      if (data.userRole && !["ADMIN", "DENTISTA"].includes(data.userRole)) {
        return { success: false, error: "No posee permisos para autorizar sobrecupos." };
      }
      if (!data.overbookReason || data.overbookReason.trim() === "") {
        return { success: false, error: "Debe registrar un motivo para autorizar el sobrecupo." };
      }
    } else {
      // Validar disponibilidad
      const conflictError = await checkScheduleConflicts({
        startDate,
        endDate,
        professionalId: data.professionalId,
        boxId: data.boxId,
        patientId: data.patientId,
      });

      if (conflictError) {
        return { success: false, error: conflictError };
      }
    }

    const newAppointment = await prisma.appointment.create({
      data: {
        date: startDate,
        endDate: endDate,
        durationMin: duration,
        status: "AGENDADA",
        patientId: data.patientId,
        professionalId: data.professionalId,
        boxId: data.boxId || null,
        procedureId: data.procedureId || null,
        isOverbook: !!data.isOverbook,
        overbookReason: data.overbookReason || null,
      },
    });

    revalidatePath("/agenda");
    return { success: true, data: { id: newAppointment.id } };
  } catch (error) {
    console.error("Error al agendar cita:", error);
    return { success: false, error: "Error de servidor al registrar la cita." };
  }
}

export async function updateAppointmentStatus(
  id: string,
  newStatus: AppointmentStatus,
  cancelReason?: string
): Promise<ActionResult> {
  try {
    const current = await prisma.appointment.findUnique({
      where: { id },
      include: { patient: true },
    });
    if (!current) return { success: false, error: "La cita no existe." };

    if (!canTransitionTo(current.status, newStatus)) {
      return {
        success: false,
        error: `No es posible pasar directamente de ${current.status} a ${newStatus}.`,
      };
    }

    if (newStatus === "CANCELADA" && (!cancelReason || cancelReason.trim() === "")) {
      return { success: false, error: "Debe registrar obligatoriamente un motivo para cancelar la cita." };
    }

    await prisma.appointment.update({
      where: { id },
      data: {
        status: newStatus,
        cancelReason: newStatus === "CANCELADA" ? cancelReason : null,
      },
    });

    // LÓGICA AUTOMÁTICA DE CAJA Y COBROS
    // Si la cita finaliza como REALIZADA, verificamos presupuestos pendientes o aprobados
    if (newStatus === "REALIZADA") {
      const activeBudget = await prisma.budget.findFirst({
        where: {
          patientId: current.patientId,
          status: { in: ["PENDIENTE", "APROBADO"] },
        },
        orderBy: { createdAt: "desc" },
      });

      // Si existe un presupuesto PENDIENTE, podemos marcarlo como APROBADO para cobro en caja
      if (activeBudget && activeBudget.status === "PENDIENTE") {
        await prisma.budget.update({
          where: { id: activeBudget.id },
          data: { status: "APROBADO" },
        });
      }
    }

    revalidatePath("/agenda");
    return { success: true };
  } catch (error) {
    console.error("Error al actualizar estado de la cita:", error);
    return { success: false, error: "Error interno al actualizar el estado." };
  }
}

export async function rescheduleAppointment(
  originalAppointmentId: string,
  newData: {
    date: string;
    professionalId: string;
    boxId: string;
    procedureId: string;
    durationMin: number;
    isOverbook?: boolean;
    overbookReason?: string;
  }
): Promise<ActionResult> {
  try {
    const original = await prisma.appointment.findUnique({ where: { id: originalAppointmentId } });
    if (!original) return { success: false, error: "Cita original no encontrada." };

    if (!canTransitionTo(original.status, "REAGENDADA")) {
      return { success: false, error: `Una cita en estado ${original.status} no se puede reagendar.` };
    }

    const createRes = await createAppointment({
      patientId: original.patientId,
      professionalId: newData.professionalId,
      boxId: newData.boxId,
      procedureId: newData.procedureId,
      date: newData.date,
      durationMin: newData.durationMin,
      isOverbook: newData.isOverbook,
      overbookReason: newData.overbookReason,
    });

    if (!createRes.success || !createRes.data) {
      return createRes;
    }

    await prisma.appointment.update({
      where: { id: originalAppointmentId },
      data: { status: "REAGENDADA" },
    });

    revalidatePath("/agenda");
    return { success: true, data: createRes.data };
  } catch (error) {
    console.error("Error al reagendar:", error);
    return { success: false, error: "Error inesperado al procesar el reagendamiento." };
  }
}

export async function createScheduleBlock(data: {
  reason: string;
  type: ScheduleBlockType;
  startDate: string;
  endDate: string;
  professionalId?: string | null;
  boxId?: string | null;
}): Promise<ActionResult> {
  try {
    const block = await prisma.scheduleBlock.create({
      data: {
        reason: data.reason,
        type: data.type,
        startDate: new Date(data.startDate),
        endDate: new Date(data.endDate),
        professionalId: data.professionalId || null,
        boxId: data.boxId || null,
      },
    });

    revalidatePath("/agenda");
    return { success: true, data: { id: block.id } };
  } catch (error) {
    console.error("Error al crear bloqueo:", error);
    return { success: false, error: "No se pudo registrar el bloqueo en la agenda." };
  }
}