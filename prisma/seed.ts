import { PrismaClient, Role } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  // 1. Asegurarnos de que existan usuarios base para los distintos roles
  const usuariosBase = [
    { email: 'juan.perez@dignidad.cl', name: 'Juan Pérez', role: Role.DENTISTA },
    { email: 'admin@dignidad.cl', name: 'Admin Clínica', role: Role.ADMIN },
    { email: 'recepcion@dignidad.cl', name: 'María Gómez', role: Role.RECEPCIONISTA },
    { email: 'asistente@dignidad.cl', name: 'Carlos Rojas', role: Role.ASISTENTE },
  ]

  let dentista = null

  for (const u of usuariosBase) {
    const user = await prisma.user.upsert({
      where: { email: u.email },
      update: { role: u.role },
      create: u,
    })

    if (u.email === 'juan.perez@dignidad.cl') {
      dentista = user
    }
  }
  console.log('✅ Usuarios base creados/verificados con sus roles')

  // 2. Crear aranceles básicos
  const tratamientos = [
    { name: 'Exodoncia Simple', price: 25000, category: 'Cirugía' },
    { name: 'Restauración Resina Simple', price: 35000, category: 'Operatoria' },
    { name: 'Endodoncia Unirradicular', price: 90000, category: 'Endodoncia' },
    { name: 'Limpieza y Destartraje', price: 40000, category: 'Prevención' },
  ]

  for (const t of tratamientos) {
    // Usamos findFirst para no duplicar si corremos el script varias veces
    const existe = await prisma.treatment.findFirst({ where: { name: t.name } })
    if (!existe) {
      await prisma.treatment.create({ data: t })
    }
  }
  console.log('✅ Catálogo de aranceles cargado')

  // 3. Crear catálogo de Especialidades
  const especialidades = [
    'Odontología General',
    'Endodoncia',
    'Ortodoncia',
    'Periodoncia',
    'Odontopediatría',
    'Cirugía Maxilofacial',
    'Rehabilitación Oral',
    'Implantología',
  ]

  let especialidadGeneralId = ''

  for (const name of especialidades) {
    const spec = await prisma.specialty.upsert({
      where: { name },
      update: { active: true },
      create: {
        name,
        active: true,
      },
    })

    if (name === 'Odontología General') {
      especialidadGeneralId = spec.id
    }
  }
  console.log('✅ Catálogo de especialidades cargado')

  // 4. Crear perfil de Profesional para el usuario existente
  if (especialidadGeneralId && dentista) {
    await prisma.professional.upsert({
      where: { rut: '12345678-9' },
      update: {
        role: Role.DENTISTA,
      },
      create: {
        firstName: 'Juan',
        lastName: 'Pérez',
        rut: '12345678-9',
        professionalRegister: 'RNPI-102938',
        email: dentista.email,
        phone: '+56 9 1234 5678',
        role: Role.DENTISTA, // ✅ Se especifica el rol
        active: true,
        specialtyId: especialidadGeneralId,
        userId: dentista.id,
      },
    })
    console.log('✅ Registro de profesional vinculado al usuario')
  }
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })