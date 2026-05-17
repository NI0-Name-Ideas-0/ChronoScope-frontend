import { Injectable, inject } from '@angular/core';
import { Subject } from 'rxjs';
import { Api } from '../api/api';
import { Auth } from './auth';
import {
  getWorkSlots,
  createWorkSlot,
  deleteWorkSlot,
  getSettings,
  updateSettings,
} from '../api/functions';
import {
  WorkSlotResponse,
  WorkSettings,
  SettingsResponse,
  IdentityOrganizationColorResponse,
} from '../api/models';
import { Organization } from '../api/models';
import { TimeSlot } from '@app/model/work-preference.model';
import { getOrganizationColors } from '../api/fn/identity/get-organization-colors';
import { getOrganizationColor } from '../api/fn/identity/get-organization-color';
import { NotificationService } from './notification.service';
import { TranslocoService } from '@jsverse/transloco';

/** Ordered mapping from dayIndex (0=Mon..6=Sun) to the Java DayOfWeek string */
const DAY_OF_WEEK_NAMES = [
  'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY',
] as const;

/** Ordered mapping from dayIndex (0=Mon..6=Sun) to the WorkSettings day codes (mo..so) */
const WORK_SETTINGS_DAY_CODES = ['mo', 'di', 'mi', 'do', 'fr', 'sa', 'so'] as const;

type DayOfWeekName = typeof DAY_OF_WEEK_NAMES[number];
type WorkSettingsDayCode = typeof WORK_SETTINGS_DAY_CODES[number];
const MINUTES_PER_DAY = 24 * 60;

/**
 * Handles persistence of the frontend's recurring weekly TimeSlot schedule against
 * the backend's recurring WorkSlot API (DayOfWeek + HH:mm startTime/endTime).
 *
 * Break slots (type === 'break') are frontend-only and never persisted.
 */
@Injectable({ providedIn: 'root' })
export class WorkSlotPreferenceService {
  private api = inject(Api);
  private auth = inject(Auth);
  private notificationService = inject(NotificationService);
  private translocoService = inject(TranslocoService);
  private preferencesChanged = new Subject<void>();
  preferencesChanged$ = this.preferencesChanged.asObservable();

  /** Load organization slots from the backend and map them to TimeSlots. */
  async loadPreferences(): Promise<TimeSlot[]> {
    const orgs = this.auth.getIdentityData()?.organizations ?? [];
    const slotsData = await this.fetchSlots();
    const orgColors = await this.fetchOrganizationColors();

    return slotsData
      .map((ws) => this.toTimeSlot(ws, orgs, orgColors))
      .filter((s): s is TimeSlot => s !== null);
  }

  async loadOrganizationColorMap(): Promise<Record<string, string>> {
    return this.fetchOrganizationColors();
  }

  /**
   * Persist the given slots to the backend.
   * Bulk replace: all existing backend slots are deleted first, then the new
   * organization slots are created sequentially (to avoid race conditions).
   */
  async savePreferences(slots: TimeSlot[], hours: number, workDays: boolean[]): Promise<void> {
    const workSettings: WorkSettings = {
      dailyWorkTimeMinutes: Math.round(hours * 60),
      workDays: WORK_SETTINGS_DAY_CODES.filter((_, index) => workDays[index] === true),
    };

    await this.api.invoke(updateSettings, {
      body: {
        workSettings,
      },
    });
    // 1. Delete all existing work slots
    const existingData = await this.fetchSlots();
    for (const ws of existingData) {
      if (ws.id != null) {
        await this.api.invoke(deleteWorkSlot, { id: ws.id });
      }
    }

    // 2. Create new organization slots (breaks are frontend-only)
    const orgSlots = slots.filter((s) => s.type === 'organization');
    for (const slot of orgSlots) {
      if (!slot.organizationId) {
        console.warn('Skipping slot without organization:', slot);
        continue;
      }
      const startMinutes = this.toMinutes(slot.startHour);
      const endMinutes = this.check(this.toMinutes(slot.startHour + slot.durationHours));
      if (startMinutes < 0 || endMinutes > MINUTES_PER_DAY || startMinutes >= endMinutes) {
        console.warn('Skipping invalid work slot:', slot);
        continue;
      }
      await this.api.invoke(createWorkSlot, {
        body: {
          organizationId: slot.organizationId,
          dayOfWeek: DAY_OF_WEEK_NAMES[slot.dayIndex],
          startTime: this.toLocalTimeString(startMinutes),
          endTime: this.toLocalTimeString(endMinutes),
        },
      });
    }

    this.notificationService.success(this.translocoService.translate('TOAST_WORK_SCHEDULE_SAVED'));
    this.preferencesChanged.next();
  }

  /** Convert a backend WorkSlotResponse to a frontend TimeSlot. */
  private toTimeSlot(
    ws: WorkSlotResponse,
    orgs: Organization[],
    organizationColors: Record<string, string>,
  ): TimeSlot | null {
    if (!ws.startTime || !ws.endTime || !ws.organizationId || !ws.dayOfWeek) {
      return null;
    }

    const org = orgs.find((o) => o.id === ws.organizationId);
    if (!org || !org.name) {
      return null;
    }

    const dayIndex = DAY_OF_WEEK_NAMES.indexOf(ws.dayOfWeek as DayOfWeekName);
    if (dayIndex === -1) return null;

    const startHour = this.parseLocalTime(ws.startTime);
    const endHour = this.parseLocalTime(ws.endTime);
    const durationHours = endHour - startHour;
    if (durationHours <= 0) return null;

    const colorClass = organizationColors[ws.organizationId] || 'UNSET';

    return {
      id: ws.id?.toString() ?? this.generateId(),
      dayIndex,
      startHour,
      durationHours,
      type: 'organization',
      label: org.name,
      colorClass,
      organizationId: ws.organizationId,
    };
  }

  /** Parse a "HH:mm" string to a decimal hour (e.g. "09:30" → 9.5). */
  private parseLocalTime(time: string): number {
    const [h, m] = time.split(':').map(Number);
    return h + m / 60;
  }

  /** Convert minutes after midnight to a "HH:mm" string. */
  private toLocalTimeString(totalMinutes: number): string {
    const h = Math.floor(totalMinutes / 60);
    const m = totalMinutes % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
  }

  private toMinutes(hour: number): number {
    return Math.round(hour * 60);
  }

  /** Load work schedule settings from the backend. */
  async loadWorkSettings(): Promise<{ hoursPerDay: number; workDays: boolean[] } | null> {
    const response = await this.api.invoke(getSettings, {});

    let parsed: SettingsResponse;
    if (response instanceof Blob) {
      const jsonText = await response.text();
      parsed = JSON.parse(jsonText);
    } else {
      parsed = response as SettingsResponse;
    }

    if (!parsed.workSettings) {
      return null;
    }

    const { dailyWorkTimeMinutes, workDays } = parsed.workSettings;
    const hoursPerDay = dailyWorkTimeMinutes / 60;
    const workDaysBoolean = WORK_SETTINGS_DAY_CODES.map((day) => workDays.includes(day));

    return {
      hoursPerDay,
      workDays: workDaysBoolean,
    };
  }

  /** Fetch and parse work slots from the API, handling Blob responses. */
  private async fetchSlots(): Promise<WorkSlotResponse[]> {
    const response = await this.api.invoke(getWorkSlots, {});
    if (response instanceof Blob) {
      const jsonText = await response.text();
      const parsed = JSON.parse(jsonText);
      return Array.isArray(parsed) ? parsed : [];
    }
    return Array.isArray(response) ? (response as WorkSlotResponse[]) : [];
  }

  private async fetchOrganizationColors(): Promise<Record<string, string>> {
    try {
      const response = await this.api.invoke(getOrganizationColors, {});
      const parsed = response instanceof Blob ? JSON.parse(await response.text()) : response;
      const list = Array.isArray(parsed) ? (parsed as IdentityOrganizationColorResponse[]) : [];
      const colorMap = list.reduce<Record<string, string>>((acc, entry) => {
        if (entry.organizationId && entry.color && entry.color !== 'UNSET') {
          acc[entry.organizationId] = entry.color;
        }
        return acc;
      }, {});

      const orgs = this.auth.getIdentityData()?.organizations ?? [];
      const missingOrgIds = orgs.map((o) => o.id).filter((id): id is string => !!id && !colorMap[id]);

      if (missingOrgIds.length > 0) {
        const results = await Promise.allSettled(
          missingOrgIds.map((orgId) =>
            this.api.invoke(getOrganizationColor, { organizationId: orgId }),
          ),
        );
        for (const result of results) {
          if (result.status === 'fulfilled') {
            const singleResponse = result.value;
            const singleParsed =
              singleResponse instanceof Blob
                ? JSON.parse(await singleResponse.text())
                : singleResponse;
            const resp = singleParsed as IdentityOrganizationColorResponse;
            if (resp.organizationId && resp.color && resp.color !== 'UNSET') {
              colorMap[resp.organizationId] = resp.color;
            }
          }
        }
      }

      return colorMap;
    } catch (error) {
      console.error('Failed to load organization colors for work slots:', error);
      return {};
    }
  }

  private generateId(): string {
    return Date.now().toString() + Math.random().toString(36).substring(2, 5);
  }

  private check(dayTimeToMinutes: number): number{
    if(dayTimeToMinutes >= MINUTES_PER_DAY){
      return MINUTES_PER_DAY-1;
    }
    return dayTimeToMinutes;
  }
}
