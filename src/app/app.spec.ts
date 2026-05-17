import { TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { App } from './app';
import { Auth } from '@services/auth';
import { LanguageService } from '@services/language.service';
import { getTranslocoTestingModule } from 'test-utils/transloco-testing';

const mockAuthService = {
  login: vi.fn(),
};

const mockLanguageService = {
  initialize: vi.fn(),
  language: vi.fn(() => 'en'),
  setLanguage: vi.fn(),
};

describe('App', () => {
  beforeEach(async () => {
    vi.clearAllMocks();

    await TestBed.configureTestingModule({
      imports: [App, getTranslocoTestingModule()],
      providers: [
        { provide: Auth, useValue: mockAuthService },
        { provide: LanguageService, useValue: mockLanguageService },
      ]
    })
    .overrideComponent(App, {
      set: {
        imports: [],
        schemas: [NO_ERRORS_SCHEMA],
        template: '<div></div>'
      }
    })
    .compileComponents();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });

  it('should have the correct title', () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance;
    expect(app['title']()).toEqual('ChronoScope-frontend');
  });
});
