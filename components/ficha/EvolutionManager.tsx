"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createEvolution, deleteEvolution } from "@/lib/ficha-actions"
import { Card, DentistSelect, EmptyState, dangerButton, inputClass, labelClass, primaryButton } from "./ui"

interface EvolutionInfo {
  id: string
  date: string
  content: string
  dentistName: string | null
  planName: string | null
}

// Fecha/hora local en formato de <input type="datetime-local">
function nowLocal() {
  const d = new Date()
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset())
  return d.toISOString().slice(0, 16)
}

export function EvolutionManager({
  patientId,
  evolutions,
  dentists,
  plans,
}: {
  patientId: string
  evolutions: EvolutionInfo[]
  dentists: { id: string; name: string }[]
  plans: { id: string; name: string }[]
}) {
  const router = useRouter()
  const [date, setDate] = useState(nowLocal)
  const [dentistId, setDentistId] = useState(dentists[0]?.id ?? "")
  const [budgetId, setBudgetId] = useState("")
  const [content, setContent] = useState("")
  const [saving, setSaving] = useState(false)
  const [planFilter, setPlanFilter] = useState("")

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    const result = await createEvolution({
      patientId,
      content,
      // datetime-local no trae zona horaria: se convierte desde la hora local del navegador
      date: date ? new Date(date).toISOString() : undefined,
      dentistId,
      budgetId,
    })
    setSaving(false)
    if (result.success) {
      setContent("")
      setDate(nowLocal())
      router.refresh()
    } else alert(result.error)
  }

  async function handleDelete(id: string) {
    if (!confirm("¿Eliminar esta evolución?")) return
    const result = await deleteEvolution(id)
    if (result.success) router.refresh()
    else alert(result.error)
  }

  const visible = planFilter ? evolutions.filter((e) => e.planName === planFilter) : evolutions

  return (
    <div className="space-y-4">
      <Card title="Registrar evolución">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className={labelClass}>Fecha y hora</label>
              <input type="datetime-local" value={date} onChange={(e) => setDate(e.target.value)} required className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Profesional</label>
              <DentistSelect dentists={dentists} value={dentistId} onChange={setDentistId} />
            </div>
            <div>
              <label className={labelClass}>Tratamiento</label>
              <select value={budgetId} onChange={(e) => setBudgetId(e.target.value)} className={inputClass}>
                <option value="">General (sin tratamiento)</option>
                {plans.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className={labelClass}>¿Qué se realizó en la atención?</label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              required
              rows={4}
              placeholder="Ej: Se realiza obturación con resina compuesta en pieza 16 OD. Paciente sin molestias. Control en 6 meses."
              className={inputClass}
            />
          </div>
          <div className="flex justify-end">
            <button type="submit" disabled={saving} className={primaryButton}>
              {saving ? "Guardando..." : "Guardar Evolución"}
            </button>
          </div>
        </form>
      </Card>

      <Card
        title={`Historial de evoluciones (${evolutions.length})`}
        actions={
          plans.length > 0 && (
            <select value={planFilter} onChange={(e) => setPlanFilter(e.target.value)} className={`${inputClass} w-auto text-sm`}>
              <option value="">Todos los tratamientos</option>
              {plans.map((p) => (
                <option key={p.id} value={p.name}>{p.name}</option>
              ))}
            </select>
          )
        }
      >
        {visible.length === 0 ? (
          <EmptyState>No hay evoluciones registradas.</EmptyState>
        ) : (
          <ol className="relative border-l-2 border-blue-100 ml-2 space-y-5">
            {visible.map((ev) => (
              <li key={ev.id} className="ml-5">
                <span className="absolute -left-[7px] w-3 h-3 rounded-full bg-blue-600 mt-1.5" />
                <div className="flex flex-wrap justify-between gap-2">
                  <p className="text-xs font-bold text-gray-500">
                    {ev.date}
                    {ev.dentistName && ` · Dr(a). ${ev.dentistName}`}
                    {ev.planName && (
                      <span className="ml-2 px-2 py-0.5 rounded-full bg-blue-50 text-blue-700">{ev.planName}</span>
                    )}
                  </p>
                  <button type="button" onClick={() => handleDelete(ev.id)} className={dangerButton}>Eliminar</button>
                </div>
                <p className="text-sm text-gray-900 font-medium whitespace-pre-wrap mt-1">{ev.content}</p>
              </li>
            ))}
          </ol>
        )}
      </Card>
    </div>
  )
}
