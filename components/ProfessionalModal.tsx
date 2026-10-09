"use client";

import { useState, useEffect } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { professionalSchema, ProfessionalFormData } from "@/lib/schemas";
import { createProfessional, updateProfessional, getActiveSpecialties } from "@/lib/professionalActions";

interface Specialty {
  id: string;
  name: string;
}

interface ProfessionalModalProps {
  isOpen: boolean;
  onClose: () => void;
  professionalToEdit?: {
    id: string;
    firstName: string;
    lastName: string;
    rut: string;
    specialtyId?: string | null;
    role?: "ADMIN" | "DENTISTA" | "RECEPCIONISTA" | "ASISTENTE";
    professionalRegister: string;
    email?: string | null;
    phone?: string | null;
    birthDate?: string | Date | null;
    userId?: string | null;
  } | null;
  onSuccess: () => void;
}

export default function ProfessionalModal({
  isOpen,
  onClose,
  professionalToEdit,
  onSuccess,
}: ProfessionalModalProps) {
  const [specialties, setSpecialties] = useState<Specialty[]>([]);
  const [serverError, setServerError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors },
  } = useForm<ProfessionalFormData>({
    resolver: zodResolver(professionalSchema),
  });

  const selectedRole = useWatch({
    control,
    name: "role",
  });

  useEffect(() => {
    if (isOpen) {
      getActiveSpecialties().then(setSpecialties);
      
      if (professionalToEdit) {
        // Formatear la fecha para que la interprete el input HTML tipo date (YYYY-MM-DD)
        const formattedBirthDate = professionalToEdit.birthDate
          ? new Date(professionalToEdit.birthDate).toISOString().split("T")[0]
          : "";

        reset({
          firstName: professionalToEdit.firstName,
          lastName: professionalToEdit.lastName,
          rut: professionalToEdit.rut,
          role: professionalToEdit.role || "DENTISTA",
          specialtyId: professionalToEdit.specialtyId || "",
          professionalRegister: professionalToEdit.professionalRegister,
          email: professionalToEdit.email || "",
          phone: professionalToEdit.phone || "",
          birthDate: formattedBirthDate,
          userId: professionalToEdit.userId || null,
        });
      } else {
        reset({
          firstName: "",
          lastName: "",
          rut: "",
          role: "DENTISTA",
          specialtyId: "",
          professionalRegister: "",
          email: "",
          phone: "",
          birthDate: "",
          userId: null,
        });
      }
    }
  }, [isOpen, professionalToEdit, reset]);

  if (!isOpen) return null;

  const handleClose = () => {
    setServerError(null);
    onClose();
  };

  const onSubmit = async (data: ProfessionalFormData) => {
    setLoading(true);
    setServerError(null);

    const res = professionalToEdit
      ? await updateProfessional(professionalToEdit.id, data)
      : await createProfessional(data);

    setLoading(false);

    if (res.success) {
      onSuccess();
      handleClose();
    } else {
      setServerError(res.error);
    }
  };

  const labelStyle = { color: "#1e293b", opacity: 1 };
  const inputStyle = { color: "#0f172a", backgroundColor: "#ffffff", opacity: 1, borderColor: "#cbd5e1" };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div 
        className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl border border-slate-200"
        style={{ color: "#0f172a", backgroundColor: "#ffffff", opacity: 1 }}
      >
        <h2 className="text-xl font-black mb-4" style={{ color: "#0f172a", opacity: 1 }}>
          {professionalToEdit ? "Editar Profesional" : "Nuevo Profesional"}
        </h2>

        {serverError && (
          <div className="mb-4 p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs font-semibold">
            {serverError}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold mb-1" style={labelStyle}>Nombre *</label>
              <input
                {...register("firstName")}
                style={inputStyle}
                className="w-full border rounded-xl p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {errors.firstName && (
                <p className="text-rose-600 text-xs mt-1 font-medium">{errors.firstName.message}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold mb-1" style={labelStyle}>Apellido *</label>
              <input
                {...register("lastName")}
                style={inputStyle}
                className="w-full border rounded-xl p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {errors.lastName && (
                <p className="text-rose-600 text-xs mt-1 font-medium">{errors.lastName.message}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold mb-1" style={labelStyle}>RUT *</label>
              <input
                {...register("rut")}
                placeholder="12345678-K"
                style={inputStyle}
                className="w-full border rounded-xl p-2.5 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {errors.rut && (
                <p className="text-rose-600 text-xs mt-1 font-medium">{errors.rut.message}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold mb-1" style={labelStyle}>Reg. Profesional *</label>
              <input
                {...register("professionalRegister")}
                placeholder="N° Registro RNPI"
                style={inputStyle}
                className="w-full border rounded-xl p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {errors.professionalRegister && (
                <p className="text-rose-600 text-xs mt-1 font-medium">{errors.professionalRegister.message}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold mb-1" style={labelStyle}>Rol de Sistema *</label>
              <select
                {...register("role")}
                style={inputStyle}
                className="w-full border rounded-xl p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="DENTISTA" style={{ color: "#0f172a" }}>Dentista</option>
                <option value="ADMIN" style={{ color: "#0f172a" }}>Administrador</option>
                <option value="RECEPCIONISTA" style={{ color: "#0f172a" }}>Recepcionista</option>
                <option value="ASISTENTE" style={{ color: "#0f172a" }}>Asistente</option>
              </select>
              {errors.role && (
                <p className="text-rose-600 text-xs mt-1 font-medium">{errors.role.message}</p>
              )}
            </div>

            {selectedRole === "DENTISTA" && (
              <div>
                <label className="block text-xs font-bold mb-1" style={labelStyle}>Especialidad *</label>
                <select
                  {...register("specialtyId")}
                  style={inputStyle}
                  className="w-full border rounded-xl p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="" style={{ color: "#0f172a" }}>Seleccione una especialidad</option>
                  {specialties.map((spec) => (
                    <option key={spec.id} value={spec.id} style={{ color: "#0f172a" }}>
                      {spec.name}
                    </option>
                  ))}
                </select>
                {errors.specialtyId && (
                  <p className="text-rose-600 text-xs mt-1 font-medium">{errors.specialtyId.message}</p>
                )}
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold mb-1" style={labelStyle}>Correo Electrónico</label>
              <input
                {...register("email")}
                type="email"
                style={inputStyle}
                className="w-full border rounded-xl p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {errors.email && (
                <p className="text-rose-600 text-xs mt-1 font-medium">{errors.email.message}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold mb-1" style={labelStyle}>Teléfono</label>
              <input
                {...register("phone")}
                placeholder="+56 9 1234 5678"
                style={inputStyle}
                className="w-full border rounded-xl p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {errors.phone && (
                <p className="text-rose-600 text-xs mt-1 font-medium">{errors.phone.message}</p>
              )}
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold mb-1" style={labelStyle}>Fecha de Nacimiento</label>
            <input
              {...register("birthDate")}
              type="date"
              style={inputStyle}
              className="w-full border rounded-xl p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {errors.birthDate && (
              <p className="text-rose-600 text-xs mt-1 font-medium">{errors.birthDate.message}</p>
            )}
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={handleClose}
              style={{ color: "#334155", backgroundColor: "#ffffff" }}
              className="px-4 py-2.5 border border-slate-300 rounded-xl text-xs font-bold hover:bg-slate-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2.5 bg-blue-600 text-white font-bold rounded-xl text-xs hover:bg-blue-700 disabled:opacity-50 transition-colors shadow-sm"
            >
              {loading ? "Guardando..." : "Guardar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}