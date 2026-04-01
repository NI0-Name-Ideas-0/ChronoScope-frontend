import { Component, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FullCalendarModule } from '@fullcalendar/angular';
import { FullCalendarComponent } from '@fullcalendar/angular';
import { CalendarOptions } from '@fullcalendar/core';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import { EventClickArg } from '@fullcalendar/core';
import { TaskService } from '@services/task.service';
import { TaskModalService } from '@services/task-modal.service';

@Component({
  selector: 'app-calendar',
  standalone: true,
  imports: [CommonModule, FullCalendarModule],
  templateUrl: './calendar.html',
  styleUrl: './calendar.css',
})
export class Calendar {
  @ViewChild('calendar') calendarRef!: FullCalendarComponent;

  constructor(
    private taskService: TaskService,
    private taskModalService: TaskModalService,
  ) {}

  calendarOptions: CalendarOptions = {
    initialView: 'dayGridMonth',
    plugins: [dayGridPlugin, timeGridPlugin],
    height: '100%',
    headerToolbar: {
      start: 'timeGridWeek dayGridMonth',
      center: 'title',
      end: 'today prev,next',
    },
  };

  ngAfterViewInit() {
    const api = this.calendarRef.getApi();

    api.setOption('eventClick', (info: EventClickArg) => {
      const index = Number(info.event.id);
      const task = this.taskService.getTasks()[index];
      if (task) this.taskModalService.openForEdit(task, index);
    });
    this.taskService.tasks$.subscribe(() => {
      api.getEvents().forEach((e) => e.remove());
      this.taskService.getAllCalendarEvents().forEach((event) => api.addEvent(event));
    });
  }
}
