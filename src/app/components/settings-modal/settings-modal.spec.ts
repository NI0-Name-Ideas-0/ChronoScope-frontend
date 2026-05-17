import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SettingsModal } from './settings-modal';
import { Auth } from '@services/auth';
import { OAuthService } from 'angular-oauth2-oidc';
import { WorkSlotPreferenceService } from '@services/work-slot-preference.service';
import { TaskService } from '@services/task.service';
import { Api } from '@api/api';
import { of } from 'rxjs';
import { getTranslocoTestingModule } from 'test-utils/transloco-testing';

describe('SettingsModal', () => {
  let component: SettingsModal;
  let fixture: ComponentFixture<SettingsModal>;
  let originalScrollTo: any;

  beforeAll(() => {
    originalScrollTo = HTMLElement.prototype.scrollTo;
    HTMLElement.prototype.scrollTo = vi.fn() as any;
  });

  afterAll(() => {
    HTMLElement.prototype.scrollTo = originalScrollTo;
  });

  const mockOAuthService = {
    configure: vi.fn(),
    setStorage: vi.fn(),
    setupAutomaticSilentRefresh: vi.fn(),
    hasValidAccessToken: vi.fn().mockReturnValue(false),
  };

  const mockAuth = {
    identity$: of(null),
    getIdentityData: vi.fn().mockReturnValue({ organizations: [] }),
  };

  const mockTaskService = {
    getTaskColorMix: vi.fn(() => null),
  };

  const mockApi = {
    invoke: vi.fn().mockResolvedValue([]),
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SettingsModal, getTranslocoTestingModule()],
      providers: [
        { provide: OAuthService, useValue: mockOAuthService },
        { provide: Auth, useValue: mockAuth },
        {
          provide: WorkSlotPreferenceService,
          useValue: {
            loadPreferences: vi.fn().mockResolvedValue([]),
            loadOrganizationColorMap: vi.fn().mockResolvedValue({}),
            loadWorkSettings: vi.fn().mockResolvedValue(null),
          },
        },
        { provide: TaskService, useValue: mockTaskService },
        { provide: Api, useValue: mockApi },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(SettingsModal);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('open', true);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should not render when open is false', () => {
    fixture.componentRef.setInput('open', false);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.settings-backdrop')).toBeFalsy();
  });

  it('should render when open is true', () => {
    expect(fixture.nativeElement.querySelector('.settings-backdrop')).toBeTruthy();
  });

  it('should default activeCategory to account', () => {
    expect(component.activeCategory()).toBe('account');
  });

  it('should switch active category', () => {
    component.activeCategory.set('work');
    fixture.detectChanges();
    expect(component.activeCategory()).toBe('work');
  });

  it('should emit closed on close button click', async () => {
    const closedSpy = vi.fn();
    component.closed.subscribe(closedSpy);

    const closeButton = fixture.nativeElement.querySelector('button[aria-label="Close settings"]');
    closeButton.click();
    await new Promise((r) => setTimeout(r, 250));

    expect(closedSpy).toHaveBeenCalled();
  });

  it('should emit closed on backdrop click', async () => {
    const closedSpy = vi.fn();
    component.closed.subscribe(closedSpy);

    const sameEl = document.createElement('div');
    const mockEvent = { target: sameEl, currentTarget: sameEl } as unknown as MouseEvent;
    component.onBackdropClick(mockEvent);
    await new Promise((r) => setTimeout(r, 250));

    expect(closedSpy).toHaveBeenCalled();
  });

  it('should set isWorkPreferencesActive when work category is selected', () => {
    component.activeCategory.set('work');
    expect(component.isWorkPreferencesActive()).toBe(true);

    component.activeCategory.set('account');
    expect(component.isWorkPreferencesActive()).toBe(false);
  });

  it('should handle work saved event', () => {
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    component.onWorkSaved([]);
    expect(consoleSpy).toHaveBeenCalled();
    consoleSpy.mockRestore();
  });
});
