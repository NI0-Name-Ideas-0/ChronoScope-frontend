import { Injectable, inject } from '@angular/core';
import { Api } from '../api/api';
import { Auth } from './auth';
import {
  getWorkSlots,
  createWorkSlot,
  updateWorkSlot,
  deleteWorkSlot,
} from '../api/functions';
import { Organization } from '../api/models';
import { TimeSlot, COLOR_POOL } from '@app/model/work-preference.model';

/**
 * Converts the frontend's recurring weekly TimeSlot format to/from the backend's
 * absolute-timestamp WorkSlot API.
 *
 * Note: The backend requires an organizationId for every slot, so break slots
 * (type === 'break') are skipped when saving. Only organization work slots are
 * persisted to the backend.
 */
@Injectable({ providedIn: 'root' })
export class WorkSlotPreferenceService {
  private api = inject(Api);
  private auth = inject(Auth);

  private readonly DAY_NAMES = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'];

  /** Load organization slots from the backend and map them to TimeSlots. */
  async loadPreferences(): Promise<TimeSlot[]> {
    const orgs = this.auth.getIdentityData()?.organizations ?? [];
    const response = await this.api.invoke(getWorkSlots, {});

    let slotsData: any[] = response as any[];
    if (response instanceof Blob) {
      const jsonText = await response.text();
      slotsData = JSON.parse(jsonText);
    }

    if (!Array.isArray(slotsData)) {
      return [];
    }

    return slotsData
      .map((ws) => this.toTimeSlot(ws, orgs))
      .filter((s): s is TimeSlot => s !== null);
  }

  /**
   * Persist the given slots to the backend.
   * Performs a diff: updates existing slots, creates new ones, deletes removed ones.
   */
  async savePreferences(slots: TimeSlot[]): Promise<void> {
    // 1. Load existing backend slots
    const existing = await this.api.invoke(getWorkSlots, {});
    let existingData: any[] = existing as any[];
    if (existing instanceof Blob) {
      const jsonText = await existing.text();
      existingData = JSON.parse(jsonText);
    }

    const existingById = new Map<number, any>();
    if (Array.isArray(existingData)) {
      existingData.forEach((ws) => {
        if (ws.id != null) {
          existingById.set(Number(ws.id), ws);
        }
      });
    }

    const orgSlots = slots.filter((s) => s.type === 'organization');
    const frontendIds = new Set<number>();
    const createPromises: Promise<any>[] = [];
    const updatePromises: Promise<any>[] = [];

    for (const slot of orgSlots) {
      if (!slot.organizationId) {
        console.warn('Skipping slot without organization:', slot);
        continue;
      }

      const backendId = Number(slot.id);
      const isExisting = !Number.isNaN(backendId) && existingById.has(backendId);
      const { dayOfWeek, startTime, endTime } = this.toWorkSlotRequest(slot);

      if (isExisting) {
        frontendIds.add(backendId);
        updatePromises.push(
          this.api.invoke(updateWorkSlot, {
            id: backendId,
            body: {
              dayOfWeek,
              startTime,
              endTime,
            } as any,
          })
        );
      } else {
        createPromises.push(
          this.api.invoke(createWorkSlot, {
            body: {
              organizationId: slot.organizationId,
              dayOfWeek,
              startTime,
              endTime,
            } as any,
          })
        );
      }
    }

    // 3. Delete backend slots that are no longer in the frontend list
    const deletePromises: Promise<any>[] = [];
    existingById.forEach((ws, id) => {
      if (!frontendIds.has(id)) {
        deletePromises.push(this.api.invoke(deleteWorkSlot, { id }));
      }
    });

    await Promise.all([...updatePromises, ...createPromises, ...deletePromises]);
  }

  /** Convert a backend WorkSlotResponse to a frontend TimeSlot. */
  private toTimeSlot(ws: any, orgs: Organization[]): TimeSlot | null {
    if (!ws.dayOfWeek || !ws.startTime || !ws.endTime || !ws.organizationId) {
      return null;
    }

    const org = orgs.find((o) => o.id === ws.organizationId);
    if (!org || !org.name) {
      return null;
    }

    const dayIndex = this.DAY_NAMES.indexOf(ws.dayOfWeek);
    if (dayIndex < 0) {
      return null;
    }

    const startHour = this.parseTimeString(ws.startTime);
    const endHour = this.parseTimeString(ws.endTime);
    const durationHours = Math.max(0.5, endHour - startHour);

    // Snap to 30-minute grid to match the frontend
    const roundedStartHour = Math.round(startHour * 2) / 2;
    const roundedDurationHours = Math.max(0.5, Math.round(durationHours * 2) / 2);

    const orgIndex = orgs.findIndex((o) => o.id === ws.organizationId);
    const colorClass = COLOR_POOL[orgIndex % COLOR_POOL.length];

    return {
      id: ws.id?.toString() ?? this.generateId(),
      dayIndex,
      startHour: roundedStartHour,
      durationHours: roundedDurationHours,
      type: 'organization',
      label: org.name,
      colorClass,
      organizationId: ws.organizationId,
    };
  }

  /** Convert a frontend TimeSlot to the backend request format. */
  private toWorkSlotRequest(slot: TimeSlot): { dayOfWeek: string; startTime: string; endTime: string } {
    const dayOfWeek = this.DAY_NAMES[slot.dayIndex];
    const startTime = this.formatTime(slot.startHour);
    const endTime = this.formatTime(slot.startHour + slot.durationHours);
    return { dayOfWeek, startTime, endTime };
  }

  /** Formats a decimal hour as HH:mm string. */
  private formatTime(hour: number): string {
    const h = Math.floor(hour);
    const m = Math.round((hour - h) * 60);
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
  }

  /** Parses an HH:mm time string to decimal hours. */
  private parseTimeString(timeStr: string): number {
    const [h, m] = timeStr.split(':').map(Number);
    return h + (m || 0) / 60;
  }

  private generateId(): string {
    return Date.now().toString() + Math.random().toString(36).substring(2, 5);
  }
}
