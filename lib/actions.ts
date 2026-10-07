"use server";

import { revalidatePath } from "next/cache";
import { Prisma, Patient } from "@prisma/client";
import { prisma } from "./prisma";
import { cleanAndValidateRut, normalizePhone, patientSchema, PatientFormData } from "./schemas";

// --- TIPOS DE RETORNO PARA PACIENTES ---
export type PatientActionResult =
  | { success: true; patient?: Patient }
  | {
      success: false;
      error: string;
      isInactive?: boolean;
      existingPatient?: Patient | null;
    };

function isUniqueConstraintError(error: unknown) {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002";
}

// Convierte "YYYY-MM-DD" a fecha UTC (evita corrimientos de día por zona horaria)
function parseBirthDate(value?: string) {
  if (!value) return null;
  const date = new Date(`${value}T00:00:00.000Z`);
  return isNaN(date.getTime()) ? null : date;
}

// Valida en el servidor y deja los datos listos para guardar
function preparePatientData(data: PatientFormData) {
  const parsed = patientSchema.safeParse(data);
  if (!parsed.success) {
    return { ok: false as const, error: parsed.error.issues[0]?.message ?? "Datos del paciente inválidos." };
  }

  const values = parsed.data;
  return {
    ok: true as const,
    data: {
      rut: cleanAndValidateRut(values.rut).formatted,
      firstName: values.firstName.trim(),
      lastName: values.lastName.trim(),
      email: values.email ? values.email.trim().toLowerCase() : null,
      phone: values.phone ? normalizePhone(values.phone) : null,
      prevision: values.prevision,
      birthDate: parseBirthDate(values.birthDate),
    },
  };
}

// --- VALIDACIONES DE UNICIDAD Y VERIFICACIONES EN TIEMPO REAL ---

export async function checkRutExists(rut: string, excludeId?: string) {
  try {
    const { formatted } = cleanAndValidateRut(rut);
    const patient = await prisma.patient.findFirst({
      where: {
        rut: formatted || rut,
        ...(excludeId ? { id: { not: excludeId } } : {}),
      },
    });
    return { exists: !!patient, patient };
  } catch {
    return { exists: false, patient: null };
  }
}

export async function checkPatientEmailExists(email: string, excludeId?: string) {
  try {
    const patient = await prisma.patient.findFirst({
      where: {
        email: { equals: email.trim(), mode: "insensitive" },
        ...(excludeId ? { id: { not: excludeId } } : {}),
      },
    });
    return { exists: !!patient };
  } catch {
    return { exists: false };
  }
}

export async function checkPhoneExists(phone: string, excludeId?: string) {
  try {
    const patient = await prisma.patient.findFirst({
      where: {
        phone: normalizePhone(phone),
        ...(excludeId ? { id: { not: excludeId } } : {}),
      },
    });
    return { exists: !!patient };
  } catch {
    return { exists: false };
  }
}

export async function checkEmailExists(email: string, excludeId?: string) {
  try {
    const user = await prisma.user.findFirst({
      where: {
        email: email,
        ...(excludeId ? { id: { not: excludeId } } : {}),
      },
    });
    return { exists: !!user };
  } catch {
    return { exists: false };
  }
}

// --- PACIENTES ---

// Detección de duplicados probables: mismo nombre y apellido, o misma fecha de nacimiento con nombre o apellido coincidente
export async function checkDuplicatePatient(firstName: string, lastName: string, birthDate?: string) {
  try {
    const cleanFirstName = firstName.trim();
    const cleanLastName = lastName.trim();
    const birth = parseBirthDate(birthDate);

    const duplicates = await prisma.patient.findMany({
      where: {
        OR: [
          {
            AND: [
              { firstName: { contains: cleanFirstName, mode: "insensitive" } },
              { lastName: { contains: cleanLastName, mode: "insensitive" } },
            ],
          },
          ...(birth
            ? [
                {
                  birthDate: birth,
                  OR: [
                    { firstName: { contains: cleanFirstName, mode: "insensitive" as const } },
                    { lastName: { contains: cleanLastName, mode: "insensitive" as const } },
                  ],
                },
              ]
            : []),
        ],
      },
      select: {
        id: true,
        rut: true,
        firstName: true,
        lastName: true,
        birthDate: true,
        active: true,
      },
      take: 10,
    });

    return { success: true, duplicates };
  } catch (error) {
    console.error("Error al comprobar duplicados:", error);
    return { success: false, duplicates: [] };
  }
}

export async function createPatient(data: PatientFormData): Promise<PatientActionResult> {
  const prepared = preparePatientData(data);
  if (!prepared.ok) return { success: false, error: prepared.error };

  try {
    const existingPatient = await prisma.patient.findUnique({
      where: { rut: prepared.data.rut },
    });

    if (existingPatient) {
      if (existingPatient.active) {
        return {
          success: false,
          error: `El RUT ya pertenece al paciente activo: ${existingPatient.firstName} ${existingPatient.lastName}.`,
          existingPatient,
        };
      }
      return {
        success: false,
        isInactive: true,
        error: `El RUT pertenece a un paciente inactivo (${existingPatient.firstName} ${existingPatient.lastName}). ¿Deseas reactivarlo?`,
        existingPatient,
      };
    }

    const newPatient = await prisma.patient.create({
      data: { ...prepared.data, active: true },
    });

    revalidatePath("/pacientes");
    revalidatePath("/agenda");
    return { success: true, patient: newPatient };
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      return { success: false, error: "Ya existe un paciente registrado con ese RUT." };
    }
    console.error("Error al crear paciente:", error);
    return { success: false, error: "No se pudo registrar el paciente." };
  }
}

export async function updatePatient(patientId: string, data: PatientFormData): Promise<PatientActionResult> {
  const prepared = preparePatientData(data);
  if (!prepared.ok) return { success: false, error: prepared.error };

  try {
    const rutOwner = await prisma.patient.findFirst({
      where: { rut: prepared.data.rut, id: { not: patientId } },
    });
    if (rutOwner) {
      return {
        success: false,
        error: `El RUT ya pertenece a otro paciente: ${rutOwner.firstName} ${rutOwner.lastName}.`,
      };
    }

    const updatedPatient = await prisma.patient.update({
      where: { id: patientId },
      data: prepared.data,
    });

    revalidatePath("/pacientes");
    revalidatePath(`/pacientes/${patientId}`, "layout");
    revalidatePath("/agenda");
    return { success: true, patient: updatedPatient };
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      return { success: false, error: "Ya existe otro paciente registrado con ese RUT." };
    }
    console.error("Error al actualizar paciente:", error);
    return { success: false, error: "No se pudo actualizar el paciente." };
  }
}

export async function reactivatePatient(patientId: string) {
  try {
    await prisma.patient.update({
      where: { id: patientId },
      data: { active: true },
    });
    revalidatePath("/pacientes");
    revalidatePath(`/pacientes/${patientId}`, "layout");
    revalidatePath("/agenda");
    return { success: true };
  } catch (error) {
    console.error("Error al reactivar paciente:", error);
    return { success: false, error: "No se pudo reactivar el paciente." };
  }
}

// Cambiar estado Activo / Inactivo (sin eliminación física)
export async function togglePatientStatus(patientId: string, currentStatus: boolean) {
  try {
    await prisma.patient.update({
      where: { id: patientId },
      data: { active: !currentStatus },
    });
    revalidatePath("/pacientes");
    revalidatePath(`/pacientes/${patientId}`, "layout");
    revalidatePath("/agenda");
    return { success: true };
  } catch (error) {
    console.error("Error al cambiar estado del paciente:", error);
    return { success: false, error: "No se pudo actualizar el estado del paciente." };
  }
}

export async function updateOdontogram(patientId: string, odontogramData: Record<string, unknown>) {
  try {
    const updatedPatient = await prisma.patient.update({
      where: { id: patientId },
      data: {
        odontogram: odontogramData as Prisma.InputJsonValue,
      },
    });

    revalidatePath(`/pacientes/${patientId}`, "layout");
    return { success: true, patient: updatedPatient };
  } catch (error) {
    console.error("Error al actualizar odontograma:", error);
    return { success: false, error: "No se pudo actualizar el odontograma clínico." };
  }
}

// --- AGENDA Y CITAS ---

export async function getAppointments(startDate: Date, endDate: Date, dentistId?: string) {
  try {
    const appointments = await prisma.appointment.findMany({
      where: {
        date: { gte: startDate, lte: endDate },
        ...(dentistId ? { dentistId } : {}),
      },
      include: {
        patient: { select: { id: true, firstName: true, lastName: true, rut: true } },
        dentist: { select: { id: true, name: true } },
      },
      orderBy: { date: "asc" },
    });

    return { success: true, appointments };
  } catch (error) {
    console.error("Error al cargar citas:", error);
    return { success: false, error: "No se pudieron cargar las citas." };
  }
}

export async function createAppointment(data: {
  date: Date;
  patientId: string;
  dentistId: string;
  duration: number;
  notes?: string;
}) {
  try {
    if (data.date < new Date()) {
      return { success: false, error: "No puedes agendar citas en el pasado." };
    }

    const newAppointment = await prisma.appointment.create({
      data: {
        date: data.date,
        duration: data.duration,
        notes: data.notes,
        patientId: data.patientId,
        dentistId: data.dentistId,
        status: "AGENDADO",
      },
    });

    revalidatePath("/agenda");
    return { success: true, appointment: newAppointment };
  } catch (error) {
    console.error("Error al crear cita:", error);
    return { success: false, error: "No se pudo agendar la cita. Verifique los datos." };
  }
}

export async function updateAppointmentStatus(appointmentId: string, status: string) {
  try {
    const updated = await prisma.appointment.update({
      where: { id: appointmentId },
      data: { status },
    });
    revalidatePath("/agenda");
    return { success: true, appointment: updated };
  } catch {
    return { success: false, error: "Error al actualizar el estado de la cita." };
  }
}

export async function deleteAppointment(appointmentId: string) {
  try {
    await prisma.appointment.delete({ where: { id: appointmentId } });
    revalidatePath("/agenda");
    return { success: true };
  } catch {
    return { success: false, error: "No se pudo cancelar la cita." };
  }
}

// --- CATÁLOGO DE ARANCELES (TRATAMIENTOS) ---

export async function createTreatment(data: { name: string; price: number; category: string }) {
  try {
    const newTreatment = await prisma.treatment.create({
      data: {
        name: data.name,
        price: data.price,
        category: data.category,
      },
    });
    revalidatePath("/aranceles");
    return { success: true, treatment: newTreatment };
  } catch (error) {
    console.error("Error al crear tratamiento:", error);
    return { success: false, error: "No se pudo crear el tratamiento." };
  }
}

export async function deleteTreatment(id: string) {
  try {
    await prisma.treatment.delete({ where: { id } });
    revalidatePath("/aranceles");
    return { success: true };
  } catch {
    return { success: false, error: "No se puede eliminar porque ya está asociado a un presupuesto existente." };
  }
}

// --- LIQUIDACIONES ---

export async function getPayrollDetails(dentistId: string, month: number, year: number) {
  try {
    const periodStr = `${year}-${month.toString().padStart(2, "0")}`;
    const existingPayroll = await prisma.payroll.findFirst({
      where: { dentistId, period: periodStr },
    });

    const startDate = new Date(year, month - 1, 1);
    const endDate = existingPayroll?.closedAt ? existingPayroll.closedAt : new Date(year, month, 1);

    const dentist = await prisma.user.findUnique({ where: { id: dentistId } });
    if (!dentist) throw new Error("Dentista no encontrado");

    const payments = await prisma.payment.findMany({
      where: {
        createdAt: { gte: startDate, lt: endDate },
        budget: { dentistId },
      },
      include: {
        budget: {
          include: {
            patient: true,
            items: { include: { treatment: true } },
          },
        },
      },
      orderBy: { createdAt: "asc" },
    });

    const totalCollected = payments.reduce((sum, p) => sum + p.amount, 0);
    const doctorCut = Math.round(totalCollected * (dentist.commission / 100));

    const formattedPayments = payments.map((p) => {
      const treatmentNames = p.budget.items.map((item) => item.treatment.name).join(", ");

      return {
        id: p.id,
        date: p.createdAt,
        patientName: `${p.budget.patient.firstName} ${p.budget.patient.lastName}`,
        patientRut: p.budget.patient.rut,
        treatments: treatmentNames.length > 0 ? treatmentNames : "Abono general",
        amount: p.amount,
        method: p.method,
        doctorEarned: Math.round(p.amount * (dentist.commission / 100)),
      };
    });

    return {
      success: true,
      status: existingPayroll?.status || "BORRADOR",
      closedAt: existingPayroll?.closedAt,
      periodStr,
      dentistName: dentist.name,
      commissionRate: dentist.commission,
      totalCollected,
      doctorCut,
      payments: formattedPayments,
    };
  } catch {
    return { success: false, error: "Error al obtener detalles de la liquidación." };
  }
}

export async function closePayrollAction(dentistId: string, month: number, year: number, doctorCut: number) {
  try {
    const periodStr = `${year}-${month.toString().padStart(2, "0")}`;
    const existing = await prisma.payroll.findFirst({ where: { dentistId, period: periodStr } });

    if (existing?.status === "CERRADA") {
      return { success: false, error: "Esta liquidación ya fue cerrada." };
    }

    const now = new Date();

    if (existing) {
      await prisma.payroll.update({
        where: { id: existing.id },
        data: { status: "CERRADA", closedAt: now, totalPaid: doctorCut },
      });
    } else {
      await prisma.payroll.create({
        data: { dentistId, period: periodStr, totalPaid: doctorCut, status: "CERRADA", closedAt: now },
      });
    }

    revalidatePath("/liquidaciones");
    return { success: true };
  } catch {
    return { success: false, error: "Error al realizar el corte." };
  }
}

export async function getDashboardStats(month: number, year: number) {
  try {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 1);
    const periodStr = `${year}-${month.toString().padStart(2, "0")}`;

    const dentists = await prisma.user.findMany({ where: { role: "DENTISTA" } });

    let totalProduction = 0;
    let totalPending = 0;

    const dentistStats = await Promise.all(
      dentists.map(async (dentist) => {
        const payroll = await prisma.payroll.findFirst({
          where: { dentistId: dentist.id, period: periodStr },
        });

        const actualEndDate = payroll?.closedAt ? payroll.closedAt : endDate;

        const payments = await prisma.payment.findMany({
          where: {
            createdAt: { gte: startDate, lt: actualEndDate },
            budget: { dentistId: dentist.id },
          },
        });

        const production = payments.reduce((sum, p) => sum + p.amount, 0);
        const liquidToPay = Math.round(production * (dentist.commission / 100));

        totalProduction += production;
        totalPending += liquidToPay;

        return {
          id: dentist.id,
          name: dentist.name,
          commission: dentist.commission,
          production,
          liquidToPay,
          status: payroll?.status || "BORRADOR",
        };
      })
    );

    dentistStats.sort((a, b) => b.production - a.production);

    return {
      success: true,
      global: {
        totalProduction,
        totalPending,
        netMargin: totalProduction - totalPending,
      },
      dentists: dentistStats,
    };
  } catch {
    return { success: false, error: "Error al cargar las estadísticas del mes." };
  }
}

// --- PROFESIONALES ---

export async function createProfessional(data: {
  name: string;
  email: string;
  role: "ADMIN" | "DENTISTA" | "RECEPCIONISTA";
  commission?: number;
}) {
  try {
    const newUser = await prisma.user.create({
      data: {
        name: data.name,
        email: data.email,
        role: data.role,
        commission: data.commission ?? 0,
      },
    });

    revalidatePath("/profesionales");
    return { success: true, user: newUser };
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      return { success: false, error: "Ya existe un profesional con ese correo electrónico." };
    }
    console.error("Error al crear profesional:", error);
    return { success: false, error: "No se pudo registrar el profesional." };
  }
}

export async function getProfessionals() {
  try {
    const professionals = await prisma.user.findMany({ orderBy: { name: "asc" } });
    return { success: true, professionals };
  } catch (error) {
    console.error("Error al cargar profesionales:", error);
    return { success: false, error: "No se pudieron cargar los profesionales." };
  }
}
