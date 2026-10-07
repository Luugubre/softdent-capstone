import { notFound } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { PrintableSheet } from "@/components/ficha/PrintableSheet"
import { formatDate } from "@/lib/ficha"

export default async function ConsentimientoImprimible({
  params,
}: {
  params: Promise<{ id: string; consentId: string }>
}) {
  const { id, consentId } = await params
  const consent = await prisma.consent.findFirst({
    where: { id: consentId, patientId: id },
    include: { patient: true, budget: { include: { dentist: { select: { name: true } } } } },
  })
  if (!consent) notFound()

  return (
    <PrintableSheet
      title={consent.title}
      patient={consent.patient}
      date={formatDate(consent.signedAt ?? consent.createdAt)}
      professional={consent.budget?.dentist.name}
      backHref={`/pacientes/${id}/consentimientos`}
      signatures={["Firma paciente o representante", "Firma profesional"]}
    >
      {consent.budget && <p className="mb-4 font-semibold">Tratamiento: {consent.budget.name}</p>}
      {consent.content}
      {"\n\n"}Yo, {consent.patient.firstName} {consent.patient.lastName}, RUT {consent.patient.rut}, declaro haber leído y comprendido este documento.
    </PrintableSheet>
  )
}
