import { Component, inject } from '@angular/core';
import { Auth } from '@services/auth'
import { TaskModalService } from '@services/task-modal.service';

@Component({
  selector: 'app-navbar',
  imports: [],
  templateUrl: './navbar.html',
  styleUrl: './navbar.css',
})
export class Navbar {
  private authService: Auth = inject(Auth);
  constructor(private taskModalService: TaskModalService) { }

  logout() {
    this.authService.logout();
  }

  openNewTask() {
    this.taskModalService.open();
  }
}
