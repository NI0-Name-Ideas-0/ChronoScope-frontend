import { Component, ChangeDetectionStrategy, signal, computed, HostListener, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

type TimeSlotType = 'organization' | 'break';

export interface TimeSlot {
  id: string;
  dayIndex: number;
  startHour: number;
  durationHours: number;
  type: TimeSlotType;
  label: string;
  colorClass: string;
}

interface Organization {
  id: string;
  name: string;
  colorClass: string;
}

interface SavedWorkState {
  hoursPerDay: number;
  workDays: boolean[];
  slots: TimeSlot[];
}

const DEFAULT_HOURS_PER_DAY = 8;

const DEFAULT_ORGANIZATIONS: Organization[] = [
  { id: '1', name: 'Moonshot AI', colorClass: 'primary' },
  { id: '2', name: 'Freelance', colorClass: 'secondary' },
  { id: '3', name: 'Open Source', colorClass: 'accent' },
  { id: '4', name: 'Meeting', colorClass: 'info' },
];

const DEFAULT_SLOTS: TimeSlot[] = [
  { id: '1', dayIndex: 0, startHour: 9, durationHours: 3.5, type: 'organization', label: 'Moonshot AI', colorClass: 'primary' },
  { id: '2', dayIndex: 0, startHour: 13, durationHours: 2.5, type: 'organization', label: 'Freelance', colorClass: 'secondary' },
  { id: '3', dayIndex: 2, startHour: 9, durationHours: 4, type: 'organization', label: 'Moonshot AI', colorClass: 'primary' },
  { id: '4', dayIndex: 2, startHour: 13.5, durationHours: 1.5, type: 'organization', label: 'Meeting', colorClass: 'info' },
  { id: '5', dayIndex: 0, startHour: 12.5, durationHours: 0.5, type: 'break', label: 'Break', colorClass: 'neutral' },
  { id: '6', dayIndex: 2, startHour: 13, durationHours: 0.5, type: 'break', label: 'Break', colorClass: 'neutral' },
];

@Component({
  selector: 'app-settings-work-preferences',
  standalone: true,
  imports: [CommonModule, FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: `work-preferences.html`,
  styleUrl: `work-preferences.css`
})
export class WorkPreferencesSection {
  @Output() saved = new EventEmitter<TimeSlot[]>();
  @Output() cancelled = new EventEmitter<void>();

  // Settings
  hoursPerDay = signal(DEFAULT_HOURS_PER_DAY);
  workDays = signal<boolean[]>([true, true, true, true, true, false, false]);

  // Data
  organizations = signal<Organization[]>([...DEFAULT_ORGANIZATIONS]);
  slots = signal<TimeSlot[]>([...DEFAULT_SLOTS]);

  // Saved state for cancel/reset
  private savedState: SavedWorkState = {
    hoursPerDay: DEFAULT_HOURS_PER_DAY,
    workDays: [true, true, true, true, true, false, false],
    slots: JSON.parse(JSON.stringify(DEFAULT_SLOTS)),
  };

  // Drag & Resize State
  dragOverDay = signal<number | null>(null);
  private dragPayload: { type: TimeSlotType; org: Organization | { name: string; colorClass: string } } | null = null;
  private draggedSlotId: string | null = null;

  private resizingSlot: TimeSlot | null = null;
  private resizeStartY = 0;
  private resizeStartDuration = 0;

  // Time
  hours = Array.from({ length: 24 }, (_, i) => i);
  dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  weekDays = Array.from({ length: 7 }, (_, i) => ({ index: i, short: this.dayNames[i] }));

  // Computed
  activeWorkDayCount = computed(() => this.workDays().filter(Boolean).length);
  
  availableHours = computed(() => this.hoursPerDay() * this.activeWorkDayCount());

  totalPlannedHours = computed(() => 
    this.slots().reduce((sum, s) => sum + (s.type === 'organization' ? s.durationHours : 0), 0)
  );

  isOverbooked = computed(() => this.totalPlannedHours() > this.availableHours());

  validationMessage = computed(() => {
    const total = this.totalPlannedHours();
    const avail = this.availableHours();
    if (total > avail) return `Overbooked by ${(total - avail).toFixed(1)}h`;
    if (total > avail * 0.9) return 'Near limit';
    return null;
  });

  toggleWorkDay(index: number): void {
    this.workDays.update(days => {
      const next = [...days];
      next[index] = !next[index];
      if (!next[index]) {
        this.slots.update(slots => slots.filter(s => s.dayIndex !== index));
      }
      return next;
    });
  }

  getSlotsForDay(dayIndex: number): TimeSlot[] {
    return this.slots()
      .filter(s => s.dayIndex === dayIndex)
      .sort((a, b) => a.startHour - b.startHour);
  }

  private getSortedDaySlots(dayIndex: number): TimeSlot[] {
    return this.getSlotsForDay(dayIndex);
  }

  getDayHours(dayIndex: number): number {
    return this.slots()
      .filter(s => s.dayIndex === dayIndex && s.type === 'organization')
      .reduce((sum, s) => sum + s.durationHours, 0);
  }

  getDayColor(dayIndex: number): string {
    if (!this.workDays()[dayIndex]) {
      const hours = this.getDayHours(dayIndex);
      return hours > 0 ? 'text-error' : 'text-base-content/30';
    }
    const hours = this.getDayHours(dayIndex);
    const limit = this.hoursPerDay();
    if (hours > limit) return 'text-error';
    if (hours > limit * 0.9) return 'text-warning';
    return 'text-success';
  }

  formatTime(hour: number): string {
    const h = Math.floor(hour);
    const m = Math.round((hour - h) * 60);
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
  }

  /** Restores the last saved state (used by Cancel) */
  private restoreSavedState(): void {
    this.hoursPerDay.set(this.savedState.hoursPerDay);
    this.workDays.set([...this.savedState.workDays]);
    this.slots.set(JSON.parse(JSON.stringify(this.savedState.slots)));
  }

  /** Stores the current state as the new baseline for future resets */
  private storeCurrentState(): void {
    this.savedState = {
      hoursPerDay: this.hoursPerDay(),
      workDays: [...this.workDays()],
      slots: JSON.parse(JSON.stringify(this.slots())),
    };
  }

  onCancel(): void {
    this.restoreSavedState();
    this.cancelled.emit();
  }

  onSave(): void {
    this.storeCurrentState();
    this.saved.emit(this.slots());
  }

  // --- Collision Detection ---

  private hasCollision(dayIndex: number, startHour: number, durationHours: number, excludeId?: string): boolean {
    const endHour = startHour + durationHours;
    return this.slots().some(s => {
      if (s.dayIndex !== dayIndex) return false;
      if (excludeId && s.id === excludeId) return false;
      const sEnd = s.startHour + s.durationHours;
      return startHour < sEnd && endHour > s.startHour;
    });
  }

  // --- Native Drag & Drop ---

  onSidebarDragStart(event: DragEvent, type: TimeSlotType, org: Organization | { name: string; colorClass: string }) {
    this.dragPayload = { type, org };
    this.draggedSlotId = null;
    event.dataTransfer!.effectAllowed = 'copy';
    event.dataTransfer!.setData('text/plain', 'sidebar');
  }

  onSlotDragStart(event: DragEvent, slot: TimeSlot) {
    this.draggedSlotId = slot.id;
    this.dragPayload = null;
    event.dataTransfer!.effectAllowed = 'move';
    event.dataTransfer!.setData('text/plain', 'slot:' + slot.id);
  }

  onDayDragOver(event: DragEvent, dayIndex: number) {
    if (!this.workDays()[dayIndex]) return;
    event.preventDefault();
    this.dragOverDay.set(dayIndex);
  }

  onDayDragLeave(event: DragEvent) {
    const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
    const x = event.clientX;
    const y = event.clientY;
    if (x < rect.left || x > rect.right || y < rect.top || y > rect.bottom) {
      this.dragOverDay.set(null);
    }
  }

  onGridDragOver(event: DragEvent) {
    event.preventDefault();
  }

  onGridDrop(event: DragEvent) {
    event.preventDefault();
    this.dragOverDay.set(null);

    const gridEl = event.currentTarget as HTMLElement;
    const rect = gridEl.getBoundingClientRect();
    const scrollTop = gridEl.scrollTop;
    
    const rawX = event.clientX - rect.left;
    const rawY = event.clientY - rect.top + scrollTop;
    
    const x = rawX - 60;
    if (x < 0) return;
    
    const dayWidth = (rect.width - 60) / 7;
    const dayIndex = Math.floor(x / dayWidth);
    if (dayIndex < 0 || dayIndex > 6 || !this.workDays()[dayIndex]) return;

    const rawHour = rawY / 60;
    const snappedHour = Math.round(rawHour * 2) / 2;
    const startHour = Math.max(0, Math.min(23.5, snappedHour));

    if (this.draggedSlotId) {
      const existing = this.slots().find(s => s.id === this.draggedSlotId);
      if (existing && !this.hasCollision(dayIndex, startHour, existing.durationHours, this.draggedSlotId)) {
        this.slots.update(slots => 
          slots.map(s => s.id === this.draggedSlotId ? { ...s, dayIndex, startHour } : s)
        );
      }
      this.draggedSlotId = null;
    } else if (this.dragPayload) {
      const finalDuration = 0.5; // 30 minutes default for all new drops
      
      if (!this.hasCollision(dayIndex, startHour, finalDuration)) {
        const newSlot: TimeSlot = {
          id: Date.now().toString() + Math.random().toString(36).substr(2, 5),
          dayIndex,
          startHour,
          durationHours: finalDuration,
          type: this.dragPayload.type,
          label: this.dragPayload.org.name,
          colorClass: this.dragPayload.org.colorClass
        };
        this.slots.update(slots => [...slots, newSlot]);
      }
      this.dragPayload = null;
    }
  }

  // --- Mouse Resize ---

  onResizeStart(event: MouseEvent, slot: TimeSlot) {
    event.preventDefault();
    event.stopPropagation();
    this.resizingSlot = slot;
    this.resizeStartY = event.clientY;
    this.resizeStartDuration = slot.durationHours;
    document.body.style.cursor = 'ns-resize';
    document.body.style.userSelect = 'none';
  }

  @HostListener('document:mousemove', ['$event'])
  onResizeMove(event: MouseEvent) {
    if (!this.resizingSlot) return;
    const deltaPixels = event.clientY - this.resizeStartY;
    const deltaHours = deltaPixels / 60;
    const newDuration = Math.max(0.5, Math.round((this.resizeStartDuration + deltaHours) * 2) / 2);
    
    if (!this.hasCollision(this.resizingSlot.dayIndex, this.resizingSlot.startHour, newDuration, this.resizingSlot.id)) {
      this.slots.update(slots => 
        slots.map(s => s.id === this.resizingSlot!.id ? { ...s, durationHours: newDuration } : s)
      );
    }
  }

  @HostListener('document:mouseup')
  onResizeEnd() {
    if (this.resizingSlot) {
      this.resizingSlot = null;
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    }
  }

  // --- Slot Management ---

  removeSlot(slot: TimeSlot) {
    this.slots.update(slots => slots.filter(s => s.id !== slot.id));
  }
}