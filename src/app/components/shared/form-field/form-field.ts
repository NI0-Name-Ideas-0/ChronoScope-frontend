import { Component, ChangeDetectionStrategy, computed, inject, input, signal } from '@angular/core';
import { NgControl } from '@angular/forms';
import { TranslocoPipe } from '@jsverse/transloco';
import { ValidationService } from '@services/validation.service';

@Component({
  selector: 'app-form-field',
  imports: [TranslocoPipe],
  templateUrl: './form-field.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    // focusout bubbles from projected content, allowing OnPush to re-check
    '(focusout)': 'onFocusOut()',
    '(input)': 'onInputChange()',
  },
})
export class FormFieldComponent {
  private readonly validationService = inject(ValidationService);

  control = input<NgControl | null>(null);
  label = input('');
  required = input(false);
  formSubmitted = input(false);
  errorMap = input<Record<string, string>>({});
  fieldId = input('');

  private readonly touched = signal(false);

  protected onFocusOut(): void {
    this.touched.set(true);
  }

  protected onInputChange(): void {
    // Marks component dirty so OnPush re-evaluates error state
  }

  protected get shouldShowError(): boolean {
    const ctrl = this.control();
    if (!ctrl || !ctrl.invalid) return false;
    return this.touched() || this.formSubmitted();
  }

  protected get errorTranslationKey(): string | null {
    const ctrl = this.control();
    if (!ctrl || !ctrl.errors) return null;
    return this.validationService.getErrorTranslationKey(ctrl.errors, this.errorMap());
  }

  protected get errorParams(): Record<string, unknown> {
    const ctrl = this.control();
    if (!ctrl || !ctrl.errors) return {};
    return this.validationService.getErrorParams(ctrl.errors);
  }

  protected get errorId(): string {
    const id = this.fieldId();
    return id ? `${id}-error` : '';
  }
}
