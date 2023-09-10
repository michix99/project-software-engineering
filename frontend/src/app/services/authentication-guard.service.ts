import { Injectable } from '@angular/core';
import { Router, ActivatedRouteSnapshot } from '@angular/router';
import { AuthenticationService } from './authentication.service';
import { environment } from 'src/environments/environment';
import notify from 'devextreme/ui/notify';
import { Role } from '../models';

@Injectable()
export class AuthenticationGuardService {
  /** The default application path to navigate to. */
  defaultPath = '/';

  constructor(
    private router: Router,
    private authService: AuthenticationService,
  ) {}

  /**
   * Indicates if a user can activate the given route.
   * @param route The current route the user wants to access.
   * @param requiredRole The user role required to see the view.
   * @returns If the user can activate the route.
   */
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

  /**
   * Indicates if a user fullfills the required role.
   * @param requiredRole The role the user (min) needs to have.
   * @returns If the user has the required permissions.
   */
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
