import {
  Component,
  ChangeDetectionStrategy,
  signal,
  inject,
  OnInit,
} from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Auth } from '@services/auth';
import { ThemeService } from '@services/theme.service';
import { NotificationsContainer } from '@app/components/notifications/notifications-container/notifications-container';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, NotificationsContainer],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App implements OnInit {
  protected readonly title = signal('ChronoScope-frontend');
  private authService = inject(Auth);
  private themeService = inject(ThemeService);

  ngOnInit() {
    this.themeService.initialize();
    this.login();
  }

  login() {
    this.authService.login();
  }
}
