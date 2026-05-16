import { TestBed } from '@angular/core/testing';
import { TaskModalService } from './task-modal.service';

describe('TaskModalService', () => {
  let service: TaskModalService;

  beforeEach(() => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({});
    service = TestBed.inject(TaskModalService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should emit open event without task', async () => {
    const eventPromise = new Promise<any>((resolve) => {
      const sub = service.open$.subscribe((event) => {
        sub.unsubscribe();
        resolve(event);
      });
    });
    service.open();
    const event = await eventPromise;
    expect(event.task).toBeUndefined();
  });

  it('should emit open event with task', async () => {
    const mockTask = { id: 1, name: 'Test' } as any;
    const eventPromise = new Promise<any>((resolve) => {
      const sub = service.open$.subscribe((event) => {
        sub.unsubscribe();
        resolve(event);
      });
    });
    service.openForEdit(mockTask);
    const event = await eventPromise;
    expect(event.task).toBe(mockTask);
  });
});
