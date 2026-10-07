import { notFound } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { PatientForm } from "@/components/PatientForm"
import { TogglePatientButton } from "@/components/TogglePatientButton"
import { Card } from "@/components/ficha/ui"
import { formatDate } from "@/lib/ficha"

export default async function DatosPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const patient = await prisma.patient.findUnique({ where: { id } })
  if (!patient) notFound()

  const initialData = {
    rut: patient.rut,
    firstName: patient.firstName,
    lastName: patient.lastName,
    email: patient.email ?? "",
    phone: patient.phone ?? "",
    prevision: patient.prevision,
    birthDate: patient.birthDate ? patient.birthDate.toISOString().split("T")[0] : "",
  }

  return (
    <div className="space-y-4">
      <PatientForm patientId={patient.id} initialData={initialData} />

      <Card title="Estado del paciente">
        <div className="flex flex-wrap items-center gap-6 text-sm text-gray-700">
          <div className="flex items-center gap-2 font-semibold">
            Estado: <TogglePatientButton patientId={patient.id} active={patient.active} />
          </div>
          <p className="font-semibold">Registrado el {formatDate(patient.createdAt)}</p>
          <p className="font-semibold">Última modificación {formatDate(patient.updatedAt, true)}</p>
        </div>
        <p className="text-xs text-gray-500 mt-3">
          Un paciente inactivo conserva toda su ficha clínica; puede reactivarlo en cualquier momento.
        </p>
      </Card>
    </div>
  )
}
