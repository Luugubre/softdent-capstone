import { prisma } from "@/lib/prisma"
import { GlobalOdontogram } from "@/components/ficha/GlobalOdontogram"
import { OdontogramaClinico } from "@/components/OdontogramaClinico"
import { absentTeethFrom, formatDate } from "@/lib/ficha"

type FindingsData = Parameters<typeof OdontogramaClinico>[0]["initialData"]

// Versiones anteriores guardaban el odontograma como texto JSON
function parseFindings(value: unknown): FindingsData {
  if (typeof value === "string") {
    try {
      return JSON.parse(value) as FindingsData
    } catch {
      return undefined
    }
  }
  return (value ?? undefined) as FindingsData
}

export default async function OdontogramaPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const [patient, plans] = await Promise.all([
    prisma.patient.findUniqueOrThrow({ where: { id }, select: { odontogram: true } }),
    prisma.budget.findMany({
      where: { patientId: id },
      include: { dentist: { select: { name: true } }, items: { include: { treatment: { select: { name: true } } } } },
      orderBy: { createdAt: "asc" },
    }),
  ])

  return (
    <GlobalOdontogram
      patientId={id}
      absentTeeth={absentTeethFrom(patient.odontogram)}
      findingsEditor={<OdontogramaClinico patientId={id} initialData={parseFindings(patient.odontogram)} />}
      plans={plans.map((p) => ({
        id: p.id,
        name: p.name,
        dentistName: p.dentist.name,
        items: p.items.map((i) => ({
          id: i.id,
          tooth: i.tooth,
          surfaces: i.surfaces,
          status: i.status,
          price: i.price,
          treatmentName: i.treatment.name,
          completedAt: i.completedAt ? formatDate(i.completedAt) : null,
        })),
      }))}
    />
  )
}
