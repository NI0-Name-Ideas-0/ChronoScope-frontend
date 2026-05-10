import { Component, ViewChild, Input, OnChanges, SimpleChanges, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FullCalendarModule } from '@fullcalendar/angular';
import { FullCalendarComponent } from '@fullcalendar/angular';
import { CalendarOptions } from '@fullcalendar/core';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import { EventClickArg } from '@fullcalendar/core';
import { TaskService } from '@services/task.service';
import { TaskModalService } from '@services/task-modal.service';
import { ViewService } from '@services/view.service';
import rrulePlugin from '@fullcalendar/rrule';

@Component({
  selector: 'app-calendar',
  standalone: true,
  imports: [CommonModule, FullCalendarModule],
  templateUrl: './calendar.html',
  styleUrl: './calendar.css',
})
export class Calendar implements OnChanges {
  @ViewChild('calendar') calendarRef!: FullCalendarComponent;
  @Input() focusDate: Date | null = null;

  private viewService = inject(ViewService);

  constructor(
    private taskService: TaskService,
    private taskModalService: TaskModalService,
  ) {}

  calendarOptions: CalendarOptions = {
    initialView: 'dayGridMonth',
    plugins: [dayGridPlugin, timeGridPlugin, rrulePlugin],
    height: '100%',
    locale: 'en-GB',
    slotLabelFormat: {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    },
    eventTimeFormat: {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    },
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

    // Handle jump-to-date when the calendar is recreated after the signal was already set
    if (this.focusDate) {
      api.gotoDate(this.focusDate);
      this.viewService.jumpToDate.set(null);
    }
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['focusDate'] && this.focusDate && this.calendarRef) {
      this.calendarRef.getApi().gotoDate(this.focusDate);
      this.viewService.jumpToDate.set(null);
    }
  }
}
