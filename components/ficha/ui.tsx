// Piezas de interfaz compartidas por las pestañas de la ficha clínica (sin estado: sirven en servidor y cliente)

export const inputClass =
  "w-full px-3.5 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white text-gray-900 font-semibold placeholder-gray-400"
export const labelClass = "block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1"
export const primaryButton =
  "bg-blue-600 text-white font-extrabold px-5 py-2.5 rounded-xl hover:bg-blue-700 disabled:bg-blue-300 transition-colors shadow-sm text-sm"
export const secondaryButton =
  "bg-gray-100 text-gray-800 font-bold px-4 py-2 rounded-xl hover:bg-gray-200 disabled:opacity-50 transition-colors border border-gray-200 text-xs"
export const dangerButton =
  "text-red-600 font-bold px-3 py-1.5 rounded-lg hover:bg-red-50 disabled:opacity-50 transition-colors text-xs"

export function Card({ title, actions, children }: { title?: string; actions?: React.ReactNode; children: React.ReactNode }) {
  return (
    <section className="bg-white p-5 md:p-6 rounded-2xl shadow-sm border border-gray-200">
      {(title || actions) && (
        <div className="flex flex-wrap justify-between items-center gap-3 mb-4">
          {title && <h2 className="text-lg font-extrabold text-gray-900">{title}</h2>}
          {actions}
        </div>
      )}
      {children}
    </section>
  )
}

export function EmptyState({ children }: { children: React.ReactNode }) {
  return (
    <div className="p-8 text-center text-gray-500 font-semibold border-2 border-dashed border-gray-200 rounded-2xl">
      {children}
    </div>
  )
}

export function ProgressBar({ percent }: { percent: number }) {
  return (
    <div className="w-full h-2.5 bg-gray-100 rounded-full overflow-hidden">
      <div
        className={`h-full rounded-full transition-all ${percent === 100 ? "bg-emerald-500" : "bg-blue-600"}`}
        style={{ width: `${percent}%` }}
      />
    </div>
  )
}

export function DentistSelect({
  dentists,
  value,
  onChange,
  required = false,
}: {
  dentists: { id: string; name: string }[]
  value: string
  onChange: (value: string) => void
  required?: boolean
}) {
  return (
    <select value={value} onChange={(e) => onChange(e.target.value)} className={inputClass} required={required}>
      {!required && <option value="">Sin profesional asignado</option>}
      {required && <option value="">Seleccionar profesional...</option>}
      {dentists.map((d) => (
        <option key={d.id} value={d.id}>
          Dr(a). {d.name}
        </option>
      ))}
    </select>
  )
}
