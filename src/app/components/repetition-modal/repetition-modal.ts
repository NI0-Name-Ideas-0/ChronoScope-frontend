import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RRule, rrulestr } from 'rrule';
import { TaskModal } from '../task-modal/task-modal';

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
  @Output() valueChange = new EventEmitter<string>();
  
  dateError: string | null = null;
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
    if (!this.isDtstartValid()) {
      this.dateError = 'Please select a date and time first.';
      return;
    }
    this.dateError = null;
    this.isOpen = true;
  }

  private isDtstartValid(): boolean {
    return this.dtstart instanceof Date && 
           !isNaN(this.dtstart.getTime()) && 
           this.dtstart.getTime() > 0;
  }

  closeModal() {
    this.isOpen = false;
    this.dateError = null;
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

    const freqMap = { daily: RRule.DAILY, weekly: RRule.WEEKLY, monthly: RRule.MONTHLY };
    const rule = new RRule({
      freq: freqMap[frequency],
      interval,
      byweekday: weekdays.length ? weekdays : undefined,
      dtstart: this.dtstart,
    });

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
      // mapping to config
      this.config.interval = options.interval || 1;
    } catch {
      // ignore invalid string
    }
  }
}