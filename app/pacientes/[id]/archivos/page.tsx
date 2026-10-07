import { prisma } from "@/lib/prisma"
import { FileManager } from "@/components/ficha/FileManager"
import { formatDate } from "@/lib/ficha"

export default async function ArchivosPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  // No se traen los bytes del archivo al listar
  const files = await prisma.patientFile.findMany({
    where: { patientId: id },
    select: { id: true, name: true, category: true, mimeType: true, size: true, notes: true, createdAt: true },
    orderBy: { createdAt: "desc" },
  })

  return <FileManager patientId={id} files={files.map((f) => ({ ...f, createdAt: formatDate(f.createdAt) }))} />
}
