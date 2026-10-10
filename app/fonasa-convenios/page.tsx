import { prisma } from "@/lib/prisma"
import { FonasaManager } from "@/components/fonasa/FonasaManager"

export default async function FonasaConveniosPage() {
  const [vouchers, agreements, patients, treatments] = await Promise.all([
    // Bonos con paciente y tratamiento
    prisma.fonasaVoucher.findMany({
      include: {
        patient: true,
        treatment: true,
      },
      orderBy: { createdAt: "desc" },
    }),
    // Convenios vigentes con beneficiarios
    prisma.agreement.findMany({
      include: {
        beneficiaries: {
          include: { patient: true },
        },
      },
      orderBy: { name: "asc" },
    }),
    // Pacientes
    prisma.patient.findMany({
      orderBy: { firstName: "asc" },
    }),
    // Prestaciones/tratamientos
    prisma.treatment.findMany({
      where: { isActive: true },
      orderBy: { name: "asc" },
    }),
  ])

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 bg-gray-50 min-h-screen">
      <div>
        <h1 className="text-3xl font-extrabold text-gray-900">Módulo 5.4: FONASA y Convenios</h1>
        <p className="text-gray-600 mt-1">
          Control y registro de bonos FONASA (folios únicos), convenios con sindicatos y empresas, y beneficiarios.
        </p>
      </div>

      <FonasaManager
        vouchers={vouchers}
        agreements={agreements}
        patients={patients}
        treatments={treatments}
      />
    </div>
  )
}