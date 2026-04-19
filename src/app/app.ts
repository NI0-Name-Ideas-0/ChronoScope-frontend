import { Component, ChangeDetectionStrategy, signal, inject, OnInit, computed } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Navbar } from './components/navbar/navbar';
import { Topbar } from './components/topbar/topbar';
import { CalendarView } from './components/calendar-view/calendar-view';
import { Auth } from '@services/auth';
import { SettingsModal } from './components/settings-modal/settings-modal';
import { TaskModal } from './components/task-modal/task-modal';
import { ListView } from './components/list-view/list-view';
import { ViewService } from '@services/view.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, Navbar, Topbar, CalendarView, SettingsModal, TaskModal, ListView],
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

  viewService = inject(ViewService);
}
