import { Component, ChangeDetectionStrategy, signal, inject, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Navbar } from './components/navbar/navbar';
import { Topbar } from './components/topbar/topbar';
import { CalendarView } from './components/calendar-view/calendar-view';
import { Auth } from '@services/auth';
import { SettingsModal } from './components/settings-modal/settings-modal';
import { TaskModal } from './components/task-modal/task-modal';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, Navbar, Topbar, CalendarView, SettingsModal, TaskModal],
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

  openSettings() {
    this.isSettingsOpen.set(true);
  }
  closeSettings() {
    this.isSettingsOpen.set(false);
  }
}
