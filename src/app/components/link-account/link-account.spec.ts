import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';
import { of } from 'rxjs';

import { LinkAccount } from './link-account';
import { Auth } from '@services/auth';

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
    await TestBed.configureTestingModule({
      imports: [LinkAccount],
      providers: [
        { provide: ActivatedRoute, useValue: mockActivatedRoute },
        { provide: Auth, useValue: mockAuth },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(LinkAccount);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
