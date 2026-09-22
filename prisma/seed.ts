import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  // 1. Asegurarnos de que el dentista exista
  const dentista = await prisma.user.upsert({
    where: { email: 'juan.perez@dignidad.cl' },
    update: {},
    create: {
      email: 'juan.perez@dignidad.cl',
      name: 'Juan Pérez',
      role: 'DENTISTA',
    },
  })
  console.log('✅ Profesional verificado:', dentista.name)

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
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })