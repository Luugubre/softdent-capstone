"use server"

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { PayrollStatus } from "@prisma/client"

// 1. Obtener prestaciones pendientes de liquidar para un profesional
export async function getPendingItemsForDentist(dentistId: string) {
  return await prisma.budgetItem.findMany({
    where: {
      payrollId: null, // Que no hayan sido liquidadas antes
      budget: {
        dentistId: dentistId,
        status: { not: "ANULADO" },
      },
    },
    include: {
      treatment: true,
      budget: {
        include: {
          patient: true,
        },
      },
    },
  })
}

// 2. Generar Liquidación (Cálculo estricto en el servidor)
export async function createPayroll(formData: FormData) {
  const dentistId = formData.get("dentistId") as string
  const period = (formData.get("period") as string)?.trim()
  const bonusAmount = parseInt(formData.get("bonusAmount") as string, 10) || 0
  const adjustmentAmount = parseInt(formData.get("adjustmentAmount") as string, 10) || 0
  const discountAmount = parseInt(formData.get("discountAmount") as string, 10) || 0
  const notes = (formData.get("notes") as string)?.trim() || null
  const selectedItemIds = formData.getAll("itemIds") as string[]

  if (!dentistId || !period) {
    return { error: "Profesional y período son obligatorios." }
  }

  if (selectedItemIds.length === 0) {
    return { error: "Debe seleccionar al menos una prestación para liquidar." }
  }

  // Obtener al profesional para saber su comisión base
  const dentist = await prisma.user.findUnique({
    where: { id: dentistId },
  })

  if (!dentist) return { error: "Profesional no encontrado." }

  const dentistRate = dentist.commission || 40.0
  const clinicRate = 100.0 - dentistRate // Regla: deben sumar 100%

  // Obtener las prestaciones verificando que NO estén liquidadas previamente
  const items = await prisma.budgetItem.findMany({
    where: {
      id: { in: selectedItemIds },
      payrollId: null, // Regla: una prestación no se liquida dos veces
    },
  })

  if (items.length !== selectedItemIds.length) {
    return { error: "Una o más prestaciones seleccionadas ya fueron liquidadas." }
  }

  // Cálculo en servidor
  const totalProduced = items.reduce((acc, curr) => acc + curr.price, 0)
  const dentistBase = Math.round(totalProduced * (dentistRate / 100))
  const totalDentist = dentistBase + bonusAmount + adjustmentAmount - discountAmount
  const totalClinic = totalProduced - dentistBase

  // Crear liquidación y vincular prestaciones
  await prisma.$transaction(async (tx) => {
    const payroll = await tx.payroll.create({
      data: {
        dentistId,
        period,
        status: "CALCULADA",
        dentistRate,
        clinicRate,
        totalProduced,
        bonusAmount,
        adjustmentAmount,
        discountAmount,
        totalDentist,
        totalClinic,
        notes,
      },
    })

    await tx.budgetItem.updateMany({
      where: { id: { in: selectedItemIds } },
      data: { payrollId: payroll.id },
    })
  })

  revalidatePath("/liquidaciones")
  return { success: true }
}

// 3. Cambiar estado de liquidación
export async function updatePayrollStatus(payrollId: string, newStatus: PayrollStatus) {
  const payroll = await prisma.payroll.findUnique({
    where: { id: payrollId },
  })

  if (!payroll) return { error: "Liquidación no encontrada." }

  // Regla: Si está pagada/cerrada, no se modifica
  if (payroll.status === "PAGADA" && newStatus !== "PAGADA") {
    return { error: "Una liquidación pagada y cerrada no puede modificarse." }
  }

  // Si se anula, liberar las prestaciones para que puedan liquidarse en otro período
  if (newStatus === "ANULADA") {
    await prisma.$transaction([
      prisma.budgetItem.updateMany({
        where: { payrollId },
        data: { payrollId: null },
      }),
      prisma.payroll.update({
        where: { id: payrollId },
        data: { status: "ANULADA" },
      }),
    ])
  } else {
    await prisma.payroll.update({
      where: { id: payrollId },
      data: {
        status: newStatus,
        closedAt: newStatus === "PAGADA" ? new Date() : payroll.closedAt,
      },
    })
  }

  revalidatePath("/liquidaciones")
  return { success: true }
}