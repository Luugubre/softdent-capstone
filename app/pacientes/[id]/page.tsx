import { prisma } from "@/lib/prisma"
import { notFound } from "next/navigation"
import { OdontogramaClinico } from "@/components/OdontogramaClinico"
import { BudgetBuilder } from "@/components/BudgetBuilder"
import { PaymentModal } from "@/components/PaymentModal"

export default async function FichaPaciente({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const patient = await prisma.patient.findUnique({
    where: { id: id },
    include: {
      budgets: {
        orderBy: { createdAt: 'desc' },
        include: {
          dentist: true,
          items: { include: { treatment: true } }
        }
      }
    }
  });

  if (!patient) notFound(); 

  const dentists = await prisma.user.findMany({
    where: { role: "DENTISTA" },
    select: { id: true, name: true }
  });

  const treatments = await prisma.treatment.findMany({
    orderBy: { category: 'asc' }
  });

  return (
    <div className="p-8 max-w-6xl mx-auto bg-gray-50 min-h-screen">
      <div className="bg-white shadow rounded-2xl p-6 mb-8 border border-gray-200">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Ficha Clínica</h1>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Paciente</p>
            <p className="font-semibold text-lg">{patient.firstName} {patient.lastName}</p>
          </div>
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">RUT</p>
            <p className="font-semibold text-lg">{patient.rut}</p>
          </div>
        </div>
      </div>

      <h2 className="text-2xl font-bold text-gray-800 mt-8 border-b pb-4">Odontograma</h2>
      <OdontogramaClinico patientId={patient.id} initialData={patient.odontogram} />

      <h2 className="text-2xl font-bold text-gray-800 mt-12 border-b pb-4">Plan de Tratamiento y Aranceles</h2>
      
      <BudgetBuilder patientId={patient.id} dentists={dentists} treatments={treatments} />

      {patient.budgets.length > 0 && (
        <div className="mt-8 space-y-6">
          <h3 className="font-bold text-gray-500 uppercase tracking-widest text-sm">Presupuestos Anteriores</h3>
          {patient.budgets.map(budget => (
            <div key={budget.id} className="bg-white p-6 rounded-3xl border border-gray-200 shadow-sm">
              <div className="flex justify-between items-start mb-4 border-b pb-4">
                <div>
                  <p className="text-xs font-black text-gray-400 uppercase">Fecha: {new Date(budget.createdAt).toLocaleDateString('es-CL')}</p>
                  <p className="text-sm font-bold text-gray-800 mt-1">Dr. {budget.dentist.name}</p>
                </div>
                
                <div className="text-right">
                  <span className={`text-[10px] font-black uppercase px-3 py-1 rounded-full ${budget.status === 'PAGADO' ? 'bg-emerald-100 text-emerald-700' : budget.status === 'APROBADO' ? 'bg-blue-100 text-blue-700' : 'bg-yellow-100 text-yellow-700'}`}>
                    {budget.status}
                  </span>
                  <p className="text-xl font-black text-blue-600 mt-2">Total: ${(budget.total || 0).toLocaleString('es-CL')}</p>
                  
                  {/* AQUÍ ESTÁ LA CORRECCIÓN: (budget.paid || 0) */}
                  <p className="text-sm font-bold text-gray-500 mt-1">Abonado: ${(budget.paid || 0).toLocaleString('es-CL')}</p>
                  
                  {/* Modal de Pagos */}
                  <PaymentModal budgetId={budget.id} total={budget.total || 0} paid={budget.paid || 0} />
                </div>
              </div>
              
              <div className="space-y-2">
                {budget.items.map(item => (
                  <div key={item.id} className="flex justify-between items-center bg-gray-50 p-3 rounded-xl border border-gray-100">
                    <div className="flex items-center gap-4">
                      <span className="bg-white px-2 py-1 rounded text-xs font-black text-gray-500 border border-gray-200 min-w-10 text-center">
                        {item.tooth || 'Gen'}
                      </span>
                      <span className="text-sm font-semibold text-gray-700">{item.treatment.name}</span>
                    </div>
                    <span className="text-sm font-bold text-gray-800">${(item.price || 0).toLocaleString('es-CL')}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}