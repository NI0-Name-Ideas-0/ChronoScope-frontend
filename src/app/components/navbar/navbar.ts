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
  setCalendarView(){
    if(this.viewService.listView){
      this.viewService.calendarView = !this.viewService.calendarView;
    }else{
      this.viewService.calendarView = true;
    }
  }

  setListView(){
    if(this.viewService.calendarView){
      this.viewService.listView = !this.viewService.listView;
    }else{
      this.viewService.listView = true;
    }
  }
}
