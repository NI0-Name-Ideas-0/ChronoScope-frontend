import { Component, ChangeDetectionStrategy, signal, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Auth } from '@services/auth';
import { AsyncPipe } from '@angular/common';

interface Organization {
  id: string;
  name: string;
  role: string;
  avatarInitials: string;
  memberCount: number;
  email: string;
}

@Component({
  selector: 'app-settings-organizations',
  imports: [FormsModule, AsyncPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './organizations.html',
  styleUrl: './organizations.css',
})
export class OrganizationsSection {
  mergeEmail = '';
  selectedOrgId = signal<string>('1');
  protected authService = inject(Auth);

  selectOrg(id: string): void {
    this.selectedOrgId.set(id);
  }

  roleBadgeClass(role: string): string {
    switch (role) {
      case 'Admin': return 'badge-primary';
      case 'Member': return 'badge-neutral';
      default: return 'badge-ghost';
    }
  }

  requestLinkEmail(): void {
    this.authService.linkAccount(this.mergeEmail);
  }
}
