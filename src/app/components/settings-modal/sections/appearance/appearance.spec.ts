import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AppearanceSection } from './appearance';
import { ThemeService } from '@services/theme.service';
import { signal } from '@angular/core';
import { LanguageService } from '@services/language.service';
import { getTranslocoTestingModule } from 'test-utils/transloco-testing';

describe('AppearanceSection', () => {
  let component: AppearanceSection;
  let fixture: ComponentFixture<AppearanceSection>;

  const mockThemeService = {
    theme: signal('system'),
    setTheme: vi.fn(),
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AppearanceSection, getTranslocoTestingModule()],
      providers: [
        { provide: ThemeService, useValue: mockThemeService },
        { provide: LanguageService, useValue: { initialize: vi.fn(), language: vi.fn(() => 'en'), setLanguage: vi.fn() } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(AppearanceSection);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should render all theme options', () => {
    const buttons = fixture.nativeElement.querySelectorAll('button[role="radio"]');
    expect(buttons.length).toBe(3);
    expect(buttons[0].textContent).toContain('Light');
    expect(buttons[1].textContent).toContain('Dark');
    expect(buttons[2].textContent).toContain('System');
  });

  it('should call setTheme when a theme option is clicked', () => {
    const darkButton = fixture.nativeElement.querySelectorAll('button[role="radio"]')[1];
    darkButton.click();
    expect(mockThemeService.setTheme).toHaveBeenCalledWith('dark');
  });
});
