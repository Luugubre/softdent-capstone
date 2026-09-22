"use client"

import { useState } from "react"
import { registerPayment } from "@/lib/actions"
import { useRouter } from "next/navigation"

export function PaymentModal({ budgetId, total, paid }: { budgetId: string, total: number, paid: number }) {
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  
  const pendingAmount = total - paid;
  
  // Si ya está pagado completo, no mostramos el botón
  if (pendingAmount <= 0) return null;

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    
    const formData = new FormData(e.currentTarget)
    const amount = parseInt(formData.get("amount") as string)
    const method = formData.get("method") as string

    if (amount <= 0 || amount > pendingAmount) {
      alert(`El monto debe ser válido y no mayor a la deuda restante ($${pendingAmount.toLocaleString('es-CL')})`);
      setLoading(false);
      return;
    }

    const result = await registerPayment({ budgetId, amount, method })
    
    if (result.success) {
      setIsOpen(false)
      router.refresh() 
    } else {
      alert(result.error)
    }
    setLoading(false)
  }

  return (
    <>
      <button 
        onClick={() => setIsOpen(true)}
        className="mt-4 bg-emerald-100 text-emerald-700 font-bold px-4 py-2 rounded-lg hover:bg-emerald-200 transition-colors text-sm"
      >
        Registrar Pago / Abono
      </button>

      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-xl">
            <h3 className="text-xl font-bold mb-4 text-gray-800">Registrar Pago</h3>
            
            <div className="bg-blue-50 p-4 rounded-xl mb-6">
              <p className="text-xs font-bold text-gray-500 uppercase">Deuda Pendiente</p>
              <p className="text-2xl font-black text-blue-700">${pendingAmount.toLocaleString('es-CL')}</p>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Monto a abonar</label>
                <input 
                  type="number" 
                  name="amount" 
                  required 
                  defaultValue={pendingAmount}
                  max={pendingAmount}
                  className="w-full border border-gray-200 p-3 rounded-xl outline-none focus:border-blue-500"
                />
              </div>

              <div className="mb-6">
                <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Medio de Pago</label>
                <select name="method" required className="w-full border border-gray-200 p-3 rounded-xl outline-none focus:border-blue-500">
                  <option value="EFECTIVO">Efectivo</option>
                  <option value="TRANSFERENCIA">Transferencia Bancaria</option>
                  <option value="TARJETA_DEBITO">Tarjeta de Débito</option>
                  <option value="TARJETA_CREDITO">Tarjeta de Crédito</option>
                </select>
              </div>

              <div className="flex justify-end gap-2">
                <button type="button" onClick={() => setIsOpen(false)} className="px-4 py-2 text-gray-500 hover:bg-gray-100 rounded-xl font-bold">
                  Cancelar
                </button>
                <button type="submit" disabled={loading} className="px-4 py-2 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 disabled:bg-gray-300">
                  {loading ? "Procesando..." : "Confirmar Pago"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}