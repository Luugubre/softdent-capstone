import { prisma } from '@/lib/prisma'
import ProfessionalTable from './ProfessionalTable'

export default async function ProfesionalesPage() {
  // Consultamos los profesionales registrados con sus relaciones
  const profesionales = await prisma.professional.findMany({
    include: {
      specialty: true,
      user: true,
    },
    orderBy: { createdAt: 'desc' },
  })

  // Mapeamos los datos para estructurarlos según la tabla de clientes
  const formattedProfessionals = profesionales.map((prof) => ({
    id: prof.id,
    rut: prof.rut,
    firstName: prof.firstName,
    lastName: prof.lastName,
    professionalRegister: prof.professionalRegister,
    role: prof.role,
    email: prof.email,
    phone: prof.phone,
    birthDate: prof.birthDate ? prof.birthDate.toISOString() : null, // 👈 Se agrega birthDate formateado a la lista
    active: prof.active,
    specialtyId: prof.specialtyId,
    specialty: prof.specialty ? { name: prof.specialty.name } : null,
    userId: prof.userId,
    user: prof.user ? { name: prof.user.name, email: prof.user.email } : null,
  }))

  return (
    <main className="min-h-screen bg-slate-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Componente Interactivo de la Tabla y Modales */}
        <ProfessionalTable initialData={formattedProfessionals} />

      </div>
    </main>
  )
}