import { prisma } from "@/lib/prisma"
import { EvolutionManager } from "@/components/ficha/EvolutionManager"
import { formatDate } from "@/lib/ficha"

export default async function EvolucionesPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const [evolutions, dentists, plans] = await Promise.all([
    prisma.evolution.findMany({
      where: { patientId: id },
      include: { dentist: { select: { name: true } }, budget: { select: { name: true } } },
      orderBy: { date: "desc" },
    }),
    prisma.user.findMany({ where: { role: "DENTISTA" }, select: { id: true, name: true }, orderBy: { name: "asc" } }),
    prisma.budget.findMany({ where: { patientId: id }, select: { id: true, name: true }, orderBy: { createdAt: "desc" } }),
  ])

  return (
    <EvolutionManager
      patientId={id}
      dentists={dentists}
      plans={plans}
      evolutions={evolutions.map((e) => ({
        id: e.id,
        date: formatDate(e.date, true),
        content: e.content,
        dentistName: e.dentist?.name ?? null,
        planName: e.budget?.name ?? null,
      }))}
    />
  )
}
