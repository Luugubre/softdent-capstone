import { PayrollDashboard } from "@/components/PayrollDashboard"

export default function LiquidacionesPage() {
  return (
    <div className="p-8 max-w-7xl mx-auto bg-gray-50 min-h-screen">
      <div className="mb-6 border-b border-gray-200 pb-4">
        <h1 className="text-3xl font-bold text-gray-800">Cierre de Caja</h1>
        <p className="text-gray-500 mt-2">Visión global de producción clínica, rendimientos médicos y pagos.</p>
      </div>
      
      <PayrollDashboard />
    </div>
  );
}