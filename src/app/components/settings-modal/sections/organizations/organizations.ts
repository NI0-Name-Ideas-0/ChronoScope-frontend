import { Component, ChangeDetectionStrategy, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

interface Organization {
  id: string;
  name: string;
  role: string;
  avatarInitials: string;
  memberCount: number;
}

@Component({
  selector: 'app-settings-organizations',
  imports: [FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './organizations.html',
})
export class OrganizationsSection {
  mergeEmail = '';

  readonly organizations: Organization[] = [
    { id: '1', name: 'Acme Corporation', role: 'Admin', avatarInitials: 'AC', memberCount: 24 },
    { id: '2', name: 'Design Studio', role: 'Member', avatarInitials: 'DS', memberCount: 8 },
    { id: '3', name: 'Open Source Collective', role: 'Viewer', avatarInitials: 'OS', memberCount: 142 },
  ];

  roleBadgeClass(role: string): string {
    switch (role) {
      case 'Admin': return 'badge-primary';
      case 'Member': return 'badge-neutral';
      default: return 'badge-ghost';
    }
  }
}
