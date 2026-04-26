import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { By } from '@angular/platform-browser';
import { RepetitionFieldComponent } from './repetition-modal';
import { RRule } from 'rrule';

describe('RepetitionFieldComponent', () => {
  let component: RepetitionFieldComponent;
  let fixture: ComponentFixture<RepetitionFieldComponent>;
  let emittedValue: string | null;

  beforeEach(async () => {
    emittedValue = null;
    await TestBed.configureTestingModule({
      imports: [FormsModule, RepetitionFieldComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(RepetitionFieldComponent);
    component = fixture.componentInstance;

    // Auf Output subscriben statt spyOn
    component.valueChange.subscribe((v: string) => {
      emittedValue = v;
    });

    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should display "no repetition" by default', () => {
    const input = fixture.debugElement.query(By.css('input[readonly]'));
    expect(input.nativeElement.value).toBe('no repetition');
  });

  describe('openModal', () => {
    it('should open modal when dtstart is valid', () => {
      component.dtstart = new Date('2026-04-26T09:00:00');
      component.openModal();
      expect(component.isOpen).toBe(true);
      expect(component.dateError).toBeNull();
    });

    it('should NOT open modal when dtstart is invalid', () => {
      component.dtstart = new Date(''); // Invalid Date
      component.openModal();
      expect(component.isOpen).toBe(false);
      expect(component.dateError).toBe('Please select a start date and time first.');
    });

    it('should NOT open modal when dtstart is epoch 0', () => {
      component.dtstart = new Date(0);
      component.openModal();
      expect(component.isOpen).toBe(false);
      expect(component.dateError).not.toBeNull();
    });
  });

  describe('closeModal', () => {
    it('should close modal and clear dateError', () => {
      component.dtstart = new Date('2026-04-26T09:00:00');
      component.openModal();
      expect(component.isOpen).toBe(true);

      component.closeModal();
      expect(component.isOpen).toBe(false);
      expect(component.dateError).toBeNull();
    });
  });

  describe('toggleWeekday', () => {
    it('should add weekday if not selected', () => {
      component.toggleWeekday(RRule.MO.weekday);
      expect(component.config.weekdays).toContain(RRule.MO.weekday);
    });

    it('should remove weekday if already selected', () => {
      component.config.weekdays = [RRule.MO.weekday];
      component.toggleWeekday(RRule.MO.weekday);
      expect(component.config.weekdays).not.toContain(RRule.MO.weekday);
    });

    it('should allow multiple weekdays', () => {
      component.toggleWeekday(RRule.MO.weekday);
      component.toggleWeekday(RRule.WE.weekday);
      expect(component.config.weekdays).toEqual([
        RRule.MO.weekday,
        RRule.WE.weekday,
      ]);
    });
  });

  describe('apply', () => {
    beforeEach(() => {
      component.dtstart = new Date('2026-04-26T09:00:00');
    });

    it('should emit empty string and display "no repetition" for frequency none', () => {
      component.config.frequency = 'none';
      component.apply();

      expect(component.displayText).toBe('no repetition');
      expect(emittedValue).toBe('');
      expect(component.isOpen).toBe(false);
    });

    it('should emit rrule string for daily repetition', () => {
      component.config.frequency = 'daily';
      component.config.interval = 1;
      component.apply();

      expect(component.displayText).toBe('daily');
      expect(emittedValue).toMatch(/FREQ=DAILY/);
      expect(emittedValue).toMatch(/DTSTART:20260426T090000/);
    });

    it('should emit rrule string with interval for daily every 3 days', () => {
      component.config.frequency = 'daily';
      component.config.interval = 3;
      component.apply();

      expect(component.displayText).toBe('every 3 days');
      expect(emittedValue).toMatch(/INTERVAL=3/);
    });

    it('should emit rrule string for weekly repetition with weekdays', () => {
      component.config.frequency = 'weekly';
      component.config.interval = 1;
      component.config.weekdays = [RRule.MO.weekday, RRule.FR.weekday];
      component.apply();

      expect(component.displayText).toBe('weekly on Mo, Fr');
      expect(emittedValue).toMatch(/FREQ=WEEKLY/);
      expect(emittedValue).toMatch(/BYDAY=MO,FR/);
    });

    it('should emit rrule string for monthly repetition', () => {
      component.config.frequency = 'monthly';
      component.config.interval = 2;
      component.apply();

      expect(component.displayText).toBe('every 2 months');
      expect(emittedValue).toMatch(/FREQ=MONTHLY/);
      expect(emittedValue).toMatch(/INTERVAL=2/);
    });
  });

  describe('value input', () => {
    it('should update display when existing rrule value is set', () => {
      const rule = new RRule({
        freq: RRule.WEEKLY,
        interval: 2,
        dtstart: new Date('2026-04-26T09:00:00'),
      });

      component.value = rule.toString();
      fixture.detectChanges();

      const input = fixture.debugElement.query(By.css('input[readonly]'));
      expect(input.nativeElement.value).not.toBe('no repetition');
    });
  });

  describe('dtstart input', () => {
    it('should use provided dtstart in generated rrule', () => {
      const specificDate = new Date('2026-12-25T14:30:00');
      component.dtstart = specificDate;
      component.config.frequency = 'daily';
      component.config.interval = 1;
      component.apply();

      expect(emittedValue).toMatch(/DTSTART:20261225T143000/);
    });
  });

  describe('UI interactions', () => {
    it('should show dateError in template when dtstart is invalid', () => {
      component.dtstart = new Date('');
      component.openModal();
      fixture.detectChanges();

      const errorEl = fixture.debugElement.query(By.css('p.text-error'));
      expect(errorEl).toBeTruthy();
      expect(errorEl.nativeElement.textContent).toContain(
        'Please select a start date and time first'
      );
    });

    it('should add input-error class when dateError is set', () => {
      component.dtstart = new Date('');
      component.openModal();
      fixture.detectChanges();

      const input = fixture.debugElement.query(By.css('input[readonly]'));
      expect(input.classes['input-error']).toBe(true);
    });

    it('should render weekday buttons when frequency is weekly', () => {
      component.dtstart = new Date('2026-04-26T09:00:00');
      component.openModal();
      component.config.frequency = 'weekly';
      fixture.detectChanges();

      const buttons = fixture.debugElement.queryAll(By.css('button'));
      const weekdayLabels = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'];
      weekdayLabels.forEach((label) => {
        const btn = buttons.find((b) => b.nativeElement.textContent.trim() === label);
        expect(btn).toBeTruthy();
      });
    });
  });
});