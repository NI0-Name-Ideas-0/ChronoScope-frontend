import { Component, viewChild } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule, NgModel } from '@angular/forms';
import { FormFieldComponent } from './form-field';
import { getTranslocoTestingModule } from '@test-utils/transloco-testing';

@Component({
  imports: [FormsModule, FormFieldComponent],
  template: `
    <app-form-field
      [control]="nameCtrl"
      [label]="'TASK_MODAL_TITLE_LABEL'"
      [required]="true"
      [formSubmitted]="submitted"
      [errorMap]="{ required: 'VALIDATION_REQUIRED' }"
      [fieldId]="'task-title'"
    >
      <input
        type="text"
        [(ngModel)]="name"
        #nameCtrl="ngModel"
        required
      />
    </app-form-field>
  `,
})
class TestHostComponent {
  name = '';
  submitted = false;
  nameModel = viewChild<NgModel>('nameCtrl');
}

describe('FormFieldComponent', () => {
  let fixture: ComponentFixture<TestHostComponent>;
  let host: TestHostComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TestHostComponent, getTranslocoTestingModule()],
    }).compileComponents();

    fixture = TestBed.createComponent(TestHostComponent);
    host = fixture.componentInstance;
    fixture.detectChanges();
    await fixture.whenStable();
  });

  it('does not show error when pristine and untouched', () => {
    const errorEl = fixture.nativeElement.querySelector('[role="alert"]');
    expect(errorEl).toBeNull();
  });

  it('shows error after control is touched (blur)', async () => {
    const input = fixture.nativeElement.querySelector('input') as HTMLInputElement;
    input.dispatchEvent(new Event('focusout', { bubbles: true }));
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const errorEl = fixture.nativeElement.querySelector('[role="alert"]');
    expect(errorEl).not.toBeNull();
    expect(errorEl.textContent).toContain('This field is required');
  });

  it('shows error when formSubmitted is true even if untouched', async () => {
    host.submitted = true;
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const errorEl = fixture.nativeElement.querySelector('[role="alert"]');
    expect(errorEl).not.toBeNull();
    expect(errorEl.textContent).toContain('This field is required');
  });

  it('hides error when control becomes valid', async () => {
    host.submitted = true;
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    // Confirm error is showing
    expect(fixture.nativeElement.querySelector('[role="alert"]')).not.toBeNull();

    // Make valid
    const input = fixture.nativeElement.querySelector('input') as HTMLInputElement;
    input.value = 'Valid title';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const errorEl = fixture.nativeElement.querySelector('[role="alert"]');
    expect(errorEl).toBeNull();
  });

  it('renders correct translation key from errorMap', async () => {
    const input = fixture.nativeElement.querySelector('input') as HTMLInputElement;
    input.dispatchEvent(new Event('focusout', { bubbles: true }));
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const errorText = fixture.nativeElement.querySelector('.text-error.text-xs');
    expect(errorText.textContent.trim()).toBe('This field is required');
  });

  it('error element has role="alert" attribute', async () => {
    const input = fixture.nativeElement.querySelector('input') as HTMLInputElement;
    input.dispatchEvent(new Event('focusout', { bubbles: true }));
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const errorEl = fixture.nativeElement.querySelector('[role="alert"]');
    expect(errorEl).not.toBeNull();
    expect(errorEl.getAttribute('role')).toBe('alert');
  });

  it('error element id matches fieldId-error pattern', async () => {
    const input = fixture.nativeElement.querySelector('input') as HTMLInputElement;
    input.dispatchEvent(new Event('focusout', { bubbles: true }));
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const errorEl = fixture.nativeElement.querySelector('#task-title-error');
    expect(errorEl).not.toBeNull();
  });

  it('label renders with asterisk when required is true', () => {
    const asterisk = fixture.nativeElement.querySelector('.text-error[aria-hidden="true"]');
    expect(asterisk).not.toBeNull();
    expect(asterisk.textContent.trim()).toBe('*');
  });
});
