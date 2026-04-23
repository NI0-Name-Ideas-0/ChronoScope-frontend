import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TaskModal } from './task-modal';
import { TaskService } from '@services/task.service';
import { TaskModalService } from '@services/task-modal.service';
import { Auth } from '@services/auth';
import { OAuthService } from 'angular-oauth2-oidc';
import { Api } from '../../../api/api';

describe('TaskModal', () => {
  let component: TaskModal;
  let fixture: ComponentFixture<TaskModal>;

  const mockOAuthService = {
    configure: vi.fn(),
    setStorage: vi.fn(),
    setupAutomaticSilentRefresh: vi.fn(),
    hasValidAccessToken: vi.fn().mockReturnValue(false),
  };

  const mockApi = {
    invoke: vi.fn(),
  };

  const mockAuth = {
    authReady$: {
      subscribe: vi.fn(),
    },
    getAccounts: vi.fn().mockReturnValue([]),
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TaskModal],
      providers: [
        TaskService,
        TaskModalService,
        { provide: OAuthService, useValue: mockOAuthService },
        { provide: Api, useValue: mockApi },
        { provide: Auth, useValue: mockAuth },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(TaskModal);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
