import { notFound } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { PrintableSheet } from "@/components/ficha/PrintableSheet"
import { formatDate } from "@/lib/ficha"

export default async function DocumentoImprimible({
  params,
}: {
  params: Promise<{ id: string; documentId: string }>
}) {
  const { id, documentId } = await params
  const doc = await prisma.patientDocument.findFirst({
    where: { id: documentId, patientId: id },
    include: { patient: true, dentist: { select: { name: true } } },
  })
  if (!doc) notFound()

  return (
    <PrintableSheet
      title={doc.title}
      patient={doc.patient}
      date={formatDate(doc.createdAt)}
      professional={doc.dentist?.name}
      backHref={`/pacientes/${id}/documentos`}
    >
      {doc.content}
    </PrintableSheet>
  )
}
