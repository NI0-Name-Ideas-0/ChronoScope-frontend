import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, BehaviorSubject } from 'rxjs';
import { UpcomingBadge } from './upcoming-badge';
import { TaskService } from '@services/task.service';
import { Auth } from '@services/auth';
import { getTranslocoTestingModule } from '@test-utils/transloco-testing';
import { AlgoTask } from '@app/model/algo-task';
import { StaticTask } from '@app/model/static-task';
import { Scope } from '@app/model/scope';
import { Task } from '@app/model/task';

class MockTaskService {
  tasks$ = new BehaviorSubject<Task[]>([]);
  getAllTasks() {
    return this.tasks$.value;
  }
  updateTask = vi.fn().mockResolvedValue({});
  saveTaskCompletion = vi.fn();
}

class MockAuth {
  authReady$ = of(false);
  identity$ = of(null);
}

describe('UpcomingBadge', () => {
  let component: UpcomingBadge;
  let fixture: ComponentFixture<UpcomingBadge>;
  let taskService: MockTaskService;

  const fixedNow = new Date('2026-05-17T12:00:00Z');

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UpcomingBadge, getTranslocoTestingModule()],
      providers: [
        { provide: TaskService, useClass: MockTaskService },
        { provide: Auth, useClass: MockAuth },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(UpcomingBadge);
    component = fixture.componentInstance;
    taskService = TestBed.inject(TaskService) as unknown as MockTaskService;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('computeUpcoming', () => {
    it('should show no entry when there are no tasks', () => {
      (component as any).now.set(fixedNow);
      taskService.tasks$.next([]);
      expect(component.currentEntry()).toBeNull();
    });

    it('should show upcoming static task', () => {
      (component as any).now.set(fixedNow);
      const scope = new Scope(
        new Date('2026-05-17T13:00:00Z'),
        new Date('2026-05-17T14:00:00Z'),
      );
      const task = new StaticTask(1, 'Static Upcoming', '', [], scope, null, 'EASY');
      taskService.tasks$.next([task]);
      expect(component.currentEntry()).not.toBeNull();
      expect(component.currentEntry()?.task.title).toBe('Static Upcoming');
      expect(component.currentEntry()?.state).toBe('upcoming');
      expect(component.currentEntry()?.taskType).toBe('static');
    });

    it('should show active static task', () => {
      (component as any).now.set(fixedNow);
      const scope = new Scope(
        new Date('2026-05-17T11:00:00Z'),
        new Date('2026-05-17T13:00:00Z'),
      );
      const task = new StaticTask(1, 'Static Active', '', [], scope, null, 'EASY');
      taskService.tasks$.next([task]);
      expect(component.currentEntry()?.state).toBe('active');
    });

    it('should not show overdue static task (filtered out)', () => {
      (component as any).now.set(fixedNow);
      const scope = new Scope(
        new Date('2026-05-17T09:00:00Z'),
        new Date('2026-05-17T10:00:00Z'),
      );
      const task = new StaticTask(1, 'Static Overdue', '', [], scope, null, 'EASY');
      taskService.tasks$.next([task]);
      expect(component.currentEntry()).toBeNull();
    });

    it('should show upcoming algo task', () => {
      (component as any).now.set(fixedNow);
      const scope = new Scope(
        new Date('2026-05-17T13:00:00Z'),
        new Date('2026-05-17T14:00:00Z'),
      );
      const task = new AlgoTask(
        1,
        'Algo Upcoming',
        '',
        new Date('2026-05-01'),
        new Date('2026-05-20'),
        120,
        0,
        [],
        [],
        null,
        [scope],
        'EASY',
        false,
        'UNSET',
        30,
        120,
      );
      taskService.tasks$.next([task]);
      expect(component.currentEntry()?.task.title).toBe('Algo Upcoming');
      expect(component.currentEntry()?.state).toBe('upcoming');
      expect(component.currentEntry()?.taskType).toBe('dynamic');
    });

    it('should show active algo task', () => {
      (component as any).now.set(fixedNow);
      const scope = new Scope(
        new Date('2026-05-17T11:00:00Z'),
        new Date('2026-05-17T13:00:00Z'),
      );
      const task = new AlgoTask(
        1,
        'Algo Active',
        '',
        new Date('2026-05-01'),
        new Date('2026-05-20'),
        120,
        0,
        [],
        [],
        null,
        [scope],
        'EASY',
        false,
        'UNSET',
        30,
        120,
      );
      taskService.tasks$.next([task]);
      expect(component.currentEntry()?.state).toBe('active');
    });

    it('should show overdue algo task', () => {
      (component as any).now.set(fixedNow);
      const scope = new Scope(
        new Date('2026-05-17T09:00:00Z'),
        new Date('2026-05-17T10:00:00Z'),
      );
      const task = new AlgoTask(
        1,
        'Algo Overdue',
        '',
        new Date('2026-05-01'),
        new Date('2026-05-20'),
        120,
        0,
        [],
        [],
        null,
        [scope],
        'EASY',
        false,
        'UNSET',
        30,
        120,
      );
      taskService.tasks$.next([task]);
      expect(component.currentEntry()?.state).toBe('overdue');
    });

    it('should prefer dynamic task when it starts earlier than static', () => {
      (component as any).now.set(fixedNow);
      const staticScope = new Scope(
        new Date('2026-05-17T13:00:00Z'),
        new Date('2026-05-17T14:00:00Z'),
      );
      const staticTask = new StaticTask(1, 'Static', '', [], staticScope, null, 'EASY');

      const dynamicScope = new Scope(
        new Date('2026-05-17T12:30:00Z'),
        new Date('2026-05-17T13:30:00Z'),
      );
      const dynamicTask = new AlgoTask(
        2,
        'Dynamic',
        '',
        new Date('2026-05-01'),
        new Date('2026-05-20'),
        120,
        0,
        [],
        [],
        null,
        [dynamicScope],
        'EASY',
        false,
        'UNSET',
        30,
        120,
      );

      taskService.tasks$.next([staticTask, dynamicTask]);
      expect(component.currentEntry()?.task.title).toBe('Dynamic');
    });

    it('should prefer static task when it starts earlier than dynamic', () => {
      (component as any).now.set(fixedNow);
      const staticScope = new Scope(
        new Date('2026-05-17T12:30:00Z'),
        new Date('2026-05-17T13:30:00Z'),
      );
      const staticTask = new StaticTask(1, 'Static', '', [], staticScope, null, 'EASY');

      const dynamicScope = new Scope(
        new Date('2026-05-17T13:00:00Z'),
        new Date('2026-05-17T14:00:00Z'),
      );
      const dynamicTask = new AlgoTask(
        2,
        'Dynamic',
        '',
        new Date('2026-05-01'),
        new Date('2026-05-20'),
        120,
        0,
        [],
        [],
        null,
        [dynamicScope],
        'EASY',
        false,
        'UNSET',
        30,
        120,
      );

      taskService.tasks$.next([dynamicTask, staticTask]);
      expect(component.currentEntry()?.task.title).toBe('Static');
    });
  });

  describe('badgeText and badgeStatusClass', () => {
    it('should show no tasks text and neutral class when no entry', () => {
      (component as any).now.set(fixedNow);
      taskService.tasks$.next([]);
      expect(component.badgeText()).toBe(component.noTasksText());
      expect(component.badgeStatusClass()).toBe('badge-neutral');
    });

    it('should show task title and info class for upcoming dynamic', () => {
      (component as any).now.set(fixedNow);
      const scope = new Scope(
        new Date('2026-05-17T13:00:00Z'),
        new Date('2026-05-17T14:00:00Z'),
      );
      const task = new AlgoTask(
        1,
        'Upcoming Dynamic',
        '',
        new Date('2026-05-01'),
        new Date('2026-05-20'),
        120,
        0,
        [],
        [],
        null,
        [scope],
        'EASY',
        false,
        'UNSET',
        30,
        120,
      );
      taskService.tasks$.next([task]);
      expect(component.badgeText()).toBe('Upcoming Dynamic');
      expect(component.badgeStatusClass()).toBe('badge-info');
    });

    it('should show error class for overdue', () => {
      (component as any).now.set(fixedNow);
      const scope = new Scope(
        new Date('2026-05-17T09:00:00Z'),
        new Date('2026-05-17T10:00:00Z'),
      );
      const task = new AlgoTask(
        1,
        'Overdue Task',
        '',
        new Date('2026-05-01'),
        new Date('2026-05-20'),
        120,
        0,
        [],
        [],
        null,
        [scope],
        'EASY',
        false,
        'UNSET',
        30,
        120,
      );
      taskService.tasks$.next([task]);
      expect(component.badgeStatusClass()).toBe('badge-error');
    });

    it('should show success class for active', () => {
      (component as any).now.set(fixedNow);
      const scope = new Scope(
        new Date('2026-05-17T11:00:00Z'),
        new Date('2026-05-17T13:00:00Z'),
      );
      const task = new AlgoTask(
        1,
        'Active Task',
        '',
        new Date('2026-05-01'),
        new Date('2026-05-20'),
        120,
        0,
        [],
        [],
        null,
        [scope],
        'EASY',
        false,
        'UNSET',
        30,
        120,
      );
      taskService.tasks$.next([task]);
      expect(component.badgeStatusClass()).toBe('badge-success');
    });
  });

  describe('showCheckmark and showOverdueAction', () => {
    it('should not show checkmark or overdue action for upcoming dynamic', () => {
      (component as any).now.set(fixedNow);
      const scope = new Scope(
        new Date('2026-05-17T13:00:00Z'),
        new Date('2026-05-17T14:00:00Z'),
      );
      const task = new AlgoTask(
        1,
        'Upcoming',
        '',
        new Date('2026-05-01'),
        new Date('2026-05-20'),
        120,
        0,
        [],
        [],
        null,
        [scope],
        'EASY',
        false,
        'UNSET',
        30,
        120,
      );
      taskService.tasks$.next([task]);
      expect(component.showCheckmark()).toBe(false);
      expect(component.showOverdueAction()).toBe(false);
    });

    it('should show checkmark for active dynamic', () => {
      (component as any).now.set(fixedNow);
      const scope = new Scope(
        new Date('2026-05-17T11:00:00Z'),
        new Date('2026-05-17T13:00:00Z'),
      );
      const task = new AlgoTask(
        1,
        'Active',
        '',
        new Date('2026-05-01'),
        new Date('2026-05-20'),
        120,
        0,
        [],
        [],
        null,
        [scope],
        'EASY',
        false,
        'UNSET',
        30,
        120,
      );
      taskService.tasks$.next([task]);
      expect(component.showCheckmark()).toBe(true);
      expect(component.showOverdueAction()).toBe(false);
    });

    it('should show checkmark and overdue action for overdue dynamic', () => {
      (component as any).now.set(fixedNow);
      const scope = new Scope(
        new Date('2026-05-17T09:00:00Z'),
        new Date('2026-05-17T10:00:00Z'),
      );
      const task = new AlgoTask(
        1,
        'Overdue',
        '',
        new Date('2026-05-01'),
        new Date('2026-05-20'),
        120,
        0,
        [],
        [],
        null,
        [scope],
        'EASY',
        false,
        'UNSET',
        30,
        120,
      );
      taskService.tasks$.next([task]);
      expect(component.showCheckmark()).toBe(true);
      expect(component.showOverdueAction()).toBe(true);
    });

    it('should not show checkmark or overdue action for static tasks', () => {
      (component as any).now.set(fixedNow);
      const scope = new Scope(
        new Date('2026-05-17T11:00:00Z'),
        new Date('2026-05-17T13:00:00Z'),
      );
      const task = new StaticTask(1, 'Static Active', '', [], scope, null, 'EASY');
      taskService.tasks$.next([task]);
      expect(component.showCheckmark()).toBe(false);
      expect(component.showOverdueAction()).toBe(false);
    });
  });

  describe('openOverdueModal and closeOverdueModal', () => {
    it('should open and close overdue modal', () => {
      (component as any).now.set(fixedNow);
      const scope = new Scope(
        new Date('2026-05-17T09:00:00Z'),
        new Date('2026-05-17T10:00:00Z'),
      );
      const task = new AlgoTask(
        1,
        'Overdue',
        '',
        new Date('2026-05-01'),
        new Date('2026-05-20'),
        120,
        0,
        [],
        [],
        null,
        [scope],
        'EASY',
        false,
        'UNSET',
        30,
        120,
      );
      taskService.tasks$.next([task]);

      component.openOverdueModal();
      expect(component.showOverdueModal()).toBe(true);
      expect(component.additionalMinutes()).toBe(60);
      expect(component.modalError()).toBeNull();

      component.closeOverdueModal();
      expect(component.showOverdueModal()).toBe(false);
      expect(component.modalError()).toBeNull();
    });
  });

  describe('markScopeDone', () => {
    it('should mark scope done and update backend', async () => {
      (component as any).now.set(fixedNow);
      const scope = new Scope(
        new Date('2026-05-17T11:00:00Z'),
        new Date('2026-05-17T12:00:00Z'),
      );
      const task = new AlgoTask(
        1,
        'Active',
        '',
        new Date('2026-05-01'),
        new Date('2026-05-20'),
        120,
        0,
        [],
        [],
        null,
        [scope],
        'EASY',
        false,
        'UNSET',
        30,
        120,
      );
      taskService.tasks$.next([task]);

      await component.markScopeDone();

      expect(scope.isFinished).toBe(true);
      expect(task.isFinished).toBe(true);
      expect(taskService.saveTaskCompletion).toHaveBeenCalledWith(1, true, [true]);
      expect(taskService.updateTask).toHaveBeenCalledWith(
        1,
        expect.objectContaining({
          type: 'dynamic',
          elapsed: 'PT60M',
        }),
      );
    });

    it('should do nothing when no entry', async () => {
      taskService.tasks$.next([]);
      await component.markScopeDone();
      expect(taskService.saveTaskCompletion).not.toHaveBeenCalled();
      expect(taskService.updateTask).not.toHaveBeenCalled();
    });

    it('should do nothing for static tasks', async () => {
      (component as any).now.set(fixedNow);
      const scope = new Scope(
        new Date('2026-05-17T11:00:00Z'),
        new Date('2026-05-17T12:00:00Z'),
      );
      const task = new StaticTask(1, 'Static', '', [], scope, null, 'EASY');
      taskService.tasks$.next([task]);

      await component.markScopeDone();

      expect(taskService.saveTaskCompletion).not.toHaveBeenCalled();
      expect(taskService.updateTask).not.toHaveBeenCalled();
    });

    it('should update elapsed for multiple scopes correctly', async () => {
      (component as any).now.set(fixedNow);
      const scope1 = new Scope(
        new Date('2026-05-17T09:00:00Z'),
        new Date('2026-05-17T10:00:00Z'),
        true,
      );
      const scope2 = new Scope(
        new Date('2026-05-17T11:00:00Z'),
        new Date('2026-05-17T12:00:00Z'),
      );
      const task = new AlgoTask(
        1,
        'Multi',
        '',
        new Date('2026-05-01'),
        new Date('2026-05-20'),
        120,
        0,
        [],
        [],
        null,
        [scope1, scope2],
        'EASY',
        false,
        'UNSET',
        30,
        120,
      );
      taskService.tasks$.next([task]);

      await component.markScopeDone();

      expect(scope2.isFinished).toBe(true);
      expect(task.isFinished).toBe(true);
      expect(taskService.updateTask).toHaveBeenCalledWith(
        1,
        expect.objectContaining({
          type: 'dynamic',
          elapsed: 'PT120M',
        }),
      );
    });
  });

  describe('submitOverdue', () => {
    it('should submit with additional minutes and close modal', async () => {
      (component as any).now.set(fixedNow);
      const scope = new Scope(
        new Date('2026-05-17T09:00:00Z'),
        new Date('2026-05-17T10:00:00Z'),
      );
      const task = new AlgoTask(
        1,
        'Overdue',
        '',
        new Date('2026-05-01'),
        new Date('2026-05-20'),
        120,
        0,
        [],
        [],
        null,
        [scope],
        'EASY',
        false,
        'UNSET',
        30,
        120,
      );
      taskService.tasks$.next([task]);

      component.additionalMinutes.set(30);
      await component.submitOverdue();

      expect(scope.isFinished).toBe(true);
      expect(task.isFinished).toBe(true);
      expect(taskService.saveTaskCompletion).toHaveBeenCalledWith(1, true, [true]);
      expect(taskService.updateTask).toHaveBeenCalledWith(
        1,
        expect.objectContaining({
          type: 'dynamic',
          elapsed: 'PT30M',
        }),
      );
      expect(component.showOverdueModal()).toBe(false);
    });

    it('should clamp additional minutes to scope duration', async () => {
      (component as any).now.set(fixedNow);
      const scope = new Scope(
        new Date('2026-05-17T09:00:00Z'),
        new Date('2026-05-17T10:00:00Z'),
      );
      const task = new AlgoTask(
        1,
        'Overdue',
        '',
        new Date('2026-05-01'),
        new Date('2026-05-20'),
        120,
        0,
        [],
        [],
        null,
        [scope],
        'EASY',
        false,
        'UNSET',
        30,
        120,
      );
      taskService.tasks$.next([task]);

      component.additionalMinutes.set(999);
      await component.submitOverdue();

      expect(taskService.updateTask).toHaveBeenCalledWith(
        1,
        expect.objectContaining({
          type: 'dynamic',
          elapsed: 'PT0M',
        }),
      );
    });

    it('should set error for invalid additional minutes', async () => {
      (component as any).now.set(fixedNow);
      const scope = new Scope(
        new Date('2026-05-17T09:00:00Z'),
        new Date('2026-05-17T10:00:00Z'),
      );
      const task = new AlgoTask(
        1,
        'Overdue',
        '',
        new Date('2026-05-01'),
        new Date('2026-05-20'),
        120,
        0,
        [],
        [],
        null,
        [scope],
        'EASY',
        false,
        'UNSET',
        30,
        120,
      );
      taskService.tasks$.next([task]);

      component.additionalMinutes.set(-5);
      await component.submitOverdue();

      expect(component.modalError()).toBe('Please enter a valid number of minutes.');
      expect(taskService.updateTask).not.toHaveBeenCalled();
    });

    it('should do nothing when no entry', async () => {
      taskService.tasks$.next([]);
      await component.submitOverdue();
      expect(taskService.updateTask).not.toHaveBeenCalled();
    });

    it('should do nothing for static tasks', async () => {
      (component as any).now.set(fixedNow);
      const scope = new Scope(
        new Date('2026-05-17T09:00:00Z'),
        new Date('2026-05-17T10:00:00Z'),
      );
      const task = new StaticTask(1, 'Static Overdue', '', [], scope, null, 'EASY');
      taskService.tasks$.next([task]);

      await component.submitOverdue();

      expect(taskService.updateTask).not.toHaveBeenCalled();
      expect(component.showOverdueModal()).toBe(false);
    });
  });

  describe('currentScopeMinutes and clampAdditionalMinutes', () => {
    it('should return 0 when no entry', () => {
      taskService.tasks$.next([]);
      expect(component.currentScopeMinutes()).toBe(0);
      expect(component.clampAdditionalMinutes(100)).toBe(0);
    });

    it('should return scope duration for current entry', () => {
      (component as any).now.set(fixedNow);
      const scope = new Scope(
        new Date('2026-05-17T11:00:00Z'),
        new Date('2026-05-17T12:30:00Z'),
      );
      const task = new AlgoTask(
        1,
        'Active',
        '',
        new Date('2026-05-01'),
        new Date('2026-05-20'),
        120,
        0,
        [],
        [],
        null,
        [scope],
        'EASY',
        false,
        'UNSET',
        30,
        120,
      );
      taskService.tasks$.next([task]);

      expect(component.currentScopeMinutes()).toBe(90);
      expect(component.clampAdditionalMinutes(100)).toBe(90);
      expect(component.clampAdditionalMinutes(50)).toBe(50);
    });
  });

  describe('getPendingScopes', () => {
    it('should return all scopes when none are finished', () => {
      const task = new AlgoTask(
        1,
        'Task',
        '',
        new Date('2026-05-01'),
        new Date('2026-05-20'),
        120,
        0,
        [],
        [],
        null,
        [
          new Scope(new Date('2026-05-17T10:00:00Z'), new Date('2026-05-17T11:00:00Z')),
          new Scope(new Date('2026-05-17T11:00:00Z'), new Date('2026-05-17T12:00:00Z')),
          new Scope(new Date('2026-05-17T12:00:00Z'), new Date('2026-05-17T13:00:00Z')),
        ],
        'EASY',
        false,
        'UNSET',
        30,
        120,
      );

      const pending = (component as any).getPendingScopes(task);
      expect(pending.length).toBe(3);
    });

    it('should return scopes from first unfinished', () => {
      const task = new AlgoTask(
        1,
        'Task',
        '',
        new Date('2026-05-01'),
        new Date('2026-05-20'),
        120,
        0,
        [],
        [],
        null,
        [
          new Scope(new Date('2026-05-17T10:00:00Z'), new Date('2026-05-17T11:00:00Z'), true),
          new Scope(new Date('2026-05-17T11:00:00Z'), new Date('2026-05-17T12:00:00Z')),
          new Scope(new Date('2026-05-17T12:00:00Z'), new Date('2026-05-17T13:00:00Z')),
        ],
        'EASY',
        false,
        'UNSET',
        30,
        120,
      );

      const pending = (component as any).getPendingScopes(task);
      expect(pending.length).toBe(2);
      expect(pending[0].start.getTime()).toBe(new Date('2026-05-17T11:00:00Z').getTime());
    });

    it('should return empty array when all scopes are finished', () => {
      const task = new AlgoTask(
        1,
        'Task',
        '',
        new Date('2026-05-01'),
        new Date('2026-05-20'),
        120,
        0,
        [],
        [],
        null,
        [
          new Scope(new Date('2026-05-17T10:00:00Z'), new Date('2026-05-17T11:00:00Z'), true),
          new Scope(new Date('2026-05-17T11:00:00Z'), new Date('2026-05-17T12:00:00Z'), true),
        ],
        'EASY',
        false,
        'UNSET',
        30,
        120,
      );

      const pending = (component as any).getPendingScopes(task);
      expect(pending.length).toBe(0);
    });

    it('should return empty array when task has no scopes', () => {
      const task = new AlgoTask(
        1,
        'Task',
        '',
        new Date('2026-05-01'),
        new Date('2026-05-20'),
        120,
        0,
        [],
        [],
        null,
        [],
        'EASY',
        false,
        'UNSET',
        30,
        120,
      );
      const pending = (component as any).getPendingScopes(task);
      expect(pending.length).toBe(0);
    });
  });

  describe('edge cases', () => {
    it('should handle all tasks finished', () => {
      (component as any).now.set(fixedNow);
      const task = new AlgoTask(
        1,
        'Finished',
        '',
        new Date('2026-05-01'),
        new Date('2026-05-20'),
        120,
        0,
        [],
        [],
        null,
        [new Scope(new Date('2026-05-17T10:00:00Z'), new Date('2026-05-17T11:00:00Z'), true)],
        'EASY',
        true,
        'UNSET',
        30,
        120,
      );
      taskService.tasks$.next([task]);
      expect(component.currentEntry()).toBeNull();
    });

    it('should handle dynamic task with multiple pending scopes showing the earliest', () => {
      (component as any).now.set(fixedNow);
      const scopes = [
        new Scope(new Date('2026-05-17T13:00:00Z'), new Date('2026-05-17T14:00:00Z')),
        new Scope(new Date('2026-05-17T15:00:00Z'), new Date('2026-05-17T16:00:00Z')),
      ];
      const task = new AlgoTask(
        1,
        'Multi',
        '',
        new Date('2026-05-01'),
        new Date('2026-05-20'),
        120,
        0,
        [],
        [],
        null,
        scopes,
        'EASY',
        false,
        'UNSET',
        30,
        120,
      );
      taskService.tasks$.next([task]);
      expect(component.currentEntry()?.scope.start.getTime()).toBe(scopes[0].start.getTime());
    });

    it('should handle dynamic task where first scope is finished and second is upcoming', () => {
      (component as any).now.set(fixedNow);
      const scopes = [
        new Scope(new Date('2026-05-17T10:00:00Z'), new Date('2026-05-17T11:00:00Z'), true),
        new Scope(new Date('2026-05-17T13:00:00Z'), new Date('2026-05-17T14:00:00Z')),
      ];
      const task = new AlgoTask(
        1,
        'Partial',
        '',
        new Date('2026-05-01'),
        new Date('2026-05-20'),
        120,
        0,
        [],
        [],
        null,
        scopes,
        'EASY',
        false,
        'UNSET',
        30,
        120,
      );
      taskService.tasks$.next([task]);
      expect(component.currentEntry()?.scope.start.getTime()).toBe(scopes[1].start.getTime());
      expect(component.currentEntry()?.state).toBe('upcoming');
    });

    it('should handle dynamic task where first scope is finished and second is active', () => {
      (component as any).now.set(fixedNow);
      const scopes = [
        new Scope(new Date('2026-05-17T10:00:00Z'), new Date('2026-05-17T11:00:00Z'), true),
        new Scope(new Date('2026-05-17T11:00:00Z'), new Date('2026-05-17T13:00:00Z')),
      ];
      const task = new AlgoTask(
        1,
        'Partial Active',
        '',
        new Date('2026-05-01'),
        new Date('2026-05-20'),
        120,
        0,
        [],
        [],
        null,
        scopes,
        'EASY',
        false,
        'UNSET',
        30,
        120,
      );
      taskService.tasks$.next([task]);
      expect(component.currentEntry()?.scope.start.getTime()).toBe(scopes[1].start.getTime());
      expect(component.currentEntry()?.state).toBe('active');
    });

    it('should handle dynamic task where first scope is finished and second is overdue', () => {
      (component as any).now.set(fixedNow);
      const scopes = [
        new Scope(new Date('2026-05-17T08:00:00Z'), new Date('2026-05-17T09:00:00Z'), true),
        new Scope(new Date('2026-05-17T09:00:00Z'), new Date('2026-05-17T10:00:00Z')),
      ];
      const task = new AlgoTask(
        1,
        'Partial Overdue',
        '',
        new Date('2026-05-01'),
        new Date('2026-05-20'),
        120,
        0,
        [],
        [],
        null,
        scopes,
        'EASY',
        false,
        'UNSET',
        30,
        120,
      );
      taskService.tasks$.next([task]);
      expect(component.currentEntry()?.scope.start.getTime()).toBe(scopes[1].start.getTime());
      expect(component.currentEntry()?.state).toBe('overdue');
    });

    it('should handle multiple dynamic tasks and pick the earliest pending scope', () => {
      (component as any).now.set(fixedNow);
      const scope1 = new Scope(
        new Date('2026-05-17T13:00:00Z'),
        new Date('2026-05-17T14:00:00Z'),
      );
      const task1 = new AlgoTask(
        1,
        'Later',
        '',
        new Date('2026-05-01'),
        new Date('2026-05-20'),
        120,
        0,
        [],
        [],
        null,
        [scope1],
        'EASY',
        false,
        'UNSET',
        30,
        120,
      );

      const scope2 = new Scope(
        new Date('2026-05-17T12:30:00Z'),
        new Date('2026-05-17T13:30:00Z'),
      );
      const task2 = new AlgoTask(
        2,
        'Earlier',
        '',
        new Date('2026-05-01'),
        new Date('2026-05-20'),
        120,
        0,
        [],
        [],
        null,
        [scope2],
        'EASY',
        false,
        'UNSET',
        30,
        120,
      );

      taskService.tasks$.next([task1, task2]);
      expect(component.currentEntry()?.task.title).toBe('Earlier');
    });

    it('should handle static tasks filtered out when they are entirely in the past', () => {
      (component as any).now.set(fixedNow);
      const pastScope = new Scope(
        new Date('2026-05-17T09:00:00Z'),
        new Date('2026-05-17T10:00:00Z'),
      );
      const futureScope = new Scope(
        new Date('2026-05-17T13:00:00Z'),
        new Date('2026-05-17T14:00:00Z'),
      );
      const pastTask = new StaticTask(1, 'Past', '', [], pastScope, null, 'EASY');
      const futureTask = new StaticTask(2, 'Future', '', [], futureScope, null, 'EASY');

      taskService.tasks$.next([pastTask, futureTask]);
      expect(component.currentEntry()?.task.title).toBe('Future');
      expect(component.currentEntry()?.state).toBe('upcoming');
    });
  });
});
