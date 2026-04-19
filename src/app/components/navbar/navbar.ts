import { Component, ChangeDetectionStrategy, inject, output } from '@angular/core';
import { Auth } from '@services/auth'
import { TaskModalService } from '@services/task-modal.service';
import { ViewService } from '@services/view.service';

@Component({
  selector: 'app-navbar',
  imports: [],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './navbar.html',
  styleUrl: './navbar.css',
})
export class Navbar {

  constructor(private taskModalService: TaskModalService) { }
  private authService = inject(Auth);

  settingsRequested = output<void>();

  logout() {
    this.authService.logout();
  }

  openNewTask() {
    this.taskModalService.open();
  }
  
  openSettings() {
    this.settingsRequested.emit();
  }

  viewService = inject(ViewService);
  
  setView(view: 'list' | 'calendar') {
    this.viewService.activeView.set(view);
  }

}
