import { prisma } from "@/lib/prisma"
import { PaymentsPanel } from "@/components/ficha/PaymentsPanel"
import { formatDate, planProgress } from "@/lib/ficha"

export default async function PagosPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const plans = await prisma.budget.findMany({
    where: { patientId: id },
    include: { items: { select: { status: true } }, payments: true },
    orderBy: { createdAt: "desc" },
  })

  const payments = plans
    .flatMap((plan) => plan.payments.map((p) => ({ ...p, planName: plan.name })))
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())

  return (
    <PaymentsPanel
      patientId={id}
      plans={plans.map((p) => ({
        id: p.id,
        name: p.name,
        total: p.total,
        paid: p.paid,
        status: p.status,
        progress: planProgress(p.items).percent,
      }))}
      payments={payments.map((p) => ({
        id: p.id,
        date: formatDate(p.createdAt, true),
        amount: p.amount,
        method: p.method,
        planName: p.planName,
      }))}
    />
  )
}
