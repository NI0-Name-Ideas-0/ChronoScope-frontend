import { Component, signal, inject, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Navbar } from './components/navbar/navbar';
import { Topbar } from './components/topbar/topbar';
import { CalendarView } from './components/calendar-view/calendar-view';
import { Auth } from '@services/auth'

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, Navbar, Topbar, CalendarView],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App implements OnInit {
  protected readonly title = signal('ChronoScope-frontend');

  private authService: Auth = inject(Auth);

  ngOnInit() {
    this.login();
  }

  login() {
	  this.authService.login();
  }
}
