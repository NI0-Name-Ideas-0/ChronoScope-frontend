import { TestBed } from '@angular/core/testing';

import { Api } from '../api/api';
import { createWorkSlot, deleteWorkSlot, getWorkSlots, updateSettings, getSettings } from '../api/functions';
import { getOrganizationColors } from '../api/fn/identity/get-organization-colors';
import { getOrganizationColor } from '../api/fn/identity/get-organization-color';
import { WorkSlotResponse, IdentityOrganizationColorResponse } from '../api/models';
import { TimeSlot } from '../app/model/work-preference.model';
import { Auth } from './auth';
import { WorkSlotPreferenceService } from './work-slot-preference.service';

describe('WorkSlotPreferenceService', () => {
  let service: WorkSlotPreferenceService;

  const mockApi = {
    invoke: vi.fn(),
  };

  const mockAuth = {
    getIdentityData: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockAuth.getIdentityData.mockReturnValue({
      organizations: [{ id: 'org-1', name: 'Chrono Labs' }],
    });

    TestBed.configureTestingModule({
      providers: [
        WorkSlotPreferenceService,
        { provide: Api, useValue: mockApi },
        { provide: Auth, useValue: mockAuth },
      ],
    });

    service = TestBed.inject(WorkSlotPreferenceService);
  });

  it('maps backend HH:mm work-slot responses to TimeSlots', async () => {
    mockApi.invoke.mockImplementation((fn: unknown) => {
      if (fn === getWorkSlots) {
        return Promise.resolve([
          responseSlot({
            id: 7,
            organizationId: 'org-1',
            dayOfWeek: 'WEDNESDAY',
            startTime: '09:30',
            endTime: '11:00',
          }),
        ]);
      }
      if (fn === getOrganizationColors) {
        return Promise.resolve([]);
      }
      if (fn === getOrganizationColor) {
        return Promise.resolve({ organizationId: 'org-1', color: 'BLUE' });
      }
      return Promise.resolve({});
    });

    const result = await service.loadPreferences();

    expect(result).toEqual([
      {
        id: '7',
        dayIndex: 2,
        startHour: 9.5,
        durationHours: 1.5,
        type: 'organization',
        label: 'Chrono Labs',
        colorClass: 'BLUE',
        organizationId: 'org-1',
      },
    ]);
  });

  it('maps dayIndex to Java DayOfWeek names when saving', async () => {
    mockApi.invoke.mockImplementation((fn: unknown) => {
      if (fn === getWorkSlots) return Promise.resolve([]);
      return Promise.resolve({});
    });

    await service.savePreferences(
      [
        slot({ dayIndex: 0, startHour: 8, durationHours: 1 }),
        slot({ dayIndex: 6, startHour: 14.5, durationHours: 1.5 }),
      ],
      8,
      [true, true, true, true, true, false, false]
    );

    expect(mockApi.invoke).toHaveBeenNthCalledWith(1, updateSettings, {
      body: {
        workSettings: {
          dailyWorkTimeMinutes: 480,
          workDays: ['mo', 'di', 'mi', 'do', 'fr'],
        },
      },
    });
    expect(mockApi.invoke).toHaveBeenNthCalledWith(2, getWorkSlots, {});
    expect(mockApi.invoke).toHaveBeenNthCalledWith(3, createWorkSlot, {
      body: {
        organizationId: 'org-1',
        dayOfWeek: 'MONDAY',
        startTime: '08:00',
        endTime: '09:00',
      },
    });
    expect(mockApi.invoke).toHaveBeenNthCalledWith(4, createWorkSlot, {
      body: {
        organizationId: 'org-1',
        dayOfWeek: 'SUNDAY',
        startTime: '14:30',
        endTime: '16:00',
      },
    });
  });

  it('deletes existing backend slots before creating replacements', async () => {
    mockApi.invoke.mockImplementation((fn: unknown) => {
      if (fn === getWorkSlots) return Promise.resolve([responseSlot({ id: 10 }), responseSlot({ id: 11 })]);
      return Promise.resolve({});
    });

    await service.savePreferences([slot({ dayIndex: 1, startHour: 10, durationHours: 2 })], 8, [
      true,
      true,
      true,
      true,
      true,
      false,
      false,
    ]);

    expect(mockApi.invoke).toHaveBeenNthCalledWith(1, updateSettings, {
      body: {
        workSettings: {
          dailyWorkTimeMinutes: 480,
          workDays: ['mo', 'di', 'mi', 'do', 'fr'],
        },
      },
    });
    expect(mockApi.invoke).toHaveBeenNthCalledWith(2, getWorkSlots, {});
    expect(mockApi.invoke).toHaveBeenNthCalledWith(3, deleteWorkSlot, { id: 10 });
    expect(mockApi.invoke).toHaveBeenNthCalledWith(4, deleteWorkSlot, { id: 11 });
    expect(mockApi.invoke).toHaveBeenNthCalledWith(5, createWorkSlot, {
      body: {
        organizationId: 'org-1',
        dayOfWeek: 'TUESDAY',
        startTime: '10:00',
        endTime: '12:00',
      },
    });
  });

  it('skips break slots and creates capped organization slots when saving', async () => {
    mockApi.invoke.mockImplementation((fn: unknown) => {
      if (fn === getWorkSlots) return Promise.resolve([]);
      return Promise.resolve({});
    });

    await service.savePreferences(
      [
        slot({ type: 'break', dayIndex: 0, startHour: 12, durationHours: 1, organizationId: '' }),
        slot({ dayIndex: 0, startHour: 23.5, durationHours: 1 }),
        slot({ dayIndex: 2, startHour: 9, durationHours: 1 }),
      ],
      8,
      [true, true, true, true, true, false, false]
    );

    const createCalls = mockApi.invoke.mock.calls.filter(([fn]) => fn === createWorkSlot);
    expect(createCalls).toHaveLength(2);
    expect(createCalls[0][1]).toEqual({
      body: {
        organizationId: 'org-1',
        dayOfWeek: 'MONDAY',
        startTime: '23:30',
        endTime: '23:59',
      },
    });
    expect(createCalls[1][1]).toEqual({
      body: {
        organizationId: 'org-1',
        dayOfWeek: 'WEDNESDAY',
        startTime: '09:00',
        endTime: '10:00',
      },
    });
  });

  it('caps a slot ending exactly at midnight to 23:59', async () => {
    mockApi.invoke.mockImplementation((fn: unknown) => {
      if (fn === getWorkSlots) return Promise.resolve([]);
      return Promise.resolve({});
    });

    await service.savePreferences([slot({ dayIndex: 4, startHour: 23.5, durationHours: 0.5 })], 8, [
      true,
      true,
      true,
      true,
      true,
      false,
      false,
    ]);

    expect(mockApi.invoke).toHaveBeenNthCalledWith(2, getWorkSlots, {});
    expect(mockApi.invoke).toHaveBeenNthCalledWith(3, createWorkSlot, {
      body: {
        organizationId: 'org-1',
        dayOfWeek: 'FRIDAY',
        startTime: '23:30',
        endTime: '23:59',
      },
    });
  });

  function responseSlot(overrides: Partial<WorkSlotResponse> = {}): WorkSlotResponse {
    return {
      id: 1,
      organizationId: 'org-1',
      dayOfWeek: 'MONDAY',
      startTime: '08:00',
      endTime: '09:00',
      ...overrides,
    };
  }

  it('loads work settings from the backend', async () => {
    mockApi.invoke.mockResolvedValue({
      workSettings: {
        dailyWorkTimeMinutes: 300,
        workDays: ['mo', 'mi', 'fr'],
      },
    });

    const result = await service.loadWorkSettings();

    expect(mockApi.invoke).toHaveBeenCalledWith(getSettings, {});
    expect(result).toEqual({
      hoursPerDay: 5,
      workDays: [true, false, true, false, true, false, false],
    });
  });

  it('returns null when no work settings exist', async () => {
    mockApi.invoke.mockResolvedValue({});

    const result = await service.loadWorkSettings();

    expect(result).toBeNull();
  });

  function slot(overrides: Partial<TimeSlot> = {}): TimeSlot {
    return {
      id: 'slot-1',
      dayIndex: 0,
      startHour: 8,
      durationHours: 1,
      type: 'organization',
      label: 'Chrono Labs',
      colorClass: 'primary',
      organizationId: 'org-1',
      ...overrides,
    };
  }
});
