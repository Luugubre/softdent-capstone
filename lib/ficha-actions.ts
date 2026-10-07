"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "./prisma";
import {
  ALL_TEETH,
  CONSENT_STATUS,
  DOCUMENT_TYPES,
  FILE_CATEGORIES,
  ITEM_STATUS,
  MAX_FILE_SIZE,
  SURFACES,
  budgetPaymentStatus,
} from "./ficha";

type ActionResult<T = object> = ({ success: true } & T) | { success: false; error: string };

// Refresca todas las pestañas de la ficha (el encabezado muestra saldo, alertas, etc.)
function revalidateFicha(patientId: string) {
  revalidatePath(`/pacientes/${patientId}`, "layout");
}

function firstIssue(error: z.ZodError) {
  return error.issues[0]?.message ?? "Datos inválidos.";
}

const optionalId = z
  .string()
  .optional()
  .nullable()
  .transform((v) => (v ? v : null));

// Recalcula total y estado de pago del plan a partir de sus prestaciones
async function recalcBudget(budgetId: string) {
  const budget = await prisma.budget.findUnique({
    where: { id: budgetId },
    include: { items: { select: { price: true } } },
  });
  if (!budget) return null;
  const total = budget.items.reduce((sum, item) => sum + item.price, 0);
  return prisma.budget.update({
    where: { id: budgetId },
    data: { total, status: budgetPaymentStatus(total, budget.paid) },
  });
}

// --- ANTECEDENTES ---

const medicalHistorySchema = z.object({
  conditions: z.array(z.string().trim().min(1)).default([]),
  allergies: z.string().trim().optional(),
  medications: z.string().trim().optional(),
  surgeries: z.string().trim().optional(),
  habits: z.string().trim().optional(),
  smoker: z.boolean().default(false),
  pregnant: z.boolean().default(false),
  observations: z.string().trim().optional(),
});

export type MedicalHistoryInput = z.input<typeof medicalHistorySchema>;

export async function saveMedicalHistory(patientId: string, input: MedicalHistoryInput): Promise<ActionResult> {
  const parsed = medicalHistorySchema.safeParse(input);
  if (!parsed.success) return { success: false, error: firstIssue(parsed.error) };

  const v = parsed.data;
  const data = {
    conditions: v.conditions,
    allergies: v.allergies || null,
    medications: v.medications || null,
    surgeries: v.surgeries || null,
    habits: v.habits || null,
    smoker: v.smoker,
    pregnant: v.pregnant,
    observations: v.observations || null,
  };

  try {
    await prisma.medicalHistory.upsert({
      where: { patientId },
      create: { patientId, ...data },
      update: data,
    });
    revalidateFicha(patientId);
    return { success: true };
  } catch (error) {
    console.error("Error al guardar antecedentes:", error);
    return { success: false, error: "No se pudieron guardar los antecedentes." };
  }
}

// --- ARCHIVOS (RADIOGRAFÍAS, FOTOS, EXÁMENES) ---

const ALLOWED_MIME = /^(image\/(png|jpe?g|gif|webp|bmp|tiff)|application\/pdf|application\/dicom)$/;

export async function uploadPatientFile(formData: FormData): Promise<ActionResult> {
  const patientId = String(formData.get("patientId") ?? "");
  const category = String(formData.get("category") ?? "RADIOGRAFIA");
  const notes = String(formData.get("notes") ?? "").trim();
  const file = formData.get("file");

  if (!patientId) return { success: false, error: "Paciente no especificado." };
  if (!(file instanceof File) || file.size === 0) return { success: false, error: "Debe seleccionar un archivo." };
  if (file.size > MAX_FILE_SIZE) return { success: false, error: "El archivo supera el máximo de 10 MB." };
  if (!FILE_CATEGORIES.some((c) => c.value === category)) return { success: false, error: "Categoría inválida." };

  const mimeType = file.type || "application/octet-stream";
  if (!ALLOWED_MIME.test(mimeType)) {
    return { success: false, error: "Formato no permitido. Use imágenes (JPG, PNG, etc.), PDF o DICOM." };
  }

  try {
    const bytes = Buffer.from(await file.arrayBuffer());
    await prisma.patientFile.create({
      data: {
        patientId,
        name: file.name.slice(0, 200),
        category,
        mimeType,
        size: file.size,
        data: bytes,
        notes: notes || null,
      },
    });
    revalidateFicha(patientId);
    return { success: true };
  } catch (error) {
    console.error("Error al subir archivo:", error);
    return { success: false, error: "No se pudo subir el archivo." };
  }
}

export async function deletePatientFile(fileId: string): Promise<ActionResult> {
  try {
    const file = await prisma.patientFile.delete({ where: { id: fileId }, select: { patientId: true } });
    revalidateFicha(file.patientId);
    return { success: true };
  } catch {
    return { success: false, error: "No se pudo eliminar el archivo." };
  }
}

// --- CONSENTIMIENTOS ---

const consentSchema = z.object({
  patientId: z.string().min(1),
  title: z.string().trim().min(3, "El título es obligatorio."),
  content: z.string().trim().min(10, "El texto del consentimiento es obligatorio."),
  budgetId: optionalId,
});

export async function createConsent(input: z.input<typeof consentSchema>): Promise<ActionResult> {
  const parsed = consentSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: firstIssue(parsed.error) };

  try {
    await prisma.consent.create({ data: parsed.data });
    revalidateFicha(parsed.data.patientId);
    return { success: true };
  } catch (error) {
    console.error("Error al crear consentimiento:", error);
    return { success: false, error: "No se pudo crear el consentimiento." };
  }
}

export async function updateConsentStatus(consentId: string, status: string): Promise<ActionResult> {
  if (!CONSENT_STATUS.some((s) => s.value === status)) return { success: false, error: "Estado inválido." };
  try {
    const consent = await prisma.consent.update({
      where: { id: consentId },
      data: { status, signedAt: status === "FIRMADO" ? new Date() : null },
    });
    revalidateFicha(consent.patientId);
    return { success: true };
  } catch {
    return { success: false, error: "No se pudo actualizar el consentimiento." };
  }
}

export async function deleteConsent(consentId: string): Promise<ActionResult> {
  try {
    const consent = await prisma.consent.delete({ where: { id: consentId } });
    revalidateFicha(consent.patientId);
    return { success: true };
  } catch {
    return { success: false, error: "No se pudo eliminar el consentimiento." };
  }
}

// --- DOCUMENTOS (CERTIFICADOS, INFORMES) ---

const documentSchema = z.object({
  patientId: z.string().min(1),
  type: z.string().refine((t) => DOCUMENT_TYPES.some((d) => d.value === t), "Tipo de documento inválido."),
  title: z.string().trim().min(3, "El título es obligatorio."),
  content: z.string().trim().min(10, "El contenido del documento es obligatorio."),
  dentistId: optionalId,
});

export async function createDocument(input: z.input<typeof documentSchema>): Promise<ActionResult<{ id: string }>> {
  const parsed = documentSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: firstIssue(parsed.error) };

  try {
    const doc = await prisma.patientDocument.create({ data: parsed.data });
    revalidateFicha(parsed.data.patientId);
    return { success: true, id: doc.id };
  } catch (error) {
    console.error("Error al crear documento:", error);
    return { success: false, error: "No se pudo crear el documento." };
  }
}

export async function deleteDocument(documentId: string): Promise<ActionResult> {
  try {
    const doc = await prisma.patientDocument.delete({ where: { id: documentId } });
    revalidateFicha(doc.patientId);
    return { success: true };
  } catch {
    return { success: false, error: "No se pudo eliminar el documento." };
  }
}

// --- EVOLUCIONES ---

const evolutionSchema = z.object({
  patientId: z.string().min(1),
  content: z.string().trim().min(3, "Describa lo realizado en la atención."),
  date: z
    .string()
    .optional()
    .refine((d) => !d || !isNaN(new Date(d).getTime()), "Fecha inválida."),
  dentistId: optionalId,
  budgetId: optionalId,
});

export async function createEvolution(input: z.input<typeof evolutionSchema>): Promise<ActionResult> {
  const parsed = evolutionSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: firstIssue(parsed.error) };

  const { date, ...rest } = parsed.data;
  try {
    await prisma.evolution.create({ data: { ...rest, date: date ? new Date(date) : new Date() } });
    revalidateFicha(rest.patientId);
    return { success: true };
  } catch (error) {
    console.error("Error al crear evolución:", error);
    return { success: false, error: "No se pudo guardar la evolución." };
  }
}

export async function deleteEvolution(evolutionId: string): Promise<ActionResult> {
  try {
    const evolution = await prisma.evolution.delete({ where: { id: evolutionId } });
    revalidateFicha(evolution.patientId);
    return { success: true };
  } catch {
    return { success: false, error: "No se pudo eliminar la evolución." };
  }
}

// --- RECETAS ---

const prescriptionSchema = z.object({
  patientId: z.string().min(1),
  dentistId: optionalId,
  instructions: z.string().trim().optional(),
  medications: z
    .array(
      z.object({
        name: z.string().trim().min(2, "Indique el nombre del medicamento."),
        dose: z.string().trim(),
        frequency: z.string().trim(),
        duration: z.string().trim(),
      })
    )
    .min(1, "Agregue al menos un medicamento."),
});

export async function createPrescription(
  input: z.input<typeof prescriptionSchema>
): Promise<ActionResult<{ id: string }>> {
  const parsed = prescriptionSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: firstIssue(parsed.error) };

  const { instructions, ...rest } = parsed.data;
  try {
    const prescription = await prisma.prescription.create({
      data: { ...rest, instructions: instructions || null },
    });
    revalidateFicha(rest.patientId);
    return { success: true, id: prescription.id };
  } catch (error) {
    console.error("Error al crear receta:", error);
    return { success: false, error: "No se pudo crear la receta." };
  }
}

export async function deletePrescription(prescriptionId: string): Promise<ActionResult> {
  try {
    const prescription = await prisma.prescription.delete({ where: { id: prescriptionId } });
    revalidateFicha(prescription.patientId);
    return { success: true };
  } catch {
    return { success: false, error: "No se pudo eliminar la receta." };
  }
}

// --- TRATAMIENTOS (PLANES CON ODONTOGRAMA) ---

const planSchema = z.object({
  patientId: z.string().min(1),
  name: z.string().trim().min(3, "Ingrese un nombre para el tratamiento (mínimo 3 caracteres)."),
  dentistId: z.string().min(1, "Seleccione el profesional a cargo."),
  notes: z.string().trim().optional(),
});

export async function createTreatmentPlan(input: z.input<typeof planSchema>): Promise<ActionResult<{ id: string }>> {
  const parsed = planSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: firstIssue(parsed.error) };

  const { notes, ...rest } = parsed.data;
  try {
    const plan = await prisma.budget.create({ data: { ...rest, notes: notes || null } });
    revalidateFicha(rest.patientId);
    return { success: true, id: plan.id };
  } catch (error) {
    console.error("Error al crear tratamiento:", error);
    return { success: false, error: "No se pudo crear el tratamiento." };
  }
}

export async function updateTreatmentPlan(
  budgetId: string,
  input: { name: string; notes?: string }
): Promise<ActionResult> {
  const name = input.name?.trim() ?? "";
  if (name.length < 3) return { success: false, error: "Ingrese un nombre para el tratamiento (mínimo 3 caracteres)." };
  try {
    const plan = await prisma.budget.update({
      where: { id: budgetId },
      data: { name, notes: input.notes?.trim() || null },
    });
    revalidateFicha(plan.patientId);
    return { success: true };
  } catch {
    return { success: false, error: "No se pudo actualizar el tratamiento." };
  }
}

export async function deleteTreatmentPlan(budgetId: string): Promise<ActionResult> {
  try {
    const plan = await prisma.budget.findUnique({
      where: { id: budgetId },
      include: { _count: { select: { payments: true } } },
    });
    if (!plan) return { success: false, error: "El tratamiento no existe." };
    if (plan._count.payments > 0) {
      return { success: false, error: "No se puede eliminar un tratamiento que tiene pagos registrados." };
    }
    await prisma.budget.delete({ where: { id: budgetId } });
    revalidateFicha(plan.patientId);
    return { success: true };
  } catch (error) {
    console.error("Error al eliminar tratamiento:", error);
    return { success: false, error: "No se pudo eliminar el tratamiento." };
  }
}

const planItemSchema = z.object({
  budgetId: z.string().min(1),
  treatmentId: z.string().min(1, "Seleccione una prestación."),
  tooth: z
    .number()
    .int()
    .nullable()
    .refine((t) => t === null || ALL_TEETH.includes(t), "Pieza dentaria inválida."),
  surfaces: z
    .array(z.string())
    .default([])
    .refine((s) => s.every((x) => SURFACES.some((y) => y.key === x)), "Cara dentaria inválida."),
  price: z.number().int("El precio debe ser un número entero.").min(0, "El precio no puede ser negativo."),
});

export async function addPlanItem(input: z.input<typeof planItemSchema>): Promise<ActionResult> {
  const parsed = planItemSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: firstIssue(parsed.error) };

  const data = parsed.data;
  try {
    const plan = await prisma.budget.findUnique({ where: { id: data.budgetId }, select: { patientId: true } });
    if (!plan) return { success: false, error: "El tratamiento no existe." };

    await prisma.budgetItem.create({
      data: {
        budgetId: data.budgetId,
        treatmentId: data.treatmentId,
        tooth: data.tooth,
        surfaces: data.tooth === null ? [] : data.surfaces,
        price: data.price,
      },
    });
    await recalcBudget(data.budgetId);
    revalidateFicha(plan.patientId);
    return { success: true };
  } catch (error) {
    console.error("Error al agregar prestación:", error);
    return { success: false, error: "No se pudo agregar la prestación." };
  }
}

export async function removePlanItem(itemId: string): Promise<ActionResult> {
  try {
    const item = await prisma.budgetItem.findUnique({
      where: { id: itemId },
      include: { budget: { select: { patientId: true } } },
    });
    if (!item) return { success: false, error: "La prestación no existe." };
    if (item.status === ITEM_STATUS.REALIZADO) {
      return { success: false, error: "No se puede quitar una prestación ya realizada. Primero márquela como pendiente." };
    }
    await prisma.budgetItem.delete({ where: { id: itemId } });
    await recalcBudget(item.budgetId);
    revalidateFicha(item.budget.patientId);
    return { success: true };
  } catch {
    return { success: false, error: "No se pudo quitar la prestación." };
  }
}

// Marca una prestación como realizada (opcionalmente registrando la evolución) o la devuelve a pendiente
export async function setPlanItemStatus(
  itemId: string,
  done: boolean,
  evolutionNote?: string
): Promise<ActionResult> {
  try {
    const item = await prisma.budgetItem.findUnique({
      where: { id: itemId },
      include: { treatment: true, budget: { select: { id: true, patientId: true, dentistId: true } } },
    });
    if (!item) return { success: false, error: "La prestación no existe." };

    const note = evolutionNote?.trim();
    await prisma.$transaction([
      prisma.budgetItem.update({
        where: { id: itemId },
        data: done
          ? { status: ITEM_STATUS.REALIZADO, completedAt: new Date() }
          : { status: ITEM_STATUS.PENDIENTE, completedAt: null },
      }),
      ...(done && note
        ? [
            prisma.evolution.create({
              data: {
                patientId: item.budget.patientId,
                budgetId: item.budget.id,
                dentistId: item.budget.dentistId,
                content: `${item.treatment.name}${item.tooth ? ` (pieza ${item.tooth})` : ""}: ${note}`,
              },
            }),
          ]
        : []),
    ]);

    revalidateFicha(item.budget.patientId);
    return { success: true };
  } catch (error) {
    console.error("Error al cambiar estado de la prestación:", error);
    return { success: false, error: "No se pudo actualizar la prestación." };
  }
}

// --- PAGOS ---

const paymentSchema = z.object({
  budgetId: z.string().min(1, "Seleccione el tratamiento a pagar."),
  amount: z.number().int("El monto debe ser un número entero.").positive("El monto debe ser mayor a 0."),
  method: z.string().min(1, "Seleccione el medio de pago."),
});

export async function registerPlanPayment(input: z.input<typeof paymentSchema>): Promise<ActionResult> {
  const parsed = paymentSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: firstIssue(parsed.error) };

  const { budgetId, amount, method } = parsed.data;
  try {
    const budget = await prisma.budget.findUnique({ where: { id: budgetId } });
    if (!budget) return { success: false, error: "El tratamiento no existe." };

    const pending = budget.total - budget.paid;
    if (amount > pending) {
      return { success: false, error: `El monto supera el saldo pendiente ($${pending.toLocaleString("es-CL")}).` };
    }

    const paid = budget.paid + amount;
    await prisma.$transaction([
      prisma.payment.create({ data: { budgetId, amount, method } }),
      prisma.budget.update({
        where: { id: budgetId },
        data: { paid, status: budgetPaymentStatus(budget.total, paid) },
      }),
    ]);

    revalidateFicha(budget.patientId);
    revalidatePath("/liquidaciones");
    return { success: true };
  } catch (error) {
    console.error("Error al registrar pago:", error);
    return { success: false, error: "No se pudo registrar el pago." };
  }
}

export async function deletePayment(paymentId: string): Promise<ActionResult> {
  try {
    const payment = await prisma.payment.findUnique({ where: { id: paymentId }, include: { budget: true } });
    if (!payment) return { success: false, error: "El pago no existe." };

    const paid = Math.max(0, payment.budget.paid - payment.amount);
    await prisma.$transaction([
      prisma.payment.delete({ where: { id: paymentId } }),
      prisma.budget.update({
        where: { id: payment.budgetId },
        data: { paid, status: budgetPaymentStatus(payment.budget.total, paid) },
      }),
    ]);

    revalidateFicha(payment.budget.patientId);
    revalidatePath("/liquidaciones");
    return { success: true };
  } catch (error) {
    console.error("Error al anular pago:", error);
    return { success: false, error: "No se pudo anular el pago." };
  }
}
