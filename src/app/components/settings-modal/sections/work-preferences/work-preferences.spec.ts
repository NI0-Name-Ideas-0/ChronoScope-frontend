import { ComponentFixture, TestBed } from '@angular/core/testing';
import { WorkPreferencesSection } from './work-preferences';
import { Auth } from '@services/auth';
import { WorkSlotPreferenceService } from '@services/work-slot-preference.service';
import { TaskService } from '@services/task.service';
import { TimeSlot } from '@app/model/work-preference.model';
import { getTranslocoTestingModule } from 'test-utils/transloco-testing';

describe('WorkPreferencesSection', () => {
  let component: WorkPreferencesSection;
  let fixture: ComponentFixture<WorkPreferencesSection>;
  let originalScrollTo: any;

  const mockAuth = {
    getIdentityData: vi.fn().mockReturnValue({
      organizations: [{ id: 'org-1', name: 'Chrono Labs' }],
    }),
  };

  const mockPreferenceService = {
    loadPreferences: vi.fn().mockResolvedValue([]),
    loadOrganizationColorMap: vi.fn().mockResolvedValue({}),
    loadWorkSettings: vi.fn().mockResolvedValue(null),
    savePreferences: vi.fn().mockResolvedValue(undefined),
  };

  const mockTaskService = {
    getTaskColorMix: vi.fn(() => null),
  };

  beforeAll(() => {
    originalScrollTo = HTMLElement.prototype.scrollTo;
    HTMLElement.prototype.scrollTo = vi.fn() as any;
  });

  afterAll(() => {
    HTMLElement.prototype.scrollTo = originalScrollTo;
  });

  beforeEach(async () => {
    TestBed.resetTestingModule();
    vi.clearAllMocks();

    mockAuth.getIdentityData.mockReturnValue({
      organizations: [{ id: 'org-1', name: 'Chrono Labs' }],
    });
    mockPreferenceService.loadPreferences.mockResolvedValue([]);
    mockPreferenceService.loadOrganizationColorMap.mockResolvedValue({});
    mockPreferenceService.loadWorkSettings.mockResolvedValue(null);

    await TestBed.configureTestingModule({
      imports: [WorkPreferencesSection, getTranslocoTestingModule()],
      providers: [
        { provide: Auth, useValue: mockAuth },
        { provide: WorkSlotPreferenceService, useValue: mockPreferenceService },
        { provide: TaskService, useValue: mockTaskService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(WorkPreferencesSection);
    component = fixture.componentInstance;
    fixture.detectChanges();
    if (component.calendarBody?.nativeElement) {
      component.calendarBody.nativeElement.scrollTo = vi.fn();
    }
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have correct default state', () => {
    expect(component.hoursPerDay()).toBe(8);
    expect(component.workDays()).toEqual([true, true, true, true, true, false, false]);
  });

  it('should toggle work day and remove slots for that day', () => {
    component.slots.set([
      {
        id: 's1',
        dayIndex: 0,
        startHour: 9,
        durationHours: 1,
        type: 'organization',
        label: 'A',
        colorClass: 'primary',
        organizationId: 'org-1',
      },
      {
        id: 's2',
        dayIndex: 1,
        startHour: 10,
        durationHours: 2,
        type: 'organization',
        label: 'B',
        colorClass: 'secondary',
        organizationId: 'org-1',
      },
    ]);

    component.toggleWorkDay(0);

    expect(component.workDays()[0]).toBe(false);
    expect(component.slots().some((s) => s.dayIndex === 0)).toBe(false);
    expect(component.slots().some((s) => s.dayIndex === 1)).toBe(true);
  });

  it('should call savePreferences and emit saved event', async () => {
    const savedSpy = vi.fn();
    component.saved.subscribe(savedSpy);

    const slots: TimeSlot[] = [
      {
        id: 's1',
        dayIndex: 0,
        startHour: 9,
        durationHours: 1,
        type: 'organization',
        label: 'A',
        colorClass: 'primary',
        organizationId: 'org-1',
      },
    ];
    component.slots.set(slots);

    await component.onSave();

    expect(mockPreferenceService.savePreferences).toHaveBeenCalledWith(slots, 8, [
      true,
      true,
      true,
      true,
      true,
      false,
      false,
    ]);
    expect(savedSpy).toHaveBeenCalledWith(slots);
  });

  it('should restore saved state and emit cancelled event', () => {
    const cancelledSpy = vi.fn();
    component.cancelled.subscribe(cancelledSpy);

    component.hoursPerDay.set(6);
    component.workDays.set([false, false, false, false, false, false, false]);
    component.slots.set([
      {
        id: 's1',
        dayIndex: 2,
        startHour: 9,
        durationHours: 1,
        type: 'organization',
        label: 'A',
        colorClass: 'primary',
        organizationId: 'org-1',
      },
    ]);

    component.onCancel();

    expect(component.hoursPerDay()).toBe(8);
    expect(component.workDays()).toEqual([true, true, true, true, true, false, false]);
    expect(component.slots()).toEqual([]);
    expect(cancelledSpy).toHaveBeenCalled();
  });

  it('should compute activeWorkDayCount, availableHours, totalPlannedHours, and isOverbooked', () => {
    expect(component.activeWorkDayCount()).toBe(5);
    expect(component.availableHours()).toBe(40);
    expect(component.totalPlannedHours()).toBe(0);
    expect(component.isOverbooked()).toBe(false);

    component.slots.set([
      {
        id: 's1',
        dayIndex: 0,
        startHour: 9,
        durationHours: 4,
        type: 'organization',
        label: 'A',
        colorClass: 'primary',
        organizationId: 'org-1',
      },
      {
        id: 's2',
        dayIndex: 1,
        startHour: 10,
        durationHours: 3,
        type: 'organization',
        label: 'B',
        colorClass: 'secondary',
        organizationId: 'org-1',
      },
    ]);

    expect(component.totalPlannedHours()).toBe(7);
    expect(component.isOverbooked()).toBe(false);

    component.slots.set([
      {
        id: 's1',
        dayIndex: 0,
        startHour: 9,
        durationHours: 10,
        type: 'organization',
        label: 'A',
        colorClass: 'primary',
        organizationId: 'org-1',
      },
      {
        id: 's2',
        dayIndex: 1,
        startHour: 10,
        durationHours: 10,
        type: 'organization',
        label: 'B',
        colorClass: 'secondary',
        organizationId: 'org-1',
      },
      {
        id: 's3',
        dayIndex: 2,
        startHour: 10,
        durationHours: 10,
        type: 'organization',
        label: 'C',
        colorClass: 'accent',
        organizationId: 'org-1',
      },
      {
        id: 's4',
        dayIndex: 3,
        startHour: 10,
        durationHours: 10,
        type: 'organization',
        label: 'D',
        colorClass: 'info',
        organizationId: 'org-1',
      },
      {
        id: 's5',
        dayIndex: 4,
        startHour: 10,
        durationHours: 10,
        type: 'organization',
        label: 'E',
        colorClass: 'success',
        organizationId: 'org-1',
      },
    ]);

    expect(component.totalPlannedHours()).toBe(50);
    expect(component.availableHours()).toBe(40);
    expect(component.isOverbooked()).toBe(true);
  });

  it('should return slots for a day sorted by startHour', () => {
    component.slots.set([
      {
        id: 's1',
        dayIndex: 0,
        startHour: 14,
        durationHours: 1,
        type: 'organization',
        label: 'A',
        colorClass: 'primary',
        organizationId: 'org-1',
      },
      {
        id: 's2',
        dayIndex: 0,
        startHour: 9,
        durationHours: 2,
        type: 'organization',
        label: 'B',
        colorClass: 'secondary',
        organizationId: 'org-1',
      },
      {
        id: 's3',
        dayIndex: 1,
        startHour: 10,
        durationHours: 1,
        type: 'organization',
        label: 'C',
        colorClass: 'accent',
        organizationId: 'org-1',
      },
    ]);

    const day0Slots = component.getSlotsForDay(0);
    expect(day0Slots.length).toBe(2);
    expect(day0Slots[0].id).toBe('s2');
    expect(day0Slots[1].id).toBe('s1');

    expect(component.getSlotsForDay(1).length).toBe(1);
    expect(component.getSlotsForDay(2).length).toBe(0);
  });

  it('should return sum of slot durations for a day', () => {
    component.slots.set([
      {
        id: 's1',
        dayIndex: 0,
        startHour: 9,
        durationHours: 2,
        type: 'organization',
        label: 'A',
        colorClass: 'primary',
        organizationId: 'org-1',
      },
      {
        id: 's2',
        dayIndex: 0,
        startHour: 14,
        durationHours: 1.5,
        type: 'organization',
        label: 'B',
        colorClass: 'secondary',
        organizationId: 'org-1',
      },
      {
        id: 's3',
        dayIndex: 1,
        startHour: 10,
        durationHours: 3,
        type: 'organization',
        label: 'C',
        colorClass: 'accent',
        organizationId: 'org-1',
      },
    ]);

    expect(component.getDayHours(0)).toBe(3.5);
    expect(component.getDayHours(1)).toBe(3);
    expect(component.getDayHours(2)).toBe(0);
  });

  it('should format decimal hours to HH:MM', () => {
    expect(component.formatTime(0)).toBe('00:00');
    expect(component.formatTime(9)).toBe('09:00');
    expect(component.formatTime(9.5)).toBe('09:30');
    expect(component.formatTime(23.75)).toBe('23:45');
    expect(component.formatTime(12.25)).toBe('12:15');
  });

  it('should remove a slot', () => {
    const slot1: TimeSlot = {
      id: 's1',
      dayIndex: 0,
      startHour: 9,
      durationHours: 1,
      type: 'organization',
      label: 'A',
      colorClass: 'primary',
      organizationId: 'org-1',
    };
    const slot2: TimeSlot = {
      id: 's2',
      dayIndex: 0,
      startHour: 10,
      durationHours: 2,
      type: 'organization',
      label: 'B',
      colorClass: 'secondary',
      organizationId: 'org-1',
    };

    component.slots.set([slot1, slot2]);
    component.removeSlot(slot1);

    expect(component.slots().length).toBe(1);
    expect(component.slots()[0].id).toBe('s2');
  });

  it('should load slots from backend on initialization', async () => {
    const backendSlots: TimeSlot[] = [
      {
        id: 's1',
        dayIndex: 0,
        startHour: 9,
        durationHours: 2,
        type: 'organization',
        label: 'Chrono Labs',
        colorClass: 'primary',
        organizationId: 'org-1',
      },
    ];

    mockPreferenceService.loadPreferences.mockResolvedValue(backendSlots);
    mockPreferenceService.loadOrganizationColorMap.mockResolvedValue({});

    TestBed.resetTestingModule();
    await TestBed.configureTestingModule({
      imports: [WorkPreferencesSection, getTranslocoTestingModule()],
      providers: [
        { provide: Auth, useValue: mockAuth },
        { provide: WorkSlotPreferenceService, useValue: mockPreferenceService },
        { provide: TaskService, useValue: mockTaskService },
      ],
    }).compileComponents();

    const newFixture = TestBed.createComponent(WorkPreferencesSection);
    const newComponent = newFixture.componentInstance;
    newFixture.detectChanges();
    if (newComponent.calendarBody?.nativeElement) {
      newComponent.calendarBody.nativeElement.scrollTo = vi.fn();
    }
    await newFixture.whenStable();
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(newComponent.slots()).toEqual(backendSlots);
  });

  // --- hasCollision boundary checks ---
  it('should return true for hasCollision boundary checks', () => {
    component.slots.set([
      {
        id: 's1',
        dayIndex: 0,
        startHour: 9,
        durationHours: 1,
        type: 'organization',
        label: 'A',
        colorClass: 'primary',
        organizationId: 'org-1',
      },
    ]);

    const hasCollision = (component as any).hasCollision.bind(component);

    expect(hasCollision(0, -1, 1)).toBe(true);
    expect(hasCollision(0, 9, 0.25)).toBe(true);
    expect(hasCollision(0, 23, 1.5)).toBe(true);
  });

  it('should exclude slot by id in hasCollision', () => {
    component.slots.set([
      {
        id: 's1',
        dayIndex: 0,
        startHour: 9,
        durationHours: 1,
        type: 'organization',
        label: 'A',
        colorClass: 'primary',
        organizationId: 'org-1',
      },
    ]);

    const hasCollision = (component as any).hasCollision.bind(component);

    expect(hasCollision(0, 9, 1)).toBe(true);
    expect(hasCollision(0, 9, 1, 's1')).toBe(false);
  });

  // --- Error handling ---
  it('should not throw when onSave fails', async () => {
    mockPreferenceService.savePreferences.mockRejectedValue(new Error('Save failed'));

    // Should not throw — error is silently caught, HTTP interceptor handles toasts
    await component.onSave();
  });

  it('should not throw when loading slots fails', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    mockPreferenceService.loadPreferences.mockRejectedValue(new Error('Load failed'));
    mockPreferenceService.loadOrganizationColorMap.mockResolvedValue({});

    TestBed.resetTestingModule();
    await TestBed.configureTestingModule({
      imports: [WorkPreferencesSection, getTranslocoTestingModule()],
      providers: [
        { provide: Auth, useValue: mockAuth },
        { provide: WorkSlotPreferenceService, useValue: mockPreferenceService },
        { provide: TaskService, useValue: mockTaskService },
      ],
    }).compileComponents();

    const newFixture = TestBed.createComponent(WorkPreferencesSection);
    const newComponent = newFixture.componentInstance;
    newFixture.detectChanges();
    if (newComponent.calendarBody?.nativeElement) {
      newComponent.calendarBody.nativeElement.scrollTo = vi.fn();
    }
    // Should not throw — error is silently caught, HTTP interceptor handles toasts
    await newFixture.whenStable();
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(consoleSpy).not.toHaveBeenCalled();
    consoleSpy.mockRestore();
  });

  // --- getDayColor ---
  it('should return correct day colors for all branches', () => {
    component.workDays.set([false, true, true, true, true, false, false]);

    // Off day with hours > 0
    component.slots.set([
      {
        id: 's1',
        dayIndex: 0,
        startHour: 9,
        durationHours: 1,
        type: 'organization',
        label: 'A',
        colorClass: 'primary',
        organizationId: 'org-1',
      },
    ]);
    expect(component.getDayColor(0)).toContain('text-error');

    // Off day with no hours
    component.slots.set([]);
    expect(component.getDayColor(0)).toContain('text-base-content/30');

    // Work day under limit
    component.workDays.set([true, true, true, true, true, false, false]);
    component.hoursPerDay.set(8);
    component.slots.set([
      {
        id: 's1',
        dayIndex: 0,
        startHour: 9,
        durationHours: 1,
        type: 'organization',
        label: 'A',
        colorClass: 'primary',
        organizationId: 'org-1',
      },
    ]);
    expect(component.getDayColor(0)).toContain('text-success');

    // Work day near limit (>90%)
    component.slots.set([
      {
        id: 's1',
        dayIndex: 0,
        startHour: 9,
        durationHours: 7.5,
        type: 'organization',
        label: 'A',
        colorClass: 'primary',
        organizationId: 'org-1',
      },
    ]);
    expect(component.getDayColor(0)).toContain('text-warning');

    // Work day over limit (>100%)
    component.slots.set([
      {
        id: 's1',
        dayIndex: 0,
        startHour: 9,
        durationHours: 10,
        type: 'organization',
        label: 'A',
        colorClass: 'primary',
        organizationId: 'org-1',
      },
    ]);
    expect(component.getDayColor(0)).toContain('text-error');
  });

  // --- validationMessage ---
  it('should compute validationMessage correctly', () => {
    component.hoursPerDay.set(8);
    component.workDays.set([true, true, true, true, true, false, false]);

    // Null case
    expect(component.validationMessage()).toBeNull();

    // Near limit
    component.slots.set([
      {
        id: 's1',
        dayIndex: 0,
        startHour: 9,
        durationHours: 8,
        type: 'organization',
        label: 'A',
        colorClass: 'primary',
        organizationId: 'org-1',
      },
      {
        id: 's2',
        dayIndex: 1,
        startHour: 9,
        durationHours: 8,
        type: 'organization',
        label: 'B',
        colorClass: 'secondary',
        organizationId: 'org-1',
      },
      {
        id: 's3',
        dayIndex: 2,
        startHour: 9,
        durationHours: 8,
        type: 'organization',
        label: 'C',
        colorClass: 'accent',
        organizationId: 'org-1',
      },
      {
        id: 's4',
        dayIndex: 3,
        startHour: 9,
        durationHours: 8,
        type: 'organization',
        label: 'D',
        colorClass: 'info',
        organizationId: 'org-1',
      },
      {
        id: 's5',
        dayIndex: 4,
        startHour: 9,
        durationHours: 5,
        type: 'organization',
        label: 'E',
        colorClass: 'success',
        organizationId: 'org-1',
      },
    ]);
    expect(component.validationMessage()).toBe('Near limit');

    // Overbooked
    component.slots.set([
      {
        id: 's1',
        dayIndex: 0,
        startHour: 9,
        durationHours: 10,
        type: 'organization',
        label: 'A',
        colorClass: 'primary',
        organizationId: 'org-1',
      },
      {
        id: 's2',
        dayIndex: 1,
        startHour: 9,
        durationHours: 10,
        type: 'organization',
        label: 'B',
        colorClass: 'secondary',
        organizationId: 'org-1',
      },
      {
        id: 's3',
        dayIndex: 2,
        startHour: 9,
        durationHours: 10,
        type: 'organization',
        label: 'C',
        colorClass: 'accent',
        organizationId: 'org-1',
      },
      {
        id: 's4',
        dayIndex: 3,
        startHour: 9,
        durationHours: 10,
        type: 'organization',
        label: 'D',
        colorClass: 'info',
        organizationId: 'org-1',
      },
      {
        id: 's5',
        dayIndex: 4,
        startHour: 9,
        durationHours: 10,
        type: 'organization',
        label: 'E',
        colorClass: 'success',
        organizationId: 'org-1',
      },
    ]);
    expect(component.validationMessage()).toBe('Overbooked by 10.0h');
  });

  // --- Drag & Drop ---
  it('should move existing slot on grid drop', () => {
    const existingSlot: TimeSlot = {
      id: 's1',
      dayIndex: 0,
      startHour: 9,
      durationHours: 1,
      type: 'organization',
      label: 'A',
      colorClass: 'primary',
      organizationId: 'org-1',
    };
    component.slots.set([existingSlot]);
    component.workDays.set([true, true, true, true, true, false, false]);

    const slotEl = document.createElement('div');
    slotEl.getBoundingClientRect = () => ({
      top: 450,
      left: 60,
      right: 123,
      bottom: 500,
      width: 63,
      height: 50,
      x: 60,
      y: 450,
      toJSON: () => ({}),
    });
    const dragStartEvent = {
      clientX: 60,
      clientY: 450,
      currentTarget: slotEl,
      dataTransfer: { effectAllowed: '', setData: vi.fn() },
    } as unknown as DragEvent;
    component.onSlotDragStart(dragStartEvent, existingSlot);

    const gridEl = document.createElement('div');
    Object.defineProperty(gridEl, 'clientWidth', { value: 500, writable: true });
    Object.defineProperty(gridEl, 'scrollTop', { value: 0, writable: true });
    gridEl.getBoundingClientRect = () => ({
      left: 0,
      top: 0,
      right: 500,
      bottom: 1200,
      width: 500,
      height: 1200,
      x: 0,
      y: 0,
      toJSON: () => ({}),
    });

    const dropEvent = {
      preventDefault: vi.fn(),
      clientX: 90,
      clientY: 500,
      currentTarget: gridEl,
    } as unknown as DragEvent;

    component.onGridDrop(dropEvent);

    const movedSlot = component.slots().find((s) => s.id === 's1');
    expect(movedSlot?.startHour).toBe(10);
  });

  it('should create new slot on grid drop from sidebar', () => {
    component.workDays.set([true, true, true, true, true, false, false]);
    component.slots.set([]);

    const orgItem = { id: 'org-1', name: 'Chrono Labs', colorClass: 'primary' };
    const sidebarDragEvent = {
      dataTransfer: { effectAllowed: '', setData: vi.fn() },
    } as unknown as DragEvent;
    component.onSidebarDragStart(sidebarDragEvent, orgItem);

    const gridEl = document.createElement('div');
    Object.defineProperty(gridEl, 'clientWidth', { value: 500, writable: true });
    Object.defineProperty(gridEl, 'scrollTop', { value: 0, writable: true });
    gridEl.getBoundingClientRect = () => ({
      left: 0,
      top: 0,
      right: 500,
      bottom: 1200,
      width: 500,
      height: 1200,
      x: 0,
      y: 0,
      toJSON: () => ({}),
    });

    const dropEvent = {
      preventDefault: vi.fn(),
      clientX: 160,
      clientY: 450,
      currentTarget: gridEl,
    } as unknown as DragEvent;

    component.onGridDrop(dropEvent);

    expect(component.slots().length).toBe(1);
    const newSlot = component.slots()[0];
    expect(newSlot.dayIndex).toBe(1);
    expect(newSlot.startHour).toBe(9);
    expect(newSlot.label).toBe('Chrono Labs');
    expect(newSlot.organizationId).toBe('org-1');
  });

  it('should handle day drag over and drag leave', () => {
    component.workDays.set([true, false, true, true, true, false, false]);

    const dragOverEvent = { preventDefault: vi.fn() } as unknown as DragEvent;

    component.onDayDragOver(dragOverEvent, 0);
    expect(component.dragOverDay()).toBe(0);

    component.onDayDragOver(dragOverEvent, 1);
    expect(component.dragOverDay()).toBe(0);

    const dayEl = document.createElement('div');
    dayEl.getBoundingClientRect = () => ({
      left: 0,
      top: 0,
      right: 100,
      bottom: 100,
      width: 100,
      height: 100,
      x: 0,
      y: 0,
      toJSON: () => ({}),
    });
    const dragLeaveEvent = {
      clientX: 150,
      clientY: 50,
      currentTarget: dayEl,
    } as unknown as DragEvent;

    component.dragOverDay.set(2);
    component.onDayDragLeave(dragLeaveEvent);
    expect(component.dragOverDay()).toBeNull();

    const dragLeaveInside = {
      clientX: 50,
      clientY: 50,
      currentTarget: dayEl,
    } as unknown as DragEvent;

    component.dragOverDay.set(2);
    component.onDayDragLeave(dragLeaveInside);
    expect(component.dragOverDay()).toBe(2);
  });

  it('should allow grid drag over', () => {
    const event = { preventDefault: vi.fn() } as unknown as DragEvent;
    component.onGridDragOver(event);
    expect(event.preventDefault).toHaveBeenCalled();
  });

  // --- Resize ---
  it('should resize slot on mouse move', () => {
    const slot: TimeSlot = {
      id: 's1',
      dayIndex: 0,
      startHour: 9,
      durationHours: 1,
      type: 'organization',
      label: 'A',
      colorClass: 'primary',
      organizationId: 'org-1',
    };
    component.slots.set([slot]);
    component.workDays.set([true, true, true, true, true, false, false]);

    (component as any).resizingSlot = slot;
    component.calendarBody.nativeElement.getBoundingClientRect = () => ({
      left: 0,
      top: 0,
      right: 500,
      bottom: 1200,
      width: 500,
      height: 1200,
      x: 0,
      y: 0,
      toJSON: () => ({}),
    });
    Object.defineProperty(component.calendarBody.nativeElement, 'scrollTop', {
      value: 0,
      writable: true,
    });

    const moveEvent = { clientY: 550 } as MouseEvent;
    component.onResizeMove(moveEvent);

    const resizedSlot = component.slots().find((s) => s.id === 's1');
    expect(resizedSlot?.durationHours).toBe(2);
  });

  it('should clean up on resize end', () => {
    const slot = {
      id: 's1',
      dayIndex: 0,
      startHour: 9,
      durationHours: 1,
      type: 'organization',
      label: 'A',
      colorClass: 'primary',
      organizationId: 'org-1',
    };
    (component as any).resizingSlot = slot;
    document.body.style.cursor = 'ns-resize';
    document.body.style.userSelect = 'none';

    component.onResizeEnd();

    expect((component as any).resizingSlot).toBeNull();
    expect(document.body.style.cursor).toBe('');
    expect(document.body.style.userSelect).toBe('');
  });
});
