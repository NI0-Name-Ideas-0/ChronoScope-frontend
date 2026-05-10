import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Topbar } from './topbar';
import { ViewService } from '@services/view.service';

describe('Topbar', () => {
  let component: Topbar;
  let fixture: ComponentFixture<Topbar>;
  let viewService: ViewService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Topbar],
      providers: [ViewService],
    }).compileComponents();

    fixture = TestBed.createComponent(Topbar);
    component = fixture.componentInstance;
    viewService = TestBed.inject(ViewService);
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should update viewService searchTask on input', () => {
    const input = fixture.nativeElement.querySelector('input[type="text"]');
    input.value = 'Test query';
    input.dispatchEvent(new Event('input'));

    expect(viewService.searchTask()).toBe('Test query');
  });

  it('should clear search when clear button is clicked', () => {
    viewService.searchTask.set('Test query');
    fixture.detectChanges();

    const clearButton = fixture.nativeElement.querySelector('button[title="Clear search"]');
    expect(clearButton).toBeTruthy();

    clearButton.click();

    expect(viewService.searchTask()).toBe('');
  });

  it('should not show clear button when search is empty', () => {
    viewService.searchTask.set('');
    fixture.detectChanges();

    const clearButton = fixture.nativeElement.querySelector('button[title="Clear search"]');
    expect(clearButton).toBeFalsy();
  });
});
