// view.service.spec.ts (für die verbesserte Version)
import { TestBed } from '@angular/core/testing';
import { ViewService } from './view.service';

describe('ViewService', () => {
  let service: ViewService;

  beforeEach(() => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [ViewService]
    });
    service = TestBed.inject(ViewService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('Initial State', () => {
    it('should have listView enabled by default', () => {
      expect(service.listView).toBe(true);
    });

    it('should have calendarView enabled by default', () => {
      expect(service.calendarView).toBe(true);
    });

    it('should have empty searchQuery by default', () => {
      expect(service.searchQuery()).toBe('');
    });

    it('should have null selectedOrganizationId by default', () => {
      expect(service.selectedOrganizationId()).toBeNull();
    });

    it('should have null activeFilter by default', () => {
      expect(service.activeFilter()).toBeNull();
    });

    it('should have empty searchTask by default', () => {
      expect(service.searchTask()).toBe('');
    });

    it('should have null jumpToDate by default', () => {
      expect(service.jumpToDate()).toBeNull();
    });
  });

  describe('Toggle Methods', () => {
    it('should toggle listView from false to true', () => {
      service.setListView(false);
      expect(service.listView).toBe(false);
      
      service.toggleList();
      
      expect(service.listView).toBe(true);
    });

    it('should toggle listView from true to false', () => {
      service.setListView(true);
      expect(service.listView).toBe(true);
      
      service.toggleList();
      
      expect(service.listView).toBe(false);
    });

    it('should toggle calendarView from true to false', () => {
      expect(service.calendarView).toBe(true);
      
      service.toggleCalendar();
      
      expect(service.calendarView).toBe(false);
    });
  });

  describe('Setter Methods', () => {
    it('should set listView to specific value', () => {
      service.setListView(true);
      expect(service.listView).toBe(true);

      service.setListView(false);
      expect(service.listView).toBe(false);
    });

    it('should set calendarView to specific value', () => {
      service.setCalendarView(false);
      expect(service.calendarView).toBe(false);

      service.setCalendarView(true);
      expect(service.calendarView).toBe(true);
    });
  });

  describe('Signal State', () => {
    it('should update searchQuery', () => {
      service.searchQuery.set('test query');
      expect(service.searchQuery()).toBe('test query');
    });

    it('should update selectedOrganizationId', () => {
      service.selectedOrganizationId.set('org-1');
      expect(service.selectedOrganizationId()).toBe('org-1');
    });

    it('should update activeFilter', () => {
      const filter = { type: 'label' as const, value: 'work' };
      service.activeFilter.set(filter);
      expect(service.activeFilter()).toEqual(filter);
    });

    it('should update searchTask', () => {
      service.searchTask.set('task 1');
      expect(service.searchTask()).toBe('task 1');
    });

    it('should update jumpToDate', () => {
      const date = new Date('2026-05-01');
      service.jumpToDate.set(date);
      expect(service.jumpToDate()).toBe(date);
    });
  });
});
