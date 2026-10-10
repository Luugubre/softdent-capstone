import { PrismaClient, Role } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  // 1. Usuarios base
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

  // 2. Aranceles básicos
  const tratamientos = [
    { name: 'Exodoncia Simple', price: 25000, category: 'Cirugía' },
    { name: 'Restauración Resina Simple', price: 35000, category: 'Operatoria' },
    { name: 'Endodoncia Unirradicular', price: 90000, category: 'Endodoncia' },
    { name: 'Limpieza y Destartraje', price: 40000, category: 'Prevención' },
  ]

  for (const t of tratamientos) {
    const existe = await prisma.treatment.findFirst({ where: { name: t.name } })
    if (!existe) {
      await prisma.treatment.create({ data: t })
    }
  }
  console.log('✅ Catálogo de aranceles cargado')

  // 3. Especialidades
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

  // 4. Perfil de Profesional
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
        role: Role.DENTISTA,
        active: true,
        specialtyId: especialidadGeneralId,
        userId: dentista.id,
      },
    })
    console.log('✅ Registro de profesional vinculado al usuario')
  }

  // 5. NUEVO: Boxes de Atención de la Clínica
  const boxes = [
    { name: 'Box 1 - Odontología General' },
    { name: 'Box 2 - Ortodoncia' },
    { name: 'Box 3 - Pabellón Cirugía' },
  ]

  for (const b of boxes) {
    const existeBox = await prisma.box.findFirst({ where: { name: b.name } })
    if (!existeBox) {
      await prisma.box.create({
        data: {
          name: b.name,
          active: true,
        },
      })
    }
  }
  console.log('✅ Boxes de atención cargados')

  // 6. NUEVO: Procedimientos / Prestaciones Clínicas para Agendamiento
  const procedimientos = [
    { name: 'Consulta General / Evaluación', durationMin: 30, price: 25000 },
    { name: 'Limpieza Dental (Profilaxis)', durationMin: 45, price: 35000 },
    { name: 'Obturación / Tapadura Simple', durationMin: 60, price: 45000 },
    { name: 'Control Ortodoncia', durationMin: 30, price: 30000 },
  ]

  for (const p of procedimientos) {
    const existeProc = await prisma.procedure.findFirst({ where: { name: p.name } })
    if (!existeProc) {
      await prisma.procedure.create({
        data: {
          name: p.name,
          durationMin: p.durationMin,
          price: p.price,
          active: true,
        },
      })
    }
  }
  console.log('✅ Catálogo de procedimientos cargado')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })