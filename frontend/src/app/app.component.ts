import { Component, HostBinding, OnDestroy, OnInit } from '@angular/core';
import {
  AppInfoService,
  AuthenticationService,
  ScreenService,
} from './services';
import { Router } from '@angular/router';
import { User } from '@angular/fire/auth';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent implements OnInit, OnDestroy {
  @HostBinding('class') get getClass() {
    return Object.keys(this.screen.sizes)
      .filter((cl) => this.screen.sizes[cl])
      .join(' ');
  }

  get unauthenticatedTitle() {
    let path = this.router.url.split('/')[1];
    const pathSegments = path.split('?');
    path = pathSegments[0];
    const queryParams = pathSegments[1];
    switch (path) {
      case 'login-form':
        return 'Sign In';
      case 'reset-password':
        if (queryParams && queryParams.includes('&oobCode='))
          return 'Change Password';
        return 'Reset Password';
      case 'create-account':
        return 'Sign Up';
      case 'change-password':
        return 'Change Password';
      default:
        return '';
    }
  }

  get unauthenticatedDescription() {
    const path = this.router.url.split('/')[1];
    switch (path) {
      case 'reset-password':
        return 'Please enter the email address that you used to register, and we will send you a link to reset your password via Email.';
      default:
        return '';
    }
  }

  authUpdateSubscription: Subscription = new Subscription();
  user: User | null = null;

  constructor(
    private authService: AuthenticationService,
    private screen: ScreenService,
    private router: Router,
    public appInfo: AppInfoService,
  ) {}

  ngOnInit(): void {
    this.authUpdateSubscription = this.authService.authState.subscribe(
      (user: User | null) => {
        this.user = user;
      },
    );
  }

  ngOnDestroy(): void {
    this.authUpdateSubscription.unsubscribe();
  }

  isAuthenticated() {
    return this.authService.loggedIn;
  }
}
