import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

async function main() {
  const dentista = await prisma.user.findFirst({ where: { role: "DENTISTA" } })
  if (!dentista) {
    console.error("No se encontró ningún dentista registrado.")
    return
  }

  let paciente = await prisma.patient.findFirst()
  if (!paciente) {
    paciente = await prisma.patient.create({
      data: {
        rut: "12345678-9",
        firstName: "Carlos",
        lastName: "Muñoz",
        email: "carlos@test.cl",
      },
    })
  }

  const tratamientos = await prisma.treatment.findMany({ take: 2 })
  if (tratamientos.length === 0) {
    console.log("No hay tratamientos cargados. Ejecuta npx prisma db seed primero.")
    return
  }

  const total = tratamientos.reduce((sum, t) => sum + t.price, 0)

  const presupuesto = await prisma.budget.create({
    data: {
      patientId: paciente.id,
      dentistId: dentista.id,
      total,
      paid: total,
      status: "PAGADO",
      items: {
        create: tratamientos.map((t) => ({
          treatmentId: t.id,
          price: t.price,
        })),
      },
    },
  })

  console.log("✅ Presupuesto y prestaciones de prueba creados exitosamente.")
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })