import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RRule, rrulestr } from 'rrule';

@Component({
  selector: 'app-repetition-field',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl:'repetition-modal.html',
  styleUrl:'repetition-modal.css'
})
export class RepetitionFieldComponent {
  @Input() set value(rrule: string) {
    if (rrule && rrule !== this._rrule) {
      this._rrule = rrule;
      this.parseRrule(rrule);
    }
  }
  @Input() dtstart: Date = new Date();
  @Input() endDate: Date | null = null;
  @Output() valueChange = new EventEmitter<string>();

  endDateInput: string = '';
  
  dateError: string | null = null;
  endDateError: string | null = null;
  intervalError: string | null = null;
  isOpen = false;
  displayText = 'no repetition';
  private _rrule = '';

  config = {
    frequency: 'none' as 'none' | 'daily' | 'weekly' | 'monthly',
    interval: 1,
    weekdays: [] as number[]
  };

  weekDays = [
    { label: 'Mo', value: RRule.MO.weekday },
    { label: 'Tu', value: RRule.TU.weekday },
    { label: 'We', value: RRule.WE.weekday },
    { label: 'Th', value: RRule.TH.weekday },
    { label: 'Fr', value: RRule.FR.weekday },
    { label: 'Sa', value: RRule.SA.weekday },
    { label: 'Su', value: RRule.SU.weekday }
  ];

  openModal() {
    this.dateError = null;
    this.endDateError = null;

    if (!this.isDateValid(this.dtstart)) {
      this.dateError = 'Please select a correct date and time.';
      return;
    }
    if (this.endDate === null || !this.isDateValid(this.endDate)) {
      this.endDateError = 'Please select a correct date and time.';
      return;
    }
    this.syncEndDateInput();
    this.isOpen = true;
  }

  private isDateValid(date: Date): boolean {
    return date instanceof Date && !isNaN(date.getTime()) && date.getTime() > 0;
  }

  private syncEndDateInput(): void {
    if (this.endDate && this.isDateValid(this.endDate)) {
      const y = this.endDate.getFullYear();
      const m = String(this.endDate.getMonth() + 1).padStart(2, '0');
      const d = String(this.endDate.getDate()).padStart(2, '0');
      this.endDateInput = `${y}-${m}-${d}`;
    } else {
      this.endDateInput = '';
    }
  }

  closeModal() {
    this.isOpen = false;
    this.dateError = null;
    this.endDateError = null;
    this.intervalError = null;
  }

  private isEndDateValid(): boolean {
    if (this.endDateInput === '') {
      return false;
    }
    const parsed = new Date(this.endDateInput + 'T00:00:00');
    if (!this.isDateValid(parsed)) {
      return false;
    }
    this.endDate = parsed;
    return true;
  }

  validateInterval(): boolean {
    const interval = this.config.interval;
    if (!Number.isInteger(interval) || interval < 1) {
      this.intervalError = 'Please select a correct interval.';
      return false;
    }
    this.intervalError = null;
    return true;
  }

  toggleWeekday(value: number) {
    const idx = this.config.weekdays.indexOf(value);
    idx > -1 ? this.config.weekdays.splice(idx, 1) : this.config.weekdays.push(value);
  }

  apply() {
    const { frequency, interval, weekdays } = this.config;

    if (frequency === 'none') {
      this.displayText = 'no repetition';
      this.valueChange.emit('');
      this.isOpen = false;
      return;
    }

    if (!this.validateInterval()) {
      return;
    }

    if (!this.isEndDateValid()) {
      this.endDateError = 'Please select a correct date and time.';
      return;
    }
    this.endDateError = null;

    const freqMap = { daily: RRule.DAILY, weekly: RRule.WEEKLY, monthly: RRule.MONTHLY };
    const ruleOptions: any = {
      freq: freqMap[frequency],
      interval,
      byweekday: weekdays.length ? weekdays : undefined,
      dtstart: this.dtstart,
    };
    if (this.endDate) {
      ruleOptions.until = this.endDate;
    }
    const rule = new RRule(ruleOptions);

    // generating diplay text
    if (frequency === 'daily') {
      this.displayText = interval === 1 ? 'daily' : `every ${interval} days`;
    } else if (frequency === 'weekly') {
      const days = weekdays.sort().map(d => this.weekDays.find(w => w.value === d)?.label).join(', ');
      this.displayText = interval === 1 ? `weekly${days ? ' on ' + days : ''}` : `every ${interval} weeks${days ? ' on ' + days : ''}`;
    } else {
      this.displayText = interval === 1 ? 'monthly' : `every ${interval} months`;
    }

    this.valueChange.emit(rule.toString());
    this.isOpen = false;
  }

  private parseRrule(rrule: string) {
    try {
      const rule = rrulestr(rrule);
      const options = rule.options;
      const freqMap: Partial<Record<number, 'daily' | 'weekly' | 'monthly'>> = {
        [RRule.DAILY]: 'daily',
        [RRule.WEEKLY]: 'weekly',
        [RRule.MONTHLY]: 'monthly',
      };

      const frequency = freqMap[options.freq as number];
      if (!frequency) {
        this.config.frequency = 'none';
        this.config.weekdays = [];
        this.displayText = 'no repetition';
        return;
      }
      this.config.frequency = frequency;
      this.config.interval = Math.max(1, Math.round(options.interval || 1));

      const weekdaysRaw = Array.isArray(options.byweekday)
        ? options.byweekday
        : options.byweekday
          ? [options.byweekday]
          : [];
      this.config.weekdays = weekdaysRaw
        .map((day: any) => (typeof day === 'number' ? day : day?.weekday))
        .filter((day: number) => Number.isFinite(day));

      if (this.config.frequency === 'daily') {
        this.displayText = this.config.interval === 1
          ? 'daily'
          : `every ${this.config.interval} days`;
      } else if (this.config.frequency === 'weekly') {
        const days = this.config.weekdays
          .slice()
          .sort()
          .map((d) => this.weekDays.find((w) => w.value === d)?.label)
          .filter(Boolean)
          .join(', ');
        this.displayText = this.config.interval === 1
          ? `weekly${days ? ' on ' + days : ''}`
          : `every ${this.config.interval} weeks${days ? ' on ' + days : ''}`;
      } else {
        this.displayText = this.config.interval === 1
          ? 'monthly'
          : `every ${this.config.interval} months`;
      }
    } catch {
      // ignore invalid string
    }
  }
}
