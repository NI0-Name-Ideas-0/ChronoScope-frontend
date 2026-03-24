import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UpcomingBadge } from './upcoming-badge';

describe('UpcomingBadge', () => {
  let component: UpcomingBadge;
  let fixture: ComponentFixture<UpcomingBadge>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UpcomingBadge],
    }).compileComponents();

    fixture = TestBed.createComponent(UpcomingBadge);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
