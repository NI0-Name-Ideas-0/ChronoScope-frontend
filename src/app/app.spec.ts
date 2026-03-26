import { TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { App } from './app';
import { Auth } from '@services/auth';

const mockAuthService = {
  login: vi.fn(),
};

describe('App', () => {
  beforeEach(async () => {
    vi.clearAllMocks();

    await TestBed.configureTestingModule({
      imports: [App],
      providers: [
        { provide: Auth, useValue: mockAuthService }
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
