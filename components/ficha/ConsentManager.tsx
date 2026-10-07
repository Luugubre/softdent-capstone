"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { createConsent, deleteConsent, updateConsentStatus } from "@/lib/ficha-actions"
import { CONSENT_STATUS, CONSENT_TEMPLATES } from "@/lib/ficha"
import { Card, EmptyState, dangerButton, inputClass, labelClass, primaryButton, secondaryButton } from "./ui"

interface ConsentInfo {
  id: string
  title: string
  content: string
  status: string
  signedAt: string | null
  createdAt: string
  planName: string | null
}

export function ConsentManager({
  patientId,
  consents,
  plans,
}: {
  patientId: string
  consents: ConsentInfo[]
  plans: { id: string; name: string }[]
}) {
  const router = useRouter()
  const [showForm, setShowForm] = useState(false)
  const [title, setTitle] = useState("")
  const [content, setContent] = useState("")
  const [budgetId, setBudgetId] = useState("")
  const [saving, setSaving] = useState(false)

  function applyTemplate(index: string) {
    const template = CONSENT_TEMPLATES[Number(index)]
    if (!template) return
    setTitle(template.title)
    setContent(template.content)
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    const result = await createConsent({ patientId, title, content, budgetId })
    setSaving(false)
    if (result.success) {
      setTitle("")
      setContent("")
      setBudgetId("")
      setShowForm(false)
      router.refresh()
    } else alert(result.error)
  }

  async function changeStatus(id: string, status: string) {
    const result = await updateConsentStatus(id, status)
    if (result.success) router.refresh()
    else alert(result.error)
  }

  async function handleDelete(id: string) {
    if (!confirm("¿Eliminar este consentimiento?")) return
    const result = await deleteConsent(id)
    if (result.success) router.refresh()
    else alert(result.error)
  }

  return (
    <div className="space-y-4">
      <Card
        title="Consentimientos informados"
        actions={
          <button type="button" onClick={() => setShowForm((v) => !v)} className={primaryButton}>
            {showForm ? "Cancelar" : "+ Nuevo Consentimiento"}
          </button>
        }
      >
        {showForm && (
          <form onSubmit={handleCreate} className="space-y-4 mb-6 p-4 bg-gray-50 rounded-2xl border border-gray-200">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Plantilla</label>
                <select defaultValue="" onChange={(e) => applyTemplate(e.target.value)} className={inputClass}>
                  <option value="">Seleccionar plantilla (opcional)...</option>
                  {CONSENT_TEMPLATES.map((t, i) => (
                    <option key={t.title} value={i}>{t.title}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className={labelClass}>Tratamiento asociado</label>
                <select value={budgetId} onChange={(e) => setBudgetId(e.target.value)} className={inputClass}>
                  <option value="">Sin tratamiento asociado</option>
                  {plans.map((p) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <label className={labelClass}>Título</label>
              <input value={title} onChange={(e) => setTitle(e.target.value)} required className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Texto del consentimiento</label>
              <textarea value={content} onChange={(e) => setContent(e.target.value)} required rows={6} className={inputClass} />
            </div>
            <div className="flex justify-end">
              <button type="submit" disabled={saving} className={primaryButton}>
                {saving ? "Guardando..." : "Crear Consentimiento"}
              </button>
            </div>
          </form>
        )}

        {consents.length === 0 ? (
          <EmptyState>No hay consentimientos registrados.</EmptyState>
        ) : (
          <div className="space-y-3">
            {consents.map((c) => {
              const status = CONSENT_STATUS.find((s) => s.value === c.status)
              return (
                <div key={c.id} className="p-4 rounded-2xl border border-gray-200 flex flex-wrap justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-extrabold text-gray-900">{c.title}</p>
                      <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${status?.className}`}>{status?.label}</span>
                    </div>
                    <p className="text-xs text-gray-500 font-semibold mt-1">
                      Creado el {c.createdAt}
                      {c.signedAt && ` · Firmado el ${c.signedAt}`}
                      {c.planName && ` · Tratamiento: ${c.planName}`}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    {c.status !== "FIRMADO" && (
                      <button type="button" onClick={() => changeStatus(c.id, "FIRMADO")} className="bg-emerald-600 text-white font-bold px-3 py-1.5 rounded-lg text-xs hover:bg-emerald-700">
                        Marcar firmado
                      </button>
                    )}
                    {c.status === "PENDIENTE" && (
                      <button type="button" onClick={() => changeStatus(c.id, "RECHAZADO")} className={secondaryButton}>Rechazado</button>
                    )}
                    {c.status !== "PENDIENTE" && (
                      <button type="button" onClick={() => changeStatus(c.id, "PENDIENTE")} className={secondaryButton}>Volver a pendiente</button>
                    )}
                    <Link href={`/pacientes/${patientId}/consentimientos/${c.id}`} className={secondaryButton}>Ver / Imprimir</Link>
                    <button type="button" onClick={() => handleDelete(c.id)} className={dangerButton}>Eliminar</button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </Card>
    </div>
  )
}
