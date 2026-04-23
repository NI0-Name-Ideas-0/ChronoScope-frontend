// view.service.spec.ts (für die verbesserte Version)
import { TestBed } from '@angular/core/testing';
import { ViewService } from './view.service';

describe('ViewService', () => {
  let service: ViewService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [ViewService]
    });
    service = TestBed.inject(ViewService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('Initial State', () => {
    it('should have listView disabled by default', () => {
      expect(service.listView).toBe(false);
    });

    it('should have calendarView enabled by default', () => {
      expect(service.calendarView).toBe(true);
    });
  });

  describe('Toggle Methods', () => {
    it('should toggle listView from false to true', () => {
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
});