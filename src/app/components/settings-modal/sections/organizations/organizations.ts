import { Component, ChangeDetectionStrategy, signal, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Auth } from '@services/auth';
import { AsyncPipe } from '@angular/common';

@Component({
  selector: 'app-settings-organizations',
  imports: [FormsModule, AsyncPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './organizations.html',
  styleUrl: './organizations.css',
})
export class OrganizationsSection {
  protected authService = inject(Auth);
}
