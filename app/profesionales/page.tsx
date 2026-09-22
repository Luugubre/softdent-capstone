import Link from 'next/link'
import { getProfessionals } from '@/lib/actions' // Ajusta la ruta a tu archivo de acciones

export default async function ProfesionalesPage() {
  const response = await getProfessionals()
  const profesionales = response.success && response.professionals ? response.professionals : []

  return (
    <div className="max-w-6xl mx-auto p-6 mt-10">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Equipo Clínico</h1>
          <p className="text-gray-500 mt-1">Gestiona los dentistas, recepcionistas y administradores.</p>
        </div>
        
        <Link 
          href="/profesionales/nuevo" 
          className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 px-5 rounded-md transition-colors"
        >
          + Nuevo Profesional
        </Link>
      </div>

      {!response.success && (
        <div className="p-4 mb-6 bg-red-50 text-red-700 rounded-md">
          {response.error}
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              <th className="py-4 px-6 font-semibold text-gray-600 text-sm">Nombre</th>
              <th className="py-4 px-6 font-semibold text-gray-600 text-sm">Correo</th>
              <th className="py-4 px-6 font-semibold text-gray-600 text-sm">Rol</th>
              <th className="py-4 px-6 font-semibold text-gray-600 text-sm">Comisión</th>
            </tr>
          </thead>
          <tbody>
            {profesionales.length === 0 ? (
              <tr>
                <td colSpan={4} className="py-8 text-center text-gray-500">
                  No hay profesionales registrados aún.
                </td>
              </tr>
            ) : (
              profesionales.map((prof) => (
                <tr key={prof.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                  <td className="py-4 px-6 text-gray-800 font-medium">
                    {prof.name}
                  </td>
                  <td className="py-4 px-6 text-gray-600 text-sm">
                    {prof.email}
                  </td>
                  <td className="py-4 px-6">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                      ${prof.role === 'ADMIN' ? 'bg-purple-100 text-purple-800' : ''}
                      ${prof.role === 'DENTISTA' ? 'bg-blue-100 text-blue-800' : ''}
                      ${prof.role === 'RECEPCIONISTA' ? 'bg-emerald-100 text-emerald-800' : ''}
                    `}>
                      {prof.role}
                    </span>
                  </td>
                  <td className="py-4 px-6 text-gray-600 text-sm">
                    {prof.role === 'DENTISTA' ? `${prof.commission}%` : '-'}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}