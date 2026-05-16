import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Topbar } from './topbar';
import { ViewService } from '@services/view.service';
import { TaskService } from '@services/task.service';
import { Auth } from '@services/auth';
import { of } from 'rxjs';

class MockTaskService {
  tasks$ = of([]);
  getAllTasks() {
    return [];
  }
}

class MockAuth {
  identity$ = of(null);
}

describe('Topbar', () => {
  let component: Topbar;
  let fixture: ComponentFixture<Topbar>;
  let viewService: ViewService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Topbar],
      providers: [
        ViewService,
        { provide: TaskService, useClass: MockTaskService },
        { provide: Auth, useClass: MockAuth },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(Topbar);
    component = fixture.componentInstance;
    viewService = TestBed.inject(ViewService);
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should update viewService searchQuery on input', () => {
    const input = fixture.nativeElement.querySelector('input[type="text"]');
    input.value = 'Test query';
    input.dispatchEvent(new Event('input'));

    expect(viewService.searchQuery()).toBe('Test query');
  });

  it('should clear all filters when clear button is clicked', () => {
    viewService.searchQuery.set('Test query');
    viewService.selectedOrganizationId.set('org-1');
    viewService.activeFilter.set({ type: 'label', value: 'work' });
    fixture.detectChanges();

    const clearButton = fixture.nativeElement.querySelector('button[title="Clear search"]');
    expect(clearButton).toBeTruthy();

    clearButton.click();

    expect(viewService.searchQuery()).toBe('');
    expect(viewService.selectedOrganizationId()).toBeNull();
    expect(viewService.activeFilter()).toBeNull();
  });

  it('should not show clear button when no filters are active', () => {
    viewService.searchQuery.set('');
    viewService.selectedOrganizationId.set(null);
    viewService.activeFilter.set(null);
    fixture.detectChanges();

    const clearButton = fixture.nativeElement.querySelector('button[title="Clear search"]');
    expect(clearButton).toBeFalsy();
  });

  it('should open dropdown on input focus', () => {
    expect(component.isDropdownOpen()).toBe(false);

    const input = fixture.nativeElement.querySelector('input[type="text"]');
    input.dispatchEvent(new Event('focus'));

    expect(component.isDropdownOpen()).toBe(true);
  });
});
