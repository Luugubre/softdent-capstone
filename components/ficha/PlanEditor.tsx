"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ToothSurfaces } from "@/types/clinical"
import {
  addPlanItem,
  deleteTreatmentPlan,
  removePlanItem,
  setPlanItemStatus,
  updateTreatmentPlan,
} from "@/lib/ficha-actions"
import { SURFACES, formatMoney, planProgress, surfaceLabel } from "@/lib/ficha"
import { LegendDot, STATUS_COLORS, ToothChart, buildSurfaceMap } from "./ToothChart"
import { Card, EmptyState, ProgressBar, dangerButton, inputClass, labelClass, primaryButton, secondaryButton } from "./ui"

interface PlanItem {
  id: string
  tooth: number | null
  surfaces: string[]
  price: number
  status: string
  completedAt: string | null
  treatmentName: string
}

interface Plan {
  id: string
  name: string
  notes: string | null
  dentistName: string
  createdAt: string
  total: number
  paid: number
  paymentsCount: number
  items: PlanItem[]
}

interface CatalogTreatment {
  id: string
  name: string
  price: number
  category: string
}

export function PlanEditor({
  patientId,
  plan,
  catalog,
  absentTeeth,
}: {
  patientId: string
  plan: Plan
  catalog: CatalogTreatment[]
  absentTeeth: number[]
}) {
  const router = useRouter()
  const [selectedTooth, setSelectedTooth] = useState<number | null>(null)
  const [selectedSurfaces, setSelectedSurfaces] = useState<string[]>([])
  const [treatmentId, setTreatmentId] = useState("")
  const [price, setPrice] = useState("")
  const [busy, setBusy] = useState(false)
  const [completing, setCompleting] = useState<PlanItem | null>(null)
  const [evolutionNote, setEvolutionNote] = useState("")
  const [editingName, setEditingName] = useState(false)
  const [name, setName] = useState(plan.name)
  const [notes, setNotes] = useState(plan.notes ?? "")

  const progress = planProgress(plan.items)
  const chart = useMemo(() => buildSurfaceMap(plan.items), [plan.items])

  // Agrupa el catálogo por categoría para el selector
  const catalogByCategory = useMemo(() => {
    const groups = new Map<string, CatalogTreatment[]>()
    for (const t of catalog) groups.set(t.category, [...(groups.get(t.category) ?? []), t])
    return [...groups.entries()]
  }, [catalog])

  function selectTooth(tooth: number) {
    if (selectedTooth === tooth) {
      setSelectedTooth(null)
      setSelectedSurfaces([])
    } else {
      setSelectedTooth(tooth)
      setSelectedSurfaces([])
    }
  }

  function toggleSurface(tooth: number, surface: keyof ToothSurfaces) {
    if (selectedTooth !== tooth) {
      setSelectedTooth(tooth)
      setSelectedSurfaces([surface])
      return
    }
    setSelectedSurfaces((s) => (s.includes(surface) ? s.filter((x) => x !== surface) : [...s, surface]))
  }

  function chooseTreatment(id: string) {
    setTreatmentId(id)
    const t = catalog.find((c) => c.id === id)
    setPrice(t ? String(t.price) : "")
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    setBusy(true)
    const result = await addPlanItem({
      budgetId: plan.id,
      treatmentId,
      tooth: selectedTooth,
      surfaces: selectedSurfaces,
      price: Number(price),
    })
    setBusy(false)
    if (result.success) {
      setTreatmentId("")
      setPrice("")
      setSelectedSurfaces([])
      router.refresh()
    } else alert(result.error)
  }

  async function run(action: () => Promise<{ success: boolean; error?: string }>) {
    setBusy(true)
    const result = await action()
    setBusy(false)
    if (result.success) router.refresh()
    else alert(result.error)
    return result.success
  }

  async function confirmComplete() {
    if (!completing) return
    const ok = await run(() => setPlanItemStatus(completing.id, true, evolutionNote))
    if (ok) {
      setCompleting(null)
      setEvolutionNote("")
    }
  }

  async function saveName() {
    const ok = await run(() => updateTreatmentPlan(plan.id, { name, notes }))
    if (ok) setEditingName(false)
  }

  async function handleDeletePlan() {
    if (!confirm(`¿Eliminar el tratamiento "${plan.name}" y todas sus prestaciones?`)) return
    setBusy(true)
    const result = await deleteTreatmentPlan(plan.id)
    setBusy(false)
    if (result.success) router.push(`/pacientes/${patientId}/tratamientos`)
    else alert(result.error)
  }

  // Las caras seleccionadas se pintan en ámbar sobre el estado del plan
  const fillFor = (tooth: number, surface: keyof ToothSurfaces) =>
    tooth === selectedTooth && selectedSurfaces.includes(surface) ? STATUS_COLORS.SELECCION : chart.fillFor(tooth, surface)

  const sortedItems = [...plan.items].sort((a, b) => (a.tooth ?? 999) - (b.tooth ?? 999))

  return (
    <div className="space-y-4">
      <Card>
        <div className="flex flex-wrap justify-between items-start gap-4">
          <div className="min-w-0 flex-1">
            <Link href={`/pacientes/${patientId}/tratamientos`} className="text-xs font-bold text-blue-600 hover:underline">
              ← Todos los tratamientos
            </Link>
            {editingName ? (
              <div className="mt-2 space-y-2 max-w-xl">
                <input value={name} onChange={(e) => setName(e.target.value)} className={inputClass} />
                <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} placeholder="Observaciones" className={inputClass} />
                <div className="flex gap-2">
                  <button type="button" onClick={saveName} disabled={busy} className={primaryButton}>Guardar</button>
                  <button type="button" onClick={() => { setEditingName(false); setName(plan.name); setNotes(plan.notes ?? "") }} className={secondaryButton}>Cancelar</button>
                </div>
              </div>
            ) : (
              <>
                <h2 className="text-2xl font-extrabold text-gray-900 mt-1 flex items-center gap-2">
                  {plan.name}
                  <button type="button" onClick={() => setEditingName(true)} className="text-sm text-gray-400 hover:text-blue-600" title="Editar nombre">✏️</button>
                </h2>
                <p className="text-sm text-gray-600 font-semibold">Dr(a). {plan.dentistName} · Creado el {plan.createdAt}</p>
                {plan.notes && <p className="text-sm text-gray-700 mt-1">{plan.notes}</p>}
              </>
            )}
          </div>
          <div className="flex gap-2">
            <Link href={`/pacientes/${patientId}/pagos`} className={secondaryButton}>Ir a Pagos</Link>
            {plan.paymentsCount === 0 && (
              <button type="button" onClick={handleDeletePlan} disabled={busy} className={dangerButton}>Eliminar tratamiento</button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-5">
          <div className="md:col-span-1 col-span-2">
            <div className="flex justify-between text-xs font-bold text-gray-600 mb-1">
              <span>Avance: {progress.done}/{progress.total}</span>
              <span>{progress.percent}%</span>
            </div>
            <ProgressBar percent={progress.percent} />
          </div>
          <div>
            <p className="text-xs font-bold text-gray-500 uppercase">Total</p>
            <p className="text-lg font-black text-gray-900">{formatMoney(plan.total)}</p>
          </div>
          <div>
            <p className="text-xs font-bold text-gray-500 uppercase">Pagado</p>
            <p className="text-lg font-black text-emerald-700">{formatMoney(plan.paid)}</p>
          </div>
          <div>
            <p className="text-xs font-bold text-gray-500 uppercase">Saldo</p>
            <p className="text-lg font-black text-yellow-700">{formatMoney(plan.total - plan.paid)}</p>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_340px] gap-4 items-start">
        <ToothChart
          fillFor={fillFor}
          markerFor={chart.markerFor}
          conditionFor={(t) => (absentTeeth.includes(t) ? "AUSENTE" : "SANO")}
          selectedTooth={selectedTooth}
          onToothClick={selectTooth}
          onSurfaceClick={toggleSurface}
          legend={
            <>
              <LegendDot color={STATUS_COLORS.PENDIENTE} label="Pendiente" />
              <LegendDot color={STATUS_COLORS.REALIZADO} label="Realizado" />
              <LegendDot color={STATUS_COLORS.SELECCION} label="Selección" />
              <span className="text-gray-400 font-semibold">Clic en el número/raíz: pieza completa · clic en una cara: seleccionar cara</span>
            </>
          }
        />

        <Card title="Agregar prestación">
          {catalog.length === 0 ? (
            <EmptyState>
              No hay prestaciones en el catálogo. <Link href="/aranceles" className="text-blue-600 underline">Agréguelas en Aranceles</Link>.
            </EmptyState>
          ) : (
            <form onSubmit={handleAdd} className="space-y-4">
              <div className="p-3 rounded-xl bg-gray-50 border border-gray-200 text-sm">
                {selectedTooth ? (
                  <div className="flex justify-between items-start gap-2">
                    <div>
                      <p className="font-extrabold text-gray-900">Pieza {selectedTooth}</p>
                      <p className="text-xs text-gray-600 font-semibold">
                        {selectedSurfaces.length > 0 ? `Caras: ${selectedSurfaces.map(surfaceLabel).join(", ")}` : "Pieza completa"}
                      </p>
                    </div>
                    <button type="button" onClick={() => { setSelectedTooth(null); setSelectedSurfaces([]) }} className="text-xs font-bold text-blue-600">
                      Quitar
                    </button>
                  </div>
                ) : (
                  <p className="font-semibold text-gray-600">
                    Sin pieza seleccionada: la prestación será <b>general</b> (ej: limpieza, radiografía). Seleccione una pieza en el odontograma para asignarla.
                  </p>
                )}
              </div>

              {selectedTooth && (
                <div className="flex flex-wrap gap-1">
                  {SURFACES.map((s) => (
                    <button
                      key={s.key}
                      type="button"
                      onClick={() => toggleSurface(selectedTooth, s.key)}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border ${
                        selectedSurfaces.includes(s.key) ? "bg-amber-100 border-amber-400 text-amber-800" : "bg-white border-gray-200 text-gray-600"
                      }`}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              )}

              <div>
                <label className={labelClass}>Prestación</label>
                <select value={treatmentId} onChange={(e) => chooseTreatment(e.target.value)} required className={inputClass}>
                  <option value="">Seleccionar...</option>
                  {catalogByCategory.map(([category, items]) => (
                    <optgroup key={category} label={category}>
                      {items.map((t) => (
                        <option key={t.id} value={t.id}>{t.name} — {formatMoney(t.price)}</option>
                      ))}
                    </optgroup>
                  ))}
                </select>
              </div>
              <div>
                <label className={labelClass}>Precio</label>
                <input type="number" min={0} step={1} value={price} onChange={(e) => setPrice(e.target.value)} required className={inputClass} />
              </div>
              <button type="submit" disabled={busy || !treatmentId} className={`${primaryButton} w-full`}>
                {busy ? "Guardando..." : "Agregar al tratamiento"}
              </button>
            </form>
          )}
        </Card>
      </div>

      <Card title={`Prestaciones (${plan.items.length})`}>
        {plan.items.length === 0 ? (
          <EmptyState>Seleccione piezas en el odontograma y agregue prestaciones a este tratamiento.</EmptyState>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 text-xs text-gray-600 uppercase tracking-wider">
                <tr>
                  <th className="p-3">Pieza</th>
                  <th className="p-3">Prestación</th>
                  <th className="p-3">Caras</th>
                  <th className="p-3 text-right">Precio</th>
                  <th className="p-3 text-center">Estado</th>
                  <th className="p-3 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {sortedItems.map((item) => (
                  <tr key={item.id} className={item.tooth !== null && item.tooth === selectedTooth ? "bg-amber-50" : "hover:bg-gray-50"}>
                    <td className="p-3 font-black text-gray-900">
                      {item.tooth !== null ? (
                        <button type="button" onClick={() => selectTooth(item.tooth!)} className="hover:text-blue-600">{item.tooth}</button>
                      ) : (
                        <span className="text-gray-500 font-bold">General</span>
                      )}
                    </td>
                    <td className="p-3 font-bold text-gray-900">{item.treatmentName}</td>
                    <td className="p-3 text-xs text-gray-600 font-semibold">{item.surfaces.map(surfaceLabel).join(", ") || "—"}</td>
                    <td className="p-3 text-right font-bold">{formatMoney(item.price)}</td>
                    <td className="p-3 text-center">
                      <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${item.status === "REALIZADO" ? "bg-blue-100 text-blue-800" : "bg-red-100 text-red-800"}`}>
                        {item.status === "REALIZADO" ? `Realizado ${item.completedAt ?? ""}` : "Pendiente"}
                      </span>
                    </td>
                    <td className="p-3 text-right whitespace-nowrap">
                      {item.status === "REALIZADO" ? (
                        <button type="button" disabled={busy} onClick={() => run(() => setPlanItemStatus(item.id, false))} className={secondaryButton}>
                          Deshacer
                        </button>
                      ) : (
                        <>
                          <button
                            type="button"
                            disabled={busy}
                            onClick={() => setCompleting(item)}
                            className="bg-blue-600 text-white font-bold px-3 py-1.5 rounded-lg text-xs hover:bg-blue-700 disabled:opacity-50"
                          >
                            Marcar realizado
                          </button>
                          <button
                            type="button"
                            disabled={busy}
                            onClick={() => confirm(`¿Quitar ${item.treatmentName}?`) && run(() => removePlanItem(item.id))}
                            className={dangerButton}
                          >
                            Quitar
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {completing && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-gray-200 space-y-4">
            <h3 className="font-extrabold text-lg text-gray-900">Marcar como realizado</h3>
            <p className="text-sm text-gray-700 font-semibold">
              {completing.treatmentName}
              {completing.tooth !== null && ` · Pieza ${completing.tooth}`}
            </p>
            <div>
              <label className={labelClass}>Evolución (opcional)</label>
              <textarea
                value={evolutionNote}
                onChange={(e) => setEvolutionNote(e.target.value)}
                rows={4}
                placeholder="Describa lo realizado. Se guardará en la pestaña Evoluciones."
                className={inputClass}
              />
            </div>
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => { setCompleting(null); setEvolutionNote("") }} className={secondaryButton}>Cancelar</button>
              <button type="button" onClick={confirmComplete} disabled={busy} className={primaryButton}>
                {busy ? "Guardando..." : "Confirmar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
