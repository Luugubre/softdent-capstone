"use client";

import { useState } from "react";
import { createAppointment } from "@/lib/appointmentActions";

interface AppointmentModalProps {
  timeBlock: string;
  date: Date;
  patients: { id: string; firstName: string; lastName: string; rut: string }[];
  dentists: { id: string; name: string }[];
  boxes: { id: string; name: string }[];
  procedures: { id: string; name: string; durationMin: number }[];
}

export function AppointmentModal({
  timeBlock,
  date,
  patients,
  dentists,
  boxes,
  procedures,
}: AppointmentModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    patientId: "",
    professionalId: "",
    boxId: "",
    procedureId: "",
    durationMin: 30,
    isOverbook: false,
    overbookReason: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    const dateTimeStr = `${year}-${month}-${day}T${timeBlock}:00`;

    const res = await createAppointment({
      ...formData,
      date: dateTimeStr,
    });

    setLoading(false);

    if (res.success) {
      setIsOpen(false);
      setFormData({
        patientId: "",
        professionalId: "",
        boxId: "",
        procedureId: "",
        durationMin: 30,
        isOverbook: false,
        overbookReason: "",
      });
    } else {
      setErrorMsg(res.error || "Ocurrió un error al agendar la cita.");
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="w-full h-full text-left p-2 text-xs text-slate-400 hover:text-blue-600 font-medium hover:bg-blue-50/50 rounded-lg transition-all"
      >
        + Agendar en {timeBlock}
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-md p-6 space-y-5">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900">
                Agendar Cita ({timeBlock} hrs)
              </h3>
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

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Paciente *
                </label>
                <select
                  value={formData.patientId}
                  onChange={(e) => setFormData({ ...formData, patientId: e.target.value })}
                  className="w-full border border-slate-300 bg-white text-slate-900 rounded-xl p-2.5 text-xs outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                  required
                >
                  <option value="" className="text-slate-900 bg-white">Seleccionar Paciente...</option>
                  {patients.map((p) => (
                    <option key={p.id} value={p.id} className="text-slate-900 bg-white">
                      {p.firstName} {p.lastName} ({p.rut})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Profesional *
                </label>
                <select
                  value={formData.professionalId}
                  onChange={(e) => setFormData({ ...formData, professionalId: e.target.value })}
                  className="w-full border border-slate-300 bg-white text-slate-900 rounded-xl p-2.5 text-xs outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                  required
                >
                  <option value="" className="text-slate-900 bg-white">Seleccionar Profesional...</option>
                  {dentists.map((d) => (
                    <option key={d.id} value={d.id} className="text-slate-900 bg-white">
                      {d.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Procedimiento / Tratamiento
                </label>
                <select
                  value={formData.procedureId}
                  onChange={(e) => {
                    const selectedProc = procedures.find((p) => p.id === e.target.value);
                    setFormData({
                      ...formData,
                      procedureId: e.target.value,
                      durationMin: selectedProc ? selectedProc.durationMin : formData.durationMin,
                    });
                  }}
                  className="w-full border border-slate-300 bg-white text-slate-900 rounded-xl p-2.5 text-xs outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                >
                  <option value="" className="text-slate-900 bg-white">Seleccionar Procedimiento (Opcional)...</option>
                  {procedures.map((proc) => (
                    <option key={proc.id} value={proc.id} className="text-slate-900 bg-white">
                      {proc.name} ({proc.durationMin} min)
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Box *
                  </label>
                  <select
                    value={formData.boxId}
                    onChange={(e) => setFormData({ ...formData, boxId: e.target.value })}
                    className="w-full border border-slate-300 bg-white text-slate-900 rounded-xl p-2.5 text-xs outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                    required
                  >
                    <option value="" className="text-slate-900 bg-white">Seleccionar Box...</option>
                    {boxes.map((b) => (
                      <option key={b.id} value={b.id} className="text-slate-900 bg-white">
                        {b.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Duración (min)
                  </label>
                  <select
                    value={formData.durationMin}
                    onChange={(e) => setFormData({ ...formData, durationMin: Number(e.target.value) })}
                    className="w-full border border-slate-300 bg-white text-slate-900 rounded-xl p-2.5 text-xs outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                  >
                    <option value={15} className="text-slate-900 bg-white">15 min</option>
                    <option value={30} className="text-slate-900 bg-white">30 min</option>
                    <option value={45} className="text-slate-900 bg-white">45 min</option>
                    <option value={60} className="text-slate-900 bg-white">60 min</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
                <input
                  type="checkbox"
                  id="overbook"
                  checked={formData.isOverbook}
                  onChange={(e) => setFormData({ ...formData, isOverbook: e.target.checked })}
                  className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                />
                <label htmlFor="overbook" className="text-xs font-bold text-slate-700 cursor-pointer">
                  Permitir Sobrecupo (Ignorar choques)
                </label>
              </div>

              {formData.isOverbook && (
                <div>
                  <label className="block text-xs font-bold text-rose-700 mb-1">
                    Motivo de Sobrecupo *
                  </label>
                  <input
                    type="text"
                    value={formData.overbookReason}
                    onChange={(e) => setFormData({ ...formData, overbookReason: e.target.value })}
                    placeholder="Urgencia dental, solicitud explícita del Dr., etc."
                    className="w-full border border-rose-300 bg-rose-50/50 text-slate-900 placeholder:text-slate-400 rounded-xl p-2.5 text-xs outline-none focus:ring-2 focus:ring-rose-500 font-medium"
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
                  disabled={loading}
                  className="px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-all shadow-sm"
                >
                  {loading ? "Agendando..." : "Confirmar Cita"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}