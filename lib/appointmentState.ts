export type AppointmentStatus =
  | "AGENDADA"
  | "CONFIRMADA"
  | "EN_ATENCION"
  | "REALIZADA"
  | "CANCELADA"
  | "NO_ASISTIO"
  | "REAGENDADA";

// Definición estricta de transiciones según especificación
const ALLOWED_TRANSITIONS: Record<AppointmentStatus, AppointmentStatus[]> = {
  AGENDADA: ["CONFIRMADA", "REAGENDADA", "CANCELADA", "NO_ASISTIO"],
  CONFIRMADA: ["EN_ATENCION", "REAGENDADA", "CANCELADA", "NO_ASISTIO"],
  EN_ATENCION: ["REALIZADA"], // Pasa únicamente a Realizada/Atendida
  REALIZADA: [], // Estado final
  CANCELADA: [], // Estado final
  NO_ASISTIO: [], // Estado final
  REAGENDADA: [], // Estado final
};

export function canTransitionTo(current: string, next: string): boolean {
  const allowed = ALLOWED_TRANSITIONS[current as AppointmentStatus];
  return allowed ? allowed.includes(next as AppointmentStatus) : false;
}