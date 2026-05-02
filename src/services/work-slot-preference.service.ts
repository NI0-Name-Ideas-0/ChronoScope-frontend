import { Injectable, inject } from '@angular/core';
import { Api } from '../api/api';
import { Auth } from './auth';
import {
  getWorkSlots,
  createWorkSlot,
  deleteWorkSlot,
} from '../api/functions';
import { WorkSlotResponse } from '../api/models';
import { AccountResponse } from '../api/models';
import { getAccountDisplayName } from './account.utils';
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

  /** Reference Monday used to convert dayIndex (0=Mon..6=Sun) to absolute Instants */
  private readonly REFERENCE_MONDAY = Date.UTC(2024, 0, 1);

  /** Load organization slots from the backend and map them to TimeSlots. */
  async loadPreferences(): Promise<TimeSlot[]> {
    const accounts = this.auth.getAccounts();
    const response = await this.api.invoke(getWorkSlots, {});

    let slotsData: WorkSlotResponse[] = response as WorkSlotResponse[];
    if (response instanceof Blob) {
      const jsonText = await response.text();
      slotsData = JSON.parse(jsonText);
    }

    if (!Array.isArray(slotsData)) {
      return [];
    }

    return slotsData
      .map((ws) => this.toTimeSlot(ws, accounts))
      .filter((s): s is TimeSlot => s !== null);
  }

  /**
   * Persist the given slots to the backend.
   * This performs a bulk replace: all existing backend slots are deleted and
   * new organization slots are created from the provided array.
   */
  async savePreferences(slots: TimeSlot[]): Promise<void> {
    // 1. Delete all existing work slots for this identity
    const existing = await this.api.invoke(getWorkSlots, {});
    let existingData: WorkSlotResponse[] = existing as WorkSlotResponse[];
    if (existing instanceof Blob) {
      const jsonText = await existing.text();
      existingData = JSON.parse(jsonText);
    }

    if (Array.isArray(existingData)) {
      await Promise.all(
        existingData.map((ws) => {
          if (ws.id != null) {
            return this.api.invoke(deleteWorkSlot, { id: ws.id });
          }
          return Promise.resolve();
        })
      );
    }

    // 2. Create new organization slots (breaks are skipped)
    const orgSlots = slots.filter((s) => s.type === 'organization');
    await Promise.all(
      orgSlots.map((slot) => {
        const orgId = this.getOrganizationIdForSlot(slot);
        if (!orgId) {
          console.warn('Skipping slot without organization:', slot);
          return Promise.resolve();
        }

        const { startAt, endAt } = this.toWorkSlotTimes(slot);
        return this.api.invoke(createWorkSlot, {
          body: {
            accountId: slot.accountId,
            organizationId: orgId,
            startAt,
            endAt,
          },
        });
      })
    );
  }

  /** Find the first organization ID for the account linked to a slot. */
  private getOrganizationIdForSlot(slot: TimeSlot): number | null {
    const account = this.auth.getAccounts().find((a) => a.id === slot.accountId);
    return account?.organizations?.[0]?.id ?? null;
  }

  /** Convert a backend WorkSlotResponse to a frontend TimeSlot. */
  private toTimeSlot(
    ws: WorkSlotResponse,
    accounts: AccountResponse[]
  ): TimeSlot | null {
    if (!ws.startAt || !ws.endAt || ws.accountId == null) {
      return null;
    }

    const startDate = new Date(ws.startAt);
    const endDate = new Date(ws.endAt);

    // Convert UTC day to our dayIndex (0=Mon..6=Sun)
    const dayOfWeek = startDate.getUTCDay();
    const dayIndex = dayOfWeek === 0 ? 6 : dayOfWeek - 1;

    const startHour = startDate.getUTCHours() + startDate.getUTCMinutes() / 60;
    const durationMs = endDate.getTime() - startDate.getTime();
    const durationHours = durationMs / (1000 * 60 * 60);

    // Snap to 30-minute grid to match the frontend
    const roundedStartHour = Math.round(startHour * 2) / 2;
    const roundedDurationHours = Math.max(0.5, Math.round(durationHours * 2) / 2);

    const account = accounts.find((a) => a.id === ws.accountId);
    if (!account) {
      return null;
    }

    const accountIndex = accounts.findIndex((a) => a.id === ws.accountId);
    const colorClass = COLOR_POOL[accountIndex % COLOR_POOL.length];
    const label = getAccountDisplayName(account);

    return {
      id: ws.id?.toString() ?? this.generateId(),
      dayIndex,
      startHour: roundedStartHour,
      durationHours: roundedDurationHours,
      type: 'organization',
      label,
      colorClass,
      accountId: ws.accountId,
    };
  }

  /** Convert a frontend TimeSlot to absolute ISO-8601 timestamps. */
  private toWorkSlotTimes(slot: TimeSlot): { startAt: string; endAt: string } {
    const targetDate = new Date(this.REFERENCE_MONDAY + slot.dayIndex * 24 * 60 * 60 * 1000);

    const hours = Math.floor(slot.startHour);
    const minutes = Math.round((slot.startHour - hours) * 60);
    targetDate.setUTCHours(hours, minutes, 0, 0);

    const startAt = targetDate.toISOString();

    const endDate = new Date(targetDate);
    endDate.setUTCMinutes(endDate.getUTCMinutes() + Math.round(slot.durationHours * 60));
    const endAt = endDate.toISOString();

    return { startAt, endAt };
  }

  private generateId(): string {
    return Date.now().toString() + Math.random().toString(36).substring(2, 5);
  }
}
