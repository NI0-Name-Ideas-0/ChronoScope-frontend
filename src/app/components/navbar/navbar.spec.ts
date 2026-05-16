import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Navbar } from './navbar';
import { Auth } from '@services/auth';
import { TaskModalService } from '@services/task-modal.service';
import { ThemeService } from '@services/theme.service';
import { ViewService } from '@services/view.service';
import { TaskService } from '@services/task.service';
import { of } from 'rxjs';

const mockAuthService = {
  logout: vi.fn(),
  identity$: of(null),
  getIdentityData: vi.fn().mockReturnValue({ organizations: [] }),
};

const mockTaskModalService = {
  open: vi.fn(),
};

const mockThemeService = {
  applyThemeToElement: vi.fn(),
  applyCurrentThemeToElement: vi.fn().mockReturnValue(vi.fn()),
};

class MockTaskService {
  tasks$ = of([]);
  getAllTasks() {
    return [];
  }
  planTasks = vi.fn();
}

describe('Navbar', () => {
  let component: Navbar;
  let fixture: ComponentFixture<Navbar>;

  beforeEach(async () => {
    TestBed.resetTestingModule();
    await TestBed.configureTestingModule({
      imports: [Navbar],
      providers: [
        { provide: Auth, useValue: mockAuthService },
        { provide: TaskModalService, useValue: mockTaskModalService },
        { provide: ThemeService, useValue: mockThemeService },
        ViewService,
        { provide: TaskService, useClass: MockTaskService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(Navbar);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should call auth logout', () => {
    component.logout();
    expect(mockAuthService.logout).toHaveBeenCalled();
  });

  it('should open new task modal', () => {
    component.openNewTask();
    expect(mockTaskModalService.open).toHaveBeenCalled();
  });

  it('should emit settingsRequested', () => {
    const spy = vi.fn();
    component.settingsRequested.subscribe(spy);
    component.openSettings();
    expect(spy).toHaveBeenCalled();
  });

  it('should toggle calendar view', () => {
    const viewService = component.viewService;
    viewService.setListView(true);
    viewService.setCalendarView(false);
    component.setCalendarView();
    expect(viewService.calendarView).toBe(true);
  });

  it('should toggle list view', () => {
    const viewService = component.viewService;
    viewService.setCalendarView(true);
    viewService.setListView(false);
    component.setListView();
    expect(viewService.listView).toBe(true);
  });
});
