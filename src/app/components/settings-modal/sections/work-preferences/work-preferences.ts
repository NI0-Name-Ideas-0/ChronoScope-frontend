import { Component, ChangeDetectionStrategy, signal, computed, HostListener, Output, EventEmitter, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Auth } from 'services/auth';
import { AccountResponse } from 'api/models';
import { getAccountDisplayName } from 'services/account.utils';

/** Type of time slot: work for an organization or a break */
type TimeSlotType = 'organization' | 'break';

/** Represents a scheduled block of time in the week calendar */
export interface TimeSlot {
  id: string;
  dayIndex: number;
  startHour: number;
  durationHours: number;
  type: TimeSlotType;
  label: string;
  colorClass: string;
  accountId: number; // Reference to the associated account
}

/** Represents an organization derived from a user account */
interface Organization {
  id: string;
  name: string;
  colorClass: string;
  accountId: number;
}

/** Snapshot of the work schedule state used for cancel/reset functionality */
interface SavedWorkState {
  hoursPerDay: number;
  workDays: boolean[];
  slots: TimeSlot[];
}

/** Default daily work hours */
const DEFAULT_HOURS_PER_DAY = 8;

/** DaisyUI color pool for accounts (assigned cyclically) */
const COLOR_POOL = ['primary', 'secondary', 'accent', 'info', 'success', 'warning'] as const;

/** Default empty slots - calendar starts completely empty */
const DEFAULT_SLOTS: TimeSlot[] = [];

@Component({
  selector: 'app-settings-work-preferences',
  standalone: true,
  imports: [CommonModule, FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: `work-preferences.html`,
  styleUrl: `work-preferences.css`
})
export class WorkPreferencesSection implements OnInit {
  /** Emits the final slot array when the user clicks Save */
  @Output() saved = new EventEmitter<TimeSlot[]>();
  /** Emits when the user clicks Cancel to discard changes */
  @Output() cancelled = new EventEmitter<void>();

  /** Injected auth service to retrieve user accounts */
  private auth = inject(Auth);

  // --- Settings ---

  /** Number of hours available for work per day */
  hoursPerDay = signal(DEFAULT_HOURS_PER_DAY);
  /** Which days of the week are work days (Mon-Sun) */
  workDays = signal<boolean[]>([true, true, true, true, true, false, false]);

  // --- Data ---

  /** Organizations derived from the user's accounts; loaded from Auth service */
  organizations = signal<Organization[]>([]);
  /** All scheduled time slots across the week */
  slots = signal<TimeSlot[]>([]);

  /** Snapshot of state used for cancel/reset functionality */
  private savedState: SavedWorkState = {
    hoursPerDay: DEFAULT_HOURS_PER_DAY,
    workDays: [true, true, true, true, true, false, false],
    slots: [],
  };

  // --- Drag & Resize State ---

  /** Which day column currently has a drag hover highlight */
  dragOverDay = signal<number | null>(null);
  /** Payload when dragging from the sidebar (new slot creation) */
  private dragPayload: { type: TimeSlotType; org: Organization } | null = null;
  /** ID of an existing slot being moved */
  private draggedSlotId: string | null = null;

  /** Slot currently being resized via mouse drag */
  private resizingSlot: TimeSlot | null = null;
  /** Y-coordinate where resize started */
  private resizeStartY = 0;
  /** Duration of the slot when resize started */
  private resizeStartDuration = 0;

  // --- Time / Calendar Constants ---

  /** Hour labels from 0 to 23 for the time column */
  hours = Array.from({ length: 24 }, (_, i) => i);
  /** Short day names for the calendar header */
  dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  /** Day metadata for the calendar grid */
  weekDays = Array.from({ length: 7 }, (_, i) => ({ index: i, short: this.dayNames[i] }));

  // --- Computed Values ---

  /** Count of days marked as work days */
  activeWorkDayCount = computed(() => this.workDays().filter(Boolean).length);
  
  /** Total available hours in the week (hours per day × work days) */
  availableHours = computed(() => this.hoursPerDay() * this.activeWorkDayCount());

  /** Sum of all organization slot durations (breaks excluded) */
  totalPlannedHours = computed(() => 
    this.slots().reduce((sum, s) => sum + (s.type === 'organization' ? s.durationHours : 0), 0)
  );

  /** True if planned hours exceed available hours */
  isOverbooked = computed(() => this.totalPlannedHours() > this.availableHours());

  /** Validation message shown below the stats: overbooked, near limit, or null */
  validationMessage = computed(() => {
    const total = this.totalPlannedHours();
    const avail = this.availableHours();
    if (total > avail) return `Overbooked by ${(total - avail).toFixed(1)}h`;
    if (total > avail * 0.9) return 'Near limit';
    return null;
  });

  /** Lifecycle hook: load accounts when component initializes */
  ngOnInit(): void {
    this.loadOrganizationsFromAccounts();
  }

  /** Loads accounts from Auth service and maps them to organizations */
  private loadOrganizationsFromAccounts(): void {
    const accounts = this.auth.getAccounts();
    
    if (accounts.length === 0) {
      // Auth not ready yet, subscribe to accounts observable for later load
      const sub = this.auth.accounts$.subscribe(accs => {
        if (accs.length > 0) {
          this.mapAccountsToOrganizations(accs);
          sub.unsubscribe();
        }
      });
      return;
    }

    this.mapAccountsToOrganizations(accounts);
  }

  /** Maps AccountResponse array to internal Organization array with assigned colors */
  private mapAccountsToOrganizations(accounts: AccountResponse[]): void {
    const orgs: Organization[] = accounts.map((acc, index) => ({
      id: acc.id?.toString() ?? index.toString(),
      name: getAccountDisplayName(acc), // Uses shared utility for consistent naming
      colorClass: COLOR_POOL[index % COLOR_POOL.length],
      accountId: acc.id ?? 0,
    }));

    this.organizations.set(orgs);
  }

  /** Toggles a day between work day and off day; removes all slots when switching to off */
  toggleWorkDay(index: number): void {
    this.workDays.update(days => {
      const next = [...days];
      next[index] = !next[index];
      if (!next[index]) {
        // Day switched to off: remove all slots for this day
        this.slots.update(slots => slots.filter(s => s.dayIndex !== index));
      }
      return next;
    });
  }

  /** Returns all slots for a specific day, sorted by start time */
  getSlotsForDay(dayIndex: number): TimeSlot[] {
    return this.slots()
      .filter(s => s.dayIndex === dayIndex)
      .sort((a, b) => a.startHour - b.startHour);
  }

  /** Helper: returns sorted day slots (same as getSlotsForDay) */
  private getSortedDaySlots(dayIndex: number): TimeSlot[] {
    return this.getSlotsForDay(dayIndex);
  }

  /** Calculates total organization hours scheduled for a specific day */
  getDayHours(dayIndex: number): number {
    return this.slots()
      .filter(s => s.dayIndex === dayIndex && s.type === 'organization')
      .reduce((sum, s) => sum + s.durationHours, 0);
  }

  /** Returns the appropriate DaisyUI text color class for a day's hour display */
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

  /** Formats a decimal hour (e.g. 9.5) to HH:MM string */
  formatTime(hour: number): string {
    const h = Math.floor(hour);
    const m = Math.round((hour - h) * 60);
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
  }

  /** Restores the last saved state; used by Cancel button */
  private restoreSavedState(): void {
    this.hoursPerDay.set(this.savedState.hoursPerDay);
    this.workDays.set([...this.savedState.workDays]);
    this.slots.set(JSON.parse(JSON.stringify(this.savedState.slots)));
  }

  /** Stores current state as the new baseline for future cancel/reset operations */
  private storeCurrentState(): void {
    this.savedState = {
      hoursPerDay: this.hoursPerDay(),
      workDays: [...this.workDays()],
      slots: JSON.parse(JSON.stringify(this.slots())),
    };
  }

  /** Cancel button handler: restore saved state and emit cancelled event */
  onCancel(): void {
    this.restoreSavedState();
    this.cancelled.emit();
  }

  /** Save button handler: store current state as new baseline and emit saved event */
  onSave(): void {
    this.storeCurrentState();
    this.saved.emit(this.slots());
  }

  // --- Collision Detection ---

  /**
   * Checks if a new or moved slot would overlap with existing slots on the same day
   * @param dayIndex Target day
   * @param startHour Proposed start time
   * @param durationHours Proposed duration
   * @param excludeId Optional slot ID to exclude (for moving existing slots)
   * @returns true if a collision exists
   */
  private hasCollision(dayIndex: number, startHour: number, durationHours: number, excludeId?: string): boolean {
    const endHour = startHour + durationHours;
    return this.slots().some(s => {
      if (s.dayIndex !== dayIndex) return false;
      if (excludeId && s.id === excludeId) return false;
      const sEnd = s.startHour + s.durationHours;
      // Overlap check: two intervals overlap if start < otherEnd AND end > otherStart
      return startHour < sEnd && endHour > s.startHour;
    });
  }

  // --- Native HTML5 Drag & Drop ---

  /** Initiated when user starts dragging an organization or break from the sidebar */
  onSidebarDragStart(event: DragEvent, type: TimeSlotType, org: Organization) {
    this.dragPayload = { type, org };
    this.draggedSlotId = null;
    event.dataTransfer!.effectAllowed = 'copy';
    event.dataTransfer!.setData('text/plain', 'sidebar');
  }

  /** Initiated when user starts dragging an existing slot to move it */
  onSlotDragStart(event: DragEvent, slot: TimeSlot) {
    this.draggedSlotId = slot.id;
    this.dragPayload = null;
    event.dataTransfer!.effectAllowed = 'move';
    event.dataTransfer!.setData('text/plain', 'slot:' + slot.id);
  }

  /** Allows dropping on a day column if it's a work day */
  onDayDragOver(event: DragEvent, dayIndex: number) {
    if (!this.workDays()[dayIndex]) return;
    event.preventDefault();
    this.dragOverDay.set(dayIndex);
  }

  /** Removes drop highlight when drag leaves the day column boundaries */
  onDayDragLeave(event: DragEvent) {
    const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
    const x = event.clientX;
    const y = event.clientY;
    if (x < rect.left || x > rect.right || y < rect.top || y > rect.bottom) {
      this.dragOverDay.set(null);
    }
  }

  /** Required to allow dropping on the grid container */
  onGridDragOver(event: DragEvent) {
    event.preventDefault();
  }

  /**
   * Handles drop events on the calendar grid
   * Calculates day and time from mouse position, then creates or moves the slot
   */
  onGridDrop(event: DragEvent) {
    event.preventDefault();
    this.dragOverDay.set(null);

    const gridEl = event.currentTarget as HTMLElement;
    const rect = gridEl.getBoundingClientRect();
    const scrollTop = gridEl.scrollTop;
    
    const rawX = event.clientX - rect.left;
    const rawY = event.clientY - rect.top + scrollTop;
    
    // Subtract time column width (60px) to get x position within day columns
    const x = rawX - 60;
    if (x < 0) return;
    
    const dayWidth = (rect.width - 60) / 7;
    const dayIndex = Math.floor(x / dayWidth);
    if (dayIndex < 0 || dayIndex > 6 || !this.workDays()[dayIndex]) return;

    // Snap to 30-minute grid (60px = 1 hour)
    const rawHour = rawY / 60;
    const snappedHour = Math.round(rawHour * 2) / 2;
    const startHour = Math.max(0, Math.min(23.5, snappedHour));

    if (this.draggedSlotId) {
      // Moving existing slot
      const existing = this.slots().find(s => s.id === this.draggedSlotId);
      if (existing && !this.hasCollision(dayIndex, startHour, existing.durationHours, this.draggedSlotId)) {
        this.slots.update(slots => 
          slots.map(s => s.id === this.draggedSlotId ? { ...s, dayIndex, startHour } : s)
        );
      }
      this.draggedSlotId = null;
    } else if (this.dragPayload) {
      // Creating new slot from sidebar drag
      const finalDuration = 0.5; // 30 minutes default for all new drops
      
      if (!this.hasCollision(dayIndex, startHour, finalDuration)) {
        const newSlot: TimeSlot = {
          id: Date.now().toString() + Math.random().toString(36).substr(2, 5),
          dayIndex,
          startHour,
          durationHours: finalDuration,
          type: this.dragPayload.type,
          label: this.dragPayload.org.name,
          colorClass: this.dragPayload.org.colorClass,
          accountId: this.dragPayload.org.accountId,
        };
        this.slots.update(slots => [...slots, newSlot]);
      }
      this.dragPayload = null;
    }
  }

  // --- Mouse Resize Handling ---

  /** Initiated when user grabs the resize handle at the bottom of a slot */
  onResizeStart(event: MouseEvent, slot: TimeSlot) {
    event.preventDefault();
    event.stopPropagation();
    this.resizingSlot = slot;
    this.resizeStartY = event.clientY;
    this.resizeStartDuration = slot.durationHours;
    document.body.style.cursor = 'ns-resize';
    document.body.style.userSelect = 'none';
  }

  /** Handles mouse movement during resize; updates slot duration in real-time */
  @HostListener('document:mousemove', ['$event'])
  onResizeMove(event: MouseEvent) {
    if (!this.resizingSlot) return;
    const deltaPixels = event.clientY - this.resizeStartY;
    const deltaHours = deltaPixels / 60;
    // Snap to 30-minute increments
    const newDuration = Math.max(0.5, Math.round((this.resizeStartDuration + deltaHours) * 2) / 2);
    
    // Only apply if no collision would occur
    if (!this.hasCollision(this.resizingSlot.dayIndex, this.resizingSlot.startHour, newDuration, this.resizingSlot.id)) {
      this.slots.update(slots => 
        slots.map(s => s.id === this.resizingSlot!.id ? { ...s, durationHours: newDuration } : s)
      );
    }
  }

  /** Cleans up after resize ends */
  @HostListener('document:mouseup')
  onResizeEnd() {
    if (this.resizingSlot) {
      this.resizingSlot = null;
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    }
  }

  // --- Slot Management ---

  /** Removes a slot from the schedule */
  removeSlot(slot: TimeSlot) {
    this.slots.update(slots => slots.filter(s => s.id !== slot.id));
  }
}