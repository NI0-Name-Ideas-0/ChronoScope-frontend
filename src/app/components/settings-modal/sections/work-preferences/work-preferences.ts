import { Component, ChangeDetectionStrategy, signal, computed, inject, AfterViewInit, ViewChild, ElementRef, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { output } from '@angular/core';
import { Auth } from '@services/auth';
import { Organization } from 'api/models';
import { WorkSlotPreferenceService } from '@services/work-slot-preference.service';
import { TimeSlot, COLOR_POOL } from '@app/model/work-preference.model';

/** View-model for organizations shown in the sidebar */
interface OrgItem {
  id: string;
  name: string;
  colorClass: string;
}

/** Snapshot of the work schedule state used for cancel/reset functionality */
interface SavedWorkState {
  hoursPerDay: number;
  workDays: boolean[];
  slots: TimeSlot[];
}

/** Default daily work hours */
const DEFAULT_HOURS_PER_DAY = 8;
const MIN_SLOT_DURATION = 0.5;
const DEFAULT_SLOT_DURATION = 1;
const HOURS_PER_DAY = 24;
const ROW_HEIGHT = 50;
const DEFAULT_SCROLL_HOUR = 6;

@Component({
  selector: 'app-settings-work-preferences',
  imports: [CommonModule, FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: 'work-preferences.html',
  styleUrl: 'work-preferences.css',
  host: {
    '(document:mousemove)': 'onResizeMove($event)',
    '(document:mouseup)': 'onResizeEnd()',
  },
})
export class WorkPreferencesSection implements AfterViewInit {
  /** Emits the final slot array when the user clicks Save */
  saved = output<TimeSlot[]>();
  /** Emits when the user clicks Cancel to discard changes */
  cancelled = output<void>();

  /** Hour to scroll to on initialization (0-23). Defaults to 6 (6:00 AM). */
  scrollHour = input(DEFAULT_SCROLL_HOUR);

  /** Injected auth service to retrieve user organizations */
  private auth = inject(Auth);
  /** Service to persist/retrieve work slots via the backend API */
  private preferenceService = inject(WorkSlotPreferenceService);

  // --- Settings ---

  /** Number of hours available for work per day */
  hoursPerDay = signal(DEFAULT_HOURS_PER_DAY);
  /** Which days of the week are work days (Mon-Sun) */
  workDays = signal<boolean[]>([true, true, true, true, true, false, false]);

  // --- Data ---

  /** Organizations derived from the user's identity; loaded from Auth service */
  organizations = signal<OrgItem[]>([]);
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
  private dragPayload: OrgItem | null = null;
  /** ID of an existing slot being moved */
  private draggedSlotId: string | null = null;
  /** Hours from the slot's top edge where the drag was initiated; used to preserve grab position on drop */
  private dragSlotOffsetHours = 0;

  /** Slot currently being resized via mouse drag */
  private resizingSlot: TimeSlot | null = null;

  // --- Time / Calendar Constants ---

  /** Hour labels from 0 to 23 for the time column */
  hours = Array.from({ length: 24 }, (_, i) => i);
  /** Short day names for the calendar header */
  dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  /** Day metadata for the calendar grid */
  weekDays = Array.from({ length: 7 }, (_, i) => ({ index: i, short: this.dayNames[i] }));

  /** Reference to the 6:00 hour row element for scrolling into view */
  @ViewChild('calendarBody') calendarBody!: ElementRef<HTMLElement>;

  // --- Computed Values ---

  /** Count of days marked as work days */
  activeWorkDayCount = computed(() => this.workDays().filter(Boolean).length);

  /** Total available hours in the week (hours per day × work days) */
  availableHours = computed(() => this.hoursPerDay() * this.activeWorkDayCount());

  /** Sum of all slot durations */
  totalPlannedHours = computed(() =>
    this.slots().reduce((sum, s) => sum + s.durationHours, 0)
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

  constructor() {
    this.loadOrganizations();
  }

  /** Lifecycle hook: scroll to configured hour after view is initialized */
  ngAfterViewInit(): void {
    // Use setTimeout to ensure the view is fully rendered before scrolling
    setTimeout(() => {
      const targetHour = this.scrollHour();
      const scrollTop = targetHour * ROW_HEIGHT;
      this.calendarBody?.nativeElement.scrollTo({ top: scrollTop, behavior: 'instant' });
    }, 0);
  }

  /** Loads previously saved work slot preferences from the backend */
  private async loadSlotsFromBackend(): Promise<void> {
    try {
      const slots = await this.preferenceService.loadPreferences();
      if (slots.length > 0) {
        this.slots.set(slots);
      }

      const settings = await this.preferenceService.loadWorkSettings();
      if (settings) {
        this.hoursPerDay.set(settings.hoursPerDay);
        this.workDays.set([...settings.workDays]);
      }

      this.savedState = {
        hoursPerDay: this.hoursPerDay(),
        workDays: [...this.workDays()],
        slots: JSON.parse(JSON.stringify(this.slots())),
      };
    } catch (err) {
      console.error('Failed to load work slot preferences:', err);
    }
  }

  /** Loads organizations from Auth service and maps them to sidebar items */
  private loadOrganizations(): void {
    const orgs = (this.auth.getIdentityData()?.organizations ?? [])
      .filter((o): o is Organization & { id: string; name: string } => !!o.id && !!o.name)
      .map((o, i) => ({
        id: o.id,
        name: o.name,
        colorClass: COLOR_POOL[i % COLOR_POOL.length],
      }));
    this.organizations.set(orgs);
    this.loadSlotsFromBackend();
  }

  /** Toggles a day between work day and off day; removes all slots when switching to off */
  toggleWorkDay(index: number): void {
    this.workDays.update((days) => {
      const next = [...days];
      next[index] = !next[index];
      if (!next[index]) {
        // Day switched to off: remove all slots for this day
        this.slots.update((slots) => slots.filter((s) => s.dayIndex !== index));
      }
      return next;
    });
  }

  /** Returns all slots for a specific day, sorted by start time */
  getSlotsForDay(dayIndex: number): TimeSlot[] {
    return this.slots()
      .filter((s) => s.dayIndex === dayIndex)
      .sort((a, b) => a.startHour - b.startHour);
  }

  /** Calculates total hours scheduled for a specific day */
  getDayHours(dayIndex: number): number {
    return this.slots()
      .filter((s) => s.dayIndex === dayIndex)
      .reduce((sum, s) => sum + s.durationHours, 0);
  }

  /** Returns the full class string for a day's hour display (includes layout classes) */
  getDayColor(dayIndex: number): string {
    const base = 'block text-xs font-bold mt-1 ';
    if (!this.workDays()[dayIndex]) {
      const hours = this.getDayHours(dayIndex);
      return base + (hours > 0 ? 'text-error' : 'text-base-content/30');
    }
    const hours = this.getDayHours(dayIndex);
    const limit = this.hoursPerDay();
    if (hours > limit) return base + 'text-error';
    if (hours > limit * 0.9) return base + 'text-warning';
    return base + 'text-success';
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

  /** Save button handler: persist slots to backend, store baseline and emit saved event */
  async onSave(): Promise<void> {
    try {
      await this.preferenceService.savePreferences(this.slots(), this.hoursPerDay(), this.workDays());
      this.storeCurrentState();
      this.saved.emit(this.slots());
    } catch (err) {
      console.error('Failed to save work slot preferences:', err);
    }
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
    if (startHour < 0 || durationHours < MIN_SLOT_DURATION || endHour > HOURS_PER_DAY) return true;
    return this.slots().some((s) => {
      if (s.dayIndex !== dayIndex) return false;
      if (excludeId && s.id === excludeId) return false;
      const sEnd = s.startHour + s.durationHours;
      // Overlap check: two intervals overlap if start < otherEnd AND end > otherStart
      return startHour < sEnd && endHour > s.startHour;
    });
  }

  // --- Native HTML5 Drag & Drop ---

  /** Initiated when user starts dragging an organization from the sidebar */
  onSidebarDragStart(event: DragEvent, org: OrgItem) {
    this.dragPayload = org;
    this.draggedSlotId = null;
    event.dataTransfer!.effectAllowed = 'copy';
    event.dataTransfer!.setData('text/plain', 'sidebar');
  }

  /** Initiated when user starts dragging an existing slot to move it */
  onSlotDragStart(event: DragEvent, slot: TimeSlot) {
    // Record how far down from the slot's top edge the user grabbed, in hours.
    // This offset is subtracted at drop time so the slot top lands where the grab was.
    const slotEl = event.currentTarget as HTMLElement;
    this.dragSlotOffsetHours = (event.clientY - slotEl.getBoundingClientRect().top) / ROW_HEIGHT;
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
    const timeColumnWidth = 60;
    const x = rawX - timeColumnWidth;
    if (x < 0) return;

    // Use clientWidth to exclude the reserved scrollbar gutter from the column width calculation
    const dayWidth = (gridEl.clientWidth - timeColumnWidth) / 7;
    const dayIndex = Math.floor(x / dayWidth);
    if (dayIndex < 0 || dayIndex > 6 || !this.workDays()[dayIndex]) return;

    // Convert pixel Y to hour using ROW_HEIGHT, then snap to 30-minute grid
    const rawHour = rawY / ROW_HEIGHT;
    const snappedHour = Math.round(rawHour * 2) / 2;
    const startHour = Math.max(0, Math.min(HOURS_PER_DAY - MIN_SLOT_DURATION, snappedHour));

    if (this.draggedSlotId) {
      // Moving existing slot: subtract the grab offset so the top of the slot aligns
      // with where the user originally grabbed it, not where the mouse cursor is.
      const existing = this.slots().find((s) => s.id === this.draggedSlotId);
      if (existing) {
        const adjustedRawHour = rawHour - this.dragSlotOffsetHours;
        const snappedStart = Math.round(adjustedRawHour * 2) / 2;
        // Clamp so the slot stays fully within [0, 24] using its actual duration
        const clampedStart = Math.max(0, Math.min(HOURS_PER_DAY - existing.durationHours, snappedStart));
        if (!this.hasCollision(dayIndex, clampedStart, existing.durationHours, this.draggedSlotId)) {
          this.slots.update((slots) =>
            slots.map((s) => (s.id === this.draggedSlotId ? { ...s, dayIndex, startHour: clampedStart } : s))
          );
        }
      }
      this.draggedSlotId = null;
    } else if (this.dragPayload) {
      // Creating new slot from sidebar drag
      const finalDuration = DEFAULT_SLOT_DURATION;

      if (!this.hasCollision(dayIndex, startHour, finalDuration)) {
        const newSlot: TimeSlot = {
          id: Date.now().toString() + Math.random().toString(36).substring(2, 5),
          dayIndex,
          startHour,
          durationHours: finalDuration,
          type: 'organization',
          label: this.dragPayload.name,
          colorClass: this.dragPayload.colorClass,
          organizationId: this.dragPayload.id,
        };
        this.slots.update((slots) => [...slots, newSlot]);
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
    document.body.style.cursor = 'ns-resize';
    document.body.style.userSelect = 'none';
  }

  /** Handles mouse movement during resize; updates slot duration in real-time */
  onResizeMove(event: MouseEvent) {
    if (!this.resizingSlot) return;

    // Compute the end hour from the absolute mouse position within the scrollable calendar body
    const calBody = this.calendarBody.nativeElement;
    const rect = calBody.getBoundingClientRect();
    const absoluteY = event.clientY - rect.top + calBody.scrollTop;
    const rawEndHour = absoluteY / ROW_HEIGHT;

    // Snap to 30-minute increments and clamp to valid range
    const snappedEndHour = Math.round(rawEndHour * 2) / 2;
    const clampedEndHour = Math.max(
      this.resizingSlot.startHour + MIN_SLOT_DURATION,
      Math.min(HOURS_PER_DAY, snappedEndHour)
    );
    const newDuration = clampedEndHour - this.resizingSlot.startHour;

    // Only apply if no collision would occur
    if (!this.hasCollision(this.resizingSlot.dayIndex, this.resizingSlot.startHour, newDuration, this.resizingSlot.id)) {
      this.slots.update((slots) =>
        slots.map((s) => (s.id === this.resizingSlot!.id ? { ...s, durationHours: newDuration } : s))
      );
    }
  }

  /** Cleans up after resize ends */
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
    this.slots.update((slots) => slots.filter((s) => s.id !== slot.id));
  }
}
