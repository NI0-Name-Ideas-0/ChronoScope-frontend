import {
  Component,
  ViewChild,
  Input,
  OnChanges,
  SimpleChanges,
  inject,
  effect,
} from '@angular/core';
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
import { WorkSlotPreferenceService } from '@services/work-slot-preference.service';
import { TimeSlot } from '@app/model/work-preference.model';
import { Task, TaskColor } from '@app/model/task';

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
    private workSlotPreferenceService: WorkSlotPreferenceService,
  ) {}

  filterEffect = effect(() => {
    // React to filter signal changes
    const orgId = this.viewService.selectedOrganizationId();
    const activeFilter = this.viewService.activeFilter();

    if (this.calendarRef) {
      this.renderCalendarEvents();
    }
  });

  calendarOptions: CalendarOptions = {
    initialView: 'dayGridMonth',
    plugins: [dayGridPlugin, timeGridPlugin, rrulePlugin],
    height: '100%',
    locale: 'en-GB',
    firstDay: 1,
    weekends: true,
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
    eventOrder: 'displayOrder',
    eventContent: (arg) => this.renderEventContent(arg),
  };

  ngAfterViewInit() {
    const api = this.calendarRef.getApi();

    api.setOption('eventClick', async (info: EventClickArg) => {
      try {
        if (info.event.extendedProps?.['isWorkSlot']) {
          return;
        }
        const task = await this.taskService.getTask(Number(info.event.id.split('-')[0]));
        if (task) this.taskModalService.openForEdit(task);
      } catch (error) {
        console.error('Error fetching task:', error);
      }
    });
    this.taskService.tasks$.subscribe(() => {
      this.renderCalendarEvents();
    });

    this.workSlotPreferenceService.preferencesChanged$.subscribe(() => {
      this.renderCalendarEvents();
    });

    this.renderCalendarEvents();

    // Handle jump-to-date when the calendar is recreated after the signal was already set
    if (this.focusDate) {
      api.gotoDate(this.focusDate);
      this.viewService.jumpToDate.set(null);
    }
  }

  private async renderCalendarEvents(): Promise<void> {
    const api = this.calendarRef.getApi();
    api.getEvents().forEach((e) => e.remove());

    const taskEvents = this.taskService.getAllCalendarEvents();
    taskEvents.forEach((event) => api.addEvent(event));

    try {
      const workSlots = await this.workSlotPreferenceService.loadPreferences();
      const workSlotEvents = this.mapWorkSlotsToEvents(workSlots);
      workSlotEvents.forEach((event) => api.addEvent(event));
    } catch (error) {
      console.error('Error loading work slot preferences for calendar:', error);
    }
  }

  private mapWorkSlotsToEvents(slots: TimeSlot[]): EventInput[] {
    return slots.map((slot) => {
      const dayIndex = (slot.dayIndex + 1) % 7;

      return {
        id: `work-slot-${slot.id}`,
        daysOfWeek: [dayIndex],
        startTime: this.formatSlotTime(slot.startHour),
        endTime: this.formatSlotTime(slot.startHour + slot.durationHours),
        display: 'background',
        classNames: [`work-slot`, `work-slot-${slot.colorClass}`],
        extendedProps: {
          isWorkSlot: true,
        },
      };
    });
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

  private formatSlotTime(hourValue: number): string {
    const safeHour = Math.max(0, Math.min(24, hourValue));
    const hours = Math.floor(safeHour);
    const minutes = Math.round((safeHour - hours) * 60);
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:00`;
  }

  private renderEventContent(arg: any): { domNodes: Node[] } | null {
    if (arg?.event?.extendedProps?.['isWorkSlot']) {
      return null;
    }

    const iconType = arg?.event?.extendedProps?.['taskType'] ?? 'static';
    const isDone = Boolean(arg?.event?.extendedProps?.['isDone']);
    const viewType = arg?.view?.type ?? '';
    const isMonthView = viewType.startsWith('dayGrid');
    const color = (arg?.event?.extendedProps?.['color'] ?? 'UNSET') as TaskColor;
    const colorStyles = this.taskService.getTaskColorStyles(color);

    const container = document.createElement('div');
    container.className = isMonthView
      ? 'fc-task-content fc-task-content--month'
      : 'fc-task-content';
    Object.entries(colorStyles).forEach(([key, value]) => {
      container.style.setProperty(key, value);
    });

    const icon = document.createElement('span');
    icon.className = 'fc-task-icon';
    icon.innerHTML = this.getIconSvg(iconType);

    const title = document.createElement('span');
    title.className = 'fc-task-title';
    title.textContent = arg?.event?.title ?? '';

    if (isMonthView) {
      container.append(icon, title);
      if (isDone) {
        const doneBadge = document.createElement('span');
        doneBadge.className = 'fc-task-done';
        doneBadge.innerHTML = this.getDoneSvg();
        container.append(doneBadge);
      }
    } else {
      container.append(icon, title);
      if (isDone) {
        const doneBadge = document.createElement('span');
        doneBadge.className = 'fc-task-done fc-task-done--corner';
        doneBadge.innerHTML = this.getDoneSvg();
        container.append(doneBadge);
      }
    }

    return { domNodes: [container] };
  }

  private getIconSvg(type: string): string {
    switch (type) {
      case 'dynamic':
        return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640"><path d="M184 120C184 89.1 209.1 64 240 64L264 64C281.7 64 296 78.3 296 96L296 544C296 561.7 281.7 576 264 576L232 576C202.2 576 177.1 555.6 170 528C169.3 528 168.7 528 168 528C123.8 528 88 492.2 88 448C88 430 94 413.4 104 400C84.6 385.4 72 362.2 72 336C72 305.1 89.6 278.2 115.2 264.9C108.1 252.9 104 238.9 104 224C104 179.8 139.8 144 184 144L184 120zM456 120L456 144C500.2 144 536 179.8 536 224C536 239 531.9 253 524.8 264.9C550.5 278.2 568 305 568 336C568 362.2 555.4 385.4 536 400C546 413.4 552 430 552 448C552 492.2 516.2 528 472 528C471.3 528 470.7 528 470 528C462.9 555.6 437.8 576 408 576L376 576C358.3 576 344 561.7 344 544L344 96C344 78.3 358.3 64 376 64L400 64C430.9 64 456 89.1 456 120z"/></svg>';
      case 'static-blocker':
        return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640"><path d="M128 480C110.3 480 96 494.3 96 512C96 529.7 110.3 544 128 544C145.7 544 160 529.7 160 512C160 494.3 145.7 480 128 480zM256 96C238.3 96 224 110.3 224 128C224 145.7 238.3 160 256 160C273.7 160 288 145.7 288 128C288 110.3 273.7 96 256 96zM384 480C366.3 480 352 494.3 352 512C352 529.7 366.3 544 384 544C401.7 544 416 529.7 416 512C416 494.3 401.7 480 384 480zM256 544C273.7 544 288 529.7 288 512C288 494.3 273.7 480 256 480C238.3 480 224 494.3 224 512C224 529.7 238.3 544 256 544zM384 96C366.3 96 352 110.3 352 128C352 145.7 366.3 160 384 160C401.7 160 416 145.7 416 128C416 110.3 401.7 96 384 96zM512 544C529.7 544 544 529.7 544 512C544 494.3 529.7 480 512 480C494.3 480 480 494.3 480 512C480 529.7 494.3 544 512 544zM512 160C529.7 160 544 145.7 544 128C544 110.3 529.7 96 512 96C494.3 96 480 110.3 480 128C480 145.7 494.3 160 512 160zM128 96C110.3 96 96 110.3 96 128C96 145.7 110.3 160 128 160C145.7 160 160 145.7 160 128C160 110.3 145.7 96 128 96zM512 416C529.7 416 544 401.7 544 384C544 366.3 529.7 352 512 352C494.3 352 480 366.3 480 384C480 401.7 494.3 416 512 416zM128 224C110.3 224 96 238.3 96 256C96 273.7 110.3 288 128 288C145.7 288 160 273.7 160 256C160 238.3 145.7 224 128 224zM128 416C145.7 416 160 401.7 160 384C160 366.3 145.7 352 128 352C110.3 352 96 366.3 96 384C96 401.7 110.3 416 128 416zM512 224C494.3 224 480 238.3 480 256C480 273.7 494.3 288 512 288C529.7 288 544 273.7 544 256C544 238.3 529.7 224 512 224z"/></svg>';
      case 'static':

      default:
        return '';
    }
  }

  private getDoneSvg(): string {
    return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640"><path d="M530.8 134.1C545.1 144.5 548.3 164.5 537.9 178.8L281.9 530.8C276.4 538.4 267.9 543.1 258.5 543.9C249.1 544.7 240 541.2 233.4 534.6L105.4 406.6C92.9 394.1 92.9 373.8 105.4 361.3C117.9 348.8 138.2 348.8 150.7 361.3L252.2 462.8L486.2 141.1C496.6 126.8 516.6 123.6 530.9 134z"/></svg>';
  }
}
