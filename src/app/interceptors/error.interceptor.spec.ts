import { TestBed } from '@angular/core/testing';
import { HttpClient, HttpContext, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { errorInterceptor, SKIP_ERROR_TOAST } from './error.interceptor';
import { NotificationService } from '@services/notification.service';

describe('errorInterceptor', () => {
  let http: HttpClient;
  let httpMock: HttpTestingController;
  let notificationService: NotificationService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([errorInterceptor])),
        provideHttpClientTesting(),
      ],
    });

    http = TestBed.inject(HttpClient);
    httpMock = TestBed.inject(HttpTestingController);
    notificationService = TestBed.inject(NotificationService);
  });

  afterEach(() => {
    httpMock.verify();
    notificationService.clear();
  });

  it('should show error toast on HTTP error', () => {
    http.get('/api/test').subscribe({ error: () => {} });
    httpMock.expectOne('/api/test').flush('Not Found', { status: 404, statusText: 'Not Found' });

    expect(notificationService.notifications().length).toBe(1);
    expect(notificationService.notifications()[0].type).toBe('error');
  });

  it('should use ProblemDetail detail field as message', () => {
    http.get('/api/test').subscribe({ error: () => {} });
    httpMock.expectOne('/api/test').flush(
      { detail: 'Task not found', title: 'Not Found', status: 404 },
      { status: 404, statusText: 'Not Found' },
    );

    expect(notificationService.notifications()[0].message).toBe('Task not found');
  });

  it('should use ProblemDetail title as fallback when detail is missing', () => {
    http.get('/api/test').subscribe({ error: () => {} });
    httpMock.expectOne('/api/test').flush(
      { title: 'Validation Error', status: 400 },
      { status: 400, statusText: 'Bad Request' },
    );

    expect(notificationService.notifications()[0].message).toBe('Validation Error');
  });

  it('should use generic message when body is not ProblemDetail', () => {
    http.get('/api/test').subscribe({ error: () => {} });
    httpMock.expectOne('/api/test').flush(null, { status: 500, statusText: 'Internal Server Error' });

    expect(notificationService.notifications()[0].message).toBe('Request failed: Internal Server Error');
  });

  it('should show connection error for status 0', () => {
    http.get('/api/test').subscribe({ error: () => {} });
    httpMock.expectOne('/api/test').error(new ProgressEvent('error'), { status: 0, statusText: 'Unknown Error' });

    expect(notificationService.notifications()[0].message).toBe(
      'Unable to reach the server. Please check your connection.',
    );
  });

  it('should suppress toast when SKIP_ERROR_TOAST is set', () => {
    const context = new HttpContext().set(SKIP_ERROR_TOAST, true);
    http.get('/api/test', { context }).subscribe({ error: () => {} });
    httpMock.expectOne('/api/test').flush('Error', { status: 400, statusText: 'Bad Request' });

    expect(notificationService.notifications().length).toBe(0);
  });

  it('should re-throw the error to the caller', () => {
    let caughtError: unknown = null;
    http.get('/api/test').subscribe({ error: (err) => (caughtError = err) });
    httpMock.expectOne('/api/test').flush('Error', { status: 500, statusText: 'Server Error' });

    expect(caughtError).toBeTruthy();
  });
});
