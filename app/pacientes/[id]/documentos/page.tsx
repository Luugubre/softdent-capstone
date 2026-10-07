import { prisma } from "@/lib/prisma"
import { DocumentManager } from "@/components/ficha/DocumentManager"
import { formatDate } from "@/lib/ficha"

export default async function DocumentosPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const [patient, documents, consents, dentists] = await Promise.all([
    prisma.patient.findUniqueOrThrow({ where: { id }, select: { firstName: true, lastName: true, rut: true } }),
    prisma.patientDocument.findMany({
      where: { patientId: id },
      include: { dentist: { select: { name: true } } },
      orderBy: { createdAt: "desc" },
    }),
    prisma.consent.findMany({ where: { patientId: id }, orderBy: { createdAt: "desc" } }),
    prisma.user.findMany({ where: { role: "DENTISTA" }, select: { id: true, name: true }, orderBy: { name: "asc" } }),
  ])

  return (
    <DocumentManager
      patientId={id}
      patient={{ name: `${patient.firstName} ${patient.lastName}`, rut: patient.rut }}
      dentists={dentists}
      documents={documents.map((d) => ({
        id: d.id,
        type: d.type,
        title: d.title,
        createdAt: formatDate(d.createdAt),
        dentistName: d.dentist?.name ?? null,
      }))}
      consents={consents.map((c) => ({ id: c.id, title: c.title, status: c.status, createdAt: formatDate(c.createdAt) }))}
    />
  )
}
