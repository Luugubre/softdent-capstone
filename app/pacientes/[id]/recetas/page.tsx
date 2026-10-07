import { prisma } from "@/lib/prisma"
import { PrescriptionManager } from "@/components/ficha/PrescriptionManager"
import { formatDate, PrescriptionMedication } from "@/lib/ficha"

export default async function RecetasPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const [prescriptions, dentists, history] = await Promise.all([
    prisma.prescription.findMany({
      where: { patientId: id },
      include: { dentist: { select: { name: true } } },
      orderBy: { createdAt: "desc" },
    }),
    prisma.user.findMany({ where: { role: "DENTISTA" }, select: { id: true, name: true }, orderBy: { name: "asc" } }),
    prisma.medicalHistory.findUnique({ where: { patientId: id }, select: { allergies: true } }),
  ])

  return (
    <PrescriptionManager
      patientId={id}
      dentists={dentists}
      allergies={history?.allergies ?? null}
      prescriptions={prescriptions.map((p) => ({
        id: p.id,
        createdAt: formatDate(p.createdAt, true),
        dentistName: p.dentist?.name ?? null,
        medications: p.medications as unknown as PrescriptionMedication[],
      }))}
    />
  )
}
