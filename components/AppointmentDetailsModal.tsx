"use client";

import { useState } from "react";
import { updateAppointmentStatus, AppointmentStatus } from "@/lib/appointmentActions";
import { canTransitionTo } from "@/lib/appointmentState";
import Link from "next/link";

interface AppointmentDetailsModalProps {
  appointment: {
    id: string;
    date: Date | string;
    status: string;
    patientName: string;
    patientId: string;
    durationMin: number;
    cancelReason?: string | null;
  };
}

const ALL_STATUSES: { key: AppointmentStatus; label: string; color: string }[] = [
  { key: "AGENDADA", label: "Agendada", color: "bg-blue-100 text-blue-800" },
  { key: "CONFIRMADA", label: "Confirmada", color: "bg-indigo-100 text-indigo-800" },
  { key: "EN_ATENCION", label: "En Atención", color: "bg-amber-100 text-amber-800" },
  { key: "REALIZADA", label: "Realizada / Atendida", color: "bg-emerald-100 text-emerald-800" },
  { key: "CANCELADA", label: "Cancelada", color: "bg-rose-100 text-rose-800" },
  { key: "NO_ASISTIO", label: "No Asistió", color: "bg-slate-200 text-slate-800" },
  { key: "REAGENDADA", label: "Reagendada", color: "bg-purple-100 text-purple-800" },
];

export function AppointmentDetailsModal({ appointment }: AppointmentDetailsModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [targetStatus, setTargetStatus] = useState<AppointmentStatus | "">("");
  const [cancelReason, setCancelReason] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const currentStatusObj = ALL_STATUSES.find((s) => s.key === appointment.status);

  const allowedTransitions = ALL_STATUSES.filter((s) =>
    canTransitionTo(appointment.status, s.key)
  );

  const handleStatusUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetStatus) return;

    if (targetStatus === "CANCELADA" && !cancelReason.trim()) {
      setErrorMsg("Debe registrar obligatoriamente el motivo de la cancelación.");
      return;
    }

    setLoading(true);
    setErrorMsg(null);

    const res = await updateAppointmentStatus(
      appointment.id,
      targetStatus as AppointmentStatus,
      cancelReason
    );

    setLoading(false);

    if (res.success) {
      setIsOpen(false);
      setTargetStatus("");
      setCancelReason("");
    } else {
      setErrorMsg(res.error || "No se pudo actualizar el estado de la cita.");
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="w-full h-full text-left flex items-center justify-between group p-1"
      >
        <div className="truncate">
          <span className="font-bold text-sm text-slate-900 group-hover:text-blue-600 transition-colors">
            {appointment.patientName}
          </span>
          <span className="ml-2 text-xs text-slate-500">
            ({appointment.durationMin} min)
          </span>
        </div>
        <span
          className={`text-[10px] font-extrabold px-2.5 py-1 rounded-full uppercase tracking-wider ${
            currentStatusObj?.color || "bg-slate-100 text-slate-800"
          }`}
        >
          {currentStatusObj?.label || appointment.status}
        </span>
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-lg p-6 space-y-6">
            
            <div className="flex justify-between items-start border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-lg font-bold text-slate-900">
                  Gestión de Cita Dental
                </h3>
                <p className="text-xs font-medium text-slate-500 mt-0.5">
                  Paciente: <span className="font-bold text-slate-700">{appointment.patientName}</span>
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold p-1"
              >
                ✕
              </button>
            </div>

            {errorMsg && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs font-bold text-rose-700">
                {errorMsg}
              </div>
            )}

            <div className="flex items-center justify-between bg-slate-50 p-3 rounded-xl border border-slate-100">
              <span className="text-xs font-semibold text-slate-600">Estado actual:</span>
              <span
                className={`text-xs font-bold px-3 py-1 rounded-full uppercase ${
                  currentStatusObj?.color || "bg-slate-200 text-slate-800"
                }`}
              >
                {currentStatusObj?.label || appointment.status}
              </span>
            </div>

            {appointment.status === "EN_ATENCION" && (
              <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-sm">
                <div>
                  <h4 className="text-xs font-black text-amber-900 uppercase tracking-wider">
                    Atención Médica En Curso
                  </h4>
                  <p className="text-[11px] text-amber-700 font-medium mt-0.5">
                    Cita ID: <span className="font-mono font-bold">{appointment.id.substring(0, 8)}...</span>
                  </p>
                </div>
                <Link
                  href={`/pacientes/${appointment.patientId}?appointmentId=${appointment.id}`}
                  className="w-full sm:w-auto text-center bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition-all shadow-sm flex items-center justify-center gap-1.5 shrink-0"
                >
                  <span>Iniciar Evolución / Odontograma</span>
                  <span>→</span>
                </Link>
              </div>
            )}

            {appointment.status === "REALIZADA" && (
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-sm">
                <div>
                  <h4 className="text-xs font-black text-emerald-900 uppercase tracking-wider">
                    Cita Finalizada - Lista para Cobro
                  </h4>
                  <p className="text-[11px] text-emerald-700 font-medium mt-0.5">
                    Generar comprobante de pago o registrar abono en caja.
                  </p>
                </div>
                <Link
                  href={`/pacientes/${appointment.patientId}`}
                  className="w-full sm:w-auto text-center bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition-all shadow-sm flex items-center justify-center gap-1.5 shrink-0"
                >
                  <span>Ir a Cobro en Caja 💰</span>
                </Link>
              </div>
            )}

            {allowedTransitions.length > 0 ? (
              <form onSubmit={handleStatusUpdate} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-2">
                    Cambiar Estado a:
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {allowedTransitions.map((t) => (
                      <button
                        key={t.key}
                        type="button"
                        onClick={() => {
                          setTargetStatus(t.key);
                          setErrorMsg(null);
                        }}
                        className={`p-2.5 rounded-xl text-xs font-bold border transition-all text-left flex items-center justify-between ${
                          targetStatus === t.key
                            ? "border-blue-600 bg-blue-50 text-blue-900 ring-2 ring-blue-500/20"
                            : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                        }`}
                      >
                        {t.label}
                      </button>
                    ))}
                  </div>
                </div>

                {targetStatus === "CANCELADA" && (
                  <div className="space-y-1.5 pt-2">
                    <label className="block text-xs font-bold text-rose-700">
                      Motivo de Cancelación *
                    </label>
                    <textarea
                      rows={3}
                      value={cancelReason}
                      onChange={(e) => setCancelReason(e.target.value)}
                      placeholder="Escriba la razón de la cancelación..."
                      className="w-full border border-rose-300 rounded-xl p-3 text-xs text-slate-800 outline-none focus:ring-2 focus:ring-rose-500 bg-rose-50/30"
                      required
                    />
                  </div>
                )}

                <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setIsOpen(false)}
                    className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-all"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={!targetStatus || loading}
                    className="px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded-xl transition-all shadow-sm"
                  >
                    {loading ? "Actualizando..." : "Confirmar Cambio"}
                  </button>
                </div>
              </form>
            ) : (
              <p className="text-xs text-slate-500 text-center py-2 italic">
                Esta cita se encuentra en un estado final y no admite más transiciones.
              </p>
            )}

          </div>
        </div>
      )}
    </>
  );
}