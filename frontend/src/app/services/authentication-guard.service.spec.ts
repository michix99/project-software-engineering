import { TestBed } from '@angular/core/testing';
import { AuthenticationService } from './authentication.service';
import { AuthenticationServiceMock } from 'src/test/authentication-service.mock';
import { AuthenticationGuardService } from './authentication-guard.service';
import { RouterTestingModule } from '@angular/router/testing';
import { Role } from '../models';
import { ActivatedRouteSnapshot, Router } from '@angular/router';
import { environment } from 'src/environments/environment';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { LoggingService } from './logging.service';
import { LoggingServiceMock } from 'src/test/logging.service.mock';

describe('AuthenticationGuardService', () => {
  let service: AuthenticationGuardService;
  let authService: AuthenticationServiceMock;
  let router: Router;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        RouterTestingModule,
        MatSnackBarModule,
        BrowserAnimationsModule,
      ],
      providers: [
        AuthenticationGuardService,
        { provide: AuthenticationService, useClass: AuthenticationServiceMock },
        { provide: LoggingService, useClass: LoggingServiceMock },
      ],
    });

    service = TestBed.inject(AuthenticationGuardService);
    authService = TestBed.inject(
      AuthenticationService,
    ) as AuthenticationServiceMock;
    router = TestBed.inject(Router);
  });

  it('canActivate should navigate to the default path if the user is logged in and is watching an auth form', async () => {
    const navSpy = spyOn(router, 'navigate');
    authService.isLoggedIn = true;
    expect(
      await service.canActivate({
        routeConfig: { path: 'login-form' },
      } as ActivatedRouteSnapshot),
    ).toBeFalse();
    expect(navSpy).toHaveBeenCalled();
    expect(
      (authService as unknown as { _lastAuthenticatedPath: string })
        ._lastAuthenticatedPath,
    ).toBe(service.defaultPath);
  });

  it('canActivate should navigate to an auth form if the user is not logged in and not on an auth form', async () => {
    const navSpy = spyOn(router, 'navigate');
    authService.isLoggedIn = false;
    expect(
      await service.canActivate({
        routeConfig: { path: 'no-auth-form' },
      } as ActivatedRouteSnapshot),
    ).toBeFalse();
    expect(navSpy).toHaveBeenCalledWith(['/login-form']);
  });

  it('canActivate should set the last authenticated path if the user is logged in', async () => {
    authService.isLoggedIn = true;
    expect(
      await service.canActivate({
        routeConfig: { path: 'no-auth-form' },
      } as ActivatedRouteSnapshot),
    ).toBeTrue();
    expect(
      (authService as unknown as { _lastAuthenticatedPath: string })
        ._lastAuthenticatedPath,
    ).toBe('no-auth-form');
  });

  it('canActivate should set the last authenticated path to the default path if the user is logged in and no path is provided', async () => {
    authService.isLoggedIn = true;
    expect(
      await service.canActivate({
        routeConfig: {},
      } as ActivatedRouteSnapshot),
    ).toBeTrue();
    expect(
      (authService as unknown as { _lastAuthenticatedPath: string })
        ._lastAuthenticatedPath,
    ).toBe(service.defaultPath);
  });

  it('canActivate should validate the api key for password reset and navigate if it is invalid', async () => {
    const navSpy = spyOn(router, 'navigate');
    authService.isLoggedIn = false;
    expect(
      await service.canActivate({
        routeConfig: { path: 'reset-password' },
        queryParams: {
          oobCode: '123',
          apiKey: 'wrong',
        },
      } as unknown as ActivatedRouteSnapshot),
    ).toBeFalse();
    expect(navSpy).toHaveBeenCalledWith([service.defaultPath]);
  });

  it('canActivate should validate the api key for password reset and return true if valid', async () => {
    authService.isLoggedIn = false;
    expect(
      await service.canActivate({
        routeConfig: { path: 'reset-password' },
        queryParams: {
          oobCode: '123',
          apiKey: environment.firebase.apiKey,
        },
      } as unknown as ActivatedRouteSnapshot),
    ).toBeTrue();
  });

  it('canActivate should navigate to the default path if the user has not the required role', async () => {
    const navSpy = spyOn(router, 'navigate');
    authService.isLoggedIn = true;
    authService.role = Role.Editor;
    authService.roleState.next(Role.Editor);
    expect(
      await service.canActivate({} as ActivatedRouteSnapshot, Role.Admin),
    ).toBeFalse();
    expect(navSpy).toHaveBeenCalledWith([service.defaultPath]);
  });

  it('canActivate should return true if the user has the required role', async () => {
    authService.isLoggedIn = true;
    authService.role = Role.Editor;
    authService.roleState.next(Role.Editor);
    expect(
      await service.canActivate(
        {
          routeConfig: { path: 'login-form' },
        } as ActivatedRouteSnapshot,
        Role.Editor,
      ),
    ).toBeTrue();
  });

  it('hasRole should indicate if the user has the permission required', () => {
    authService.role = Role.Admin;
    expect(service.hasRole(Role.Admin)).toBeTrue();
    expect(service.hasRole(Role.Editor)).toBeTrue();
    expect(service.hasRole(Role.Requester)).toBeTrue();

    authService.role = Role.Editor;
    expect(service.hasRole(Role.Admin)).toBeFalse();
    expect(service.hasRole(Role.Editor)).toBeTrue();
    expect(service.hasRole(Role.Requester)).toBeTrue();

    authService.role = Role.Requester;
    expect(service.hasRole(Role.Admin)).toBeFalse();
    expect(service.hasRole(Role.Editor)).toBeFalse();
    expect(service.hasRole(Role.Requester)).toBeTrue();

    expect(service.hasRole('dummy' as Role)).toBeFalse();
  });

  it('hasRole should return false, if the current user is undefined', () => {
    authService.role = undefined as unknown as Role;
    expect(service.hasRole(Role.Editor)).toBeFalse();
  });
});
