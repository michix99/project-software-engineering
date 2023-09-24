import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { AppComponent } from './app.component';
import {
  AppInfoService,
  AuthenticationGuardService,
  AuthenticationService,
  ScreenService,
} from './services';
import { AuthenticationServiceMock } from 'src/test/authentication-service.mock';
import { SideNavOuterToolbarModule } from './components';
import { Router, Routes } from '@angular/router';
import { Component } from '@angular/core';
import {
  NAVIGATION,
  NAVIGATION_TOKEN,
} from './components/side-nav-outer-toolbar/navigation';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

@Component({ template: '' })
class TestComponent {}

const testRoutes: Routes = [
  {
    path: 'login-form',
    component: TestComponent,
  },
  {
    path: 'reset-password',
    component: TestComponent,
  },
  {
    path: 'create-account',
    component: TestComponent,
  },
  {
    path: 'change-password',
    component: TestComponent,
  },
  {
    path: '**',
    redirectTo: '',
    pathMatch: 'full',
  },
];

describe('AppComponent', () => {
  let component: AppComponent;
  let fixture: ComponentFixture<AppComponent>;
  let authService: AuthenticationServiceMock;
  let router: Router;
  let screenService: ScreenService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        RouterTestingModule.withRoutes(testRoutes),
        SideNavOuterToolbarModule,
        MatSnackBarModule,
        MatProgressSpinnerModule,
      ],
      providers: [
        { provide: AuthenticationService, useClass: AuthenticationServiceMock },
        { provide: NAVIGATION_TOKEN, useValue: NAVIGATION },
        AuthenticationGuardService,
        ScreenService,
        AppInfoService,
      ],
      declarations: [AppComponent],
    });

    fixture = TestBed.createComponent(AppComponent);
    component = fixture.componentInstance;
    authService = TestBed.inject(
      AuthenticationService,
    ) as AuthenticationServiceMock;
    router = TestBed.inject(Router);
    screenService = TestBed.inject(ScreenService);
  });

  it('should create the app', () => {
    expect(component).toBeTruthy();
  });

  it('isAuthenticated should indicate if the user is authenticated', () => {
    authService.isLoggedIn = true;
    expect(component.isAuthenticated()).toBeTrue();
    authService.isLoggedIn = false;
    expect(component.isAuthenticated()).toBeFalse();
  });

  it('getClass should get the css classes depending on the screen size', () => {
    spyOnProperty(screenService, 'sizes').and.returnValue({
      'screen-x-small': true,
      'screen-small': true,
      'screen-medium': false,
      'screen-large': false,
    });

    expect(component.getClass).toBe('screen-x-small screen-small');
  });

  it('unauthenticatedTitle should return the title for unauthenticated urls', async () => {
    fixture.detectChanges();
    await router.navigate(['/login-form']);
    expect(component.unauthenticatedTitle).toBe('Sign In');

    await router.navigate(['/reset-password']);
    expect(component.unauthenticatedTitle).toBe('Reset Password');

    await router.navigate(['/reset-password'], {
      queryParams: { apiKey: '123', oobCode: '567' },
    });
    expect(component.unauthenticatedTitle).toBe('Change Password');

    await router.navigate(['/create-account']);
    expect(component.unauthenticatedTitle).toBe('Sign Up');

    await router.navigate(['/change-password']);
    expect(component.unauthenticatedTitle).toBe('Change Password');

    await router.navigate(['/home']);
    expect(component.unauthenticatedTitle).toBe('');
  });

  it('unauthenticatedDescription should return the description for unauthenticated urls', async () => {
    fixture.detectChanges();

    await router.navigate(['/reset-password']);
    expect(component.unauthenticatedDescription).toBe(
      'Please enter the email address that you used to register, ' +
        'and we will send you a link to reset your password via Email.',
    );

    await router.navigate(['/home']);
    expect(component.unauthenticatedDescription).toBe('');
  });
});
