import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LinkAccount } from './link-account';

describe('LinkAccount', () => {
  let component: LinkAccount;
  let fixture: ComponentFixture<LinkAccount>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LinkAccount],
    }).compileComponents();

    fixture = TestBed.createComponent(LinkAccount);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
