"use client";

import { useState } from "react";
import { updateAppointmentStatus } from "@/lib/appointmentActions";

interface CancelModalProps {
  isOpen: boolean;
  appointmentId: string | null;
  onClose: () => void;
  onSuccess: () => void;
}

export default function CancelAppointmentModal({
  isOpen,
  appointmentId,
  onClose,
  onSuccess,
}: CancelModalProps) {
  const [cancelReason, setCancelReason] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (!isOpen || !appointmentId) return null;

  const handleConfirm = async () => {
    if (!cancelReason.trim()) {
      setError("Debe especificar el motivo de la cancelación.");
      return;
    }

    setLoading(true);
    setError(null);

    const res = await updateAppointmentStatus(appointmentId, "CANCELADA", cancelReason);
    setLoading(false);

    if (res.success) {
      setCancelReason("");
      onSuccess();
      onClose();
    } else {
      setError(res.error || "Error al cancelar la cita.");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl border border-slate-200">
        <h3 className="text-lg font-black text-slate-800 mb-2">Cancelar Cita Médica</h3>
        <p className="text-xs text-slate-500 mb-4">
          Esta acción liberará el box y la agenda del profesional. Indique el motivo para mantener la trazabilidad.
        </p>

        {error && (
          <div className="mb-3 p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs font-semibold">
            {error}
          </div>
        )}

        <textarea
          value={cancelReason}
          onChange={(e) => setCancelReason(e.target.value)}
          placeholder="Ej: Solicitud expresa del paciente por inconvenientes personales..."
          rows={3}
          className="w-full border border-slate-300 rounded-xl p-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-rose-500 mb-4"
        />

        <div className="flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-slate-300 text-slate-700 rounded-xl text-xs font-bold hover:bg-slate-50 transition-colors"
          >
            Volver
          </button>
          <button
            onClick={handleConfirm}
            disabled={loading}
            className="px-4 py-2 bg-rose-600 text-white rounded-xl text-xs font-bold hover:bg-rose-700 disabled:opacity-50 transition-colors"
          >
            {loading ? "Cancelando..." : "Confirmar Cancelación"}
          </button>
        </div>
      </div>
    </div>
  );
}