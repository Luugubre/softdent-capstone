'use client'

import { useState, useRef } from 'react'
import { createProfessional } from '@/lib/professionalActions'

type RoleType = 'ADMIN' | 'DENTISTA' | 'RECEPCIONISTA'

export default function NuevoProfesionalPage() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [selectedRole, setSelectedRole] = useState<RoleType>('DENTISTA')
  
  const formRef = useRef<HTMLFormElement>(null)

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setLoading(true)
    setError(null)
    setSuccess(false)

    const formData = new FormData(event.currentTarget)
    
    const commissionValue = selectedRole === 'DENTISTA' 
      ? parseFloat(formData.get('commission') as string || '0') 
      : 0

    const data = {
      firstName: formData.get('firstName') as string,
      lastName: formData.get('lastName') as string,
      rut: formData.get('rut') as string,
      email: formData.get('email') as string,
      phone: (formData.get('phone') as string) || '',
      specialty: (formData.get('specialty') as string) || '',
      professionalRegister: (formData.get('professionalRegister') as string) || '',
      role: selectedRole,
      commission: commissionValue
    }
    
    const response = await createProfessional(data)

    if (!response.success) {
      setError(response.error || 'Ocurrió un error al guardar.')
      setLoading(false)
    } else {
      setSuccess(true)
      setLoading(false)
      formRef.current?.reset()
      setSelectedRole('DENTISTA')
    }
  }

  return (
    <div className="max-w-2xl mx-auto p-6 mt-10 bg-white rounded-xl shadow-sm border border-gray-100">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Registrar Nuevo Profesional</h1>
      
      {error && (
        <div className="mb-4 p-4 bg-red-50 text-red-700 rounded-md text-sm border border-red-100 font-medium">
          {error}
        </div>
      )}

      {success && (
        <div className="mb-4 p-4 bg-emerald-50 text-emerald-700 rounded-md text-sm font-medium border border-emerald-100">
          ¡Profesional registrado con éxito en la base de datos!
        </div>
      )}

      <form ref={formRef} onSubmit={handleSubmit} className="space-y-5">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-1">Nombre *</label>
            <input 
              type="text" 
              id="firstName" 
              name="firstName" 
              required
              className="w-full border border-gray-300 rounded-md px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none text-gray-900 bg-white"
              placeholder="Ej. Juan"
            />
          </div>

          <div>
            <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-1">Apellido *</label>
            <input 
              type="text" 
              id="lastName" 
              name="lastName" 
              required
              className="w-full border border-gray-300 rounded-md px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none text-gray-900 bg-white"
              placeholder="Ej. Pérez"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="rut" className="block text-sm font-medium text-gray-700 mb-1">RUT *</label>
            <input 
              type="text" 
              id="rut" 
              name="rut" 
              required
              className="w-full border border-gray-300 rounded-md px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none text-gray-900 bg-white"
              placeholder="Ej. 12.345.678-9"
            />
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">Correo Electrónico *</label>
            <input 
              type="email" 
              id="email" 
              name="email" 
              required
              className="w-full border border-gray-300 rounded-md px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none text-gray-900 bg-white"
              placeholder="correo@clinica.cl"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="professionalRegister" className="block text-sm font-medium text-gray-700 mb-1">
              N° Registro Minsal / SIS
            </label>
            <input 
              type="text" 
              id="professionalRegister" 
              name="professionalRegister" 
              className="w-full border border-gray-300 rounded-md px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none text-gray-900 bg-white"
              placeholder="Ej. 123456 (Opcional)"
            />
          </div>

          <div>
            <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">Teléfono</label>
            <input 
              type="text" 
              id="phone" 
              name="phone" 
              className="w-full border border-gray-300 rounded-md px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none text-gray-900 bg-white"
              placeholder="+56 9 1234 5678 (Opcional)"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-1">Rol en la Clínica *</label>
            <select 
              id="role" 
              name="role" 
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value as RoleType)}
              required
              className="w-full border border-gray-300 rounded-md px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none bg-white text-gray-900 font-medium"
            >
              <option value="DENTISTA" className="text-gray-900">Dentista</option>
              <option value="RECEPCIONISTA" className="text-gray-900">Recepcionista</option>
              <option value="ADMIN" className="text-gray-900">Administrador</option>
            </select>
          </div>

          {selectedRole === 'DENTISTA' && (
            <div className="animate-in fade-in zoom-in duration-200">
              <label htmlFor="commission" className="block text-sm font-medium text-gray-700 mb-1">Comisión (%) *</label>
              <input 
                type="number" 
                id="commission" 
                name="commission" 
                min="0" 
                max="100" 
                step="0.1"
                defaultValue="40.0"
                required={selectedRole === 'DENTISTA'}
                className="w-full border border-gray-300 rounded-md px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none text-gray-900 bg-white"
              />
              <p className="text-xs text-gray-500 mt-1">Porcentaje de ganancia por tratamiento.</p>
            </div>
          )}
        </div>

        <div className="pt-4">
          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 px-4 rounded-md transition-colors disabled:bg-blue-400"
          >
            {loading ? 'Guardando en la nube...' : 'Guardar Profesional'}
          </button>
        </div>
      </form>
    </div>
  )
}