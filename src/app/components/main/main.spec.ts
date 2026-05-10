import { ComponentFixture, TestBed } from '@angular/core/testing';
import { OAuthService } from 'angular-oauth2-oidc';

import { Main } from './main';
import { Api } from '../../../api/api';

describe('Main', () => {
  let component: Main;
  let fixture: ComponentFixture<Main>;

  const mockOAuthService = {
    configure: vi.fn(),
    setStorage: vi.fn(),
    setupAutomaticSilentRefresh: vi.fn(),
    hasValidAccessToken: vi.fn().mockReturnValue(false),
    events: {
      pipe: vi.fn().mockReturnValue({ subscribe: vi.fn() }),
    },
  };

  const mockApi = {
    invoke: vi.fn(),
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Main],
      providers: [
        { provide: OAuthService, useValue: mockOAuthService },
        { provide: Api, useValue: mockApi },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(Main);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
