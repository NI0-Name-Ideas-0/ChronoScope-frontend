import { ComponentFixture, TestBed } from '@angular/core/testing';
import { OrganizationsSection } from './organizations';
import { Auth } from '@services/auth';
import { Organization } from '@services/organization';
import { Api } from '@api/api';
import { BehaviorSubject } from 'rxjs';
import { IdentityResponse } from '../../../../../api/models';
import { getTranslocoTestingModule } from 'test-utils/transloco-testing';

describe('OrganizationsSection', () => {
  let component: OrganizationsSection;
  let fixture: ComponentFixture<OrganizationsSection>;

  const identitySubject = new BehaviorSubject<IdentityResponse | null>({
    organizations: [
      { id: 'org-1', name: 'Chrono Labs' },
      { id: 'org-2', name: 'Test Org' },
    ],
    adminOrganizations: ['org-1'],
  } as IdentityResponse);

  const mockAuth = {
    identity$: identitySubject.asObservable(),
    getIdentityData: vi.fn().mockReturnValue(identitySubject.getValue()),
  };

  const mockOrganizationService = {
    getOrganizationMembers: vi.fn().mockResolvedValue({ members: [] }),
    getOrganizationInvitations: vi.fn().mockResolvedValue({ invitations: [] }),
    inviteUser: vi.fn().mockResolvedValue(undefined),
    resendInvitation: vi.fn().mockResolvedValue(undefined),
    deleteInvitation: vi.fn().mockResolvedValue(undefined),
    removeMember: vi.fn().mockResolvedValue(undefined),
  };

  const mockApi = {
    invoke: vi.fn().mockResolvedValue([]),
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [OrganizationsSection, getTranslocoTestingModule()],
      providers: [
        { provide: Auth, useValue: mockAuth },
        { provide: Organization, useValue: mockOrganizationService },
        { provide: Api, useValue: mockApi },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(OrganizationsSection);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should render organizations from identity', () => {
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Chrono Labs');
    expect(fixture.nativeElement.textContent).toContain('Test Org');
  });

  it('should show Admin badge for admin organizations', () => {
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Admin');
  });
});
