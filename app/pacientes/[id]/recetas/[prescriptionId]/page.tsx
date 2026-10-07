import { notFound } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { PrintableSheet } from "@/components/ficha/PrintableSheet"
import { formatDate, PrescriptionMedication } from "@/lib/ficha"

export default async function RecetaImprimible({
  params,
}: {
  params: Promise<{ id: string; prescriptionId: string }>
}) {
  const { id, prescriptionId } = await params
  const prescription = await prisma.prescription.findFirst({
    where: { id: prescriptionId, patientId: id },
    include: { patient: true, dentist: { select: { name: true } } },
  })
  if (!prescription) notFound()

  const medications = prescription.medications as unknown as PrescriptionMedication[]

  return (
    <PrintableSheet
      title="Receta médica"
      patient={prescription.patient}
      date={formatDate(prescription.createdAt)}
      professional={prescription.dentist?.name}
      backHref={`/pacientes/${id}/recetas`}
    >
      <p className="text-3xl font-black mb-4">Rp.</p>
      <ol className="list-decimal ml-6 space-y-3 whitespace-normal">
        {medications.map((m, i) => (
          <li key={i}>
            <p className="font-bold">{m.name} {m.dose}</p>
            <p>
              {[m.frequency && `Cada ${m.frequency}`, m.duration && `por ${m.duration}`].filter(Boolean).join(" ")}
            </p>
          </li>
        ))}
      </ol>
      {prescription.instructions && (
        <div className="mt-6">
          <p className="font-bold">Indicaciones:</p>
          <p>{prescription.instructions}</p>
        </div>
      )}
    </PrintableSheet>
  )
}
