"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { deletePayment, registerPlanPayment } from "@/lib/ficha-actions"
import { PAYMENT_METHODS, formatMoney, paymentMethodLabel } from "@/lib/ficha"
import { Card, EmptyState, dangerButton, inputClass, labelClass, primaryButton, secondaryButton } from "./ui"

interface PlanBalance {
  id: string
  name: string
  total: number
  paid: number
  status: string
  progress: number
}

interface PaymentRow {
  id: string
  date: string
  amount: number
  method: string
  planName: string
}

export function PaymentsPanel({
  patientId,
  plans,
  payments,
}: {
  patientId: string
  plans: PlanBalance[]
  payments: PaymentRow[]
}) {
  const router = useRouter()
  const [paying, setPaying] = useState<PlanBalance | null>(null)
  const [amount, setAmount] = useState("")
  const [method, setMethod] = useState(PAYMENT_METHODS[0].value)
  const [busy, setBusy] = useState(false)

  const total = plans.reduce((s, p) => s + p.total, 0)
  const paid = plans.reduce((s, p) => s + p.paid, 0)

  function openPayment(plan: PlanBalance) {
    setPaying(plan)
    setAmount(String(plan.total - plan.paid))
    setMethod(PAYMENT_METHODS[0].value)
  }

  async function handlePay(e: React.FormEvent) {
    e.preventDefault()
    if (!paying) return
    setBusy(true)
    const result = await registerPlanPayment({ budgetId: paying.id, amount: Number(amount), method })
    setBusy(false)
    if (result.success) {
      setPaying(null)
      router.refresh()
    } else alert(result.error)
  }

  async function handleDelete(payment: PaymentRow) {
    if (!confirm(`¿Anular el pago de ${formatMoney(payment.amount)} del ${payment.date}?`)) return
    setBusy(true)
    const result = await deletePayment(payment.id)
    setBusy(false)
    if (result.success) router.refresh()
    else alert(result.error)
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border-l-4 border-blue-500 shadow-sm">
          <p className="text-xs font-black text-gray-500 uppercase">Total tratamientos</p>
          <p className="text-2xl font-black text-gray-900 mt-1">{formatMoney(total)}</p>
        </div>
        <div className="bg-white p-5 rounded-2xl border-l-4 border-emerald-500 shadow-sm">
          <p className="text-xs font-black text-gray-500 uppercase">Total pagado</p>
          <p className="text-2xl font-black text-emerald-700 mt-1">{formatMoney(paid)}</p>
        </div>
        <div className="bg-white p-5 rounded-2xl border-l-4 border-yellow-500 shadow-sm">
          <p className="text-xs font-black text-gray-500 uppercase">Saldo pendiente</p>
          <p className="text-2xl font-black text-yellow-700 mt-1">{formatMoney(total - paid)}</p>
        </div>
      </div>

      <Card title="Saldo por tratamiento">
        {plans.length === 0 ? (
          <EmptyState>
            No hay tratamientos que cobrar.{" "}
            <Link href={`/pacientes/${patientId}/tratamientos`} className="text-blue-600 underline">Crear un tratamiento</Link>
          </EmptyState>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 text-xs text-gray-600 uppercase tracking-wider">
                <tr>
                  <th className="p-3">Tratamiento</th>
                  <th className="p-3 text-center">Avance</th>
                  <th className="p-3 text-right">Total</th>
                  <th className="p-3 text-right">Pagado</th>
                  <th className="p-3 text-right">Saldo</th>
                  <th className="p-3 text-right"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {plans.map((plan) => {
                  const balance = plan.total - plan.paid
                  return (
                    <tr key={plan.id}>
                      <td className="p-3 font-bold text-gray-900">
                        <Link href={`/pacientes/${patientId}/tratamientos/${plan.id}`} className="hover:text-blue-600">{plan.name}</Link>
                      </td>
                      <td className="p-3 text-center text-xs font-bold text-gray-600">{plan.progress}%</td>
                      <td className="p-3 text-right font-semibold">{formatMoney(plan.total)}</td>
                      <td className="p-3 text-right font-semibold text-emerald-700">{formatMoney(plan.paid)}</td>
                      <td className="p-3 text-right font-black text-yellow-700">{formatMoney(balance)}</td>
                      <td className="p-3 text-right">
                        {balance > 0 ? (
                          <button type="button" onClick={() => openPayment(plan)} className="bg-emerald-600 text-white font-bold px-3 py-1.5 rounded-lg text-xs hover:bg-emerald-700">
                            Registrar pago
                          </button>
                        ) : (
                          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800">
                            {plan.total > 0 ? "Pagado" : "Sin cargos"}
                          </span>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Card title={`Historial de pagos (${payments.length})`}>
        {payments.length === 0 ? (
          <EmptyState>No hay pagos registrados.</EmptyState>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 text-xs text-gray-600 uppercase tracking-wider">
                <tr>
                  <th className="p-3">Fecha</th>
                  <th className="p-3">Tratamiento</th>
                  <th className="p-3">Medio de pago</th>
                  <th className="p-3 text-right">Monto</th>
                  <th className="p-3 text-right"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {payments.map((p) => (
                  <tr key={p.id}>
                    <td className="p-3 font-semibold text-gray-700">{p.date}</td>
                    <td className="p-3 font-bold text-gray-900">{p.planName}</td>
                    <td className="p-3 font-semibold text-gray-700">{paymentMethodLabel(p.method)}</td>
                    <td className="p-3 text-right font-black text-emerald-700">{formatMoney(p.amount)}</td>
                    <td className="p-3 text-right">
                      <button type="button" disabled={busy} onClick={() => handleDelete(p)} className={dangerButton}>Anular</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {paying && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <form onSubmit={handlePay} className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-gray-200 space-y-4">
            <h3 className="font-extrabold text-lg text-gray-900">Registrar pago</h3>
            <div className="p-3 rounded-xl bg-blue-50">
              <p className="text-xs font-bold text-gray-600">{paying.name}</p>
              <p className="text-xl font-black text-blue-700">Saldo {formatMoney(paying.total - paying.paid)}</p>
            </div>
            <div>
              <label className={labelClass}>Monto</label>
              <input
                type="number"
                min={1}
                max={paying.total - paying.paid}
                step={1}
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Medio de pago</label>
              <select value={method} onChange={(e) => setMethod(e.target.value)} className={inputClass}>
                {PAYMENT_METHODS.map((m) => (
                  <option key={m.value} value={m.value}>{m.label}</option>
                ))}
              </select>
            </div>
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setPaying(null)} className={secondaryButton}>Cancelar</button>
              <button type="submit" disabled={busy} className={primaryButton}>{busy ? "Procesando..." : "Confirmar pago"}</button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}
