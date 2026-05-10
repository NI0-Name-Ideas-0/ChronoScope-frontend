import { Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Auth } from '@services/auth';
import { AccountLinkConfirmRequest } from '@api/models/account-link-confirm-request';

@Component({
  selector: 'app-link-account',
  imports: [],
  templateUrl: './link-account.html',
  styleUrl: './link-account.css',
})
export class LinkAccount implements OnInit {
  private route = inject(ActivatedRoute);
  private authService = inject(Auth);
  linked = signal(false);
  error = signal(false);

  ngOnInit(): void {
    this.route.queryParams.subscribe((params) => {
      const token = params['token'];
      if (token == undefined) {
        this.error.set(true);
        return;
      }
      let request: AccountLinkConfirmRequest = { token };
      this.authService.confirmLink(request).then((r) => {
        this.linked.set(true);})
        .catch(() => {
          this.error.set(true);
        });
    });
  }
}
