import { PrintButton } from "./PrintButton"

// Hoja imprimible (consentimientos, certificados, recetas). La barra superior y las pestañas se ocultan al imprimir.
export function PrintableSheet({
  title,
  patient,
  date,
  professional,
  children,
  signatures = ["Firma profesional"],
  backHref,
}: {
  title: string
  patient: { firstName: string; lastName: string; rut: string }
  date: string
  professional?: string | null
  children: React.ReactNode
  signatures?: string[]
  backHref: string
}) {
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center print:hidden">
        <a href={backHref} className="text-sm font-bold text-blue-600 hover:underline">← Volver</a>
        <PrintButton />
      </div>

      <article className="bg-white max-w-3xl mx-auto p-8 md:p-12 rounded-2xl border border-gray-200 shadow-sm print:shadow-none print:border-0 print:p-0 text-gray-900">
        <header className="flex justify-between items-start border-b-2 border-gray-900 pb-4 mb-6">
          <div>
            <p className="text-xl font-black text-blue-700">Clínica Dignidad</p>
            <p className="text-xs text-gray-600 font-semibold">Atención odontológica</p>
          </div>
          <p className="text-sm font-semibold text-gray-700">Fecha: {date}</p>
        </header>

        <h1 className="text-2xl font-extrabold text-center mb-6 uppercase tracking-wide">{title}</h1>

        <div className="grid grid-cols-2 gap-2 text-sm mb-6 p-4 bg-gray-50 rounded-xl print:bg-transparent print:p-0">
          <p><span className="font-bold">Paciente:</span> {patient.firstName} {patient.lastName}</p>
          <p><span className="font-bold">RUT:</span> {patient.rut}</p>
          {professional && <p className="col-span-2"><span className="font-bold">Profesional:</span> Dr(a). {professional}</p>}
        </div>

        <div className="text-sm leading-relaxed whitespace-pre-wrap">{children}</div>

        <footer className={`grid gap-10 mt-20 ${signatures.length > 1 ? "grid-cols-2" : "grid-cols-1 max-w-xs mx-auto"}`}>
          {signatures.map((s) => (
            <div key={s} className="border-t border-gray-900 pt-2 text-center text-xs font-bold">{s}</div>
          ))}
        </footer>
      </article>
    </div>
  )
}
