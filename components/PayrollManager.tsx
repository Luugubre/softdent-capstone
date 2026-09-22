"use client"

import { useState } from "react"
import { getPayrollDetails, closePayrollAction } from "@/lib/actions"
import { useRouter } from "next/navigation"
import * as XLSX from "xlsx"

interface Dentist { id: string; name: string; commission: number; }

export function PayrollManager({ dentists }: { dentists: Dentist[] }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [dentistId, setDentistId] = useState(dentists[0]?.id || "")
  const [month, setMonth] = useState(new Date().getMonth() + 1)
  const [year, setYear] = useState(new Date().getFullYear())
  
  const [details, setDetails] = useState<any>(null)

  const handlePreview = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    const result = await getPayrollDetails(dentistId, month, year)
    if (result.success) setDetails(result)
    else alert(result.error)
    setLoading(false)
  }

  const handleCloseAndExport = async () => {
    if (!confirm("¿Estás seguro de cerrar el mes? Los pagos que ingresen a partir de este momento pasarán al mes siguiente.")) return;
    
    setLoading(true)
    const closeResult = await closePayrollAction(dentistId, month, year, details.doctorCut)
    
    if (closeResult.success) {
      // 1. Generar el Excel con los datos exactos que tenemos en pantalla
      const worksheetData = details.payments.map((p: any) => ({
        "Fecha Pago": new Date(p.date).toLocaleString('es-CL'),
        "Paciente": p.patientName,
        "RUT": p.patientRut,
        "Método de Pago": p.method,
        "Abono Clínica ($)": p.amount,
        [`Comisión Dr (${details.commissionRate}%) ($)`]: p.doctorEarned
      }));

      const ws = XLSX.utils.json_to_sheet(worksheetData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Detalle Liquidación");
      
      // 2. Descargar el archivo
      XLSX.writeFile(wb, `Liquidacion_${details.periodStr}_Dr_${details.dentistName}.xlsx`);

      alert("Liquidación cerrada y Excel descargado.");
      
      // 3. Refrescar la vista
      const refreshResult = await getPayrollDetails(dentistId, month, year);
      if (refreshResult.success) setDetails(refreshResult);
      router.refresh();
    } else {
      alert(closeResult.error);
    }
    setLoading(false)
  }

  return (
    <div className="space-y-8">
      {/* Panel de Búsqueda */}
      <form onSubmit={handlePreview} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 flex gap-4 items-end">
        <div className="flex-1">
          <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Profesional</label>
          <select value={dentistId} onChange={e => setDentistId(e.target.value)} className="w-full border p-3 rounded-xl bg-gray-50 outline-none">
            {dentists.map(d => <option key={d.id} value={d.id}>Dr. {d.name} ({d.commission}%)</option>)}
          </select>
        </div>
        <div className="w-32">
          <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Mes</label>
          <select value={month} onChange={e => setMonth(parseInt(e.target.value))} className="w-full border p-3 rounded-xl bg-gray-50 outline-none">
            {[1,2,3,4,5,6,7,8,9,10,11,12].map(m => <option key={m} value={m}>{m.toString().padStart(2, '0')}</option>)}
          </select>
        </div>
        <div className="w-32">
          <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Año</label>
          <input type="number" value={year} onChange={e => setYear(parseInt(e.target.value))} className="w-full border p-3 rounded-xl bg-gray-50 outline-none"/>
        </div>
        <button type="submit" disabled={loading} className="bg-blue-600 text-white font-bold px-8 py-3 rounded-xl hover:bg-blue-700 h-[50px]">
          {loading ? "Buscando..." : "Ver Pagos"}
        </button>
      </form>

      {/* Panel de Resultados y Detalles */}
      {details && (
        <div className="bg-white rounded-3xl shadow-sm border border-gray-200 overflow-hidden">
          {/* Encabezado del Resumen */}
          <div className="bg-slate-800 text-white p-8 flex justify-between items-center">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h2 className="text-2xl font-black">Liquidación {details.periodStr}</h2>
                <span className={`text-xs font-black px-3 py-1 rounded-full uppercase ${details.status === 'CERRADA' ? 'bg-emerald-500 text-white' : 'bg-yellow-500 text-yellow-900'}`}>
                  {details.status}
                </span>
              </div>
              <p className="text-slate-300">Dr. {details.dentistName} • Comisión Base: {details.commissionRate}%</p>
              {details.status === 'CERRADA' && (
                <p className="text-emerald-400 text-sm font-bold mt-2">Corte realizado el: {new Date(details.closedAt).toLocaleString('es-CL')}</p>
              )}
            </div>
            
            <div className="text-right flex items-center gap-8">
              <div>
                <p className="text-slate-400 text-sm font-bold uppercase">Recaudado (Clínica)</p>
                <p className="text-xl font-semibold text-slate-200">${details.totalCollected.toLocaleString('es-CL')}</p>
              </div>
              <div className="bg-slate-700 p-4 rounded-2xl">
                <p className="text-slate-300 text-sm font-bold uppercase mb-1">A Pagar al Dr.</p>
                <p className="text-4xl font-black text-emerald-400">${details.doctorCut.toLocaleString('es-CL')}</p>
              </div>
            </div>
          </div>

          {/* Botón de Cierre / Exportación */}
          <div className="p-4 bg-slate-50 border-b border-gray-200 flex justify-end">
            {details.status === 'BORRADOR' ? (
              <button 
                onClick={handleCloseAndExport} disabled={loading || details.payments.length === 0}
                className="bg-emerald-600 text-white font-bold px-6 py-3 rounded-xl hover:bg-emerald-700 disabled:bg-gray-300 transition-colors shadow-md flex items-center gap-2"
              >
                Cerrar Periodo y Descargar Excel
              </button>
            ) : (
              <button 
                onClick={() => alert("El excel histórico ya fue generado al cerrar. La re-descarga se puede habilitar luego.")} 
                className="bg-gray-200 text-gray-600 font-bold px-6 py-3 rounded-xl hover:bg-gray-300 transition-colors flex items-center gap-2"
              >
                Descargar Copia Excel
              </button>
            )}
          </div>

          {/* Tabla Detallada */}
          <div className="p-0 overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-white border-b border-gray-100 text-xs text-gray-500 uppercase tracking-wider">
                <tr>
                  <th className="p-4 font-bold">Fecha Abono</th>
                  <th className="p-4 font-bold">Paciente</th>
                  <th className="p-4 font-bold">RUT</th>
                  <th className="p-4 font-bold">Método</th>
                  <th className="p-4 font-bold text-right">Monto Pagado</th>
                  <th className="p-4 font-bold text-right text-emerald-600">Comisión Dr.</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {details.payments.length === 0 ? (
                  <tr><td colSpan={6} className="p-8 text-center text-gray-400 font-semibold">No hay pagos registrados en este periodo.</td></tr>
                ) : (
                  details.payments.map((p: any) => (
                    <tr key={p.id} className="hover:bg-gray-50">
                      <td className="p-4 text-sm text-gray-600">{new Date(p.date).toLocaleString('es-CL')}</td>
                      <td className="p-4 text-sm font-bold text-gray-800">{p.patientName}</td>
                      <td className="p-4 text-sm text-gray-500">{p.patientRut}</td>
                      <td className="p-4"><span className="bg-blue-50 text-blue-700 text-xs font-bold px-2 py-1 rounded">{p.method}</span></td>
                      <td className="p-4 text-sm font-bold text-gray-700 text-right">${p.amount.toLocaleString('es-CL')}</td>
                      <td className="p-4 text-sm font-black text-emerald-600 text-right">${p.doctorEarned.toLocaleString('es-CL')}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}