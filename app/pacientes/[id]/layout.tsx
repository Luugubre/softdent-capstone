import Link from "next/link"
import { notFound } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { FichaTabs } from "@/components/ficha/FichaTabs"
import { calculateAge, formatMoney } from "@/lib/ficha"

export default async function FichaLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  const patient = await prisma.patient.findUnique({
    where: { id },
    include: {
      medicalHistory: { select: { allergies: true, conditions: true } },
      budgets: { select: { total: true, paid: true } },
    },
  })

  if (!patient) notFound()

  const age = calculateAge(patient.birthDate)
  const balance = patient.budgets.reduce((sum, b) => sum + (b.total - b.paid), 0)
  const alerts = [
    ...(patient.medicalHistory?.allergies ? [`Alergias: ${patient.medicalHistory.allergies}`] : []),
    ...(patient.medicalHistory?.conditions ?? []),
  ]

  return (
    <div className="w-full min-h-screen bg-gray-50 p-4 md:p-8 space-y-4">
      <div className="bg-white shadow-sm rounded-2xl p-5 border border-gray-200 print:hidden">
        <Link href="/pacientes" className="text-xs font-bold text-blue-600 hover:underline">
          ← Directorio de pacientes
        </Link>
        <div className="flex flex-wrap justify-between items-start gap-4 mt-2">
          <div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-gray-900">
              {patient.firstName} {patient.lastName}
            </h1>
            <p className="text-sm text-gray-600 font-semibold mt-1">
              RUT {patient.rut} · {patient.prevision}
              {age !== null && ` · ${age} años`}
              {patient.phone && ` · ${patient.phone}`}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={`px-3 py-1 text-xs font-bold rounded-full ${
                patient.active ? "bg-emerald-100 text-emerald-800" : "bg-red-100 text-red-800"
              }`}
            >
              {patient.active ? "Activo" : "Inactivo"}
            </span>
            <Link
              href={`/pacientes/${patient.id}/pagos`}
              className={`px-3 py-1 text-xs font-bold rounded-full ${
                balance > 0 ? "bg-yellow-100 text-yellow-800" : "bg-gray-100 text-gray-700"
              }`}
            >
              Saldo pendiente: {formatMoney(balance)}
            </Link>
          </div>
        </div>
        {alerts.length > 0 && (
          <div className="mt-3 p-3 rounded-xl bg-red-50 border border-red-200 text-sm text-red-800 font-semibold">
            ⚠️ {alerts.join(" · ")}
          </div>
        )}
      </div>

      <FichaTabs patientId={patient.id} />

      <div>{children}</div>
    </div>
  )
}
