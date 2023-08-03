import { Injectable } from '@angular/core';
import { Router, ActivatedRouteSnapshot } from '@angular/router';
import { AuthenticationService } from './authentication.service';

@Injectable()
export class AuthenticationGuardService {
  defaultPath = '/';
  constructor(
    private router: Router,
    private authService: AuthenticationService,
  ) {}

  canActivate(route: ActivatedRouteSnapshot): boolean {
    const isLoggedIn = this.authService.loggedIn;
    const isAuthForm = [
      'login-form',
      'reset-password',
      'create-account',
      'change-password/:recoveryCode',
    ].includes(route.routeConfig?.path || this.defaultPath);

    if (isLoggedIn && isAuthForm) {
      this.authService.lastAuthenticatedPath = this.defaultPath;
      this.router.navigate([this.defaultPath]);
      return false;
    }

    if (!isLoggedIn && !isAuthForm) {
      this.router.navigate(['/login-form']);
    }

    if (isLoggedIn) {
      this.authService.lastAuthenticatedPath =
        route.routeConfig?.path || this.defaultPath;
    }

    return isLoggedIn || isAuthForm;
  }
}
