// repetition-field.component.ts
import { Component, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

export interface RepetitionConfig {
  frequency: 'none' | 'daily' | 'weekly' | 'monthly';
  interval: number;
  weekdays: number[];
}

@Component({
  selector: 'app-repetition-field',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: 'repetition-modal.html',
  styleUrl: 'repetition-modal.css',
})
export class RepetitionFieldComponent {
  @Output() repetitionChange = new EventEmitter<RepetitionConfig>();

  isOpen = false;
  displayText = 'no repetition';

  config: RepetitionConfig = {
    frequency: 'none',
    interval: 1,
    weekdays: []
  };

  weekDays = [
    { label: 'Mo', value: 1 },//RRule.MO.weekday },
    { label: 'Tu', value: 2 },//RRule.TU.weekday },
    { label: 'We', value: 3 },//RRule.WE.weekday },
    { label: 'Th', value: 4 },//RRule.TH.weekday },
    { label: 'Fr', value: 5 },//RRule.FR.weekday },
    { label: 'Sa', value: 6 },//RRule.SA.weekday },
    { label: 'Su', value: 0 },//RRule.SU.weekday }
  ];

  openModal() { this.isOpen = true; }
  closeModal() { this.isOpen = false; }

  toggleWeekday(value: number) {
    const idx = this.config.weekdays.indexOf(value);
    idx > -1 ? this.config.weekdays.splice(idx, 1) : this.config.weekdays.push(value);
  }

  apply() {
    const { frequency, interval, weekdays } = this.config;

    if (frequency === 'none') {
      this.displayText = 'no repetition';
    } else if (frequency === 'daily') {
      this.displayText = interval === 1 ? 'daily' : `every ${interval} days`;
    } else if (frequency === 'weekly') {
      const days = weekdays.sort().map(d => this.weekDays.find(w => w.value === d)?.label).join(', ');
      this.displayText = interval === 1 ? `weekly${days ? ' on ' + days : ''}` : `every ${interval} weeks${days ? ' on ' + days : ''}`;
    } else if (frequency === 'monthly') {
      this.displayText = interval === 1 ? 'monthly' : `every ${interval} months`;
    }

    this.repetitionChange.emit({ ...this.config });
    this.isOpen = false;
  }
}