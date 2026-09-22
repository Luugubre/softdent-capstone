"use client"

import { useState } from "react"
import { closePayrollAction } from "@/lib/actions"
import { useRouter } from "next/navigation"
import * as XLSX from "xlsx"
import Link from "next/link"

export function PayrollDetailClient({ initialData, dentistId, month, year }: { initialData: any, dentistId: string, month: number, year: number }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const details = initialData 

  // Descargar Excel sin cerrar el periodo
  const handleExportExcel = () => {
    const worksheetData = details.payments.map((p: any) => ({
  "Fecha Pago": new Date(p.date).toLocaleString('es-CL'),
  "Paciente": p.patientName,
  "RUT": p.patientRut,
  "Prestación(es)": p.treatments, // <--- NUEVA COLUMNA EN EL EXCEL
  "Método de Pago": p.method,
  "Abono Clínica ($)": p.amount,
  [`Comisión Dr (${details.commissionRate}%) ($)`]: p.doctorEarned
}));
    const ws = XLSX.utils.json_to_sheet(worksheetData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Liquidación");
    XLSX.writeFile(wb, `Liquidacion_${details.periodStr}_Dr_${details.dentistName}.xlsx`);
  }

  // Cerrar en BD y descargar Excel final
  const handleCloseAndExport = async () => {
    if (!confirm("¿Seguro que deseas CERRAR este periodo de pago? Al hacerlo, los nuevos pagos que ingresen pasarán al mes siguiente.")) return;
    setLoading(true)
    
    const closeResult = await closePayrollAction(dentistId, month, year, details.doctorCut)
    
    if (closeResult.success) {
      handleExportExcel();
      alert("Liquidación cerrada y guardada exitosamente.");
      router.refresh(); 
    } else {
      alert(closeResult.error);
    }
    setLoading(false)
  }

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
      <Link href="/liquidaciones" className="mb-6 inline-flex items-center gap-2 text-gray-500 font-bold hover:text-gray-800 transition-colors">
        ← Volver al Cierre de Caja
      </Link>

      <div className="bg-white rounded-3xl shadow-sm border border-gray-200 overflow-hidden">
        
        {/* Cabecera */}
        <div className="bg-slate-800 text-white p-8 flex flex-col md:flex-row justify-between items-center gap-6">
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-2xl font-black">Liquidación {details.periodStr}</h2>
              <span className={`text-xs font-black px-3 py-1 rounded-full uppercase ${details.status === 'CERRADA' ? 'bg-emerald-500 text-white' : 'bg-yellow-500 text-yellow-900'}`}>
                {details.status}
              </span>
            </div>
            <p className="text-slate-300 mt-2 text-lg">Dr. {details.dentistName} • Contrato: {details.commissionRate}%</p>
            {details.status === 'CERRADA' && details.closedAt && (
              <p className="text-emerald-400 text-sm font-bold mt-2">Corte realizado el: {new Date(details.closedAt).toLocaleString('es-CL')}</p>
            )}
          </div>
          
          <div className="bg-slate-700 p-6 rounded-2xl text-right min-w-[250px]">
            <p className="text-slate-300 text-sm font-bold uppercase mb-1">A Pagar Líquido</p>
            <p className="text-4xl font-black text-emerald-400">${details.doctorCut.toLocaleString('es-CL')}</p>
          </div>
        </div>

        {/* Barra de Acciones */}
        <div className="p-4 bg-slate-50 border-b border-gray-200 flex justify-end">
          {details.status === 'BORRADOR' ? (
            <div className="flex gap-3">
              {/* NUEVO BOTÓN: Solo descargar excel sin afectar base de datos */}
              <button 
                onClick={handleExportExcel} 
                className="bg-white text-gray-700 border border-gray-300 font-bold px-6 py-3 rounded-xl hover:bg-gray-50 transition-colors shadow-sm"
              >
                📥 Descargar Excel de Prueba
              </button>
              <button 
                onClick={handleCloseAndExport} disabled={loading || details.payments.length === 0}
                className="bg-emerald-600 text-white font-bold px-6 py-3 rounded-xl hover:bg-emerald-700 disabled:bg-gray-300 transition-colors shadow-md"
              >
                {loading ? "Procesando..." : "✅ Cerrar Periodo y Pagar"}
              </button>
            </div>
          ) : (
            <button 
              onClick={handleExportExcel} 
              className="bg-blue-100 text-blue-700 font-bold px-6 py-3 rounded-xl hover:bg-blue-200 transition-colors shadow-sm"
            >
              📥 Volver a Descargar Excel
            </button>
          )}
        </div>

        {/* Tabla de Pagos de Pacientes */}
        <div className="overflow-x-auto">
          <table className="w-full text-left">
  <thead className="bg-white border-b border-gray-100 text-xs text-gray-500 uppercase tracking-wider">
    <tr>
      <th className="p-4 font-bold">Fecha Abono</th>
      <th className="p-4 font-bold">Paciente</th>
      <th className="p-4 font-bold">RUT</th>
      <th className="p-4 font-bold">Prestación(es)</th>
      <th className="p-4 font-bold text-center">Método</th>
      <th className="p-4 font-bold text-right">Abono Clínica</th>
      <th className="p-4 font-bold text-right text-emerald-600">Comisión Dr.</th>
    </tr>
  </thead>
  <tbody className="divide-y divide-gray-50">
    {details.payments.length === 0 ? (
      <tr>
        <td colSpan={7} className="p-8 text-center text-gray-400 font-semibold">
          No se han registrado pagos para este doctor en este periodo.
        </td>
      </tr>
    ) : (
      details.payments.map((p: any) => (
        <tr key={p.id} className="hover:bg-gray-50">
          <td className="p-4 text-sm text-gray-500">{new Date(p.date).toLocaleString('es-CL')}</td>
          <td className="p-4 text-sm font-bold text-gray-800">{p.patientName}</td>
          <td className="p-4 text-sm text-gray-500">{p.patientRut}</td>
          <td className="p-4 text-sm font-semibold text-gray-700 max-w-xs truncate" title={p.treatments}>
            {p.treatments}
          </td>
          <td className="p-4 text-center">
            <span className="bg-gray-100 text-gray-600 font-bold px-2 py-1 rounded text-xs">{p.method}</span>
          </td>
          <td className="p-4 text-sm font-bold text-gray-700 text-right">${p.amount.toLocaleString('es-CL')}</td>
          <td className="p-4 text-sm font-black text-emerald-600 text-right">${p.doctorEarned.toLocaleString('es-CL')}</td>
        </tr>
      ))
    )}
  </tbody>
</table>
        </div>
      </div>
    </div>
  )
}