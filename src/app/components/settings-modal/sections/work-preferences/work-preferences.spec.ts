import { ComponentFixture, TestBed } from '@angular/core/testing';
import { WorkPreferencesSection } from './work-preferences';
import { Auth } from '@services/auth';
import { WorkSlotPreferenceService } from '@services/work-slot-preference.service';
import { TimeSlot } from '@app/model/work-preference.model';

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
    loadWorkSettings: vi.fn().mockResolvedValue(null),
    savePreferences: vi.fn().mockResolvedValue(undefined),
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
    mockPreferenceService.loadWorkSettings.mockResolvedValue(null);

    await TestBed.configureTestingModule({
      imports: [WorkPreferencesSection],
      providers: [
        { provide: Auth, useValue: mockAuth },
        { provide: WorkSlotPreferenceService, useValue: mockPreferenceService },
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
      { id: 's1', dayIndex: 0, startHour: 9, durationHours: 1, type: 'organization', label: 'A', colorClass: 'primary', organizationId: 'org-1' },
      { id: 's2', dayIndex: 1, startHour: 10, durationHours: 2, type: 'organization', label: 'B', colorClass: 'secondary', organizationId: 'org-1' },
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
      { id: 's1', dayIndex: 0, startHour: 9, durationHours: 1, type: 'organization', label: 'A', colorClass: 'primary', organizationId: 'org-1' },
    ];
    component.slots.set(slots);

    await component.onSave();

    expect(mockPreferenceService.savePreferences).toHaveBeenCalledWith(slots);
    expect(savedSpy).toHaveBeenCalledWith(slots);
  });

  it('should restore saved state and emit cancelled event', () => {
    const cancelledSpy = vi.fn();
    component.cancelled.subscribe(cancelledSpy);

    component.hoursPerDay.set(6);
    component.workDays.set([false, false, false, false, false, false, false]);
    component.slots.set([
      { id: 's1', dayIndex: 2, startHour: 9, durationHours: 1, type: 'organization', label: 'A', colorClass: 'primary', organizationId: 'org-1' },
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
      { id: 's1', dayIndex: 0, startHour: 9, durationHours: 4, type: 'organization', label: 'A', colorClass: 'primary', organizationId: 'org-1' },
      { id: 's2', dayIndex: 1, startHour: 10, durationHours: 3, type: 'organization', label: 'B', colorClass: 'secondary', organizationId: 'org-1' },
    ]);

    expect(component.totalPlannedHours()).toBe(7);
    expect(component.isOverbooked()).toBe(false);

    component.slots.set([
      { id: 's1', dayIndex: 0, startHour: 9, durationHours: 10, type: 'organization', label: 'A', colorClass: 'primary', organizationId: 'org-1' },
      { id: 's2', dayIndex: 1, startHour: 10, durationHours: 10, type: 'organization', label: 'B', colorClass: 'secondary', organizationId: 'org-1' },
      { id: 's3', dayIndex: 2, startHour: 10, durationHours: 10, type: 'organization', label: 'C', colorClass: 'accent', organizationId: 'org-1' },
      { id: 's4', dayIndex: 3, startHour: 10, durationHours: 10, type: 'organization', label: 'D', colorClass: 'info', organizationId: 'org-1' },
      { id: 's5', dayIndex: 4, startHour: 10, durationHours: 10, type: 'organization', label: 'E', colorClass: 'success', organizationId: 'org-1' },
    ]);

    expect(component.totalPlannedHours()).toBe(50);
    expect(component.availableHours()).toBe(40);
    expect(component.isOverbooked()).toBe(true);
  });

  it('should return slots for a day sorted by startHour', () => {
    component.slots.set([
      { id: 's1', dayIndex: 0, startHour: 14, durationHours: 1, type: 'organization', label: 'A', colorClass: 'primary', organizationId: 'org-1' },
      { id: 's2', dayIndex: 0, startHour: 9, durationHours: 2, type: 'organization', label: 'B', colorClass: 'secondary', organizationId: 'org-1' },
      { id: 's3', dayIndex: 1, startHour: 10, durationHours: 1, type: 'organization', label: 'C', colorClass: 'accent', organizationId: 'org-1' },
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
      { id: 's1', dayIndex: 0, startHour: 9, durationHours: 2, type: 'organization', label: 'A', colorClass: 'primary', organizationId: 'org-1' },
      { id: 's2', dayIndex: 0, startHour: 14, durationHours: 1.5, type: 'organization', label: 'B', colorClass: 'secondary', organizationId: 'org-1' },
      { id: 's3', dayIndex: 1, startHour: 10, durationHours: 3, type: 'organization', label: 'C', colorClass: 'accent', organizationId: 'org-1' },
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
    const slot1: TimeSlot = { id: 's1', dayIndex: 0, startHour: 9, durationHours: 1, type: 'organization', label: 'A', colorClass: 'primary', organizationId: 'org-1' };
    const slot2: TimeSlot = { id: 's2', dayIndex: 0, startHour: 10, durationHours: 2, type: 'organization', label: 'B', colorClass: 'secondary', organizationId: 'org-1' };

    component.slots.set([slot1, slot2]);
    component.removeSlot(slot1);

    expect(component.slots().length).toBe(1);
    expect(component.slots()[0].id).toBe('s2');
  });

  it('should load slots from backend on initialization', async () => {
    const backendSlots: TimeSlot[] = [
      { id: 's1', dayIndex: 0, startHour: 9, durationHours: 2, type: 'organization', label: 'Chrono Labs', colorClass: 'primary', organizationId: 'org-1' },
    ];

    mockPreferenceService.loadPreferences.mockResolvedValue(backendSlots);

    TestBed.resetTestingModule();
    await TestBed.configureTestingModule({
      imports: [WorkPreferencesSection],
      providers: [
        { provide: Auth, useValue: mockAuth },
        { provide: WorkSlotPreferenceService, useValue: mockPreferenceService },
      ],
    }).compileComponents();

    const newFixture = TestBed.createComponent(WorkPreferencesSection);
    const newComponent = newFixture.componentInstance;
    newFixture.detectChanges();
    if (newComponent.calendarBody?.nativeElement) {
      newComponent.calendarBody.nativeElement.scrollTo = vi.fn();
    }
    await newFixture.whenStable();

    expect(newComponent.slots()).toEqual(backendSlots);
  });
});
