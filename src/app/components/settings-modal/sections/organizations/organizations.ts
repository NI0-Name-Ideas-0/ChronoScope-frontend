import { Component, ChangeDetectionStrategy, signal, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Auth } from '@services/auth';
import { AsyncPipe } from '@angular/common';
import { Api } from '@api/api';
import { TaskColor } from '@app/model/task';
import { getOrganizationColors } from '../../../../../api/fn/identity/get-organization-colors';
import { updateOrganizationColor } from '../../../../../api/fn/identity/update-organization-color';
import { IdentityOrganizationColorResponse } from '../../../../../api/models';

const ORGANIZATION_COLORS: TaskColor[] = [
  'RED',
  'ORANGE',
  'AMBER',
  'YELLOW',
  'GREEN',
  'MINT',
  'CYAN',
  'BLUE',
  'INDIGO',
  'PURPLE',
  'PINK',
  'BROWN',
  'GRAY',
];

@Component({
  selector: 'app-settings-organizations',
  imports: [FormsModule, AsyncPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './organizations.html',
  styleUrl: './organizations.css',
})
export class OrganizationsSection {
  protected authService = inject(Auth);
  private api = inject(Api);

  colors = signal<Record<string, TaskColor>>({});
  openPopoverOrgId = signal<string | null>(null);
  savingOrgId = signal<string | null>(null);

  readonly colorOptions = ORGANIZATION_COLORS;

  constructor() {
    this.loadOrganizationColors();
  }

  private async parseBlob<T>(response: T): Promise<T> {
    const blob = response as Blob;
    if (!(blob instanceof Blob)) {
      return response;
    }
    const jsonText = await blob.text();
    return JSON.parse(jsonText) as T;
  }

  private async loadOrganizationColors(): Promise<void> {
    try {
      const response = await this.api.invoke(getOrganizationColors, {});
      const colors = await this.parseBlob<IdentityOrganizationColorResponse[]>(response);
      const map: Record<string, TaskColor> = {};
      (colors || []).forEach((entry) => {
        if (entry.organizationId) {
          map[entry.organizationId] = entry.color as TaskColor;
        }
      });
      this.colors.set(map);
    } catch (error) {
      console.error('Failed to load organization colors:', error);
    }
  }

  getOrganizationColor(orgId: string | undefined): TaskColor {
    if (!orgId) {
      return 'BLUE';
    }
    const configured = this.colors()[orgId];
    if (configured && configured !== 'UNSET') {
      return configured;
    }

    const orgs = this.authService.getIdentityData()?.organizations ?? [];
    const index = orgs.findIndex((org) => org.id === orgId);
    if (index === -1) {
      return 'BLUE';
    }
    return ORGANIZATION_COLORS[index % ORGANIZATION_COLORS.length] ?? 'BLUE';
  }

  togglePopover(orgId: string | undefined): void {
    if (!orgId) {
      return;
    }
    this.openPopoverOrgId.set(this.openPopoverOrgId() === orgId ? null : orgId);
  }

  async setOrganizationColor(orgId: string | undefined, color: TaskColor): Promise<void> {
    if (!orgId || this.savingOrgId() || color === 'UNSET') {
      return;
    }

    this.savingOrgId.set(orgId);
    try {
      await this.api.invoke(updateOrganizationColor, {
        organizationId: orgId,
        body: { color },
      });

      this.colors.update((prev) => {
        const next = { ...prev };
        next[orgId] = color;
        return next;
      });
      this.openPopoverOrgId.set(null);
    } catch (error) {
      console.error('Failed to update organization color:', error);
    } finally {
      this.savingOrgId.set(null);
    }
  }
}
