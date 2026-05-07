import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TaskModal } from './task-modal';
import { TaskModalService } from '@services/task-modal.service';
import { Auth } from '@services/auth';
import { TaskService } from '@services/task.service';
import { of } from 'rxjs';

describe('TaskModal', () => {
  let component: TaskModal;
  let fixture: ComponentFixture<TaskModal>;

  const mockAuth = {
    identity$: of(null),
  };

  const mockTaskService = {
    createTask: vi.fn(),
    updateTask: vi.fn(),
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TaskModal],
      providers: [
        TaskModalService,
        { provide: Auth, useValue: mockAuth },
        { provide: TaskService, useValue: mockTaskService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(TaskModal);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
