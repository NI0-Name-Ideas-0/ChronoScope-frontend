import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Navbar } from './navbar';
import { Auth } from '@services/auth';
import { TaskService } from '@services/task.service';
import { of } from 'rxjs';

const mockAuthService = {
  logout: vi.fn(),
};

class MockTaskService {
  tasks$ = of([]);
  getAllTasks() {
    return [];
  }
  planTasks = vi.fn();
}

describe('Navbar', () => {
  let component: Navbar;
  let fixture: ComponentFixture<Navbar>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Navbar],
      providers: [
        { provide: Auth, useValue: mockAuthService },
        { provide: TaskService, useClass: MockTaskService },
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(Navbar);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
