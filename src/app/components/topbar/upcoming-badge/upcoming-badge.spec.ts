import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { UpcomingBadge } from './upcoming-badge';
import { TaskService } from '@services/task.service';
import { Auth } from '@services/auth';
import { getTranslocoTestingModule } from '@test-utils/transloco-testing';

class MockTaskService {
  tasks$ = of([]);
  getAllTasks() {
    return [];
  }
}

class MockAuth {
  authReady$ = of(false);
  identity$ = of(null);
}

describe('UpcomingBadge', () => {
  let component: UpcomingBadge;
  let fixture: ComponentFixture<UpcomingBadge>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UpcomingBadge, getTranslocoTestingModule()],
      providers: [
        { provide: TaskService, useClass: MockTaskService },
        { provide: Auth, useClass: MockAuth },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(UpcomingBadge);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
