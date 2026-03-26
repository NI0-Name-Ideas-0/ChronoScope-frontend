import { Component, inject } from '@angular/core';
import { Auth } from '@services/auth'

@Component({
  selector: 'app-navbar',
  imports: [],
  templateUrl: './navbar.html',
  styleUrl: './navbar.css',
})
export class Navbar {
  private authService: Auth = inject(Auth);

  logout() {
    this.authService.logout();
  }
}
