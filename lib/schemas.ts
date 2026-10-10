import { z } from "zod";

export function cleanAndValidateRut(rawRut: string): { isValid: boolean; formatted: string } {
  if (!rawRut || typeof rawRut !== "string") return { isValid: false, formatted: "" };
  
  const clean = rawRut.replace(/[^0-9kK]/g, "").toUpperCase();
  if (clean.length < 8) return { isValid: false, formatted: "" };

  const body = clean.slice(0, -1);
  const dv = clean.slice(-1);

  let sum = 0;
  let multiplier = 2;

  for (let i = body.length - 1; i >= 0; i--) {
    sum += parseInt(body.charAt(i), 10) * multiplier;
    multiplier = multiplier === 7 ? 2 : multiplier + 1;
  }

  const expectedDv = 11 - (sum % 11);
  const computedDv = expectedDv === 11 ? "0" : expectedDv === 10 ? "K" : expectedDv.toString();

  const isValid = dv === computedDv;
  const formatted = `${body}-${dv}`;

  return { isValid, formatted };
}

export const patientSchema = z
  .object({
    firstName: z.string().min(2, "El nombre es obligatorio (mínimo 2 caracteres)"),
    lastName: z.string().min(2, "El apellido es obligatorio (mínimo 2 caracteres)"),
    rut: z
      .string()
      .min(1, "El RUT es obligatorio")
      .refine((rut) => cleanAndValidateRut(rut).isValid, {
        message: "El RUT ingresado no es válido (Dígito verificador incorrecto)",
      }),
    email: z.string().email("Ingrese un correo electrónico válido").optional().or(z.literal("")),
    phone: z
      .string()
      .optional()
      .or(z.literal(""))
      .refine(
        (val) => {
          if (!val) return true;
          return /^(\+?56)?(\s?)(0?9|[2-9])(\s?)[0-9]{8}$/.test(val.trim());
        },
        { message: "Ingrese un formato de teléfono chileno válido (ej: +56 9 1234 5678)" }
      ),
    birthDate: z
      .string()
      .optional()
      .or(z.literal(""))
      .refine(
        (val) => {
          if (!val) return true;
          const date = new Date(val);
          const now = new Date();
          const minDate = new Date("1900-01-01");
          return date <= now && date >= minDate;
        },
        { message: "La fecha de nacimiento no puede ser futura ni inconsistente" }
      ),
    prevision: z.string().min(1, "Debe seleccionar una previsión"),
  })
  .refine(
    (data) => Boolean((data.email && data.email.trim() !== "") || (data.phone && data.phone.trim() !== "")),
    {
      message: "Debe ingresar al menos un medio de contacto (Correo electrónico o Teléfono)",
      path: ["email"],
    }
  );

export type PatientFormData = z.infer<typeof patientSchema>;

export const professionalSchema = z
  .object({
    firstName: z.string().min(2, "El nombre es obligatorio (mínimo 2 caracteres)"),
    lastName: z.string().min(2, "El apellido es obligatorio (mínimo 2 caracteres)"),
    rut: z
      .string()
      .min(1, "El RUT es obligatorio")
      .refine((val) => cleanAndValidateRut(val).isValid, {
        message: "RUT inválido o dígito verificador incorrecto",
      }),
    role: z.enum(["ADMIN", "DENTISTA", "RECEPCIONISTA", "ASISTENTE"], {
      message: "Debe seleccionar un rol de sistema válido",
    }),
    specialtyId: z.string().optional().nullable(),
    professionalRegister: z.string().min(1, "El registro profesional es obligatorio"),
    email: z.string().email("Ingrese un correo electrónico válido").optional().or(z.literal("")),
    phone: z
      .string()
      .optional()
      .or(z.literal(""))
      .refine(
        (val) => {
          if (!val) return true;
          return /^(\+?56)?(\s?)(0?9|[2-9])(\s?)[0-9]{8}$/.test(val.trim());
        },
        { message: "Ingrese un formato de teléfono chileno válido (ej: +56 9 1234 5678)" }
      ),
    birthDate: z
      .string()
      .optional()
      .or(z.literal(""))
      .refine(
        (val) => {
          if (!val) return true;
          const date = new Date(val);
          const now = new Date();
          const minDate = new Date("1900-01-01");
          return date <= now && date >= minDate;
        },
        { message: "La fecha de nacimiento no puede ser futura ni inconsistente" }
      ),
    userId: z.string().optional().nullable(),
  })
  .superRefine((data, ctx) => {
    // Exige especialidad obligatoriamente solo si el rol es DENTISTA
    if (data.role === "DENTISTA" && (!data.specialtyId || data.specialtyId.trim() === "")) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Debe seleccionar una especialidad para el rol Dentista",
        path: ["specialtyId"],
      });
    }
  });

export type ProfessionalFormData = z.infer<typeof professionalSchema>;

// ==========================================
// ESQUEMAS DEL MÓDULO AGENDA
// ==========================================

export const appointmentSchema = z
  .object({
    patientId: z.string().min(1, "Debe seleccionar un paciente"),
    professionalId: z.string().min(1, "Debe seleccionar un profesional"),
    boxId: z.string().min(1, "Debe seleccionar un box"),
    procedureId: z.string().min(1, "Debe seleccionar una prestación"),
    date: z.string().min(1, "Debe seleccionar la fecha y hora de inicio"),
    durationMin: z.number().min(5, "La duración mínima es de 5 minutos"),
    isOverbook: z.boolean().default(false),
    overbookReason: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.isOverbook && (!data.overbookReason || data.overbookReason.trim() === "")) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Debe ingresar el motivo del sobrecupo",
        path: ["overbookReason"],
      });
    }
  });

export type AppointmentFormData = z.infer<typeof appointmentSchema>;

export const cancelAppointmentSchema = z.object({
  cancelReason: z.string().min(3, "Debe ingresar un motivo de cancelación detallado"),
});

export type CancelAppointmentFormData = z.infer<typeof cancelAppointmentSchema>;

export const scheduleBlockSchema = z
  .object({
    reason: z.string().min(2, "El motivo es obligatorio"),
    type: z.enum(["VACACIONES", "REUNION", "MANTENCION", "OTRO"]),
    startDate: z.string().min(1, "Debe indicar la fecha/hora de inicio"),
    endDate: z.string().min(1, "Debe indicar la fecha/hora de término"),
    professionalId: z.string().optional().nullable(),
    boxId: z.string().optional().nullable(),
  })
  .refine((data) => new Date(data.endDate) > new Date(data.startDate), {
    message: "La fecha de término debe ser posterior a la fecha de inicio",
    path: ["endDate"],
  });

export type ScheduleBlockFormData = z.infer<typeof scheduleBlockSchema>;