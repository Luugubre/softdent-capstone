"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "./prisma";
import { cleanAndValidateRut, professionalSchema, ProfessionalFormData } from "./schemas";

export type ActionResult<T = unknown> =
  | { success: true; data?: T }
  | { success: false; error: string };

export async function getActiveSpecialties() {
  try {
    const specialties = await prisma.specialty.findMany({
      where: { active: true },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    });
    return specialties;
  } catch (error) {
    console.error("Error al obtener especialidades:", error);
    return [];
  }
}

export async function createProfessional(data: ProfessionalFormData): Promise<ActionResult> {
  try {
    const validation = professionalSchema.safeParse(data);
    if (!validation.success) {
      const errorMsg = validation.error.issues.map((issue) => issue.message).join(", ");
      return { success: false, error: errorMsg };
    }

    const { formatted: normalizedRut } = cleanAndValidateRut(data.rut);

    const existingRut = await prisma.professional.findUnique({
      where: { rut: normalizedRut },
    });
    if (existingRut) {
      return { success: false, error: "El RUT ingresado ya pertenece a un profesional registrado." };
    }

    const existingRegister = await prisma.professional.findUnique({
      where: { professionalRegister: data.professionalRegister },
    });
    if (existingRegister) {
      return { success: false, error: "El Registro Profesional ya existe en el sistema (Profesional duplicado)." };
    }

    // Validar la especialidad solo si el rol es DENTISTA y se seleccionó una
    if (data.role === "DENTISTA" && data.specialtyId) {
      const specialty = await prisma.specialty.findUnique({
        where: { id: data.specialtyId },
      });
      if (!specialty || !specialty.active) {
        return { success: false, error: "La especialidad seleccionada no existe o se encuentra inactiva." };
      }
    }

    if (data.userId) {
      const existingUserRelation = await prisma.professional.findUnique({
        where: { userId: data.userId },
      });
      if (existingUserRelation) {
        return { success: false, error: "El usuario seleccionado ya está asociado a otro profesional." };
      }
    }

    // Normalización estricta para evitar incompatibilidad de tipos con Prisma
    const specialtyIdToSave = data.role === "DENTISTA" && data.specialtyId ? data.specialtyId : null;

    const newProfessional = await prisma.professional.create({
      data: {
        rut: normalizedRut,
        firstName: data.firstName,
        lastName: data.lastName,
        specialtyId: specialtyIdToSave,
        role: data.role,
        professionalRegister: data.professionalRegister,
        email: data.email || null,
        phone: data.phone || null,
        birthDate: data.birthDate ? new Date(data.birthDate) : null,
        userId: data.userId || null,
        active: true,
      },
    });

    revalidatePath("/profesionales");
    return { success: true, data: newProfessional };
  } catch (error) {
    console.error("Error al crear profesional:", error);
    return { success: false, error: "Error interno al guardar el profesional." };
  }
}

export async function updateProfessional(
  id: string,
  data: ProfessionalFormData
): Promise<ActionResult> {
  try {
    const validation = professionalSchema.safeParse(data);
    if (!validation.success) {
      const errorMsg = validation.error.issues.map((issue) => issue.message).join(", ");
      return { success: false, error: errorMsg };
    }

    const { formatted: normalizedRut } = cleanAndValidateRut(data.rut);

    const existingRut = await prisma.professional.findFirst({
      where: { rut: normalizedRut, NOT: { id } },
    });
    if (existingRut) {
      return { success: false, error: "El RUT ya está en uso por otro profesional." };
    }

    const existingRegister = await prisma.professional.findFirst({
      where: { professionalRegister: data.professionalRegister, NOT: { id } },
    });
    if (existingRegister) {
      return { success: false, error: "El Registro Profesional ya está asociado a otro profesional." };
    }

    if (data.role === "DENTISTA" && data.specialtyId) {
      const specialty = await prisma.specialty.findUnique({
        where: { id: data.specialtyId },
      });
      if (!specialty || !specialty.active) {
        return { success: false, error: "La especialidad seleccionada no está activa." };
      }
    }

    if (data.userId) {
      const existingUserRelation = await prisma.professional.findFirst({
        where: { userId: data.userId, NOT: { id } },
      });
      if (existingUserRelation) {
        return { success: false, error: "El usuario ya está asociado a otro profesional." };
      }
    }

    // Normalización estricta para evitar incompatibilidad de tipos con Prisma
    const specialtyIdToSave = data.role === "DENTISTA" && data.specialtyId ? data.specialtyId : null;

    const updatedProfessional = await prisma.professional.update({
      where: { id },
      data: {
        rut: normalizedRut,
        firstName: data.firstName,
        lastName: data.lastName,
        specialtyId: specialtyIdToSave,
        role: data.role,
        professionalRegister: data.professionalRegister,
        email: data.email || null,
        phone: data.phone || null,
        birthDate: data.birthDate ? new Date(data.birthDate) : null,
        userId: data.userId || null,
      },
    });

    revalidatePath("/profesionales");
    return { success: true, data: updatedProfessional };
  } catch (error) {
    console.error("Error al actualizar profesional:", error);
    return { success: false, error: "Error al actualizar los datos del profesional." };
  }
}

export async function toggleProfessionalStatus(
  id: string,
  targetState: boolean
): Promise<ActionResult> {
  try {
    if (!targetState) {
      const activeFutureAppointments = await prisma.appointment.count({
        where: {
          professionalId: id,
          date: { gte: new Date() },
          status: { in: ["AGENDADA", "CONFIRMADA", "EN_ATENCION"] },
        },
      });

      if (activeFutureAppointments > 0) {
        return {
          success: false,
          error: `No se puede desactivar: El profesional tiene ${activeFutureAppointments} cita(s) futura(s) activa(s). Reasigne o cancele las citas antes de desactivar.`,
        };
      }
    }

    await prisma.professional.update({
      where: { id },
      data: { active: targetState },
    });

    revalidatePath("/profesionales");
    return { success: true };
  } catch (error) {
    console.error("Error al cambiar estado del profesional:", error);
    return { success: false, error: "No se pudo cambiar el estado del profesional." };
  }
}