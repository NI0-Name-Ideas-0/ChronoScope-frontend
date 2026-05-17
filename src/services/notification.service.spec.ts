import { TestBed } from '@angular/core/testing';
import { NotificationService } from './notification.service';

describe('NotificationService', () => {
  let service: NotificationService;

  beforeEach(() => {
    vi.useFakeTimers();
    TestBed.configureTestingModule({});
    service = TestBed.inject(NotificationService);
  });

  afterEach(() => {
    service.clear();
    vi.useRealTimers();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('notify() adds a notification and returns its ID', () => {
    const id = service.notify({ type: 'info', message: 'Hello' });
    expect(id).toBeTruthy();
    expect(service.notifications().length).toBe(1);
    expect(service.notifications()[0].message).toBe('Hello');
    expect(service.notifications()[0].type).toBe('info');
  });

  it('success() creates a success notification', () => {
    service.success('Saved');
    expect(service.notifications()[0].type).toBe('success');
    expect(service.notifications()[0].message).toBe('Saved');
  });

  it('error() creates an error notification', () => {
    service.error('Failed');
    expect(service.notifications()[0].type).toBe('error');
  });

  it('info() creates an info notification', () => {
    service.info('Info message');
    expect(service.notifications()[0].type).toBe('info');
  });

  it('warning() creates a warning notification', () => {
    service.warning('Watch out');
    expect(service.notifications()[0].type).toBe('warning');
  });

  it('dismiss(id) removes the specific notification', () => {
    const id1 = service.success('First');
    const id2 = service.success('Second');
    expect(service.notifications().length).toBe(2);

    service.dismiss(id1);
    expect(service.notifications().length).toBe(1);
    expect(service.notifications()[0].id).toBe(id2);
  });

  it('clear() removes all notifications', () => {
    service.success('One');
    service.error('Two');
    service.info('Three');
    expect(service.notifications().length).toBe(3);

    service.clear();
    expect(service.notifications().length).toBe(0);
  });

  it('auto-dismisses after default duration for success (5000ms)', () => {
    service.success('Auto');
    expect(service.notifications().length).toBe(1);

    vi.advanceTimersByTime(4999);
    expect(service.notifications().length).toBe(1);

    vi.advanceTimersByTime(1);
    expect(service.notifications().length).toBe(0);
  });

  it('auto-dismisses error after 8000ms', () => {
    service.error('Error');
    expect(service.notifications().length).toBe(1);

    vi.advanceTimersByTime(7999);
    expect(service.notifications().length).toBe(1);

    vi.advanceTimersByTime(1);
    expect(service.notifications().length).toBe(0);
  });

  it('does not auto-dismiss persistent notifications', () => {
    service.notify({ type: 'error', message: 'Persistent', persistent: true });
    expect(service.notifications().length).toBe(1);

    vi.advanceTimersByTime(60000);
    expect(service.notifications().length).toBe(1);
  });

  it('respects custom durationMs', () => {
    service.notify({ type: 'info', message: 'Custom', durationMs: 2000 });

    vi.advanceTimersByTime(1999);
    expect(service.notifications().length).toBe(1);

    vi.advanceTimersByTime(1);
    expect(service.notifications().length).toBe(0);
  });

  it('enforces MAX_VISIBLE_TOASTS by removing oldest non-persistent', () => {
    for (let i = 0; i < 5; i++) {
      service.success(`Toast ${i}`);
    }
    expect(service.notifications().length).toBe(5);

    service.success('Overflow');
    expect(service.notifications().length).toBe(5);
    expect(service.notifications().find((n) => n.message === 'Toast 0')).toBeUndefined();
    expect(service.notifications().find((n) => n.message === 'Overflow')).toBeTruthy();
  });

  it('dismissible defaults to true', () => {
    service.success('Test');
    expect(service.notifications()[0].dismissible).toBe(true);
  });

  it('allows optional title', () => {
    service.success('Body', { title: 'Title' });
    expect(service.notifications()[0].title).toBe('Title');
  });
});
