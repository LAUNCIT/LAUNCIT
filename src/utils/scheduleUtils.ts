import {
  Appointment,
  BlockedSlot,
  DayName,
  Professional,
  WorkingDayConfig,
} from '../types';

export function formatCOP(amount: number): string {
  return `$${amount.toLocaleString('es-CO')} COP`;
}

export function parseTimeToMinutes(timeStr: string): number {
  const clean = timeStr.trim().toUpperCase();
  const match = clean.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/);
  if (!match) return 0;
  let hours = parseInt(match[1], 10);
  const minutes = parseInt(match[2], 10);
  const period = match[3];

  if (period === 'PM' && hours !== 12) {
    hours += 12;
  } else if (period === 'AM' && hours === 12) {
    hours = 0;
  }
  return hours * 60 + minutes;
}

export interface SlotAvailability {
  available: boolean;
  reason?: 'closed_day' | 'outside_hours' | 'blocked' | 'booked';
  shortLabel?: string;
  detail?: string;
}

export function evaluateSlotAvailability(params: {
  dayName: DayName;
  dateKey: string;
  timeStr: string;
  proId: string; // 'any' or specific proId
  workingDays: Record<DayName, WorkingDayConfig>;
  blockedSlots: BlockedSlot[];
  appointments: Appointment[];
  professionals: Professional[];
}): SlotAvailability {
  const {
    dayName,
    dateKey,
    timeStr,
    proId,
    workingDays,
    blockedSlots,
    appointments,
    professionals,
  } = params;

  const dayConfig = workingDays[dayName];
  if (!dayConfig || !dayConfig.isOpen) {
    return {
      available: false,
      reason: 'closed_day',
      shortLabel: 'Cerrado',
      detail: `${dayName} configurado como día cerrado`,
    };
  }

  const slotMin = parseTimeToMinutes(timeStr);
  const openMin = parseTimeToMinutes(dayConfig.openTime);
  const closeMin = parseTimeToMinutes(dayConfig.closeTime);

  if (slotMin < openMin || slotMin >= closeMin) {
    return {
      available: false,
      reason: 'outside_hours',
      shortLabel: 'Cerrado',
      detail: `Horario de atención: ${dayConfig.openTime} a ${dayConfig.closeTime}`,
    };
  }

  // Check active blocks for this day
  const dayBlocks = blockedSlots.filter((b) => b.day === dayName);

  // Check if entire establishment is blocked at this hour
  const globalBlock = dayBlocks.find((b) => {
    if (b.proId !== 'all') return false;
    const startMin = parseTimeToMinutes(b.startTime);
    const endMin = parseTimeToMinutes(b.endTime);
    return slotMin >= startMin && slotMin < endMin;
  });

  if (globalBlock) {
    return {
      available: false,
      reason: 'blocked',
      shortLabel: 'Bloqueado',
      detail: `${globalBlock.startTime}–${globalBlock.endTime}: ${globalBlock.reason}`,
    };
  }

  const activePros = professionals.filter((p) => p.status !== 'Descanso');

  if (proId === 'any') {
    if (activePros.length === 0) {
      return {
        available: false,
        reason: 'blocked',
        shortLabel: 'Sin cupo',
        detail: 'No hay especialistas disponibles en este turno',
      };
    }

    const anyProFree = activePros.some((pro) => {
      const proBlocked = dayBlocks.some((b) => {
        if (b.proId !== pro.id) return false;
        const startMin = parseTimeToMinutes(b.startTime);
        const endMin = parseTimeToMinutes(b.endTime);
        return slotMin >= startMin && slotMin < endMin;
      });
      if (proBlocked) return false;

      const proBooked = appointments.some(
        (a) =>
          a.status !== 'Cancelada' &&
          a.dateKey === dateKey &&
          a.time === timeStr &&
          a.proId === pro.id
      );
      return !proBooked;
    });

    if (!anyProFree) {
      return {
        available: false,
        reason: 'booked',
        shortLabel: 'Ocupado',
        detail: 'Todos los especialistas tienen reserva o bloqueo en este horario',
      };
    }

    return { available: true };
  }

  // Specific professional selected
  const proBlock = dayBlocks.find((b) => {
    if (b.proId !== proId) return false;
    const startMin = parseTimeToMinutes(b.startTime);
    const endMin = parseTimeToMinutes(b.endTime);
    return slotMin >= startMin && slotMin < endMin;
  });

  if (proBlock) {
    return {
      available: false,
      reason: 'blocked',
      shortLabel: 'Bloqueado',
      detail: `${proBlock.proName}: ${proBlock.reason}`,
    };
  }

  const existingAppt = appointments.find(
    (a) =>
      a.status !== 'Cancelada' &&
      a.dateKey === dateKey &&
      a.time === timeStr &&
      (a.proId === proId || a.proId === 'any')
  );

  if (existingAppt) {
    return {
      available: false,
      reason: 'booked',
      shortLabel: 'Ocupado',
      detail: 'Horario ya reservado por otro cliente',
    };
  }

  return { available: true };
}
