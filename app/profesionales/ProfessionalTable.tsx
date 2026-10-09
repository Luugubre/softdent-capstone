"use client";

import { useState } from "react";
import { toggleProfessionalStatus } from "@/lib/professionalActions";
import ProfessionalModal from "@/components/ProfessionalModal";
import { useRouter } from "next/navigation";

interface ProfessionalItem {
  id: string;
  rut: string;
  firstName: string;
  lastName: string;
  professionalRegister: string;
  email: string | null;
  phone: string | null;
  birthDate?: string | Date | null; // 👈 Se agrega a la interfaz
  role: "ADMIN" | "DENTISTA" | "RECEPCIONISTA" | "ASISTENTE";
  active: boolean;
  specialtyId?: string | null;
  specialty: { name: string } | null;
  userId: string | null;
  user?: { name: string; email: string } | null;
}

export default function ProfessionalTable({ initialData }: { initialData: ProfessionalItem[] }) {
  const router = useRouter();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedProfessional, setSelectedProfessional] = useState<ProfessionalItem | null>(null);
  const [alertError, setAlertError] = useState<string | null>(null);

  const handleToggleActive = async (prof: ProfessionalItem) => {
    setAlertError(null);
    const res = await toggleProfessionalStatus(prof.id, !prof.active);
    if (!res.success) {
      setAlertError(res.error);
    } else {
      router.refresh();
    }
  };

  const handleEdit = (prof: ProfessionalItem) => {
    setSelectedProfessional(prof);
    setIsModalOpen(true);
  };

  const handleCreate = () => {
    setSelectedProfessional(null);
    setIsModalOpen(true);
  };

  return (
    <div className="space-y-6">
      {alertError && (
        <div className="p-4 bg-amber-50 border-l-4 border-amber-500 text-amber-800 rounded-r-xl text-sm flex justify-between items-center shadow-sm">
          <span>{alertError}</span>
          <button onClick={() => setAlertError(null)} className="font-bold ml-4 text-amber-900 hover:text-amber-700">
            ✕
          </button>
        </div>
      )}

      {/* Cabecera */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
        <div>
          <h1 className="text-3xl font-black text-slate-800 tracking-tight">Equipo Clínico</h1>
          <p className="text-sm text-slate-500 mt-1">Gestiona los profesionales médicos, registros y vinculación de cuentas.</p>
        </div>
        <button
          onClick={handleCreate}
          className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-5 py-2.5 rounded-xl transition-all shadow-sm text-sm border-none cursor-pointer flex items-center gap-1.5"
        >
          <span>+</span>
          <span>Agregar Profesional</span>
        </button>
      </div>

      {/* Tabla de Profesionales */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-200 text-xs font-black text-slate-400 uppercase tracking-wider">
                <th className="p-4 pl-6">Nombre</th>
                <th className="p-4">RUT</th>
                <th className="p-4">Especialidad</th>
                <th className="p-4">Registro</th>
                <th className="p-4">Estado</th>
                <th className="p-4 pr-6 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {initialData.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-12 text-center text-slate-400 font-medium">
                    No hay profesionales registrados aún.
                  </td>
                </tr>
              ) : (
                initialData.map((prof) => (
                  <tr key={prof.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="p-4 pl-6 font-bold text-slate-800">
                      {prof.firstName} {prof.lastName}
                    </td>
                    <td className="p-4 text-slate-600 font-mono text-xs">{prof.rut}</td>
                    <td className="p-4 text-slate-600">{prof.specialty?.name || "—"}</td>
                    <td className="p-4 text-slate-600">{prof.professionalRegister}</td>
                    <td className="p-4">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${
                          prof.active
                            ? "bg-emerald-50 text-emerald-700"
                            : "bg-rose-50 text-rose-700"
                        }`}
                      >
                        {prof.active ? "Activo" : "Inactivo"}
                      </span>
                    </td>
                    <td className="p-4 pr-6 text-right space-x-3 font-medium">
                      <button
                        onClick={() => handleEdit(prof)}
                        className="text-blue-600 hover:text-blue-800 text-xs font-bold"
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => handleToggleActive(prof)}
                        className={`text-xs font-bold ${
                          prof.active ? "text-rose-600 hover:text-rose-800" : "text-emerald-600 hover:text-emerald-800"
                        }`}
                      >
                        {prof.active ? "Desactivar" : "Activar"}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <ProfessionalModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        professionalToEdit={selectedProfessional}
        onSuccess={() => router.refresh()}
      />
    </div>
  );
}