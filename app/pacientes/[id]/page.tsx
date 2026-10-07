import { redirect } from "next/navigation"

// La ficha abre por defecto en la pestaña de Datos
export default async function FichaPaciente({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  redirect(`/pacientes/${id}/datos`)
}
