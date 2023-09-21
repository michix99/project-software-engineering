import { TestBed } from '@angular/core/testing';
import { AuthenticationService } from './authentication.service';
import { AuthenticationServiceMock } from 'src/test/authentication-service.mock';
import { AuthenticationGuardService } from './authentication-guard.service';
import { RouterTestingModule } from '@angular/router/testing';
import { Role } from '../models';
import { ActivatedRouteSnapshot, Router } from '@angular/router';
import { environment } from 'src/environments/environment';

describe('AuthenticationGuardService', () => {
  let service: AuthenticationGuardService;
  let authService: AuthenticationServiceMock;
  let router: Router;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [RouterTestingModule],
      providers: [
        AuthenticationGuardService,
        { provide: AuthenticationService, useClass: AuthenticationServiceMock },
      ],
    });

    service = TestBed.inject(AuthenticationGuardService);
    authService = TestBed.inject(
      AuthenticationService,
    ) as AuthenticationServiceMock;
    router = TestBed.inject(Router);
  });

  it('canActivate should navigate to the default path if the user is logged in and is watching an auth form', () => {
    const navSpy = spyOn(router, 'navigate');
    authService.isLoggedIn = true;
    expect(
      service.canActivate({
        routeConfig: { path: 'login-form' },
      } as ActivatedRouteSnapshot),
    ).toBeFalse();
    expect(navSpy).toHaveBeenCalled();
    expect(
      (authService as unknown as { _lastAuthenticatedPath: string })
        ._lastAuthenticatedPath,
    ).toBe(service.defaultPath);
  });

  it('canActivate should navigate to an auth form if the user is not logged in and not on an auth form', () => {
    const navSpy = spyOn(router, 'navigate');
    authService.isLoggedIn = false;
    expect(
      service.canActivate({
        routeConfig: { path: 'no-auth-form' },
      } as ActivatedRouteSnapshot),
    ).toBeFalse();
    expect(navSpy).toHaveBeenCalledWith(['/login-form']);
  });

  it('canActivate should set the last authenticated path if the user is logged in', () => {
    authService.isLoggedIn = true;
    expect(
      service.canActivate({
        routeConfig: { path: 'no-auth-form' },
      } as ActivatedRouteSnapshot),
    ).toBeTrue();
    expect(
      (authService as unknown as { _lastAuthenticatedPath: string })
        ._lastAuthenticatedPath,
    ).toBe('no-auth-form');
  });

  it('canActivate should set the last authenticated path to the default path if the user is logged in and no path is provided', () => {
    authService.isLoggedIn = true;
    expect(
      service.canActivate({
        routeConfig: {},
      } as ActivatedRouteSnapshot),
    ).toBeTrue();
    expect(
      (authService as unknown as { _lastAuthenticatedPath: string })
        ._lastAuthenticatedPath,
    ).toBe(service.defaultPath);
  });

  it('canActivate should validate the api key for password reset and navigate if it is invalid', () => {
    const navSpy = spyOn(router, 'navigate');
    authService.isLoggedIn = false;
    expect(
      service.canActivate({
        routeConfig: { path: 'reset-password' },
        queryParams: {
          oobCode: '123',
          apiKey: 'wrong',
        },
      } as unknown as ActivatedRouteSnapshot),
    ).toBeFalse();
    expect(navSpy).toHaveBeenCalledWith([service.defaultPath]);
  });

  it('canActivate should validate the api key for password reset and return true if valid', () => {
    authService.isLoggedIn = false;
    expect(
      service.canActivate({
        routeConfig: { path: 'reset-password' },
        queryParams: {
          oobCode: '123',
          apiKey: environment.firebase.apiKey,
        },
      } as unknown as ActivatedRouteSnapshot),
    ).toBeTrue();
  });

  it('canActivate should navigate to the default path if the user has not the required role', () => {
    const navSpy = spyOn(router, 'navigate');
    authService.isLoggedIn = true;
    authService.role = Role.User;
    expect(
      service.canActivate(
        {
          routeConfig: { path: 'login-form' },
        } as ActivatedRouteSnapshot,
        Role.Admin,
      ),
    ).toBeFalse();
    expect(navSpy).toHaveBeenCalledWith([service.defaultPath]);
  });

  it('hasRole should indicate if the user has the permission required', () => {
    authService.role = Role.Admin;
    expect(service.hasRole(Role.Admin)).toBeTrue();
    expect(service.hasRole(Role.User)).toBeTrue();

    authService.role = Role.User;
    expect(service.hasRole(Role.Admin)).toBeFalse();
    expect(service.hasRole(Role.User)).toBeTrue();

    expect(service.hasRole('dummy' as Role)).toBeFalse();
  });
});
