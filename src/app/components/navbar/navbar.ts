import { Component, ChangeDetectionStrategy, inject, output } from '@angular/core';
import { Auth } from '@services/auth';
import { AfterViewInit, Component, ChangeDetectionStrategy, DestroyRef, ElementRef, inject, output, viewChild } from '@angular/core';
import { TaskModalService } from '@services/task-modal.service';
import { ThemeService } from '@services/theme.service';
import { ViewService } from '@services/view.service';
import { TaskService } from '@services/task.service';

@Component({
  selector: 'app-navbar',
  imports: [],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './navbar.html',
  styleUrl: './navbar.css',
})
export class Navbar implements AfterViewInit {

  constructor(
    private taskModalService: TaskModalService,
    private taskService: TaskService,
  ) { }
  private authService = inject(Auth);
  private themeService = inject(ThemeService);
  private destroyRef = inject(DestroyRef);

  private asideEl = viewChild<ElementRef<HTMLElement>>('navbarAside');
  private dropdownMenuEl = viewChild<ElementRef<HTMLElement>>('themeDropdownMenu');

  settingsRequested = output<void>();

  ngAfterViewInit() {
    const aside = this.asideEl()?.nativeElement;
    const dropdownMenu = this.dropdownMenuEl()?.nativeElement;

    if (aside) {
      this.themeService.applyThemeToElement('dark', aside);
    }

    if (dropdownMenu) {
      const cleanup = this.themeService.applyCurrentThemeToElement(dropdownMenu);
      this.destroyRef.onDestroy(cleanup);
    }
  }

  logout() {
    this.authService.logout();
  }

  openNewTask() {
    this.taskModalService.open();
  }

  openSettings() {
    this.settingsRequested.emit();
  }

  planTasks() {
    this.taskService.planTasks();
  }
  /*
  Import of the View Service for changing the view via the functions
  */
  viewService = inject(ViewService);
  setCalendarView(){
    if(this.viewService.listView){
      this.viewService.toggleCalendar();
    }else{
      this.viewService.setCalendarView(true);
    }
  }

  setListView(){
    if(this.viewService.calendarView){
      this.viewService.toggleList();
    }else{
      this.viewService.setListView(true);
    }
  }
}
