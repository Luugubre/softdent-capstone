// Constantes y utilidades compartidas por la ficha clínica del paciente (cliente y servidor)

import { ToothSurfaces } from "@/types/clinical"

export const FICHA_TABS = [
  { slug: "antecedentes", label: "Antecedentes" },
  { slug: "archivos", label: "Archivos" },
  { slug: "consentimientos", label: "Consentimientos" },
  { slug: "datos", label: "Datos" },
  { slug: "documentos", label: "Documentos" },
  { slug: "evoluciones", label: "Evoluciones" },
  { slug: "odontograma", label: "Odontograma" },
  { slug: "pagos", label: "Pagos" },
  { slug: "recetas", label: "Recetas" },
  { slug: "tratamientos", label: "Tratamientos" },
] as const

// --- Odontograma (nomenclatura FDI) ---
export const ADULT_UPPER_RIGHT = [18, 17, 16, 15, 14, 13, 12, 11]
export const ADULT_UPPER_LEFT = [21, 22, 23, 24, 25, 26, 27, 28]
export const ADULT_LOWER_RIGHT = [48, 47, 46, 45, 44, 43, 42, 41]
export const ADULT_LOWER_LEFT = [31, 32, 33, 34, 35, 36, 37, 38]
export const CHILD_UPPER_RIGHT = [55, 54, 53, 52, 51]
export const CHILD_UPPER_LEFT = [61, 62, 63, 64, 65]
export const CHILD_LOWER_RIGHT = [85, 84, 83, 82, 81]
export const CHILD_LOWER_LEFT = [71, 72, 73, 74, 75]

export const ALL_TEETH = [
  ...ADULT_UPPER_RIGHT, ...ADULT_UPPER_LEFT, ...ADULT_LOWER_RIGHT, ...ADULT_LOWER_LEFT,
  ...CHILD_UPPER_RIGHT, ...CHILD_UPPER_LEFT, ...CHILD_LOWER_RIGHT, ...CHILD_LOWER_LEFT,
]

export const SURFACES: { key: keyof ToothSurfaces; label: string }[] = [
  { key: "vestibular", label: "Vestibular" },
  { key: "palatine", label: "Palatino/Lingual" },
  { key: "mesial", label: "Mesial" },
  { key: "distal", label: "Distal" },
  { key: "oclusal", label: "Oclusal/Incisal" },
]

export function surfaceLabel(key: string) {
  return SURFACES.find((s) => s.key === key)?.label ?? key
}

// --- Tratamientos ---
export const ITEM_STATUS = { PENDIENTE: "PENDIENTE", REALIZADO: "REALIZADO" } as const

export function planProgress(items: { status: string }[]) {
  const total = items.length
  const done = items.filter((i) => i.status === ITEM_STATUS.REALIZADO).length
  return { total, done, percent: total === 0 ? 0 : Math.round((done / total) * 100) }
}

// Estado de pago del plan a partir de lo abonado
export function budgetPaymentStatus(total: number, paid: number) {
  if (total > 0 && paid >= total) return "PAGADO"
  if (paid > 0) return "APROBADO"
  return "PENDIENTE"
}

export const PAYMENT_METHODS = [
  { value: "EFECTIVO", label: "Efectivo" },
  { value: "TRANSFERENCIA", label: "Transferencia" },
  { value: "TARJETA_DEBITO", label: "Tarjeta de Débito" },
  { value: "TARJETA_CREDITO", label: "Tarjeta de Crédito" },
]

export function paymentMethodLabel(value: string) {
  return PAYMENT_METHODS.find((m) => m.value === value)?.label ?? value
}

// --- Antecedentes ---
export const MEDICAL_CONDITIONS = [
  "Hipertensión",
  "Diabetes",
  "Cardiopatía",
  "Trastornos de coagulación",
  "Asma",
  "Epilepsia",
  "Enfermedad renal",
  "Enfermedad hepática / Hepatitis",
  "VIH",
  "Enfermedad tiroidea",
  "Osteoporosis / Bifosfonatos",
  "Cáncer / Radioterapia",
]

// --- Archivos ---
export const FILE_CATEGORIES = [
  { value: "RADIOGRAFIA", label: "Radiografía" },
  { value: "FOTO", label: "Fotografía" },
  { value: "EXAMEN", label: "Examen" },
  { value: "OTRO", label: "Otro" },
]
export const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10 MB

export function fileCategoryLabel(value: string) {
  return FILE_CATEGORIES.find((c) => c.value === value)?.label ?? value
}

export function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

// --- Consentimientos ---
export const CONSENT_STATUS = [
  { value: "PENDIENTE", label: "Pendiente", className: "bg-yellow-100 text-yellow-800" },
  { value: "FIRMADO", label: "Firmado", className: "bg-emerald-100 text-emerald-800" },
  { value: "RECHAZADO", label: "Rechazado", className: "bg-red-100 text-red-800" },
]

export const CONSENT_TEMPLATES = [
  {
    title: "Consentimiento informado general",
    content:
      "Declaro haber sido informado(a) de manera clara sobre el diagnóstico, el plan de tratamiento propuesto, sus alternativas, beneficios, riesgos y costos. Entiendo que puedo hacer preguntas y retirar mi consentimiento en cualquier momento. Autorizo al equipo clínico a realizar los procedimientos indicados.",
  },
  {
    title: "Consentimiento para exodoncia",
    content:
      "Autorizo la extracción de la(s) pieza(s) dentaria(s) indicada(s). He sido informado(a) de los posibles riesgos: dolor, inflamación, sangrado, infección, alveolitis, lesión de piezas vecinas, comunicación oro-sinusal y alteraciones transitorias de la sensibilidad. Me comprometo a seguir las indicaciones post operatorias.",
  },
  {
    title: "Consentimiento para endodoncia",
    content:
      "Autorizo el tratamiento de conducto de la(s) pieza(s) indicada(s). Entiendo que el tratamiento busca conservar la pieza, que puede requerir varias sesiones y que existen riesgos como fractura de instrumentos, perforaciones, dolor post operatorio o fracaso del tratamiento que podría requerir retratamiento o extracción.",
  },
  {
    title: "Consentimiento para anestesia local",
    content:
      "Autorizo la aplicación de anestesia local. He sido informado(a) de que pueden presentarse efectos como adormecimiento prolongado, hematoma, reacciones alérgicas o aumento transitorio de la frecuencia cardíaca. He informado mis antecedentes médicos y alergias.",
  },
]

// --- Documentos ---
export const DOCUMENT_TYPES = [
  { value: "CERTIFICADO", label: "Certificado" },
  { value: "INFORME", label: "Informe" },
  { value: "OTRO", label: "Otro" },
]

export function documentTypeLabel(value: string) {
  return DOCUMENT_TYPES.find((d) => d.value === value)?.label ?? value
}

export const DOCUMENT_TEMPLATES = [
  {
    type: "CERTIFICADO",
    title: "Certificado de atención",
    content:
      "Certifico que el(la) paciente {paciente}, RUT {rut}, fue atendido(a) en esta clínica dental con fecha {fecha}.\n\nSe extiende el presente certificado a petición del interesado(a) para los fines que estime conveniente.",
  },
  {
    type: "CERTIFICADO",
    title: "Certificado de reposo",
    content:
      "Certifico que el(la) paciente {paciente}, RUT {rut}, fue sometido(a) a un procedimiento odontológico con fecha {fecha}, por lo que se indica reposo por ___ día(s) a contar de esta fecha.",
  },
  {
    type: "INFORME",
    title: "Informe odontológico",
    content:
      "Paciente: {paciente}\nRUT: {rut}\nFecha: {fecha}\n\nDiagnóstico:\n\nTratamiento realizado:\n\nIndicaciones:",
  },
]

export function fillTemplate(template: string, values: { paciente: string; rut: string; fecha: string }) {
  return template
    .replaceAll("{paciente}", values.paciente)
    .replaceAll("{rut}", values.rut)
    .replaceAll("{fecha}", values.fecha)
}

// --- Recetas ---
export interface PrescriptionMedication {
  name: string
  dose: string
  frequency: string
  duration: string
}

// --- Fechas ---
export function formatDate(date: Date | string, withTime = false) {
  return new Date(date).toLocaleString("es-CL", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    ...(withTime ? { hour: "2-digit", minute: "2-digit" } : {}),
  })
}

export function formatMoney(amount: number) {
  return `$${amount.toLocaleString("es-CL")}`
}

export function calculateAge(birthDate: Date | string | null | undefined) {
  if (!birthDate) return null
  const birth = new Date(birthDate)
  const now = new Date()
  let age = now.getUTCFullYear() - birth.getUTCFullYear()
  const beforeBirthday =
    now.getUTCMonth() < birth.getUTCMonth() ||
    (now.getUTCMonth() === birth.getUTCMonth() && now.getUTCDate() < birth.getUTCDate())
  if (beforeBirthday) age--
  return age
}

// Piezas marcadas como ausentes en el odontograma de hallazgos (se muestran tachadas en los planes)
export function absentTeethFrom(odontogram: unknown): number[] {
  let data = odontogram
  if (typeof data === "string") {
    try {
      data = JSON.parse(data)
    } catch {
      return []
    }
  }
  if (!data || typeof data !== "object") return []
  return Object.entries(data as Record<string, { condition?: string }>)
    .filter(([, tooth]) => tooth?.condition === "AUSENTE" || tooth?.condition === "EXTRACCION_INDICADA")
    .map(([id]) => Number(id))
}
