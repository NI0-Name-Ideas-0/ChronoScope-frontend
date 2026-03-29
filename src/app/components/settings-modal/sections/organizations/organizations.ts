import { Component, ChangeDetectionStrategy, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

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
  imports: [FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './organizations.html',
  styleUrl: './organizations.css',
})
export class OrganizationsSection {
  mergeEmail = '';
  selectedOrgId = signal<string>('1');

  readonly organizations: Organization[] = [
    { id: '1', name: 'Acme Corporation', role: 'Admin', avatarInitials: 'AC', memberCount: 24, email: 'admin@acme.com' },
    { id: '2', name: 'Design Studio', role: 'Member', avatarInitials: 'DS', memberCount: 8, email: 'hello@designstudio.co' },
    { id: '3', name: 'Open Source Collective', role: 'Viewer', avatarInitials: 'OS', memberCount: 142, email: 'contact@opensource.org' },
  ];

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
}
