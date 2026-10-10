"use server"

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { FonasaVoucherStatus } from "@prisma/client"

// -------------------------------------------------------------
// SECCIÓN FONASA
// -------------------------------------------------------------

// Registrar un nuevo Bono FONASA
export async function createFonasaVoucher(formData: FormData) {
  const folio = (formData.get("folio") as string)?.trim()
  const patientId = formData.get("patientId") as string
  const treatmentId = formData.get("treatmentId") as string
  const amount = parseInt(formData.get("amount") as string, 10)
  const copayment = parseInt(formData.get("copayment") as string, 10) || 0

  if (!folio || !patientId || !treatmentId || isNaN(amount) || amount <= 0) {
    return { error: "Todos los campos principales son requeridos y el monto debe ser mayor a 0." }
  }

  // Regla: Folio único y no reutilizable
  const existing = await prisma.fonasaVoucher.findUnique({ where: { folio } })
  if (existing) {
    return { error: `El folio "${folio}" ya se encuentra registrado y no puede reutilizarse.` }
  }

  // Regla: Paciente y prestación deben existir
  const [patient, treatment] = await Promise.all([
    prisma.patient.findUnique({ where: { id: patientId } }),
    prisma.treatment.findUnique({ where: { id: treatmentId } }),
  ])

  if (!patient || !treatment) {
    return { error: "El paciente o la prestación seleccionada no existen." }
  }

  await prisma.fonasaVoucher.create({
    data: {
      folio,
      patientId,
      treatmentId,
      amount,
      copayment,
      status: "PENDIENTE",
    },
  })

  revalidatePath("/fonasa-convenios")
  return { success: true }
}

// Cambiar estado de Bono (Utilizar o Anular)
export async function updateFonasaVoucherStatus(
  voucherId: string,
  newStatus: FonasaVoucherStatus,
  voidReason?: string
) {
  const voucher = await prisma.fonasaVoucher.findUnique({ where: { id: voucherId } })
  if (!voucher) return { error: "Bono no encontrado." }

  if (voucher.status === "UTILIZADO" && newStatus !== "UTILIZADO") {
    return { error: "Un bono ya utilizado no puede ser modificado." }
  }

  const data: any = { status: newStatus }
  if (newStatus === "UTILIZADO") {
    data.usedAt = new Date()
  } else if (newStatus === "ANULADO") {
    if (!voidReason?.trim()) return { error: "Debe ingresar el motivo de la anulación del bono." }
    data.voidReason = voidReason.trim()
  }

  await prisma.fonasaVoucher.update({
    where: { id: voucherId },
    data,
  })

  revalidatePath("/fonasa-convenios")
  return { success: true }
}

// -------------------------------------------------------------
// SECCIÓN CONVENIOS (Empresas y Sindicatos)
// -------------------------------------------------------------

// Crear un Convenio
export async function createAgreement(formData: FormData) {
  const name = (formData.get("name") as string)?.trim()
  const institution = (formData.get("institution") as string)?.trim()
  const discountPct = parseFloat(formData.get("discountPct") as string) || 0
  const startDateStr = formData.get("startDate") as string

  if (!name || !institution || !startDateStr) {
    return { error: "Nombre, institución y fecha de inicio son requeridos." }
  }

  const existing = await prisma.agreement.findUnique({ where: { name } })
  if (existing) {
    return { error: `Ya existe un convenio con el nombre "${name}".` }
  }

  await prisma.agreement.create({
    data: {
      name,
      institution,
      discountPct,
      startDate: new Date(startDateStr),
      isActive: true,
    },
  })

  revalidatePath("/fonasa-convenios")
  return { success: true }
}

// Inscribir beneficiario a convenio
export async function addAgreementBeneficiary(agreementId: string, patientId: string) {
  // Regla: Convenio debe estar vigente
  const agreement = await prisma.agreement.findUnique({ where: { id: agreementId } })
  if (!agreement || !agreement.isActive) {
    return { error: "El convenio no se encuentra vigente para inscribir beneficiarios." }
  }

  const existingMember = await prisma.agreementMember.findUnique({
    where: {
      agreementId_patientId: { agreementId, patientId },
    },
  })
  if (existingMember) {
    return { error: "El paciente ya está adscrito a este convenio." }
  }

  await prisma.agreementMember.create({
    data: { agreementId, patientId },
  })

  revalidatePath("/fonasa-convenios")
  return { success: true }
}

// Crear Contrato en Cuotas
export async function createAgreementContract(
  agreementId: string,
  patientId: string,
  totalAmount: number,
  installments: { number: number; amount: number; dueDate: string }[]
) {
  // Regla: El paciente debe pertenecer a este convenio y estar vigente
  const agreement = await prisma.agreement.findUnique({ where: { id: agreementId } })
  if (!agreement || !agreement.isActive) {
    return { error: "El convenio no está vigente." }
  }

  const membership = await prisma.agreementMember.findUnique({
    where: { agreementId_patientId: { agreementId, patientId } },
  })
  if (!membership) {
    return { error: "Regla del módulo: El paciente no es beneficiario de este convenio." }
  }

  // Regla: La suma de las cuotas debe coincidir exactamente con el monto pactado
  const sumCuotas = installments.reduce((acc, curr) => acc + curr.amount, 0)
  if (sumCuotas !== totalAmount) {
    return {
      error: `La suma de las cuotas ($${sumCuotas.toLocaleString("es-CL")}) no coincide con el total pactado ($${totalAmount.toLocaleString("es-CL")}).`,
    }
  }

  await prisma.$transaction(async (tx) => {
    const contract = await tx.agreementContract.create({
      data: {
        agreementId,
        patientId,
        totalAmount,
        installmentsCount: installments.length,
      },
    })

    for (const inst of installments) {
      await tx.agreementInstallment.create({
        data: {
          contractId: contract.id,
          number: inst.number,
          amount: inst.amount,
          dueDate: new Date(inst.dueDate),
        },
      })
    }
  })

  revalidatePath("/fonasa-convenios")
  return { success: true }
}