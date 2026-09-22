"use client"

import { useState } from "react"
import { createAppointment } from "@/lib/actions"
import { useRouter } from "next/navigation"

interface AppointmentModalProps {
  timeBlock: string;       
  date: Date;              
  patients: { id: string, firstName: string, lastName: string, rut: string }[]; 
  dentists: { id: string, name: string }[]; 
}

export function AppointmentModal({ timeBlock, date, patients, dentists }: AppointmentModalProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    
    const formData = new FormData(e.currentTarget)
    const patientId = formData.get("patientId") as string
    const dentistId = formData.get("dentistId") as string
    const duration = parseInt(formData.get("duration") as string)
    const notes = formData.get("notes") as string // NUEVO: Capturamos las notas

    const [hours, minutes] = timeBlock.split(':').map(Number)
    const appointmentDate = new Date(date)
    appointmentDate.setHours(hours, minutes, 0, 0)

    const result = await createAppointment({
      date: appointmentDate,
      patientId,
      dentistId,
      duration, 
      notes // NUEVO: Enviamos las notas a la base de datos
    })
    
    if (result.success) {
      setIsOpen(false)
      router.refresh() 
    } else {
      alert(result.error)
    }
    
    setLoading(false)
  }

  return (
    <>
      <button 
        onClick={() => setIsOpen(true)}
        className="text-sm font-medium text-gray-400 hover:text-blue-600 transition-colors w-full h-full text-left flex items-center"
      >
        + Agendar cita aquí
      </button>

      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full shadow-xl">
            <h2 className="text-xl font-bold mb-4">Agendar a las {timeBlock} hrs</h2>
            
            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Paciente</label>
                <select required name="patientId" className="w-full border p-2 rounded-md">
                  <option value="">Seleccione un paciente...</option>
                  {patients.map(p => (
                    <option key={p.id} value={p.id}>{p.firstName} {p.lastName} ({p.rut})</option>
                  ))}
                </select>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Profesional</label>
                <select required name="dentistId" className="w-full border p-2 rounded-md">
                  <option value="">Seleccione un especialista...</option>
                  {dentists.map(d => (
                    <option key={d.id} value={d.id}>Dr. {d.name}</option>
                  ))}
                </select>
              </div>

              {/* NUEVO CAMPO: Notas del motivo de la cita */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Motivo / Notas (Opcional)</label>
                <input 
                  type="text" 
                  name="notes" 
                  placeholder="Ej: Evaluación, Dolor molar..." 
                  className="w-full border p-2 rounded-md"
                />
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-1">Duración (minutos)</label>
                <select required name="duration" defaultValue="30" className="w-full border p-2 rounded-md">
                  {[15, 30, 45, 60, 75, 90, 105, 120].map(min => (
                    <option key={min} value={min}>{min} minutos</option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end gap-2">
                <button 
                  type="button" 
                  onClick={() => setIsOpen(false)}
                  className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-md"
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  disabled={loading}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-blue-300"
                >
                  {loading ? "Guardando..." : "Confirmar Cita"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}