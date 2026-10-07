"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { createDocument, deleteDocument } from "@/lib/ficha-actions"
import { DOCUMENT_TEMPLATES, DOCUMENT_TYPES, documentTypeLabel, fillTemplate } from "@/lib/ficha"
import { Card, DentistSelect, EmptyState, dangerButton, inputClass, labelClass, primaryButton, secondaryButton } from "./ui"

interface DocumentInfo {
  id: string
  type: string
  title: string
  createdAt: string
  dentistName: string | null
}

export function DocumentManager({
  patientId,
  patient,
  documents,
  consents,
  dentists,
}: {
  patientId: string
  patient: { name: string; rut: string }
  documents: DocumentInfo[]
  consents: { id: string; title: string; status: string; createdAt: string }[]
  dentists: { id: string; name: string }[]
}) {
  const router = useRouter()
  const [showForm, setShowForm] = useState(false)
  const [type, setType] = useState("CERTIFICADO")
  const [title, setTitle] = useState("")
  const [content, setContent] = useState("")
  const [dentistId, setDentistId] = useState("")
  const [saving, setSaving] = useState(false)

  function applyTemplate(index: string) {
    const template = DOCUMENT_TEMPLATES[Number(index)]
    if (!template) return
    setType(template.type)
    setTitle(template.title)
    setContent(
      fillTemplate(template.content, {
        paciente: patient.name,
        rut: patient.rut,
        fecha: new Date().toLocaleDateString("es-CL"),
      })
    )
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    const result = await createDocument({ patientId, type, title, content, dentistId })
    setSaving(false)
    if (result.success) {
      router.push(`/pacientes/${patientId}/documentos/${result.id}`)
    } else alert(result.error)
  }

  async function handleDelete(id: string) {
    if (!confirm("¿Eliminar este documento?")) return
    const result = await deleteDocument(id)
    if (result.success) router.refresh()
    else alert(result.error)
  }

  return (
    <div className="space-y-4">
      <Card
        title="Certificados e informes"
        actions={
          <button type="button" onClick={() => setShowForm((v) => !v)} className={primaryButton}>
            {showForm ? "Cancelar" : "+ Nuevo Documento"}
          </button>
        }
      >
        {showForm && (
          <form onSubmit={handleCreate} className="space-y-4 mb-6 p-4 bg-gray-50 rounded-2xl border border-gray-200">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className={labelClass}>Plantilla</label>
                <select defaultValue="" onChange={(e) => applyTemplate(e.target.value)} className={inputClass}>
                  <option value="">Seleccionar plantilla (opcional)...</option>
                  {DOCUMENT_TEMPLATES.map((t, i) => (
                    <option key={t.title} value={i}>{t.title}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className={labelClass}>Tipo</label>
                <select value={type} onChange={(e) => setType(e.target.value)} className={inputClass}>
                  {DOCUMENT_TYPES.map((t) => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className={labelClass}>Profesional que emite</label>
                <DentistSelect dentists={dentists} value={dentistId} onChange={setDentistId} />
              </div>
            </div>
            <div>
              <label className={labelClass}>Título</label>
              <input value={title} onChange={(e) => setTitle(e.target.value)} required className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Contenido</label>
              <textarea value={content} onChange={(e) => setContent(e.target.value)} required rows={8} className={inputClass} />
            </div>
            <div className="flex justify-end">
              <button type="submit" disabled={saving} className={primaryButton}>
                {saving ? "Guardando..." : "Crear y Ver Documento"}
              </button>
            </div>
          </form>
        )}

        {documents.length === 0 ? (
          <EmptyState>No hay certificados ni informes emitidos.</EmptyState>
        ) : (
          <div className="divide-y divide-gray-100">
            {documents.map((d) => (
              <div key={d.id} className="py-3 flex flex-wrap justify-between items-center gap-3">
                <div>
                  <p className="font-bold text-gray-900">{d.title}</p>
                  <p className="text-xs text-gray-500 font-semibold">
                    {documentTypeLabel(d.type)} · {d.createdAt}
                    {d.dentistName && ` · Dr(a). ${d.dentistName}`}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Link href={`/pacientes/${patientId}/documentos/${d.id}`} className={secondaryButton}>Ver / Imprimir</Link>
                  <button type="button" onClick={() => handleDelete(d.id)} className={dangerButton}>Eliminar</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      <Card
        title="Consentimientos"
        actions={<Link href={`/pacientes/${patientId}/consentimientos`} className={secondaryButton}>Gestionar consentimientos</Link>}
      >
        {consents.length === 0 ? (
          <EmptyState>No hay consentimientos registrados.</EmptyState>
        ) : (
          <div className="divide-y divide-gray-100">
            {consents.map((c) => (
              <div key={c.id} className="py-3 flex flex-wrap justify-between items-center gap-3">
                <div>
                  <p className="font-bold text-gray-900">{c.title}</p>
                  <p className="text-xs text-gray-500 font-semibold">Consentimiento · {c.createdAt} · {c.status}</p>
                </div>
                <Link href={`/pacientes/${patientId}/consentimientos/${c.id}`} className={secondaryButton}>Ver / Imprimir</Link>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  )
}
