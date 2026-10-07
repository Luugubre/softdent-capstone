import { prisma } from "@/lib/prisma"
import { MedicalHistoryForm } from "@/components/ficha/MedicalHistoryForm"
import { formatDate } from "@/lib/ficha"

export default async function AntecedentesPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const history = await prisma.medicalHistory.findUnique({ where: { patientId: id } })

  return (
    <MedicalHistoryForm
      // Al guardar se remonta con los datos frescos
      key={history?.updatedAt.toISOString() ?? "nuevo"}
      patientId={id}
      updatedAt={history ? formatDate(history.updatedAt, true) : null}
      initial={{
        conditions: history?.conditions ?? [],
        allergies: history?.allergies ?? "",
        medications: history?.medications ?? "",
        surgeries: history?.surgeries ?? "",
        habits: history?.habits ?? "",
        smoker: history?.smoker ?? false,
        pregnant: history?.pregnant ?? false,
        observations: history?.observations ?? "",
      }}
    />
  )
}
