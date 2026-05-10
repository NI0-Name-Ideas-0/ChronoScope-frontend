import { Component, inject, signal } from '@angular/core';
import { CalendarView } from '@app/components/calendar-view/calendar-view';
import { ListView } from '@app/components/list-view/list-view';
import { Navbar } from '@app/components/navbar/navbar';
import { Topbar } from '@app/components/topbar/topbar';
import { ViewService } from '@services/view.service';
import { SettingsModal } from '@app/components/settings-modal/settings-modal';
import { TaskModal } from '@app/components/task-modal/task-modal';

@Component({
  selector: 'app-main',
  imports: [CalendarView, ListView, Navbar, Topbar, SettingsModal, TaskModal],
  templateUrl: './main.html',
  styleUrl: './main.css',
})
export class Main {
  isSettingsOpen = signal(false);

  openSettings() {
    this.isSettingsOpen.set(true);
  }
  closeSettings() {
    this.isSettingsOpen.set(false);
  }

  viewService = inject(ViewService);
}
