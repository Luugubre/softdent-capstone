import { prisma } from "@/lib/prisma"
import { TreatmentPlanList } from "@/components/ficha/TreatmentPlanList"
import { formatDate, planProgress } from "@/lib/ficha"

export default async function TratamientosPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const [plans, dentists] = await Promise.all([
    prisma.budget.findMany({
      where: { patientId: id },
      include: { dentist: { select: { name: true } }, items: { select: { status: true } } },
      orderBy: { createdAt: "desc" },
    }),
    prisma.user.findMany({ where: { role: "DENTISTA" }, select: { id: true, name: true }, orderBy: { name: "asc" } }),
  ])

  return (
    <TreatmentPlanList
      patientId={id}
      dentists={dentists}
      plans={plans.map((p) => {
        const progress = planProgress(p.items)
        return {
          id: p.id,
          name: p.name,
          dentistName: p.dentist.name,
          createdAt: formatDate(p.createdAt),
          total: p.total,
          paid: p.paid,
          done: progress.done,
          count: progress.total,
          percent: progress.percent,
        }
      })}
    />
  )
}
