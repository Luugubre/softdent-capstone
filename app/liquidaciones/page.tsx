import { prisma } from "@/lib/prisma"
import { PayrollManager } from "@/components/liquidaciones/PayrollManager"

export default async function LiquidacionesPage() {
  const [dentists, payrolls, pendingItems] = await Promise.all([
    // Dentistas activos
    prisma.user.findMany({
      where: { role: "DENTISTA", isActive: true },
      orderBy: { name: "asc" },
    }),
    // Historial de liquidaciones
    prisma.payroll.findMany({
      include: { dentist: true, items: true },
      orderBy: { createdAt: "desc" },
    }),
    // Prestaciones no liquidadas aún
    prisma.budgetItem.findMany({
      where: { payrollId: null },
      include: {
        treatment: true,
        budget: {
          include: { patient: true },
        },
      },
    }),
  ])

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 bg-gray-50 min-h-screen">
      <div>
        <h1 className="text-3xl font-extrabold text-gray-900">Módulo 5.3: Liquidaciones</h1>
        <p className="text-gray-600 mt-1">
          Cálculo y registro de honorarios por profesional, comisiones y separación clínica/profesional.
        </p>
      </div>

      <PayrollManager
        dentists={dentists}
        payrolls={payrolls}
        pendingItems={pendingItems}
      />
    </div>
  )
}