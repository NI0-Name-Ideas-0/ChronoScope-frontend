import { Component, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FullCalendarModule } from '@fullcalendar/angular';
import { FullCalendarComponent } from '@fullcalendar/angular';
import { CalendarOptions } from '@fullcalendar/core';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import { TaskService } from '@services/task.service';

@Component({
  selector: 'app-calendar',
  standalone: true,
  imports: [CommonModule, FullCalendarModule],
  templateUrl: './calendar.html',
  styleUrl: './calendar.css',
})
export class Calendar {
  @ViewChild('calendar') calendarRef!: FullCalendarComponent;

  constructor(private taskService: TaskService) {}

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
    this.taskService.tasks$.subscribe(() => {
      api.getEvents().forEach((e) => e.remove());
      this.taskService.getAllCalendarEvents().forEach((event) => api.addEvent(event));
    });

    api.addEvent({
      id: '0',
      start: new Date(),
      end: new Date(new Date().getTime() + 2 * 60 * 60 * 1000),
    });
  }
}
