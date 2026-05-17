import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NotificationsContainer } from './notifications-container';
import { NotificationService } from '@services/notification.service';
import { getTranslocoTestingModule } from 'test-utils/transloco-testing';

describe('NotificationsContainer', () => {
  let component: NotificationsContainer;
  let fixture: ComponentFixture<NotificationsContainer>;
  let service: NotificationService;

  beforeEach(async () => {
    vi.useFakeTimers();
    await TestBed.configureTestingModule({
      imports: [NotificationsContainer, getTranslocoTestingModule()],
    }).compileComponents();

    service = TestBed.inject(NotificationService);
    fixture = TestBed.createComponent(NotificationsContainer);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    service.clear();
    vi.useRealTimers();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have region role and accessible label', () => {
    const el = fixture.nativeElement as HTMLElement;
    expect(el.getAttribute('role')).toBe('region');
    expect(el.getAttribute('aria-label')).toBe('Notifications');
  });

  it('should render toasts when notifications exist', () => {
    service.success('Hello');
    fixture.detectChanges();
    const toasts = fixture.nativeElement.querySelectorAll('app-notification-toast');
    expect(toasts.length).toBe(1);
  });

  it('should remove toast when dismissed', () => {
    const id = service.error('Error!');
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelectorAll('app-notification-toast').length).toBe(1);

    service.dismiss(id);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelectorAll('app-notification-toast').length).toBe(0);
  });

  it('should render multiple toasts', () => {
    service.success('One');
    service.info('Two');
    service.warning('Three');
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelectorAll('app-notification-toast').length).toBe(3);
  });
});
