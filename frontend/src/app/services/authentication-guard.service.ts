import { Injectable } from '@angular/core';
import { Router, ActivatedRouteSnapshot } from '@angular/router';
import { AuthenticationService } from './authentication.service';
import { environment } from 'src/environments/environment';
import { Role } from '../models';
import { takeWhile } from 'rxjs';
import { LoggingService } from './logging.service';
import { MatSnackBar } from '@angular/material/snack-bar';

@Injectable()
export class AuthenticationGuardService {
  /** The default application path to navigate to. */
  defaultPath = '/';

  constructor(
    private router: Router,
    private authService: AuthenticationService,
    private logger: LoggingService,
    private notificationService: MatSnackBar,
  ) {}

  /**
   * Indicates if a user can activate the given route.
   * @param route The current route the user wants to access.
   * @param requiredRole The user role required to see the view.
   * @returns If the user can activate the route.
   */
  async canActivate(
    route: ActivatedRouteSnapshot,
    requiredRole?: Role,
  ): Promise<boolean> {
    const isLoggedIn = this.authService.loggedIn;
    const isAuthForm = ['login-form', 'reset-password'].includes(
      route.routeConfig?.path || this.defaultPath,
    );

    if (requiredRole) {
      this.authService.lastAuthenticatedPath =
        route.routeConfig?.path || this.defaultPath;
      return new Promise((resolve) => {
        this.authService.roleState
          .pipe(takeWhile((role) => role === null))
          .subscribe({
            complete: () => {
              if (!this.hasRole(requiredRole)) {
                this.router.navigate([this.defaultPath]);
                this.notificationService.open(
                  'User is not allowed to access this ressource.',
                  undefined,
                  {
                    duration: 2000,
                    panelClass: ['red-snackbar'],
                  },
                );
                this.logger.error(
                  `User with role ${this.authService.currentRole} is not allowd to access route: ${route.routeConfig?.path}`,
                );
                resolve(false);
              }

              resolve(true);
            },
          });
      });
    }

    if (isLoggedIn && isAuthForm) {
      this.authService.lastAuthenticatedPath = this.defaultPath;
      this.router.navigate([this.defaultPath]);
      return false;
    }

    if (!isLoggedIn && !isAuthForm) {
      this.logger.error('User is not logged in, redirect to login.');
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
        this.notificationService.open(
          'Reset password link is not valid!',
          undefined,
          {
            duration: 2000,
            panelClass: ['red-snackbar'],
          },
        );
        this.logger.error(
          'Reset password link is not valid: invalid API key provided',
        );
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
    const userRole = this.authService.currentRole;
    if (!userRole) return false;

    switch (requiredRole) {
      case Role.Admin:
        return userRole === Role.Admin;
      case Role.Editor:
        return [Role.Admin, Role.Editor].includes(userRole);
      case Role.Requester:
        return [Role.Admin, Role.Editor, Role.Requester].includes(userRole);
      default:
        return requiredRole === userRole;
    }
  }
}
