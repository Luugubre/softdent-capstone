"use client";

import { useState } from "react";
import { createScheduleBlock } from "@/lib/appointmentActions";
import type { ScheduleBlockType } from "@prisma/client";

interface ScheduleBlockModalProps {
  professionals: { id: string; name: string }[];
  boxes: { id: string; name: string }[];
  defaultDate?: Date;
}

export function ScheduleBlockModal({
  professionals,
  boxes,
  defaultDate,
}: ScheduleBlockModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const initialDateStr = defaultDate
    ? defaultDate.toISOString().split("T")[0]
    : new Date().toISOString().split("T")[0];

  const [formData, setFormData] = useState({
    reason: "",
    type: "REUNION" as ScheduleBlockType,
    date: initialDateStr,
    startTime: "09:00",
    endTime: "18:00",
    professionalId: "",
    boxId: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.reason.trim()) {
      setErrorMsg("Debe ingresar el motivo del bloqueo.");
      return;
    }

    setLoading(true);
    setErrorMsg(null);

    const startDate = `${formData.date}T${formData.startTime}:00`;
    const endDate = `${formData.date}T${formData.endTime}:00`;

    const res = await createScheduleBlock({
      reason: formData.reason,
      type: formData.type,
      startDate,
      endDate,
      professionalId: formData.professionalId || null,
      boxId: formData.boxId || null,
    });

    setLoading(false);

    if (res.success) {
      setIsOpen(false);
      setFormData({
        reason: "",
        type: "REUNION",
        date: initialDateStr,
        startTime: "09:00",
        endTime: "18:00",
        professionalId: "",
        boxId: "",
      });
    } else {
      setErrorMsg(res.error || "Error al registrar el bloqueo.");
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition-all shadow-sm flex items-center gap-1.5"
      >
        <span>🚫</span>
        <span>Bloquear Agenda</span>
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-md p-6 space-y-5">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900">
                Registrar Bloqueo de Agenda
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
                  Motivo *
                </label>
                <input
                  type="text"
                  value={formData.reason}
                  onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                  placeholder="Ej. Mantención Box 1, Vacaciones Dr. Axel..."
                  className="w-full border border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 rounded-xl p-2.5 text-xs outline-none focus:ring-2 focus:ring-slate-800 font-medium"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Tipo
                  </label>
                  <select
                    value={formData.type}
                    onChange={(e) =>
                      setFormData({ ...formData, type: e.target.value as ScheduleBlockType })
                    }
                    className="w-full border border-slate-300 bg-white text-slate-900 rounded-xl p-2.5 text-xs outline-none focus:ring-2 focus:ring-slate-800 font-medium"
                  >
                    <option value="REUNION" className="text-slate-900 bg-white">Reunión</option>
                    <option value="VACACIONES" className="text-slate-900 bg-white">Vacaciones</option>
                    <option value="MANTENCION" className="text-slate-900 bg-white">Mantención</option>
                    <option value="FERIADO" className="text-slate-900 bg-white">Feriado / Administrativo</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Fecha
                  </label>
                  <input
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    className="w-full border border-slate-300 bg-white text-slate-900 rounded-xl p-2.5 text-xs outline-none focus:ring-2 focus:ring-slate-800 font-medium"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Hora Inicio
                  </label>
                  <input
                    type="time"
                    value={formData.startTime}
                    onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                    className="w-full border border-slate-300 bg-white text-slate-900 rounded-xl p-2.5 text-xs outline-none focus:ring-2 focus:ring-slate-800 font-medium"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Hora Fin
                  </label>
                  <input
                    type="time"
                    value={formData.endTime}
                    onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                    className="w-full border border-slate-300 bg-white text-slate-900 rounded-xl p-2.5 text-xs outline-none focus:ring-2 focus:ring-slate-800 font-medium"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Profesional (Opcional)
                  </label>
                  <select
                    value={formData.professionalId}
                    onChange={(e) =>
                      setFormData({ ...formData, professionalId: e.target.value })
                    }
                    className="w-full border border-slate-300 bg-white text-slate-900 rounded-xl p-2.5 text-xs outline-none focus:ring-2 focus:ring-slate-800 font-medium"
                  >
                    <option value="" className="text-slate-900 bg-white">Toda la Clínica</option>
                    {professionals.map((p) => (
                      <option key={p.id} value={p.id} className="text-slate-900 bg-white">
                        {p.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Box (Opcional)
                  </label>
                  <select
                    value={formData.boxId}
                    onChange={(e) => setFormData({ ...formData, boxId: e.target.value })}
                    className="w-full border border-slate-300 bg-white text-slate-900 rounded-xl p-2.5 text-xs outline-none focus:ring-2 focus:ring-slate-800 font-medium"
                  >
                    <option value="" className="text-slate-900 bg-white">Todos los Boxes</option>
                    {boxes.map((b) => (
                      <option key={b.id} value={b.id} className="text-slate-900 bg-white">
                        {b.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

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
                  className="px-5 py-2 text-xs font-bold text-white bg-slate-900 hover:bg-black rounded-xl transition-all shadow-sm"
                >
                  {loading ? "Guardando..." : "Crear Bloqueo"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}