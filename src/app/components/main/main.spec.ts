import { ComponentFixture, TestBed } from '@angular/core/testing';
import { OAuthService } from 'angular-oauth2-oidc';

import { Main } from './main';
import { ViewService } from '@services/view.service';

const mockOAuthService = {
  configure: vi.fn(),
  setStorage: vi.fn(),
  setupAutomaticSilentRefresh: vi.fn(),
  hasValidAccessToken: vi.fn().mockReturnValue(false),
  events: {
    pipe: vi.fn().mockReturnValue({ subscribe: vi.fn() }),
  },
};

describe('Main', () => {
  let component: Main;
  let fixture: ComponentFixture<Main>;

  beforeEach(async () => {
    TestBed.resetTestingModule();
    await TestBed.configureTestingModule({
      imports: [Main],
      providers: [
        { provide: OAuthService, useValue: mockOAuthService },
        ViewService,
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(Main);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should open settings', () => {
    component.openSettings();
    expect(component.isSettingsOpen()).toBe(true);
  });

  it('should close settings', () => {
    component.openSettings();
    component.closeSettings();
    expect(component.isSettingsOpen()).toBe(false);
  });

  it('should inject viewService', () => {
    expect(component.viewService).toBeInstanceOf(ViewService);
  });
});
