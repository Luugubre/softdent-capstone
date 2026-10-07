import { notFound } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { PlanEditor } from "@/components/ficha/PlanEditor"
import { absentTeethFrom, formatDate } from "@/lib/ficha"

export default async function PlanTratamientoPage({
  params,
}: {
  params: Promise<{ id: string; planId: string }>
}) {
  const { id, planId } = await params
  const [plan, catalog, patient] = await Promise.all([
    prisma.budget.findFirst({
      where: { id: planId, patientId: id },
      include: {
        dentist: { select: { name: true } },
        items: { include: { treatment: { select: { name: true } } }, orderBy: { id: "asc" } },
        _count: { select: { payments: true } },
      },
    }),
    prisma.treatment.findMany({ orderBy: [{ category: "asc" }, { name: "asc" }] }),
    prisma.patient.findUnique({ where: { id }, select: { odontogram: true } }),
  ])
  if (!plan) notFound()

  return (
    <PlanEditor
      patientId={id}
      catalog={catalog}
      absentTeeth={absentTeethFrom(patient?.odontogram)}
      plan={{
        id: plan.id,
        name: plan.name,
        notes: plan.notes,
        dentistName: plan.dentist.name,
        createdAt: formatDate(plan.createdAt),
        total: plan.total,
        paid: plan.paid,
        paymentsCount: plan._count.payments,
        items: plan.items.map((item) => ({
          id: item.id,
          tooth: item.tooth,
          surfaces: item.surfaces,
          price: item.price,
          status: item.status,
          completedAt: item.completedAt ? formatDate(item.completedAt) : null,
          treatmentName: item.treatment.name,
        })),
      }}
    />
  )
}
