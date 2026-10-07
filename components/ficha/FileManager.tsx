"use client"

import { useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { deletePatientFile, uploadPatientFile } from "@/lib/ficha-actions"
import { FILE_CATEGORIES, MAX_FILE_SIZE, fileCategoryLabel, formatBytes } from "@/lib/ficha"
import { Card, EmptyState, dangerButton, inputClass, labelClass, primaryButton, secondaryButton } from "./ui"

interface PatientFileInfo {
  id: string
  name: string
  category: string
  mimeType: string
  size: number
  notes: string | null
  createdAt: string
}

export function FileManager({ patientId, files }: { patientId: string; files: PatientFileInfo[] }) {
  const router = useRouter()
  const formRef = useRef<HTMLFormElement>(null)
  const [uploading, setUploading] = useState(false)
  const [filter, setFilter] = useState("TODOS")
  const [preview, setPreview] = useState<PatientFileInfo | null>(null)

  async function handleUpload(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    const file = formData.get("file")
    if (file instanceof File && file.size > MAX_FILE_SIZE) {
      alert("El archivo supera el máximo de 10 MB.")
      return
    }
    formData.set("patientId", patientId)
    setUploading(true)
    try {
      const result = await uploadPatientFile(formData)
      if (result.success) {
        formRef.current?.reset()
        router.refresh()
      } else {
        alert(result.error)
      }
    } catch {
      alert("No se pudo subir el archivo. Verifique que no supere 10 MB.")
    } finally {
      setUploading(false)
    }
  }

  async function handleDelete(file: PatientFileInfo) {
    if (!confirm(`¿Eliminar "${file.name}"? Esta acción no se puede deshacer.`)) return
    const result = await deletePatientFile(file.id)
    if (result.success) {
      setPreview(null)
      router.refresh()
    } else alert(result.error)
  }

  const visible = filter === "TODOS" ? files : files.filter((f) => f.category === filter)

  return (
    <div className="space-y-4">
      <Card title="Subir archivo">
        <form ref={formRef} onSubmit={handleUpload} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
          <div className="md:col-span-2">
            <label className={labelClass}>Archivo (imagen, PDF o DICOM · máx. 10 MB)</label>
            <input
              name="file"
              type="file"
              required
              accept="image/*,application/pdf,.dcm"
              className={`${inputClass} file:mr-3 file:px-3 file:py-1 file:rounded-lg file:border-0 file:bg-blue-50 file:text-blue-700 file:font-bold`}
            />
          </div>
          <div>
            <label className={labelClass}>Categoría</label>
            <select name="category" className={inputClass} defaultValue="RADIOGRAFIA">
              {FILE_CATEGORIES.map((c) => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelClass}>Nota (opcional)</label>
            <input name="notes" type="text" placeholder="Ej: Panorámica control" className={inputClass} />
          </div>
          <div className="md:col-span-4 flex justify-end">
            <button type="submit" disabled={uploading} className={primaryButton}>
              {uploading ? "Subiendo..." : "Subir Archivo"}
            </button>
          </div>
        </form>
      </Card>

      <Card
        title={`Archivos del paciente (${files.length})`}
        actions={
          <div className="flex flex-wrap gap-1">
            {[{ value: "TODOS", label: "Todos" }, ...FILE_CATEGORIES].map((c) => (
              <button
                key={c.value}
                type="button"
                onClick={() => setFilter(c.value)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold ${filter === c.value ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"}`}
              >
                {c.label}
              </button>
            ))}
          </div>
        }
      >
        {visible.length === 0 ? (
          <EmptyState>No hay archivos en esta categoría.</EmptyState>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {visible.map((file) => (
              <div key={file.id} className="border border-gray-200 rounded-2xl overflow-hidden bg-gray-50 flex flex-col">
                <button type="button" onClick={() => setPreview(file)} className="aspect-square bg-gray-900 flex items-center justify-center overflow-hidden">
                  {file.mimeType.startsWith("image/") ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={`/api/archivos/${file.id}`} alt={file.name} className="w-full h-full object-cover" loading="lazy" />
                  ) : (
                    <span className="text-4xl">📄</span>
                  )}
                </button>
                <div className="p-3 space-y-1 flex-1">
                  <p className="text-xs font-bold text-gray-900 truncate" title={file.name}>{file.name}</p>
                  <p className="text-[11px] text-gray-500 font-semibold">
                    {fileCategoryLabel(file.category)} · {formatBytes(file.size)} · {file.createdAt}
                  </p>
                  {file.notes && <p className="text-[11px] text-gray-600">{file.notes}</p>}
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {preview && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4" onClick={() => setPreview(null)}>
          <div className="bg-white rounded-2xl max-w-5xl w-full max-h-[92vh] flex flex-col overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="flex flex-wrap justify-between items-center gap-2 p-4 border-b border-gray-100">
              <div>
                <p className="font-extrabold text-gray-900">{preview.name}</p>
                <p className="text-xs text-gray-500 font-semibold">{fileCategoryLabel(preview.category)} · {preview.createdAt}</p>
              </div>
              <div className="flex gap-2">
                <a href={`/api/archivos/${preview.id}`} target="_blank" rel="noreferrer" className={secondaryButton}>Abrir</a>
                <a href={`/api/archivos/${preview.id}?descargar`} className={secondaryButton}>Descargar</a>
                <button type="button" onClick={() => handleDelete(preview)} className={dangerButton}>Eliminar</button>
                <button type="button" onClick={() => setPreview(null)} className={secondaryButton}>✕</button>
              </div>
            </div>
            <div className="flex-1 overflow-auto bg-gray-900 flex items-center justify-center min-h-[50vh]">
              {preview.mimeType.startsWith("image/") ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={`/api/archivos/${preview.id}`} alt={preview.name} className="max-w-full max-h-[75vh] object-contain" />
              ) : preview.mimeType === "application/pdf" ? (
                <iframe src={`/api/archivos/${preview.id}`} title={preview.name} className="w-full h-[75vh] bg-white" />
              ) : (
                <p className="text-white font-semibold p-8">Vista previa no disponible. Use &quot;Descargar&quot;.</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
