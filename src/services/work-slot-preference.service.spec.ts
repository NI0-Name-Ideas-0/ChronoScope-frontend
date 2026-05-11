import { TestBed } from '@angular/core/testing';

import { Api } from '../api/api';
import { createWorkSlot, deleteWorkSlot, getWorkSlots } from '../api/functions';
import { WorkSlotResponse } from '../api/models';
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
    mockApi.invoke.mockResolvedValue([
      responseSlot({
        id: 7,
        organizationId: 'org-1',
        dayOfWeek: 'WEDNESDAY',
        startTime: '09:30',
        endTime: '11:00',
      }),
    ]);

    const result = await service.loadPreferences();

    expect(mockApi.invoke).toHaveBeenCalledWith(getWorkSlots, {});
    expect(result).toEqual([
      {
        id: '7',
        dayIndex: 2,
        startHour: 9.5,
        durationHours: 1.5,
        type: 'organization',
        label: 'Chrono Labs',
        colorClass: 'primary',
        organizationId: 'org-1',
      },
    ]);
  });

  it('maps dayIndex to Java DayOfWeek names when saving', async () => {
    mockApi.invoke.mockImplementation((fn: unknown) => {
      if (fn === getWorkSlots) return Promise.resolve([]);
      return Promise.resolve({});
    });

    await service.savePreferences([
      slot({ dayIndex: 0, startHour: 8, durationHours: 1 }),
      slot({ dayIndex: 6, startHour: 14.5, durationHours: 1.5 }),
    ]);

    expect(mockApi.invoke).toHaveBeenNthCalledWith(1, getWorkSlots, {});
    expect(mockApi.invoke).toHaveBeenNthCalledWith(2, createWorkSlot, {
      body: {
        organizationId: 'org-1',
        dayOfWeek: 'MONDAY',
        startTime: '08:00',
        endTime: '09:00',
      },
    });
    expect(mockApi.invoke).toHaveBeenNthCalledWith(3, createWorkSlot, {
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

    await service.savePreferences([slot({ dayIndex: 1, startHour: 10, durationHours: 2 })]);

    expect(mockApi.invoke).toHaveBeenNthCalledWith(1, getWorkSlots, {});
    expect(mockApi.invoke).toHaveBeenNthCalledWith(2, deleteWorkSlot, { id: 10 });
    expect(mockApi.invoke).toHaveBeenNthCalledWith(3, deleteWorkSlot, { id: 11 });
    expect(mockApi.invoke).toHaveBeenNthCalledWith(4, createWorkSlot, {
      body: {
        organizationId: 'org-1',
        dayOfWeek: 'TUESDAY',
        startTime: '10:00',
        endTime: '12:00',
      },
    });
  });

  it('skips break slots and cross-midnight organization slots when saving', async () => {
    mockApi.invoke.mockImplementation((fn: unknown) => {
      if (fn === getWorkSlots) return Promise.resolve([]);
      return Promise.resolve({});
    });

    await service.savePreferences([
      slot({ type: 'break', dayIndex: 0, startHour: 12, durationHours: 1, organizationId: '' }),
      slot({ dayIndex: 0, startHour: 23.5, durationHours: 1 }),
      slot({ dayIndex: 2, startHour: 9, durationHours: 1 }),
    ]);

    const createCalls = mockApi.invoke.mock.calls.filter(([fn]) => fn === createWorkSlot);
    expect(createCalls).toHaveLength(1);
    expect(createCalls[0][1]).toEqual({
      body: {
        organizationId: 'org-1',
        dayOfWeek: 'WEDNESDAY',
        startTime: '09:00',
        endTime: '10:00',
      },
    });
  });

  it('currently emits 24:00 for a slot ending exactly at midnight', async () => {
    mockApi.invoke.mockImplementation((fn: unknown) => {
      if (fn === getWorkSlots) return Promise.resolve([]);
      return Promise.resolve({});
    });

    await service.savePreferences([slot({ dayIndex: 4, startHour: 23.5, durationHours: 0.5 })]);

    expect(mockApi.invoke).toHaveBeenNthCalledWith(2, createWorkSlot, {
      body: {
        organizationId: 'org-1',
        dayOfWeek: 'FRIDAY',
        startTime: '23:30',
        endTime: '24:00',
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
