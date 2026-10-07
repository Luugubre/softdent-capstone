import { prisma } from "@/lib/prisma"

// Entrega el archivo guardado en la base de datos (radiografías, fotos, PDFs)
export async function GET(request: Request, { params }: { params: Promise<{ fileId: string }> }) {
  const { fileId } = await params
  const file = await prisma.patientFile.findUnique({ where: { id: fileId } })
  if (!file) return new Response("Archivo no encontrado", { status: 404 })

  const download = new URL(request.url).searchParams.has("descargar")
  const filename = encodeURIComponent(file.name)

  return new Response(new Uint8Array(file.data), {
    headers: {
      "Content-Type": file.mimeType,
      "Content-Length": String(file.size),
      "Content-Disposition": `${download ? "attachment" : "inline"}; filename*=UTF-8''${filename}`,
      "Cache-Control": "private, max-age=3600",
      "X-Content-Type-Options": "nosniff",
    },
  })
}
