"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { createTreatmentPlan } from "@/lib/ficha-actions"
import { formatMoney } from "@/lib/ficha"
import { Card, DentistSelect, EmptyState, ProgressBar, inputClass, labelClass, primaryButton } from "./ui"

interface PlanSummary {
  id: string
  name: string
  dentistName: string
  createdAt: string
  total: number
  paid: number
  done: number
  count: number
  percent: number
}

export function TreatmentPlanList({
  patientId,
  plans,
  dentists,
}: {
  patientId: string
  plans: PlanSummary[]
  dentists: { id: string; name: string }[]
}) {
  const router = useRouter()
  const [showForm, setShowForm] = useState(plans.length === 0)
  const [name, setName] = useState("")
  const [dentistId, setDentistId] = useState(dentists[0]?.id ?? "")
  const [notes, setNotes] = useState("")
  const [saving, setSaving] = useState(false)

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    const result = await createTreatmentPlan({ patientId, name, dentistId, notes })
    setSaving(false)
    if (result.success) {
      // Se entra directo al odontograma del nuevo tratamiento
      router.push(`/pacientes/${patientId}/tratamientos/${result.id}`)
    } else alert(result.error)
  }

  return (
    <div className="space-y-4">
      <Card
        title="Tratamientos"
        actions={
          <button type="button" onClick={() => setShowForm((v) => !v)} className={primaryButton}>
            {showForm ? "Cancelar" : "+ Nuevo Tratamiento"}
          </button>
        }
      >
        {showForm && (
          <form onSubmit={handleCreate} className="space-y-4 mb-6 p-4 bg-gray-50 rounded-2xl border border-gray-200">
            {dentists.length === 0 && (
              <p className="p-3 rounded-xl bg-yellow-50 border border-yellow-200 text-sm text-yellow-800 font-semibold">
                No hay profesionales con rol Dentista. <Link href="/profesionales/nuevo" className="underline">Registre uno</Link> para crear tratamientos.
              </p>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Nombre del tratamiento <span className="text-red-500">*</span></label>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  minLength={3}
                  placeholder="Ej: Rehabilitación oral 2026, Urgencia pieza 36..."
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>Profesional a cargo <span className="text-red-500">*</span></label>
                <DentistSelect dentists={dentists} value={dentistId} onChange={setDentistId} required />
              </div>
            </div>
            <div>
              <label className={labelClass}>Observaciones</label>
              <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} className={inputClass} />
            </div>
            <div className="flex justify-end">
              <button type="submit" disabled={saving || dentists.length === 0} className={primaryButton}>
                {saving ? "Creando..." : "Crear y Abrir Odontograma"}
              </button>
            </div>
          </form>
        )}

        {plans.length === 0 ? (
          <EmptyState>El paciente aún no tiene tratamientos. Cree uno para comenzar a planificar en el odontograma.</EmptyState>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {plans.map((plan) => (
              <Link
                key={plan.id}
                href={`/pacientes/${patientId}/tratamientos/${plan.id}`}
                className="block p-5 rounded-2xl border border-gray-200 hover:border-blue-400 hover:shadow-md transition-all bg-white"
              >
                <div className="flex justify-between items-start gap-3">
                  <div className="min-w-0">
                    <p className="font-extrabold text-gray-900 truncate">{plan.name}</p>
                    <p className="text-xs text-gray-500 font-semibold">Dr(a). {plan.dentistName} · {plan.createdAt}</p>
                  </div>
                  <span
                    className={`shrink-0 px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                      plan.count > 0 && plan.percent === 100 ? "bg-emerald-100 text-emerald-800" : "bg-blue-100 text-blue-800"
                    }`}
                  >
                    {plan.count > 0 && plan.percent === 100 ? "Finalizado" : "En curso"}
                  </span>
                </div>
                <div className="mt-4 space-y-1">
                  <div className="flex justify-between text-xs font-bold text-gray-600">
                    <span>{plan.done} de {plan.count} prestaciones realizadas</span>
                    <span>{plan.percent}%</span>
                  </div>
                  <ProgressBar percent={plan.percent} />
                </div>
                <div className="mt-3 flex justify-between text-sm font-bold">
                  <span className="text-gray-900">Total {formatMoney(plan.total)}</span>
                  <span className={plan.total - plan.paid > 0 ? "text-yellow-700" : "text-emerald-700"}>
                    Saldo {formatMoney(plan.total - plan.paid)}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </Card>
    </div>
  )
}
