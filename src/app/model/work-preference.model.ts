/** Type of time slot: work for an organization or a break */
export type TimeSlotType = 'organization' | 'break';

/** Represents a scheduled block of time in the week calendar */
export interface TimeSlot {
  id: string;
  dayIndex: number;
  startHour: number;
  durationHours: number;
  type: TimeSlotType;
  label: string;
  colorClass: string;
  organizationId: string; // Reference to the associated organization
}

/** DaisyUI color pool for accounts (assigned cyclically) */
export const COLOR_POOL = ['primary', 'secondary', 'accent', 'info', 'success', 'warning'] as const;
