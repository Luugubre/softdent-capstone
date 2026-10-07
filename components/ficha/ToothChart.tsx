"use client"

import { useState } from "react"
import { Tooth } from "@/components/Tooth"
import { ToothCondition, ToothSurfaces } from "@/types/clinical"
import {
  ADULT_LOWER_LEFT, ADULT_LOWER_RIGHT, ADULT_UPPER_LEFT, ADULT_UPPER_RIGHT,
  CHILD_LOWER_LEFT, CHILD_LOWER_RIGHT, CHILD_UPPER_LEFT, CHILD_UPPER_RIGHT, SURFACES,
} from "@/lib/ficha"

export const STATUS_COLORS = {
  PENDIENTE: "#ef4444",
  REALIZADO: "#2563eb",
  SELECCION: "#f59e0b",
}

const SANE_SURFACES: ToothSurfaces = { vestibular: "SANO", palatine: "SANO", mesial: "SANO", distal: "SANO", oclusal: "SANO" }

interface ToothChartProps {
  fillFor?: (tooth: number, surface: keyof ToothSurfaces) => string | undefined
  markerFor?: (tooth: number) => string | undefined
  conditionFor?: (tooth: number) => ToothCondition
  selectedTooth?: number | null
  onToothClick?: (tooth: number) => void
  onSurfaceClick?: (tooth: number, surface: keyof ToothSurfaces) => void
  legend?: React.ReactNode
}

// Odontograma de solo dibujo: el color de cada cara lo decide quien lo usa (plan o vista global)
export function ToothChart({
  fillFor, markerFor, conditionFor, selectedTooth, onToothClick, onSurfaceClick, legend,
}: ToothChartProps) {
  const [isChildView, setIsChildView] = useState(false)

  const renderTooth = (id: number, invert = false) => (
    <Tooth
      key={id}
      number={id}
      condition={conditionFor?.(id) ?? "SANO"}
      surfaces={SANE_SURFACES}
      invert={invert}
      selected={selectedTooth === id}
      markerColor={markerFor?.(id)}
      fillFor={fillFor ? (surface) => fillFor(id, surface) : undefined}
      onRootClick={() => onToothClick?.(id)}
      onNumberClick={() => onToothClick?.(id)}
      onSurfaceClick={(surface) => (onSurfaceClick ? onSurfaceClick(id, surface) : onToothClick?.(id))}
    />
  )

  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 w-full overflow-x-auto">
      <div className="flex flex-wrap justify-between items-center gap-3 mb-6">
        <div className="flex flex-wrap gap-3 text-xs font-bold text-gray-600">{legend}</div>
        <div className="flex bg-gray-100 rounded-xl p-1 border border-gray-200">
          <button type="button" onClick={() => setIsChildView(false)} className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all ${!isChildView ? "bg-white text-gray-800 shadow-sm" : "text-gray-500 hover:text-gray-800"}`}>Adulto</button>
          <button type="button" onClick={() => setIsChildView(true)} className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all ${isChildView ? "bg-white text-purple-700 shadow-sm" : "text-gray-500 hover:text-gray-800"}`}>Niño</button>
        </div>
      </div>

      <div className="min-w-max flex flex-col items-center gap-8">
        <div className="flex gap-2">
          <div className="flex gap-0.5 border-r-2 border-gray-200 pr-2">
            {(isChildView ? CHILD_UPPER_RIGHT : ADULT_UPPER_RIGHT).map((id) => renderTooth(id))}
          </div>
          <div className="flex gap-0.5">
            {(isChildView ? CHILD_UPPER_LEFT : ADULT_UPPER_LEFT).map((id) => renderTooth(id))}
          </div>
        </div>
        <div className="w-full h-px bg-gray-100" />
        <div className="flex gap-2">
          <div className="flex gap-0.5 border-r-2 border-gray-200 pr-2">
            {(isChildView ? CHILD_LOWER_RIGHT : ADULT_LOWER_RIGHT).map((id) => renderTooth(id, true))}
          </div>
          <div className="flex gap-0.5">
            {(isChildView ? CHILD_LOWER_LEFT : ADULT_LOWER_LEFT).map((id) => renderTooth(id, true))}
          </div>
        </div>
      </div>
    </div>
  )
}

export function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className="w-3 h-3 rounded-full border border-gray-300" style={{ backgroundColor: color }} />
      {label}
    </span>
  )
}

// Construye el color de cada cara a partir de prestaciones (si una cara tiene algo pendiente, prima el rojo).
// Una prestación de pieza completa (sin caras) pinta todas sus caras y deja una marca junto al número.
export function buildSurfaceMap(items: { tooth: number | null; surfaces: string[]; status: string }[]) {
  const surfaceMap = new Map<string, string>()
  const toothMap = new Map<number, string>()
  const apply = <K,>(map: Map<K, string>, key: K, color: string) => {
    if (map.get(key) !== STATUS_COLORS.PENDIENTE) map.set(key, color)
  }
  for (const item of items) {
    if (item.tooth === null) continue
    const color = item.status === "REALIZADO" ? STATUS_COLORS.REALIZADO : STATUS_COLORS.PENDIENTE
    if (item.surfaces.length === 0) apply(toothMap, item.tooth, color)
    const faces = item.surfaces.length > 0 ? item.surfaces : SURFACES.map((s) => s.key)
    for (const s of faces) apply(surfaceMap, `${item.tooth}-${s}`, color)
  }
  return {
    fillFor: (tooth: number, surface: string) => surfaceMap.get(`${tooth}-${surface}`),
    markerFor: (tooth: number) => toothMap.get(tooth),
  }
}
