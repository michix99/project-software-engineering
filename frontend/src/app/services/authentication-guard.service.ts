import { Injectable } from '@angular/core';
import { Router, ActivatedRouteSnapshot } from '@angular/router';
import { AuthenticationService } from './authentication.service';
import { environment } from 'src/environments/environment';
import notify from 'devextreme/ui/notify';
import { Role } from '../models';

@Injectable()
export class AuthenticationGuardService {
  defaultPath = '/';
  constructor(
    private router: Router,
    private authService: AuthenticationService,
  ) {}

  canActivate(route: ActivatedRouteSnapshot, requiredRole?: Role): boolean {
    const isLoggedIn = this.authService.loggedIn;
    const isAuthForm = ['login-form', 'reset-password'].includes(
      route.routeConfig?.path || this.defaultPath,
    );
    const isAllowed = requiredRole ? this.hasRole(requiredRole) : true;

    if (!isAllowed) {
      this.router.navigate([this.defaultPath]);
      notify('User is not allowed to access this ressource.', 'error', 2000);
      return false;
    }

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

    if (
      route.routeConfig?.path == 'reset-password' &&
      route.queryParams['oobCode']
    ) {
      const apiKey = route.queryParams['apiKey'];
      if (!apiKey || apiKey !== environment.firebase.apiKey) {
        this.router.navigate([this.defaultPath]);
        notify('Reset password link is not valid!', 'error', 2000);
        return false;
      }

      return true;
    }

    return isLoggedIn || isAuthForm;
  }

  hasRole(requiredRole: Role): boolean {
    const userRole = this.authService.authUserInfo.role;

    switch (requiredRole) {
      case Role.Admin:
        return userRole === Role.Admin;
      case Role.User:
        return [Role.Admin, Role.User].includes(userRole);
      default:
        return requiredRole === userRole;
    }
  }
}
