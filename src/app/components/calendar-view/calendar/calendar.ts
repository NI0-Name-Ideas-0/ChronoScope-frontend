import { Component, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FullCalendarModule } from '@fullcalendar/angular';
import { FullCalendarComponent } from '@fullcalendar/angular';
import { CalendarOptions, EventInput } from '@fullcalendar/core';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import { EventClickArg } from '@fullcalendar/core';
import { TaskService } from '@services/task.service';
import { TaskModalService } from '@services/task-modal.service';
import rrulePlugin from '@fullcalendar/rrule';
import { WorkSlotPreferenceService } from '@services/work-slot-preference.service';
import { TimeSlot } from '@app/model/work-preference.model';

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
    private workSlotPreferenceService: WorkSlotPreferenceService,
  ) {}

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

  private formatSlotTime(hourValue: number): string {
    const safeHour = Math.max(0, Math.min(24, hourValue));
    const hours = Math.floor(safeHour);
    const minutes = Math.round((safeHour - hours) * 60);
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:00`;
  }
}
