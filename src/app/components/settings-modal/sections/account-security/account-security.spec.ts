import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AccountSecuritySection } from './account-security';
import { Auth } from '@services/auth';
import { BehaviorSubject } from 'rxjs';
import { IdentityResponse } from '../../../../../api/models';
import { getTranslocoTestingModule } from 'test-utils/transloco-testing';

describe('AccountSecuritySection', () => {
  let component: AccountSecuritySection;
  let fixture: ComponentFixture<AccountSecuritySection>;

  const identitySubject = new BehaviorSubject<IdentityResponse | null>({
    accounts: [{ id: 'acc-1', mail: 'user@example.com', identityId: 1 }],
    adminOrganizations: [],
    id: 'user-1',
    organizations: [{ id: 'org-1', name: 'Chrono Labs' }],
  } as unknown as IdentityResponse);

  const mockAuth = {
    identity$: identitySubject.asObservable(),
    linkAccount: vi.fn().mockResolvedValue(undefined),
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AccountSecuritySection, getTranslocoTestingModule()],
      providers: [{ provide: Auth, useValue: mockAuth }],
    }).compileComponents();

    fixture = TestBed.createComponent(AccountSecuritySection);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should render linked accounts from identity', () => {
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('user@example.com');
  });

  it('should call linkAccount with email on requestLinkEmail', () => {
    component.mergeEmail = 'other@example.com';
    component.requestLinkEmail();
    expect(mockAuth.linkAccount).toHaveBeenCalledWith('other@example.com');
  });
});
