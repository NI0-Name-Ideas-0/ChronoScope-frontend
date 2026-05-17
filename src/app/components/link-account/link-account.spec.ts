import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';
import { of } from 'rxjs';

import { LinkAccount } from './link-account';
import { Auth } from '@services/auth';
import { getTranslocoTestingModule } from 'test-utils/transloco-testing';

describe('LinkAccount', () => {
  let component: LinkAccount;
  let fixture: ComponentFixture<LinkAccount>;

  const mockAuth = {
    confirmLink: vi.fn().mockResolvedValue({}),
  };

  const mockActivatedRoute = {
    queryParams: of({ token: 'test-token' }),
  };

  beforeEach(async () => {
    TestBed.resetTestingModule();
    await TestBed.configureTestingModule({
      imports: [LinkAccount, getTranslocoTestingModule()],
      providers: [
        { provide: ActivatedRoute, useValue: mockActivatedRoute },
        { provide: Auth, useValue: mockAuth },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(LinkAccount);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should set linked signal to true on successful confirm', async () => {
    mockAuth.confirmLink.mockResolvedValue({});
    await fixture.whenStable();
    expect(component.linked()).toBe(true);
    expect(component.error()).toBe(false);
  });

  it('should set error signal to true when token is missing', async () => {
    TestBed.resetTestingModule();
    await TestBed.configureTestingModule({
      imports: [LinkAccount, getTranslocoTestingModule()],
      providers: [
        { provide: ActivatedRoute, useValue: { queryParams: of({}) } },
        { provide: Auth, useValue: mockAuth },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(LinkAccount);
    component = fixture.componentInstance;
    fixture.detectChanges();
    await fixture.whenStable();

    expect(component.error()).toBe(true);
    expect(component.linked()).toBe(false);
  });
});
