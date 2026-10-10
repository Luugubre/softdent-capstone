"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { AppointmentStatus } from "@/lib/appointmentActions";

interface Professional {
  id: string;
  name: string;
}

interface Box {
  id: string;
  name: string;
}

interface Patient {
  id: string;
  firstName?: string;
  lastName?: string;
  fullName?: string;
}

interface AppointmentItem {
  id: string;
  date: Date | string;
  endDate?: Date | string | null;
  status: AppointmentStatus | string;
  durationMin?: number | null;
  patientId: string;
  professionalId?: string | null;
  boxId?: string | null;
  procedureId?: string | null;
  patient?: Patient | null;
  professional?: Professional | null;
  box?: Box | null;
  isOverbook?: boolean;
}

interface AgendaClientProps {
  professionals: Professional[];
  boxes: Box[];
  appointments: AppointmentItem[];
}

export default function AgendaClient({
  professionals,
  boxes,
  appointments,
}: AgendaClientProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Estados de filtros obtenidos desde los parámetros de la URL
  const currentView = (searchParams.get("view") as "diaria" | "semanal" | "mensual") || "diaria";
  const selectedProfessional = searchParams.get("professionalId") || "";
  const selectedBox = searchParams.get("boxId") || "";
  const selectedStatus = searchParams.get("status") || "";

  // Helper para refrescar los parámetros en la URL sin recargar la página
  const updateQueryParam = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    router.push(`${pathname}?${params.toString()}`);
  };

  // Filtrado reactivo de las citas
  const filteredAppointments = appointments.filter((app) => {
    if (selectedProfessional && app.professionalId !== selectedProfessional) {
      return false;
    }
    if (selectedBox && app.boxId !== selectedBox) {
      return false;
    }
    if (selectedStatus && app.status !== selectedStatus) {
      return false;
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* BARRA SUPERIOR DE HERRAMIENTAS: SELECTOR DE VISTAS Y FILTROS */}
      <div className="flex flex-col gap-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm md:flex-row md:items-center md:justify-between">
        {/* Selector de Vistas: Diaria / Semanal / Mensual */}
        <div className="flex items-center rounded-lg bg-slate-100 p-1">
          <button
            type="button"
            onClick={() => updateQueryParam("view", "diaria")}
            className={`rounded-md px-4 py-2 text-sm font-semibold transition-all ${
              currentView === "diaria"
                ? "bg-white text-blue-600 shadow-sm"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Diaria
          </button>
          <button
            type="button"
            onClick={() => updateQueryParam("view", "semanal")}
            className={`rounded-md px-4 py-2 text-sm font-semibold transition-all ${
              currentView === "semanal"
                ? "bg-white text-blue-600 shadow-sm"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Semanal
          </button>
          <button
            type="button"
            onClick={() => updateQueryParam("view", "mensual")}
            className={`rounded-md px-4 py-2 text-sm font-semibold transition-all ${
              currentView === "mensual"
                ? "bg-white text-blue-600 shadow-sm"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Mensual
          </button>
        </div>

        {/* Filtros Activos: Profesional, Box y Estado */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Desplegable de Profesional */}
          <div className="flex flex-col">
            <select
              value={selectedProfessional}
              onChange={(e) => updateQueryParam("professionalId", e.target.value)}
              className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="">Todos los Profesionales</option>
              {professionals.map((prof) => (
                <option key={prof.id} value={prof.id}>
                  {prof.name}
                </option>
              ))}
            </select>
          </div>

          {/* Desplegable de Box de Atención */}
          <div className="flex flex-col">
            <select
              value={selectedBox}
              onChange={(e) => updateQueryParam("boxId", e.target.value)}
              className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="">Todos los Boxes</option>
              {boxes.map((box) => (
                <option key={box.id} value={box.id}>
                  {box.name}
                </option>
              ))}
            </select>
          </div>

          {/* Desplegable de Estado de la Cita */}
          <div className="flex flex-col">
            <select
              value={selectedStatus}
              onChange={(e) => updateQueryParam("status", e.target.value)}
              className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="">Todos los Estados</option>
              <option value="AGENDADA">Agendada</option>
              <option value="CONFIRMADA">Confirmada</option>
              <option value="EN_ATENCION">En Atención</option>
              <option value="REALIZADA">Realizada / Atendida</option>
              <option value="CANCELADA">Cancelada</option>
              <option value="NO_ASISTIO">No Asistió</option>
              <option value="REAGENDADA">Reagendada</option>
            </select>
          </div>

          {/* Botón de reset de filtros */}
          {(selectedProfessional || selectedBox || selectedStatus) && (
            <button
              type="button"
              onClick={() => {
                const params = new URLSearchParams();
                if (currentView) params.set("view", currentView);
                router.push(`${pathname}?${params.toString()}`);
              }}
              className="text-xs font-semibold text-red-600 hover:text-red-800 hover:underline"
            >
              Limpiar filtros
            </button>
          )}
        </div>
      </div>

      {/* CONTENEDOR DE CITA Y VISTAS DEL CALENDARIO */}
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-800 capitalize">
            Agenda - Vista {currentView}
          </h2>
          <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
            {filteredAppointments.length} cita(s) encontrada(s)
          </span>
        </div>

        {/* VISTA DIARIA */}
        {currentView === "diaria" && (
          <div className="space-y-3">
            {filteredAppointments.length === 0 ? (
              <p className="py-8 text-center text-sm text-slate-500">
                No hay citas programadas que coincidan con los filtros seleccionados.
              </p>
            ) : (
              filteredAppointments.map((app) => (
                <div
                  key={app.id}
                  className="flex items-center justify-between rounded-lg border border-slate-100 bg-slate-50 p-4 transition-all hover:bg-slate-100/80"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-sm font-bold text-blue-600">
                        {new Date(app.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                      <span className="text-sm font-semibold text-slate-800">
                        {app.patient?.fullName || `${app.patient?.firstName || ''} ${app.patient?.lastName || ''}`}
                      </span>
                    </div>
                    <div className="mt-1 flex items-center gap-4 text-xs text-slate-500">
                      <span>Dr(a). {app.professional?.name || "Sin asignar"}</span>
                      <span>•</span>
                      <span>{app.box?.name || "Sin Box"}</span>
                    </div>
                  </div>
                  <span className="rounded-full bg-slate-200 px-2.5 py-1 text-xs font-semibold text-slate-700">
                    {app.status}
                  </span>
                </div>
              ))
            )}
          </div>
        )}

        {/* VISTA SEMANAL */}
        {currentView === "semanal" && (
          <div className="py-8 text-center text-slate-500">
            <p className="text-sm">Grilla de vista semanal activada ({filteredAppointments.length} citas cargadas).</p>
          </div>
        )}

        {/* VISTA MENSUAL */}
        {currentView === "mensual" && (
          <div className="py-8 text-center text-slate-500">
            <p className="text-sm">Grilla de vista mensual activada ({filteredAppointments.length} citas cargadas).</p>
          </div>
        )}
      </div>
    </div>
  );
}