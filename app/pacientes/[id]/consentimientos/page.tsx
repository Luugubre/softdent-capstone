import { prisma } from "@/lib/prisma"
import { ConsentManager } from "@/components/ficha/ConsentManager"
import { formatDate } from "@/lib/ficha"

export default async function ConsentimientosPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const [consents, plans] = await Promise.all([
    prisma.consent.findMany({
      where: { patientId: id },
      include: { budget: { select: { name: true } } },
      orderBy: { createdAt: "desc" },
    }),
    prisma.budget.findMany({ where: { patientId: id }, select: { id: true, name: true }, orderBy: { createdAt: "desc" } }),
  ])

  return (
    <ConsentManager
      patientId={id}
      plans={plans}
      consents={consents.map((c) => ({
        id: c.id,
        title: c.title,
        content: c.content,
        status: c.status,
        signedAt: c.signedAt ? formatDate(c.signedAt) : null,
        createdAt: formatDate(c.createdAt),
        planName: c.budget?.name ?? null,
      }))}
    />
  )
}
