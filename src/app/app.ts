import { Component, ChangeDetectionStrategy, signal, inject, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Navbar } from './components/navbar/navbar';
import { Topbar } from './components/topbar/topbar';
import { CalendarView } from './components/calendar-view/calendar-view';
import { SettingsModal } from './components/settings-modal/settings-modal';
import { Auth } from '@services/auth';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, Navbar, Topbar, CalendarView, SettingsModal],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App implements OnInit {
  protected readonly title = signal('ChronoScope-frontend');
  private authService = inject(Auth);

  isSettingsOpen = signal(false);

  ngOnInit() {
    this.login();
  }

  login() {
    this.authService.login();
  }

  openSettings() { this.isSettingsOpen.set(true); }
  closeSettings() { this.isSettingsOpen.set(false); }
}
