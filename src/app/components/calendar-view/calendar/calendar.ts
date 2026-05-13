import { Component, ViewChild, Input, OnChanges, SimpleChanges, inject, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FullCalendarModule } from '@fullcalendar/angular';
import { FullCalendarComponent } from '@fullcalendar/angular';
import { CalendarOptions, EventInput } from '@fullcalendar/core';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import { EventClickArg } from '@fullcalendar/core';
import { TaskService } from '@services/task.service';
import { TaskModalService } from '@services/task-modal.service';
import { ViewService } from '@services/view.service';
import rrulePlugin from '@fullcalendar/rrule';
import { Task } from '@app/model/task';

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

  tasks: Task[] = [];

  constructor(
    private taskService: TaskService,
    private taskModalService: TaskModalService,
  ) {
    this.taskService.tasks$.subscribe((tasks) => {
      this.tasks = tasks;
      if (this.calendarRef) {
        this.refreshEvents();
      }
    });
  }

  filterEffect = effect(() => {
    // React to filter signal changes
    const orgId = this.viewService.selectedOrganizationId();
    const activeFilter = this.viewService.activeFilter();

    if (this.calendarRef) {
      this.refreshEvents();
    }
  });

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
        const task = await this.taskService.getTask(Number(info.event.id.split('-')[0]));
        if (task) this.taskModalService.openForEdit(task);
      } catch (error) {
        console.error('Error fetching task:', error);
      }
    });

    this.refreshEvents();

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

  private refreshEvents() {
    const api = this.calendarRef.getApi();
    api.getEvents().forEach((e) => e.remove());
    this.getFilteredEvents().forEach((event) => api.addEvent(event));
  }

  private getFilteredEvents(): EventInput[] {
    let filteredTasks = this.tasks;

    const orgId = this.viewService.selectedOrganizationId();
    if (orgId) {
      filteredTasks = filteredTasks.filter((t) => t.organizationId === orgId);
    }

    const activeFilter = this.viewService.activeFilter();
    if (activeFilter) {
      if (activeFilter.type === 'label') {
        filteredTasks = filteredTasks.filter((t) =>
          t.labels?.includes(activeFilter.value as string),
        );
      } else if (activeFilter.type === 'task') {
        filteredTasks = filteredTasks.filter((t) => t.id === activeFilter.value);
      }
    }

    return filteredTasks.flatMap((task) => this.taskService.toCalendarEvents(task));
  }
}
