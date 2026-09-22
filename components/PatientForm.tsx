"use client"

import { useState } from "react"
import { createPatient } from "@/lib/actions"
import { useRouter } from "next/navigation"

export function PatientForm() {
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    
    // Extraemos los datos del formulario
    const formData = new FormData(e.currentTarget)
    const data = {
      rut: formData.get("rut") as string,
      firstName: formData.get("firstName") as string,
      lastName: formData.get("lastName") as string,
      phone: formData.get("phone") as string,
    }

    // Llamamos a la Server Action
    const result = await createPatient(data)
    
    if (result.success) {
      // Limpiamos el formulario y recargamos los datos de la página
      (e.target as HTMLFormElement).reset()
      router.refresh()
    } else {
      alert(result.error)
    }
    
    setLoading(false)
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white p-6 shadow rounded-lg mb-8">
      <h2 className="text-xl font-semibold mb-4">Registrar Nuevo Paciente</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">RUT</label>
          <input required name="rut" type="text" placeholder="12.345.678-9" className="mt-1 p-2 w-full border rounded-md" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Teléfono</label>
          <input name="phone" type="text" placeholder="+56 9..." className="mt-1 p-2 w-full border rounded-md" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Nombre</label>
          <input required name="firstName" type="text" className="mt-1 p-2 w-full border rounded-md" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Apellidos</label>
          <input required name="lastName" type="text" className="mt-1 p-2 w-full border rounded-md" />
        </div>
      </div>

      <button 
        type="submit" 
        disabled={loading}
        className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:bg-blue-300"
      >
        {loading ? "Guardando..." : "Guardar Paciente"}
      </button>
    </form>
  )
}