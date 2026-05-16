import { ComponentFixture, TestBed } from '@angular/core/testing';
import { OrganizationsSection } from './organizations';
import { Auth } from '@services/auth';
import { BehaviorSubject } from 'rxjs';
import { IdentityResponse } from '../../../../../api/models';

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
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [OrganizationsSection],
      providers: [{ provide: Auth, useValue: mockAuth }],
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
