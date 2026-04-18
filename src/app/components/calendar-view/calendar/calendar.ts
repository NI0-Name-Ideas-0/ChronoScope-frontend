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

    api.setOption('eventClick', async (info: EventClickArg) => {
      try {
        const task = await this.taskService.getTask(Number(info.event.id));
        if (task) this.taskModalService.openForEdit(task);
      } catch (error) {
        console.error('Error fetching task:', error);
      }
    });
    this.taskService.tasks$.subscribe(() => {
      api.getEvents().forEach((e) => e.remove());
      this.taskService.getAllCalendarEvents().forEach((event) => api.addEvent(event));
    });
  }
}
