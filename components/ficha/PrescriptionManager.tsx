"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { createPrescription, deletePrescription } from "@/lib/ficha-actions"
import { PrescriptionMedication } from "@/lib/ficha"
import { Card, DentistSelect, EmptyState, dangerButton, inputClass, labelClass, primaryButton, secondaryButton } from "./ui"

interface PrescriptionInfo {
  id: string
  createdAt: string
  dentistName: string | null
  medications: PrescriptionMedication[]
}

const emptyMedication = (): PrescriptionMedication => ({ name: "", dose: "", frequency: "", duration: "" })

export function PrescriptionManager({
  patientId,
  prescriptions,
  dentists,
  allergies,
}: {
  patientId: string
  prescriptions: PrescriptionInfo[]
  dentists: { id: string; name: string }[]
  allergies: string | null
}) {
  const router = useRouter()
  const [showForm, setShowForm] = useState(false)
  const [dentistId, setDentistId] = useState(dentists[0]?.id ?? "")
  const [medications, setMedications] = useState<PrescriptionMedication[]>([emptyMedication()])
  const [instructions, setInstructions] = useState("")
  const [saving, setSaving] = useState(false)

  const updateMed = (index: number, key: keyof PrescriptionMedication, value: string) =>
    setMedications((meds) => meds.map((m, i) => (i === index ? { ...m, [key]: value } : m)))

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    const result = await createPrescription({
      patientId,
      dentistId,
      instructions,
      medications: medications.filter((m) => m.name.trim() !== ""),
    })
    setSaving(false)
    if (result.success) {
      router.push(`/pacientes/${patientId}/recetas/${result.id}`)
    } else alert(result.error)
  }

  async function handleDelete(id: string) {
    if (!confirm("¿Eliminar esta receta?")) return
    const result = await deletePrescription(id)
    if (result.success) router.refresh()
    else alert(result.error)
  }

  return (
    <Card
      title="Recetas"
      actions={
        <button type="button" onClick={() => setShowForm((v) => !v)} className={primaryButton}>
          {showForm ? "Cancelar" : "+ Nueva Receta"}
        </button>
      }
    >
      {showForm && (
        <form onSubmit={handleSubmit} className="space-y-4 mb-6 p-4 bg-gray-50 rounded-2xl border border-gray-200">
          {allergies && (
            <p className="p-3 rounded-xl bg-red-50 border border-red-200 text-sm text-red-800 font-bold">
              ⚠️ Alergias del paciente: {allergies}
            </p>
          )}
          <div className="max-w-sm">
            <label className={labelClass}>Profesional</label>
            <DentistSelect dentists={dentists} value={dentistId} onChange={setDentistId} />
          </div>

          <div className="space-y-2">
            <label className={labelClass}>Medicamentos</label>
            {medications.map((med, i) => (
              <div key={i} className="grid grid-cols-2 md:grid-cols-[2fr_1fr_1fr_1fr_auto] gap-2">
                <input placeholder="Medicamento (ej: Amoxicilina)" value={med.name} onChange={(e) => updateMed(i, "name", e.target.value)} className={`${inputClass} col-span-2 md:col-span-1`} />
                <input placeholder="Dosis (500 mg)" value={med.dose} onChange={(e) => updateMed(i, "dose", e.target.value)} className={inputClass} />
                <input placeholder="Cada (8 horas)" value={med.frequency} onChange={(e) => updateMed(i, "frequency", e.target.value)} className={inputClass} />
                <input placeholder="Por (7 días)" value={med.duration} onChange={(e) => updateMed(i, "duration", e.target.value)} className={inputClass} />
                <button
                  type="button"
                  onClick={() => setMedications((meds) => (meds.length > 1 ? meds.filter((_, j) => j !== i) : meds))}
                  className={dangerButton}
                  aria-label="Quitar medicamento"
                >
                  ✕
                </button>
              </div>
            ))}
            <button type="button" onClick={() => setMedications((m) => [...m, emptyMedication()])} className={secondaryButton}>
              + Agregar medicamento
            </button>
          </div>

          <div>
            <label className={labelClass}>Indicaciones</label>
            <textarea value={instructions} onChange={(e) => setInstructions(e.target.value)} rows={3} placeholder="Ej: Tomar después de las comidas. Evitar alimentos duros por 24 horas." className={inputClass} />
          </div>
          <div className="flex justify-end">
            <button type="submit" disabled={saving} className={primaryButton}>
              {saving ? "Guardando..." : "Emitir Receta"}
            </button>
          </div>
        </form>
      )}

      {prescriptions.length === 0 ? (
        <EmptyState>No hay recetas emitidas.</EmptyState>
      ) : (
        <div className="divide-y divide-gray-100">
          {prescriptions.map((p) => (
            <div key={p.id} className="py-3 flex flex-wrap justify-between items-center gap-3">
              <div>
                <p className="font-bold text-gray-900">{p.medications.map((m) => m.name).join(", ")}</p>
                <p className="text-xs text-gray-500 font-semibold">
                  {p.createdAt}
                  {p.dentistName && ` · Dr(a). ${p.dentistName}`}
                </p>
              </div>
              <div className="flex gap-2">
                <Link href={`/pacientes/${patientId}/recetas/${p.id}`} className={secondaryButton}>Ver / Imprimir</Link>
                <button type="button" onClick={() => handleDelete(p.id)} className={dangerButton}>Eliminar</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  )
}
