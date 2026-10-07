"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { saveMedicalHistory, MedicalHistoryInput } from "@/lib/ficha-actions"
import { MEDICAL_CONDITIONS } from "@/lib/ficha"
import { Card, inputClass, labelClass, primaryButton } from "./ui"

interface Props {
  patientId: string
  initial: Required<Omit<MedicalHistoryInput, "conditions" | "smoker" | "pregnant">> & {
    conditions: string[]
    smoker: boolean
    pregnant: boolean
  }
  updatedAt: string | null
}

export function MedicalHistoryForm({ patientId, initial, updatedAt }: Props) {
  const router = useRouter()
  const [form, setForm] = useState(initial)
  const [saving, setSaving] = useState(false)

  const set = <K extends keyof typeof form>(key: K, value: (typeof form)[K]) => setForm((f) => ({ ...f, [key]: value }))

  const toggleCondition = (condition: string) =>
    set(
      "conditions",
      form.conditions.includes(condition)
        ? form.conditions.filter((c) => c !== condition)
        : [...form.conditions, condition]
    )

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    const result = await saveMedicalHistory(patientId, form)
    setSaving(false)
    if (result.success) {
      alert("Antecedentes guardados")
      router.refresh()
    } else {
      alert(result.error)
    }
  }

  const textFields: { key: "allergies" | "medications" | "surgeries" | "habits"; label: string; placeholder: string }[] = [
    { key: "allergies", label: "Alergias", placeholder: "Ej: Penicilina, látex, AINEs..." },
    { key: "medications", label: "Medicamentos en uso", placeholder: "Ej: Losartán 50 mg c/12 h" },
    { key: "surgeries", label: "Cirugías / Hospitalizaciones", placeholder: "Ej: Apendicectomía 2015" },
    { key: "habits", label: "Hábitos", placeholder: "Ej: Bruxismo, onicofagia, consumo de alcohol" },
  ]

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Card title="Enfermedades y condiciones sistémicas">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
          {MEDICAL_CONDITIONS.map((condition) => (
            <label
              key={condition}
              className={`flex items-center gap-2 p-2.5 rounded-xl border text-sm font-semibold cursor-pointer transition-colors ${
                form.conditions.includes(condition)
                  ? "bg-red-50 border-red-300 text-red-800"
                  : "border-gray-200 text-gray-700 hover:bg-gray-50"
              }`}
            >
              <input
                type="checkbox"
                checked={form.conditions.includes(condition)}
                onChange={() => toggleCondition(condition)}
                className="w-4 h-4 accent-red-600"
              />
              {condition}
            </label>
          ))}
        </div>
        <div className="flex flex-wrap gap-6 mt-4">
          <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
            <input type="checkbox" checked={form.smoker} onChange={(e) => set("smoker", e.target.checked)} className="w-4 h-4" />
            Fumador(a)
          </label>
          <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
            <input type="checkbox" checked={form.pregnant} onChange={(e) => set("pregnant", e.target.checked)} className="w-4 h-4" />
            Embarazo / Lactancia
          </label>
        </div>
      </Card>

      <Card title="Antecedentes médicos">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {textFields.map((field) => (
            <div key={field.key}>
              <label className={labelClass}>{field.label}</label>
              <textarea
                rows={2}
                value={form[field.key]}
                onChange={(e) => set(field.key, e.target.value)}
                placeholder={field.placeholder}
                className={inputClass}
              />
            </div>
          ))}
          <div className="md:col-span-2">
            <label className={labelClass}>Observaciones</label>
            <textarea
              rows={3}
              value={form.observations}
              onChange={(e) => set("observations", e.target.value)}
              className={inputClass}
            />
          </div>
        </div>
      </Card>

      <div className="flex justify-between items-center">
        <p className="text-xs text-gray-500 font-semibold">
          {updatedAt ? `Última actualización: ${updatedAt}` : "Aún no se han registrado antecedentes."}
        </p>
        <button type="submit" disabled={saving} className={primaryButton}>
          {saving ? "Guardando..." : "Guardar Antecedentes"}
        </button>
      </div>
    </form>
  )
}
