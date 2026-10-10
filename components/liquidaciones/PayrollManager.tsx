"use client"

import { useState, useTransition } from "react"
import { createPayroll, updatePayrollStatus } from "@/app/actions/payrollActions"
import { PayrollStatus } from "@prisma/client"

interface PayrollManagerProps {
  dentists: any[]
  payrolls: any[]
  pendingItems: any[]
}

export function PayrollManager({ dentists, payrolls, pendingItems }: PayrollManagerProps) {
  const [selectedDentist, setSelectedDentist] = useState<string>(dentists[0]?.id || "")
  const [selectedItems, setSelectedItems] = useState<string[]>([])
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  // Filtrar prestaciones del profesional elegido
  const availableItems = pendingItems.filter((i) => i.budget.dentistId === selectedDentist)
  const currentDentist = dentists.find((d) => d.id === selectedDentist)

  function toggleItem(id: string) {
    setSelectedItems((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    )
  }

  function selectAll() {
    setSelectedItems(availableItems.map((i) => i.id))
  }

  async function handleCreate(formData: FormData) {
    setError(null)
    startTransition(async () => {
      const res = await createPayroll(formData)
      if (res?.error) setError(res.error)
      else {
        setSelectedItems([])
        ;(document.getElementById("form-payroll") as HTMLFormElement)?.reset()
      }
    })
  }

  async function handleStatusChange(id: string, status: PayrollStatus) {
    setError(null)
    startTransition(async () => {
      const res = await updatePayrollStatus(id, status)
      if (res?.error) setError(res.error)
    })
  }

  return (
    <div className="space-y-8">
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
          {error}
        </div>
      )}

      {/* FORMULARIO DE GENERACIÓN DE LIQUIDACIÓN */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-6">
        <h2 className="text-xl font-bold text-gray-800">Calcular Nueva Liquidación</h2>

        <form id="form-payroll" action={handleCreate} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">
                Profesional
              </label>
              <select
                name="dentistId"
                value={selectedDentist}
                onChange={(e) => {
                  setSelectedDentist(e.target.value)
                  setSelectedItems([])
                }}
                className="w-full border rounded-md px-3 py-2 text-sm text-gray-800"
              >
                {dentists.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name} ({d.commission}% comisión)
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">
                Período de Liquidación
              </label>
              <input
                name="period"
                type="text"
                placeholder="Ej: Marzo 2026"
                required
                className="w-full border rounded-md px-3 py-2 text-sm text-gray-800"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">
                Notas / Glosa
              </label>
              <input
                name="notes"
                type="text"
                placeholder="Observaciones de pago"
                className="w-full border rounded-md px-3 py-2 text-sm text-gray-800"
              />
            </div>
          </div>

          {/* Ajustes manuales */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg border">
            <div>
              <label className="block text-xs font-semibold text-green-700 uppercase mb-1">
                Bonificación (+)
              </label>
              <input
                name="bonusAmount"
                type="number"
                min="0"
                defaultValue={0}
                className="w-full border rounded-md px-3 py-2 text-sm text-gray-800"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-blue-700 uppercase mb-1">
                Ajuste (+ / -)
              </label>
              <input
                name="adjustmentAmount"
                type="number"
                defaultValue={0}
                className="w-full border rounded-md px-3 py-2 text-sm text-gray-800"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-rose-700 uppercase mb-1">
                Descuento (-)
              </label>
              <input
                name="discountAmount"
                type="number"
                min="0"
                defaultValue={0}
                className="w-full border rounded-md px-3 py-2 text-sm text-gray-800"
              />
            </div>
          </div>

          {/* Selección de Prestaciones Pendientes */}
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm font-bold text-gray-700">
                Prestaciones pendientes de liquidar ({availableItems.length})
              </span>
              {availableItems.length > 0 && (
                <button
                  type="button"
                  onClick={selectAll}
                  className="text-xs font-semibold text-blue-600 hover:underline"
                >
                  Seleccionar todas
                </button>
              )}
            </div>

            <div className="max-h-60 overflow-y-auto border rounded-lg divide-y divide-gray-200">
              {availableItems.length === 0 ? (
                <div className="p-4 text-center text-sm text-gray-400">
                  No hay prestaciones pendientes para este profesional.
                </div>
              ) : (
                availableItems.map((item) => (
                  <label
                    key={item.id}
                    className="flex items-center justify-between p-3 hover:bg-gray-50 cursor-pointer text-sm"
                  >
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        name="itemIds"
                        value={item.id}
                        checked={selectedItems.includes(item.id)}
                        onChange={() => toggleItem(item.id)}
                        className="rounded text-blue-600"
                      />
                      <div>
                        <span className="font-semibold text-gray-800">{item.treatment.name}</span>
                        <div className="text-xs text-gray-400">
                          Paciente: {item.budget.patient.firstName} {item.budget.patient.lastName}
                        </div>
                      </div>
                    </div>
                    <span className="font-mono font-medium text-gray-700">
                      ${item.price.toLocaleString("es-CL")}
                    </span>
                  </label>
                ))
              )}
            </div>
          </div>

          <button
            type="submit"
            disabled={isPending || selectedItems.length === 0}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 rounded-md text-sm transition-colors disabled:opacity-50"
          >
            {isPending ? "Calculando en servidor..." : "Generar Liquidación"}
          </button>
        </form>
      </div>

      {/* HISTORIAL DE LIQUIDACIONES */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-4">
        <h2 className="text-xl font-bold text-gray-800">Historial de Liquidaciones</h2>
        <div className="overflow-x-auto border rounded-lg">
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left font-semibold text-gray-600">Período</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600">Profesional</th>
                <th className="px-4 py-3 text-right font-semibold text-gray-600">Total Producido</th>
                <th className="px-4 py-3 text-right font-semibold text-gray-600">Total Profesional</th>
                <th className="px-4 py-3 text-right font-semibold text-gray-600">Total Clínica</th>
                <th className="px-4 py-3 text-center font-semibold text-gray-600">Estado</th>
                <th className="px-4 py-3 text-right font-semibold text-gray-600">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {payrolls.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-6 text-center text-gray-400">
                    No se han registrado liquidaciones aún.
                  </td>
                </tr>
              ) : (
                payrolls.map((p) => (
                  <tr key={p.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-800">{p.period}</td>
                    <td className="px-4 py-3 text-gray-700">
                      <div>{p.dentist.name}</div>
                      <div className="text-xs text-gray-400">Tasa: {p.dentistRate}%</div>
                    </td>
                    <td className="px-4 py-3 text-right font-mono">${p.totalProduced.toLocaleString("es-CL")}</td>
                    <td className="px-4 py-3 text-right font-mono font-bold text-emerald-600">
                      ${p.totalDentist.toLocaleString("es-CL")}
                    </td>
                    <td className="px-4 py-3 text-right font-mono font-bold text-blue-600">
                      ${p.totalClinic.toLocaleString("es-CL")}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                        p.status === "PAGADA" ? "bg-green-100 text-green-800" :
                        p.status === "APROBADA" ? "bg-blue-100 text-blue-800" :
                        p.status === "CALCULADA" ? "bg-amber-100 text-amber-800" :
                        p.status === "ANULADA" ? "bg-gray-100 text-gray-500 line-through" :
                        "bg-gray-100 text-gray-700"
                      }`}>
                        {p.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right space-x-2 whitespace-nowrap">
                      {p.status === "CALCULADA" && (
                        <button
                          onClick={() => handleStatusChange(p.id, "APROBADA")}
                          disabled={isPending}
                          className="text-xs bg-blue-50 text-blue-700 px-2.5 py-1 rounded hover:bg-blue-100 font-semibold"
                        >
                          Aprobar
                        </button>
                      )}
                      {p.status === "APROBADA" && (
                        <button
                          onClick={() => handleStatusChange(p.id, "PAGADA")}
                          disabled={isPending}
                          className="text-xs bg-green-50 text-green-700 px-2.5 py-1 rounded hover:bg-green-100 font-semibold"
                        >
                          Marcar Pagada
                        </button>
                      )}
                      {p.status !== "PAGADA" && p.status !== "ANULADA" && (
                        <button
                          onClick={() => handleStatusChange(p.id, "ANULADA")}
                          disabled={isPending}
                          className="text-xs text-rose-600 hover:underline"
                        >
                          Anular
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}