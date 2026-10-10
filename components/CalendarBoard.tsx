"use client"

import { useState, useEffect, useCallback } from "react"
import { format, addDays, subDays, isSameDay } from "date-fns"
import { es } from "date-fns/locale"
import { updateAppointmentStatus } from "@/lib/appointmentActions"
import { useRouter } from "next/navigation"

// Definición de tipos
interface Patient { id: string; firstName: string; lastName: string; rut: string; }
interface Dentist { id: string; name: string; }
interface Appointment {
  id: string;
  date: Date;
  duration: number;
  status: string;
  notes?: string | null;
  patient: Patient;
  dentist: Dentist;
}

export function CalendarBoard({ dentists }: { dentists: Dentist[] }) {
  const router = useRouter();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(false);

  // Horario de atención clínica (09:00 a 19:00, bloques de 30 min)
  const hours = Array.from({ length: 21 }, (_, i) => {
    const hour = Math.floor(i / 2) + 9;
    const minutes = i % 2 === 0 ? "00" : "30";
    return `${hour.toString().padStart(2, '0')}:${minutes}`;
  });

  const loadAppointmentsOfDay = useCallback(async (date: Date) => {
    setLoading(true);
    try {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const day = String(date.getDate()).padStart(2, "0");
      const dateStr = `${year}-${month}-${day}`;

      const res = await fetch(`/api/appointments?date=${dateStr}`);
      if (res.ok) {
        const data = await res.json();
        setAppointments(data as Appointment[]);
      }
    } catch (err: unknown) {
      console.error("Error al cargar las citas:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;

    const fetchData = async () => {
      setLoading(true);
      try {
        const year = currentDate.getFullYear();
        const month = String(currentDate.getMonth() + 1).padStart(2, "0");
        const day = String(currentDate.getDate()).padStart(2, "0");
        const dateStr = `${year}-${month}-${day}`;

        const res = await fetch(`/api/appointments?date=${dateStr}`);
        if (isMounted && res.ok) {
          const data = await res.json();
          setAppointments(data as Appointment[]);
        }
      } catch (err: unknown) {
        console.error("Error al cargar las citas:", err);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchData();

    return () => {
      isMounted = false;
    };
  }, [currentDate]);

  const handleStatusChange = async (id: string, newStatus: string) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result = await updateAppointmentStatus(id, newStatus as any);
    if (result.success) {
      loadAppointmentsOfDay(currentDate);
      router.refresh();
    } else {
      alert(result.error || "No se pudo actualizar el estado de la cita");
    }
  };

  // Funciones para calcular la posición en la grilla
  const getAppointmentStyle = (dateStr: Date | string, duration: number) => {
    const date = new Date(dateStr);
    const hoursOffset = date.getHours() - 9; // Inicio a las 09:00
    const minutesOffset = date.getMinutes() / 60;
    
    const topPosition = (hoursOffset + minutesOffset) * 80;
    const heightPx = (duration / 60) * 80;

    return {
      top: `${topPosition}px`,
      height: `${heightPx}px`,
      position: 'absolute' as const,
      left: '4px',
      right: '4px',
      zIndex: 10
    };
  };

  // Colores según estado
  const getStatusColor = (status: string) => {
    switch(status) {
      case 'AGENDADO': return 'bg-blue-100 border-blue-300 text-blue-800';
      case 'EN_ESPERA': return 'bg-yellow-100 border-yellow-400 text-yellow-800 shadow-md ring-2 ring-yellow-400 animate-pulse';
      case 'EN_BOX': return 'bg-emerald-100 border-emerald-400 text-emerald-800 shadow-inner';
      case 'ATENDIDO': return 'bg-gray-100 border-gray-300 text-gray-500 opacity-70';
      case 'NO_ASISTE': return 'bg-red-50 border-red-200 text-red-500 line-through';
      default: return 'bg-gray-100 border-gray-300 text-gray-800';
    }
  };

  return (
    <div className="bg-white rounded-3xl shadow-sm border border-gray-200 overflow-hidden flex flex-col h-[800px]">
      
      {/* Barra de Navegación de Fecha */}
      <div className="bg-slate-800 text-white p-4 flex justify-between items-center z-20 shadow-md relative">
        <button 
          onClick={() => setCurrentDate(subDays(currentDate, 1))}
          className="px-4 py-2 hover:bg-slate-700 rounded-lg font-bold transition-colors text-sm"
        >
          ← Día Anterior
        </button>
        
        <div className="text-center flex flex-col items-center">
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-black capitalize">
              {format(currentDate, "EEEE d 'de' MMMM, yyyy", { locale: es })}
            </h2>
            {loading && (
              <span className="text-xs text-blue-300 font-bold animate-pulse">
                (Actualizando...)
              </span>
            )}
          </div>
          {isSameDay(currentDate, new Date()) && (
            <span className="bg-blue-500 text-white text-[10px] uppercase font-black px-2 py-0.5 rounded-full mt-1">Hoy</span>
          )}
        </div>

        <button 
          onClick={() => setCurrentDate(addDays(currentDate, 1))}
          className="px-4 py-2 hover:bg-slate-700 rounded-lg font-bold transition-colors text-sm"
        >
          Día Siguiente →
        </button>
      </div>

      {/* Área de la Grilla (Scrollable) */}
      <div className="flex-1 overflow-auto bg-gray-50 relative">
        
        <div className="flex min-w-[800px]">
          
          {/* Columna de Horas */}
          <div className="w-20 flex-shrink-0 bg-white border-r border-gray-200 sticky left-0 z-20">
            <div className="h-14 border-b border-gray-200 bg-gray-50 flex items-center justify-center font-bold text-gray-400 text-xs">
              Hora
            </div>
            <div className="relative" style={{ height: `${21 * 40}px` }}>
              {hours.map((hour, i) => (
                <div key={hour} className="absolute w-full border-b border-gray-100 text-right pr-2 text-xs font-semibold text-gray-400" style={{ top: `${i * 40}px`, height: '40px' }}>
                  <span className="relative top-[-8px]">{hour}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Columnas de Dentistas */}
          {dentists.map((dentist) => {
            const dentistAppointments = appointments.filter(a => a.dentist?.id === dentist.id);

            return (
              <div key={dentist.id} className="flex-1 min-w-[250px] border-r border-gray-200 relative">
                <div className="h-14 border-b border-gray-200 bg-white sticky top-0 z-10 flex flex-col items-center justify-center">
                  <span className="font-bold text-gray-800 text-sm">Dr. {dentist.name}</span>
                  <span className="text-[10px] font-black text-gray-400 bg-gray-100 px-2 rounded-full mt-0.5">
                    {dentistAppointments.length} citas
                  </span>
                </div>

                <div className="relative" style={{ height: `${21 * 40}px` }}>
                  {hours.map((hour, i) => (
                    <div key={`${dentist.id}-${hour}`} className="absolute w-full border-b border-gray-100" style={{ top: `${i * 40}px`, height: '40px' }} />
                  ))}

                  {dentistAppointments.map(app => (
                    <div 
                      key={app.id} 
                      className={`absolute border-l-4 rounded-md p-2 overflow-hidden flex flex-col transition-all cursor-pointer hover:brightness-95 ${getStatusColor(app.status)}`}
                      style={getAppointmentStyle(app.date, app.duration)}
                    >
                      <div className="flex justify-between items-start mb-1">
                        <span className="font-bold text-sm truncate leading-tight">
                          {app.patient?.firstName} {app.patient?.lastName}
                        </span>
                        <span className="text-[10px] font-black opacity-70">
                          {format(new Date(app.date), 'HH:mm')}
                        </span>
                      </div>
                      
                      <div className="text-[10px] opacity-80 font-medium truncate mb-2">
                        RUT: {app.patient?.rut} {app.notes ? `• ${app.notes}` : ''}
                      </div>

                      {app.status !== 'ATENDIDO' && app.status !== 'NO_ASISTE' && (
                        <div className="mt-auto pt-1 border-t border-black/10 flex gap-1">
                          <select 
                            value={app.status}
                            onChange={(e) => handleStatusChange(app.id, e.target.value)}
                            className="text-[10px] font-bold bg-white/50 rounded outline-none w-full text-slate-900"
                          >
                            <option value="AGENDADO">Agendado</option>
                            <option value="EN_ESPERA">En Espera</option>
                            <option value="EN_BOX">En Box</option>
                            <option value="ATENDIDO">Atendido ✅</option>
                            <option value="NO_ASISTE">No Asiste ❌</option>
                          </select>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}

        </div>
      </div>
    </div>
  )
}