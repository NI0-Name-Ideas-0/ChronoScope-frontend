import { Component, ChangeDetectionStrategy, signal, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TranslocoPipe } from '@jsverse/transloco';
import { Auth } from '@services/auth';
import { AsyncPipe } from '@angular/common';

@Component({
  selector: 'app-settings-organizations',
  imports: [FormsModule, AsyncPipe, TranslocoPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './organizations.html',
  styleUrl: './organizations.css',
})
export class OrganizationsSection {
  protected authService = inject(Auth);
}
