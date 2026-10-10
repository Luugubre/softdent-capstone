import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { AppointmentModal } from "@/components/AppointmentModal";
import { AppointmentDetailsModal } from "@/components/AppointmentDetailsModal";
import { ScheduleBlockModal } from "@/components/ScheduleBlockModal";
import Link from "next/link";

function formatDateForURL(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function generateTimeBlocks() {
  const blocks = [];
  let currentHour = 9;
  let currentMinute = 0;

  while (currentHour <= 18) {
    blocks.push(
      `${currentHour.toString().padStart(2, "0")}:${currentMinute.toString().padStart(2, "0")}`
    );
    currentMinute += 15;
    if (currentMinute >= 60) {
      currentMinute = 0;
      currentHour += 1;
    }
  }
  return blocks;
}

export default async function AgendaPage({
  searchParams,
}: {
  searchParams: Promise<{
    date?: string;
    view?: string;
    professionalId?: string;
    boxId?: string;
    status?: string;
  }>;
}) {
  const { date, view = "diaria", professionalId, boxId, status } = await searchParams;

  const selectedDate = date ? new Date(date + "T00:00:00") : new Date();
  selectedDate.setHours(0, 0, 0, 0);

  const tomorrow = new Date(selectedDate);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const prevDay = new Date(selectedDate);
  prevDay.setDate(prevDay.getDate() - 1);

  const nextDay = new Date(selectedDate);
  nextDay.setDate(nextDay.getDate() + 1);

  // Construcción dinámicamente tipada para el filtro where de Prisma
  const whereClause: Prisma.AppointmentWhereInput = {};

  if (view === "diaria") {
    whereClause.date = { gte: selectedDate, lt: tomorrow };
  } else if (view === "semanal") {
    const endOfWeek = new Date(selectedDate);
    endOfWeek.setDate(endOfWeek.getDate() + 7);
    whereClause.date = { gte: selectedDate, lt: endOfWeek };
  } else if (view === "mensual") {
    const endOfMonth = new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 1);
    whereClause.date = { gte: selectedDate, lt: endOfMonth };
  }

  if (professionalId) {
    whereClause.OR = [
      { professionalId: professionalId },
      { dentistId: professionalId },
    ];
  }

  if (boxId) {
    whereClause.boxId = boxId;
  }

  if (status) {
    whereClause.status = status;
  }

  const [rawAppointments, patients, professionals, boxes, procedures, scheduleBlocks] = await Promise.all([
    prisma.appointment.findMany({
      where: whereClause,
      select: {
        id: true,
        date: true,
        patientId: true,
        professionalId: true,
        boxId: true,
        status: true,
      },
      orderBy: { date: "asc" },
    }),
    prisma.patient.findMany({
      where: { active: true },
      select: { id: true, firstName: true, lastName: true, rut: true },
      orderBy: { lastName: "asc" },
    }),
    prisma.professional.findMany({
      where: { active: true },
      select: { id: true, firstName: true, lastName: true },
      orderBy: { firstName: "asc" },
    }),
    prisma.box.findMany({
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
    prisma.procedure.findMany({
      select: { id: true, name: true, durationMin: true },
      orderBy: { name: "asc" },
    }),
    prisma.scheduleBlock.findMany({
      where: {
        startDate: { lt: tomorrow },
        endDate: { gt: selectedDate },
      },
      orderBy: { startDate: "asc" },
    }),
  ]);

  const appointments = rawAppointments.map((appt) => {
    const patient = patients.find((p) => p.id === appt.patientId);
    return {
      ...appt,
      patientName: patient ? `${patient.firstName} ${patient.lastName}` : "Paciente registrado",
      durationMin: 30,
    };
  });

  const dentistsOptions = professionals.map((p) => ({
    id: p.id,
    name: `${p.firstName} ${p.lastName}`,
  }));

  const timeBlocks = generateTimeBlocks();
  const isToday = formatDateForURL(selectedDate) === formatDateForURL(new Date());

  // Helper para preservar filtros en los enlaces de navegación
  const getFilterURL = (newParams: Record<string, string | undefined>) => {
    const current = new URLSearchParams();
    if (date) current.set("date", date);
    if (view) current.set("view", view);
    if (professionalId) current.set("professionalId", professionalId);
    if (boxId) current.set("boxId", boxId);
    if (status) current.set("status", status);

    Object.entries(newParams).forEach(([k, v]) => {
      if (v) current.set(k, v);
      else current.delete(k);
    });

    return `/agenda?${current.toString()}`;
  };

  return (
    <main className="min-h-screen bg-slate-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* CABECERA PRINCIPAL Y BARRA DE FILTROS SUPERIOR */}
        <div className="flex flex-col gap-6 bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 w-full">
            <div className="flex items-center gap-4">
              <h1 className="text-3xl font-black text-slate-800 tracking-tight">Agenda Dental</h1>
              
              {/* BOTÓN DE BLOQUEO DE AGENDA */}
              <ScheduleBlockModal
                professionals={dentistsOptions}
                boxes={boxes}
                defaultDate={selectedDate}
              />
            </div>

            {/* Navegación por fechas */}
            <div className="flex items-center gap-3 bg-slate-50 p-2 rounded-2xl border border-slate-200 shrink-0">
              <Link
                href={getFilterURL({ date: formatDateForURL(prevDay) })}
                className="px-4 py-2 hover:bg-white hover:shadow-sm rounded-xl transition-all text-slate-600 font-bold text-sm"
              >
                ← Anterior
              </Link>

              <div className="flex flex-col items-center min-w-[180px]">
                <span className="text-sm font-bold text-slate-700 capitalize">
                  {selectedDate.toLocaleDateString("es-CL", {
                    weekday: "long",
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </span>
                {isToday ? (
                  <span className="text-[10px] bg-blue-100 text-blue-700 font-black uppercase px-2 py-0.5 rounded-full mt-1">
                    Hoy
                  </span>
                ) : (
                  <Link href={getFilterURL({ date: undefined })} className="text-[10px] text-blue-600 hover:underline font-bold mt-1">
                    Volver a Hoy
                  </Link>
                )}
              </div>

              <Link
                href={getFilterURL({ date: formatDateForURL(nextDay) })}
                className="px-4 py-2 hover:bg-white hover:shadow-sm rounded-xl transition-all text-slate-600 font-bold text-sm"
              >
                Siguiente →
              </Link>
            </div>
          </div>

          {/* BARRA DE HERRAMIENTAS: SELECTOR DE VISTAS Y FILTROS */}
          <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4 pt-4 border-t border-slate-100">
            
            {/* 1. Selector de Vistas */}
            <div className="flex items-center bg-slate-100 p-1 rounded-xl self-start">
              <Link
                href={getFilterURL({ view: "diaria" })}
                className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                  view === "diaria"
                    ? "bg-white text-blue-600 shadow-sm"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Diaria
              </Link>
              <Link
                href={getFilterURL({ view: "semanal" })}
                className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                  view === "semanal"
                    ? "bg-white text-blue-600 shadow-sm"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Semanal
              </Link>
              <Link
                href={getFilterURL({ view: "mensual" })}
                className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                  view === "mensual"
                    ? "bg-white text-blue-600 shadow-sm"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Mensual
              </Link>
            </div>

            {/* 2. Filtros Activos (Profesional, Box y Estado) */}
            <form className="flex flex-wrap items-center gap-3">
              <select
                name="professionalId"
                defaultValue={professionalId || ""}
                className="bg-slate-50 border border-slate-200 text-slate-700 text-xs rounded-xl p-2.5 font-medium outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Todos los Profesionales</option>
                {dentistsOptions.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>

              <select
                name="boxId"
                defaultValue={boxId || ""}
                className="bg-slate-50 border border-slate-200 text-slate-700 text-xs rounded-xl p-2.5 font-medium outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Todos los Boxes</option>
                {boxes.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>

              <select
                name="status"
                defaultValue={status || ""}
                className="bg-slate-50 border border-slate-200 text-slate-700 text-xs rounded-xl p-2.5 font-medium outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Todos los Estados</option>
                <option value="AGENDADA">Agendada</option>
                <option value="CONFIRMADA">Confirmada</option>
                <option value="EN_ATENCION">En Atención</option>
                <option value="REALIZADA">Realizada</option>
                <option value="CANCELADA">Cancelada</option>
                <option value="NO_ASISTIO">No Asistió</option>
                <option value="REAGENDADA">Reagendada</option>
              </select>

              <button
                type="submit"
                className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition-all shadow-sm"
              >
                Filtrar
              </button>

              {(professionalId || boxId || status) && (
                <Link
                  href={getFilterURL({
                    professionalId: undefined,
                    boxId: undefined,
                    status: undefined,
                  })}
                  className="text-xs text-rose-600 font-bold hover:underline px-2"
                >
                  Limpiar
                </Link>
              )}
            </form>
          </div>
        </div>

        {/* GRILLA Y VISTAS DE LA AGENDA */}
        <div className="bg-white shadow-sm rounded-2xl overflow-hidden border border-slate-200">
          
          {/* VISTA DIARIA (GRILLA HORARIA INTERACTIVA CON BLOQUEOS) */}
          {view === "diaria" && (
            <div className="grid grid-cols-1 divide-y divide-slate-100">
              {timeBlocks.map((time) => {
                const [blockHour, blockMin] = time.split(":").map(Number);
                const blockTime = new Date(selectedDate);
                blockTime.setHours(blockHour, blockMin, 0, 0);

                const activeBlock = scheduleBlocks.find((block) => {
                  const start = new Date(block.startDate);
                  const end = new Date(block.endDate);
                  return blockTime >= start && blockTime < end;
                });

                const overlappingAppt = appointments.find((appt) => {
                  const start = new Date(appt.date);
                  const duration = appt.durationMin;
                  const end = new Date(start.getTime() + duration * 60000);
                  return blockTime >= start && blockTime < end;
                });

                const isStartOfAppt =
                  overlappingAppt &&
                  new Date(overlappingAppt.date).getTime() === blockTime.getTime();

                return (
                  <div key={time} className="flex hover:bg-slate-50/80 transition-colors h-14">
                    <div className="w-28 px-4 font-semibold text-xs text-slate-500 border-r border-slate-100 flex items-center justify-center bg-slate-50/50 shrink-0">
                      {time}
                    </div>

                    <div className="flex-1 p-1">
                      {activeBlock ? (
                        <div className="h-full bg-slate-100 border-l-4 border-slate-600 px-4 flex items-center justify-between rounded-md">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-black text-slate-800 uppercase tracking-wider">
                              🚫 BLOQUEADO ({activeBlock.type})
                            </span>
                            <span className="text-xs text-slate-600 font-medium">
                              - {activeBlock.reason}
                            </span>
                          </div>
                        </div>
                      ) : overlappingAppt ? (
                        <div
                          className={`h-full flex items-center px-4 transition-all rounded-md ${
                            ["CANCELADA", "NO_ASISTIO"].includes(overlappingAppt.status)
                              ? "bg-rose-50 border-x-4 border-rose-500 opacity-70"
                              : "bg-blue-50 border-x-4 border-blue-500 hover:bg-blue-100/70"
                          } ${isStartOfAppt ? "pt-1" : ""}`}
                        >
                          {isStartOfAppt && (
                            <AppointmentDetailsModal
                              appointment={{
                                id: overlappingAppt.id,
                                date: overlappingAppt.date,
                                status: overlappingAppt.status,
                                patientName: overlappingAppt.patientName,
                                patientId: overlappingAppt.patientId,
                                durationMin: overlappingAppt.durationMin,
                              }}
                            />
                          )}
                        </div>
                      ) : (
                        <div className="h-full">
                          <AppointmentModal
                            timeBlock={time}
                            date={selectedDate}
                            patients={patients}
                            dentists={dentistsOptions}
                            boxes={boxes}
                            procedures={procedures}
                          />
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* VISTAS SEMANAL Y MENSUAL */}
          {["semanal", "mensual"].includes(view) && (
            <div className="p-8">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-base font-bold text-slate-800 capitalize">
                  Resumen - Vista {view} ({appointments.length} cita(s))
                </h3>
              </div>

              {appointments.length === 0 ? (
                <div className="text-center py-12 text-slate-400 font-medium text-sm">
                  No existen citas agendadas para el rango de fechas y filtros seleccionados.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {appointments.map((appt) => (
                    <div
                      key={appt.id}
                      className="p-4 rounded-xl border border-slate-200 bg-slate-50 hover:bg-white hover:shadow-md transition-all space-y-3"
                    >
                      <div className="text-xs font-bold text-blue-600 font-mono">
                        {new Date(appt.date).toLocaleDateString("es-CL", {
                          day: "2-digit",
                          month: "short",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </div>
                      
                      <AppointmentDetailsModal
                        appointment={{
                          id: appt.id,
                          date: appt.date,
                          status: appt.status,
                          patientName: appt.patientName,
                          patientId: appt.patientId,
                          durationMin: appt.durationMin,
                        }}
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

        </div>
      </div>
    </main>
  );
}