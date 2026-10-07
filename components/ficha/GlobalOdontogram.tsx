"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { formatMoney, planProgress, surfaceLabel } from "@/lib/ficha"
import { LegendDot, STATUS_COLORS, ToothChart, buildSurfaceMap } from "./ToothChart"
import { Card, EmptyState, ProgressBar, inputClass } from "./ui"

interface GlobalItem {
  id: string
  tooth: number | null
  surfaces: string[]
  status: string
  treatmentName: string
  completedAt: string | null
  price: number
}

interface GlobalPlan {
  id: string
  name: string
  dentistName: string
  items: GlobalItem[]
}

// Vista consolidada: todas las prestaciones de todos los tratamientos del paciente sobre un mismo odontograma
export function GlobalOdontogram({
  patientId,
  plans,
  absentTeeth,
  findingsEditor,
}: {
  patientId: string
  plans: GlobalPlan[]
  absentTeeth: number[]
  findingsEditor: React.ReactNode
}) {
  const [view, setView] = useState<"tratamientos" | "hallazgos">("tratamientos")
  const [planFilter, setPlanFilter] = useState("")
  const [selectedTooth, setSelectedTooth] = useState<number | null>(null)

  const visiblePlans = planFilter ? plans.filter((p) => p.id === planFilter) : plans
  const allItems = useMemo(
    () => visiblePlans.flatMap((p) => p.items.map((i) => ({ ...i, planId: p.id, planName: p.name }))),
    [visiblePlans]
  )
  const chart = useMemo(() => buildSurfaceMap(allItems), [allItems])
  const overall = planProgress(allItems)
  const toothItems = selectedTooth === null ? [] : allItems.filter((i) => i.tooth === selectedTooth)
  const generalItems = allItems.filter((i) => i.tooth === null)

  return (
    <div className="space-y-4">
      <div className="flex bg-white rounded-2xl p-1 border border-gray-200 shadow-sm w-fit">
        <button type="button" onClick={() => setView("tratamientos")} className={`px-4 py-2 text-sm font-bold rounded-xl ${view === "tratamientos" ? "bg-blue-600 text-white" : "text-gray-600 hover:bg-gray-50"}`}>
          Tratamientos
        </button>
        <button type="button" onClick={() => setView("hallazgos")} className={`px-4 py-2 text-sm font-bold rounded-xl ${view === "hallazgos" ? "bg-blue-600 text-white" : "text-gray-600 hover:bg-gray-50"}`}>
          Hallazgos / Diagnóstico
        </button>
      </div>

      {view === "hallazgos" ? (
        findingsEditor
      ) : plans.length === 0 ? (
        <EmptyState>
          El paciente no tiene tratamientos.{" "}
          <Link href={`/pacientes/${patientId}/tratamientos`} className="text-blue-600 underline">Crear un tratamiento</Link>
        </EmptyState>
      ) : (
        <>
          <Card title="Avance de tratamientos">
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm font-extrabold text-gray-900 mb-1">
                  <span>Total general: {overall.done} de {overall.total} prestaciones realizadas</span>
                  <span>{overall.percent}%</span>
                </div>
                <ProgressBar percent={overall.percent} />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {plans.map((plan) => {
                  const p = planProgress(plan.items)
                  return (
                    <Link
                      key={plan.id}
                      href={`/pacientes/${patientId}/tratamientos/${plan.id}`}
                      className="p-3 rounded-xl border border-gray-200 hover:border-blue-400 transition-colors"
                    >
                      <div className="flex justify-between text-xs font-bold text-gray-700 mb-1">
                        <span className="truncate">{plan.name}</span>
                        <span>{p.done}/{p.total} · {p.percent}%</span>
                      </div>
                      <ProgressBar percent={p.percent} />
                    </Link>
                  )
                })}
              </div>
            </div>
          </Card>

          <div className="grid grid-cols-1 xl:grid-cols-[1fr_340px] gap-4 items-start">
            <ToothChart
              fillFor={chart.fillFor}
              markerFor={chart.markerFor}
              conditionFor={(t) => (absentTeeth.includes(t) ? "AUSENTE" : "SANO")}
              selectedTooth={selectedTooth}
              onToothClick={(t) => setSelectedTooth((s) => (s === t ? null : t))}
              legend={
                <>
                  <LegendDot color={STATUS_COLORS.PENDIENTE} label="Pendiente" />
                  <LegendDot color={STATUS_COLORS.REALIZADO} label="Realizado" />
                  <select value={planFilter} onChange={(e) => setPlanFilter(e.target.value)} className={`${inputClass} w-auto py-1.5 text-xs`}>
                    <option value="">Todos los tratamientos</option>
                    {plans.map((p) => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </>
              }
            />

            <Card title={selectedTooth ? `Pieza ${selectedTooth}` : "Detalle"}>
              {selectedTooth === null ? (
                <p className="text-sm text-gray-600 font-semibold">Seleccione una pieza para ver todas sus prestaciones.</p>
              ) : toothItems.length === 0 ? (
                <p className="text-sm text-gray-600 font-semibold">Sin prestaciones registradas en esta pieza.</p>
              ) : (
                <ItemList items={toothItems} />
              )}
              {generalItems.length > 0 && (
                <div className="mt-5 pt-4 border-t border-gray-100">
                  <p className="text-xs font-black text-gray-500 uppercase mb-2">Prestaciones generales</p>
                  <ItemList items={generalItems} />
                </div>
              )}
            </Card>
          </div>
        </>
      )}
    </div>
  )
}

function ItemList({ items }: { items: (GlobalItem & { planName: string })[] }) {
  return (
    <ul className="space-y-2">
      {items.map((item) => (
        <li key={item.id} className="p-2.5 rounded-xl bg-gray-50 border border-gray-100 text-sm">
          <div className="flex justify-between gap-2">
            <p className="font-bold text-gray-900">{item.treatmentName}</p>
            <span
              className="shrink-0 w-2.5 h-2.5 rounded-full mt-1.5"
              style={{ backgroundColor: item.status === "REALIZADO" ? STATUS_COLORS.REALIZADO : STATUS_COLORS.PENDIENTE }}
            />
          </div>
          <p className="text-[11px] text-gray-600 font-semibold">
            {item.planName}
            {item.surfaces.length > 0 && ` · ${item.surfaces.map(surfaceLabel).join(", ")}`}
            {` · ${formatMoney(item.price)}`}
            {item.status === "REALIZADO" ? ` · Realizado ${item.completedAt ?? ""}` : " · Pendiente"}
          </p>
        </li>
      ))}
    </ul>
  )
}
