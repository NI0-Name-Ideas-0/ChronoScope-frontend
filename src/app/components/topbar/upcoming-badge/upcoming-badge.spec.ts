import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, BehaviorSubject } from 'rxjs';
import { UpcomingBadge } from './upcoming-badge';
import { TaskService } from '@services/task.service';
import { Auth } from '@services/auth';
import { getTranslocoTestingModule } from '@test-utils/transloco-testing';
import { AlgoTask } from '@app/model/algo-task';
import { StaticTask } from '@app/model/static-task';
import { Scope } from '@app/model/scope';
import { Task, TaskColor } from '@app/model/task';

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

function makeAlgoTask(overrides: Partial<{
  id: number;
  title: string;
  description: string;
  startDate: Date;
  dueDate: Date;
  duration: number;
  elapsedMinutes: number;
  dependencies: number[];
  labels: string[];
  organizationId: string | null;
  scopes: Scope[];
  difficulty: string;
  isFinished: boolean;
  color: TaskColor;
  minScopeMinutes: number;
  maxScopeMinutes: number;
}> = {}): AlgoTask {
  return new AlgoTask(
    overrides.id ?? 1,
    overrides.title ?? 'Task',
    overrides.description ?? '',
    overrides.startDate ?? new Date('2026-05-01'),
    overrides.dueDate ?? new Date('2026-05-20'),
    overrides.duration ?? 120,
    overrides.elapsedMinutes ?? 0,
    overrides.dependencies ?? [],
    overrides.labels ?? [],
    overrides.organizationId ?? null,
    overrides.scopes ?? [],
    overrides.difficulty ?? 'EASY',
    overrides.isFinished ?? false,
    overrides.color ?? 'UNSET',
    overrides.minScopeMinutes ?? 30,
    overrides.maxScopeMinutes ?? 120,
  );
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
      const task = makeAlgoTask({
        title: 'Algo Upcoming',
        scopes: [scope]
      });
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
      const task = makeAlgoTask({
        title: 'Algo Active',
        scopes: [scope]
      });
      taskService.tasks$.next([task]);
      expect(component.currentEntry()?.state).toBe('active');
    });

    it('should show overdue algo task', () => {
      (component as any).now.set(fixedNow);
      const scope = new Scope(
        new Date('2026-05-17T09:00:00Z'),
        new Date('2026-05-17T10:00:00Z'),
      );
      const task = makeAlgoTask({
        title: 'Algo Overdue',
        scopes: [scope]
      });
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
      const dynamicTask = makeAlgoTask({
        id: 2,
        title: 'Dynamic',
        scopes: [dynamicScope]
      });

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
      const dynamicTask = makeAlgoTask({
        id: 2,
        title: 'Dynamic',
        scopes: [dynamicScope]
      });

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
      const task = makeAlgoTask({
        title: 'Upcoming Dynamic',
        scopes: [scope]
      });
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
      const task = makeAlgoTask({
        title: 'Overdue Task',
        scopes: [scope]
      });
      taskService.tasks$.next([task]);
      expect(component.badgeStatusClass()).toBe('badge-error');
    });

    it('should show success class for active', () => {
      (component as any).now.set(fixedNow);
      const scope = new Scope(
        new Date('2026-05-17T11:00:00Z'),
        new Date('2026-05-17T13:00:00Z'),
      );
      const task = makeAlgoTask({
        title: 'Active Task',
        scopes: [scope]
      });
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
      const task = makeAlgoTask({
        title: 'Upcoming',
        scopes: [scope]
      });
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
      const task = makeAlgoTask({
        title: 'Active',
        scopes: [scope]
      });
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
      const task = makeAlgoTask({
        title: 'Overdue',
        scopes: [scope]
      });
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
      const task = makeAlgoTask({
        title: 'Overdue',
        scopes: [scope]
      });
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
      const task = makeAlgoTask({
        title: 'Active',
        scopes: [scope]
      });
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
      const task = makeAlgoTask({
        title: 'Multi',
        scopes: [scope1, scope2]
      });
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
      const task = makeAlgoTask({
        title: 'Overdue',
        scopes: [scope]
      });
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
      const task = makeAlgoTask({
        title: 'Overdue',
        scopes: [scope]
      });
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
      const task = makeAlgoTask({
        title: 'Overdue',
        scopes: [scope]
      });
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
      const task = makeAlgoTask({
        title: 'Active',
        scopes: [scope]
      });
      taskService.tasks$.next([task]);

      expect(component.currentScopeMinutes()).toBe(90);
      expect(component.clampAdditionalMinutes(100)).toBe(90);
      expect(component.clampAdditionalMinutes(50)).toBe(50);
    });
  });

  describe('getPendingScopes', () => {
    it('should return all scopes when none are finished', () => {
      const task = makeAlgoTask({
        scopes: [
          new Scope(new Date('2026-05-17T10:00:00Z'), new Date('2026-05-17T11:00:00Z')),
          new Scope(new Date('2026-05-17T11:00:00Z'), new Date('2026-05-17T12:00:00Z')),
          new Scope(new Date('2026-05-17T12:00:00Z'), new Date('2026-05-17T13:00:00Z')),
        ]
      });

      const pending = (component as any).getPendingScopes(task);
      expect(pending.length).toBe(3);
    });

    it('should return scopes from first unfinished', () => {
      const task = makeAlgoTask({
        scopes: [
          new Scope(new Date('2026-05-17T10:00:00Z'), new Date('2026-05-17T11:00:00Z'), true),
          new Scope(new Date('2026-05-17T11:00:00Z'), new Date('2026-05-17T12:00:00Z')),
          new Scope(new Date('2026-05-17T12:00:00Z'), new Date('2026-05-17T13:00:00Z')),
        ]
      });

      const pending = (component as any).getPendingScopes(task);
      expect(pending.length).toBe(2);
      expect(pending[0].start.getTime()).toBe(new Date('2026-05-17T11:00:00Z').getTime());
    });

    it('should return empty array when all scopes are finished', () => {
      const task = makeAlgoTask({
        scopes: [
          new Scope(new Date('2026-05-17T10:00:00Z'), new Date('2026-05-17T11:00:00Z'), true),
          new Scope(new Date('2026-05-17T11:00:00Z'), new Date('2026-05-17T12:00:00Z'), true),
        ]
      });

      const pending = (component as any).getPendingScopes(task);
      expect(pending.length).toBe(0);
    });

    it('should return empty array when task has no scopes', () => {
      const task = makeAlgoTask();
      const pending = (component as any).getPendingScopes(task);
      expect(pending.length).toBe(0);
    });
  });

  describe('edge cases', () => {
    it('should handle all tasks finished', () => {
      (component as any).now.set(fixedNow);
      const task = makeAlgoTask({
        title: 'Finished',
        scopes: [new Scope(new Date('2026-05-17T10:00:00Z'), new Date('2026-05-17T11:00:00Z'), true)],
        isFinished: true
      });
      taskService.tasks$.next([task]);
      expect(component.currentEntry()).toBeNull();
    });

    it('should handle dynamic task with multiple pending scopes showing the earliest', () => {
      (component as any).now.set(fixedNow);
      const scopes = [
        new Scope(new Date('2026-05-17T13:00:00Z'), new Date('2026-05-17T14:00:00Z')),
        new Scope(new Date('2026-05-17T15:00:00Z'), new Date('2026-05-17T16:00:00Z')),
      ];
      const task = makeAlgoTask({
        title: 'Multi',
        scopes: scopes
      });
      taskService.tasks$.next([task]);
      expect(component.currentEntry()?.scope.start.getTime()).toBe(scopes[0].start.getTime());
    });

    it('should handle dynamic task where first scope is finished and second is upcoming', () => {
      (component as any).now.set(fixedNow);
      const scopes = [
        new Scope(new Date('2026-05-17T10:00:00Z'), new Date('2026-05-17T11:00:00Z'), true),
        new Scope(new Date('2026-05-17T13:00:00Z'), new Date('2026-05-17T14:00:00Z')),
      ];
      const task = makeAlgoTask({
        title: 'Partial',
        scopes: scopes
      });
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
      const task = makeAlgoTask({
        title: 'Partial Active',
        scopes: scopes
      });
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
      const task = makeAlgoTask({
        title: 'Partial Overdue',
        scopes: scopes
      });
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
      const task1 = makeAlgoTask({
        title: 'Later',
        scopes: [scope1]
      });

      const scope2 = new Scope(
        new Date('2026-05-17T12:30:00Z'),
        new Date('2026-05-17T13:30:00Z'),
      );
      const task2 = makeAlgoTask({
        id: 2,
        title: 'Earlier',
        scopes: [scope2]
      });

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
