import { Component, ChangeDetectionStrategy, inject, output } from '@angular/core';
import { Auth } from '@services/auth';

@Component({
  selector: 'app-navbar',
  imports: [],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './navbar.html',
  styleUrl: './navbar.css',
})
export class Navbar {
  private authService = inject(Auth);

  settingsRequested = output<void>();

  logout() {
    this.authService.logout();
  }

  openSettings() {
    this.settingsRequested.emit();
  }
}
