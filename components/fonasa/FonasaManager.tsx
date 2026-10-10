"use client"

import { useState, useTransition } from "react"
import {
  createFonasaVoucher,
  updateFonasaVoucherStatus,
  createAgreement,
  addAgreementBeneficiary,
} from "@/app/actions/fonasaActions"
import { FonasaVoucherStatus } from "@prisma/client"

interface FonasaManagerProps {
  vouchers: any[]
  agreements: any[]
  patients: any[]
  treatments: any[]
}

export function FonasaManager({ vouchers, agreements, patients, treatments }: FonasaManagerProps) {
  const [activeTab, setActiveTab] = useState<"fonasa" | "convenios">("fonasa")
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  // Estados para anulación de bonos
  const [anulandoVoucherId, setAnulandoVoucherId] = useState<string | null>(null)
  const [voidReason, setVoidReason] = useState("")

  // Estados para beneficiarios de convenios
  const [selectedAgreementId, setSelectedAgreementId] = useState<string>(agreements[0]?.id || "")
  const [selectedPatientId, setSelectedPatientId] = useState<string>(patients[0]?.id || "")

  async function handleCreateVoucher(formData: FormData) {
    setError(null)
    startTransition(async () => {
      const res = await createFonasaVoucher(formData)
      if (res?.error) setError(res.error)
      else (document.getElementById("form-voucher") as HTMLFormElement)?.reset()
    })
  }

  async function handleVoucherStatus(id: string, status: FonasaVoucherStatus, reason?: string) {
    setError(null)
    startTransition(async () => {
      const res = await updateFonasaVoucherStatus(id, status, reason)
      if (res?.error) setError(res.error)
      else {
        setAnulandoVoucherId(null)
        setVoidReason("")
      }
    })
  }

  async function handleCreateAgreement(formData: FormData) {
    setError(null)
    startTransition(async () => {
      const res = await createAgreement(formData)
      if (res?.error) setError(res.error)
      else (document.getElementById("form-agreement") as HTMLFormElement)?.reset()
    })
  }

  async function handleAddBeneficiary() {
    if (!selectedAgreementId || !selectedPatientId) return
    setError(null)
    startTransition(async () => {
      const res = await addAgreementBeneficiary(selectedAgreementId, selectedPatientId)
      if (res?.error) setError(res.error)
    })
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
          {error}
        </div>
      )}

      {/* Tabs */}
      <div className="flex border-b border-gray-200 space-x-4">
        <button
          onClick={() => setActiveTab("fonasa")}
          className={`py-3 px-4 font-semibold text-sm border-b-2 transition-colors ${
            activeTab === "fonasa"
              ? "border-blue-600 text-blue-600"
              : "border-transparent text-gray-500 hover:text-gray-700"
          }`}
        >
          Control de Bonos FONASA
        </button>
        <button
          onClick={() => setActiveTab("convenios")}
          className={`py-3 px-4 font-semibold text-sm border-b-2 transition-colors ${
            activeTab === "convenios"
              ? "border-blue-600 text-blue-600"
              : "border-transparent text-gray-500 hover:text-gray-700"
          }`}
        >
          Convenios y Sindicatos
        </button>
      </div>

      {/* TAB 1: FONASA */}
      {activeTab === "fonasa" && (
        <div className="space-y-8">
          {/* Formulario Registro Bono */}
          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-4">
            <h2 className="text-lg font-bold text-gray-800">Registrar Bono FONASA</h2>
            <form id="form-voucher" action={handleCreateVoucher} className="grid grid-cols-1 md:grid-cols-5 gap-3">
              <div>
                <label className="text-xs font-semibold text-gray-600">Nº Folio Único</label>
                <input
                  name="folio"
                  type="text"
                  placeholder="Ej: 108429381"
                  required
                  className="w-full mt-1 border px-3 py-2 rounded-md text-sm"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-600">Paciente</label>
                <select name="patientId" className="w-full mt-1 border px-3 py-2 rounded-md text-sm" required>
                  {patients.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.firstName} {p.lastName} ({p.rut})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-600">Prestación Bonificada</label>
                <select name="treatmentId" className="w-full mt-1 border px-3 py-2 rounded-md text-sm" required>
                  {treatments.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name} (${t.price.toLocaleString("es-CL")})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-600">Monto Bono ($)</label>
                <input
                  name="amount"
                  type="number"
                  placeholder="Aporte FONASA"
                  required
                  min="1"
                  className="w-full mt-1 border px-3 py-2 rounded-md text-sm"
                />
              </div>

              <div className="flex items-end">
                <button
                  type="submit"
                  disabled={isPending}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 rounded-md text-sm transition-colors disabled:opacity-50"
                >
                  {isPending ? "Guardando..." : "Ingresar Bono"}
                </button>
              </div>
            </form>
          </div>

          {/* Tabla de Bonos */}
          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-4">
            <h3 className="text-lg font-bold text-gray-800">Historial y Control de Bonos</h3>
            <div className="overflow-x-auto border rounded-lg">
              <table className="min-w-full divide-y divide-gray-200 text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left font-semibold text-gray-600">Folio</th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-600">Paciente</th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-600">Prestación</th>
                    <th className="px-4 py-3 text-right font-semibold text-gray-600">Monto Bono</th>
                    <th className="px-4 py-3 text-center font-semibold text-gray-600">Estado</th>
                    <th className="px-4 py-3 text-right font-semibold text-gray-600">Acción</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {vouchers.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-6 text-center text-gray-400">
                        No hay bonos registrados.
                      </td>
                    </tr>
                  ) : (
                    vouchers.map((v) => (
                      <tr key={v.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 font-mono font-medium text-blue-700">{v.folio}</td>
                        <td className="px-4 py-3 text-gray-800">
                          {v.patient.firstName} {v.patient.lastName}
                          <div className="text-xs text-gray-400">{v.patient.rut}</div>
                        </td>
                        <td className="px-4 py-3 text-gray-600">{v.treatment.name}</td>
                        <td className="px-4 py-3 text-right font-mono font-bold text-emerald-600">
                          ${v.amount.toLocaleString("es-CL")}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span
                            className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                              v.status === "UTILIZADO"
                                ? "bg-green-100 text-green-800"
                                : v.status === "PENDIENTE"
                                ? "bg-amber-100 text-amber-800"
                                : "bg-gray-100 text-gray-500 line-through"
                            }`}
                          >
                            {v.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right whitespace-nowrap">
                          {v.status === "PENDIENTE" && (
                            <div className="space-x-2">
                              <button
                                onClick={() => handleVoucherStatus(v.id, "UTILIZADO")}
                                disabled={isPending}
                                className="text-xs bg-green-50 text-green-700 px-2 py-1 rounded font-semibold hover:bg-green-100"
                              >
                                Usar
                              </button>
                              {anulandoVoucherId === v.id ? (
                                <span className="inline-flex items-center gap-1">
                                  <input
                                    type="text"
                                    placeholder="Motivo..."
                                    value={voidReason}
                                    onChange={(e) => setVoidReason(e.target.value)}
                                    className="text-xs px-2 py-1 border rounded w-28"
                                  />
                                  <button
                                    onClick={() => handleVoucherStatus(v.id, "ANULADO", voidReason)}
                                    className="text-xs bg-red-600 text-white px-2 py-1 rounded"
                                  >
                                    OK
                                  </button>
                                  <button
                                    onClick={() => setAnulandoVoucherId(null)}
                                    className="text-xs bg-gray-200 px-2 py-1 rounded"
                                  >
                                    X
                                  </button>
                                </span>
                              ) : (
                                <button
                                  onClick={() => setAnulandoVoucherId(v.id)}
                                  className="text-xs text-red-600 hover:underline font-semibold"
                                >
                                  Anular
                                </button>
                              )}
                            </div>
                          )}
                          {v.status === "ANULADO" && (
                            <span className="text-xs text-red-500 italic">Motivo: {v.voidReason}</span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: CONVENIOS */}
      {activeTab === "convenios" && (
        <div className="space-y-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Formulario Crear Convenio */}
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-4">
              <h2 className="text-lg font-bold text-gray-800">Crear Convenio</h2>
              <form id="form-agreement" action={handleCreateAgreement} className="space-y-3">
                <div>
                  <label className="text-xs font-semibold text-gray-600">Nombre del Convenio</label>
                  <input
                    name="name"
                    type="text"
                    placeholder="Ej: Convenio Sindicato N°1 BancoEstado"
                    required
                    className="w-full mt-1 border px-3 py-2 rounded-md text-sm"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-gray-600">Institución / Empresa</label>
                    <input
                      name="institution"
                      type="text"
                      placeholder="Empresa asociada"
                      required
                      className="w-full mt-1 border px-3 py-2 rounded-md text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-600">% Descuento</label>
                    <input
                      name="discountPct"
                      type="number"
                      step="0.1"
                      placeholder="Ej: 20"
                      min="0"
                      max="100"
                      className="w-full mt-1 border px-3 py-2 rounded-md text-sm"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-600">Fecha de Inicio de Vigencia</label>
                  <input
                    name="startDate"
                    type="date"
                    required
                    defaultValue={new Date().toISOString().split("T")[0]}
                    className="w-full mt-1 border px-3 py-2 rounded-md text-sm"
                  />
                </div>
                <button
                  type="submit"
                  disabled={isPending}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 rounded-md text-sm transition-colors"
                >
                  {isPending ? "Guardando..." : "Crear Convenio"}
                </button>
              </form>
            </div>

            {/* Inscribir Beneficiario */}
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-4">
              <h2 className="text-lg font-bold text-gray-800">Adscribir Paciente a Convenio</h2>
              <div className="space-y-3">
                <div>
                  <label className="text-xs font-semibold text-gray-600">Convenio Vigente</label>
                  <select
                    value={selectedAgreementId}
                    onChange={(e) => setSelectedAgreementId(e.target.value)}
                    className="w-full mt-1 border px-3 py-2 rounded-md text-sm"
                  >
                    {agreements.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.name} ({a.discountPct}% desc.)
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-600">Paciente</label>
                  <select
                    value={selectedPatientId}
                    onChange={(e) => setSelectedPatientId(e.target.value)}
                    className="w-full mt-1 border px-3 py-2 rounded-md text-sm"
                  >
                    {patients.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.firstName} {p.lastName} - {p.rut}
                      </option>
                    ))}
                  </select>
                </div>
                <button
                  type="button"
                  onClick={handleAddBeneficiary}
                  disabled={isPending || agreements.length === 0}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-2 rounded-md text-sm transition-colors disabled:opacity-50"
                >
                  {isPending ? "Inscribiendo..." : "Asociar Paciente a Convenio"}
                </button>
              </div>
            </div>
          </div>

          {/* Listado de Convenios y Beneficiarios */}
          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-4">
            <h3 className="text-lg font-bold text-gray-800">Convenios Activos y Beneficiarios</h3>
            <div className="space-y-4">
              {agreements.length === 0 ? (
                <p className="text-sm text-gray-400">No hay convenios creados.</p>
              ) : (
                agreements.map((ag) => (
                  <div key={ag.id} className="border rounded-lg p-4 bg-gray-50/50">
                    <div className="flex justify-between items-center mb-2">
                      <div>
                        <h4 className="font-bold text-gray-800">{ag.name}</h4>
                        <span className="text-xs text-gray-500">
                          Institución: {ag.institution} | Descuento: {ag.discountPct}%
                        </span>
                      </div>
                      <span className="text-xs bg-green-100 text-green-800 font-semibold px-2 py-0.5 rounded-full">
                        Vigente
                      </span>
                    </div>

                    <div className="text-xs text-gray-600">
                      <strong>Beneficiarios inscritos ({ag.beneficiaries?.length || 0}):</strong>
                      {ag.beneficiaries?.length > 0 ? (
                        <div className="flex flex-wrap gap-2 mt-1">
                          {ag.beneficiaries.map((b: any) => (
                            <span key={b.id} className="bg-white border px-2 py-1 rounded text-gray-700">
                              {b.patient.firstName} {b.patient.lastName} ({b.patient.rut})
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-gray-400 ml-1">Sin beneficiarios inscritos aún.</span>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}