import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Navbar } from './components/navbar/navbar';
import { Topbar } from './components/topbar/topbar';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, Navbar, Topbar],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  protected readonly title = signal('ChronoScope-frontend');
}
