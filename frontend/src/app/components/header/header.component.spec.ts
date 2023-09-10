import { ComponentFixture, TestBed, inject } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { HeaderComponent, HeaderModule } from './header.component';
import { AuthenticationService } from '../../services';
import { AuthenticationServiceMock } from '../../../test/authentication-service.mock';
import { User } from '@angular/fire/auth';
import { Router } from '@angular/router';

describe('HeaderComponent', () => {
  let component: HeaderComponent;
  let fixture: ComponentFixture<HeaderComponent>;
  let authService: AuthenticationServiceMock;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [RouterTestingModule, HeaderModule],
      providers: [
        { provide: AuthenticationService, useClass: AuthenticationServiceMock },
      ],
      declarations: [HeaderComponent],
    });

    authService = TestBed.inject(
      AuthenticationService,
    ) as AuthenticationServiceMock;
    fixture = TestBed.createComponent(HeaderComponent);
    component = fixture.componentInstance;
  });

  it('should create the app', () => {
    expect(component).toBeTruthy();
  });

  it('ngOnInit should load the user', () => {
    const loadSpy = spyOn(authService, 'getUser').and.returnValue({
      isOk: true,
      data: { email: 'test@user.de' } as User,
    });
    fixture.detectChanges();

    expect(component.user).toBeDefined();
    expect(component.user!.email).toBe('test@user.de');
    expect(loadSpy).toHaveBeenCalled();
  });

  it('ngOnInit should set the user to null if the auth service does not return anything', () => {
    const loadSpy = spyOn(authService, 'getUser').and.returnValue({
      isOk: false,
      message: 'error',
    });
    fixture.detectChanges();

    expect(component.user).toBeNull();
    expect(loadSpy).toHaveBeenCalled();
  });

  it('toggleMenu should notifiy that the menu was toggled', () => {
    const emitSpy = spyOn(component.menuToggle, 'emit');

    component.toggleMenu();
    expect(emitSpy).toHaveBeenCalled();
  });

  it('onClick on profile menu item should navigate to the profile page', inject(
    [Router],
    (router: Router) => {
      const navigateSpy = spyOn(router, 'navigate');

      component.userMenuItems.find((e) => e.text === 'Profile')?.onClick();
      expect(navigateSpy).toHaveBeenCalledWith(['/profile']);
    },
  ));

  it('onClick on change password menu item should navigate to the change password page', inject(
    [Router],
    (router: Router) => {
      const navigateSpy = spyOn(router, 'navigate');

      component.userMenuItems
        .find((e) => e.text === 'Change Password')
        ?.onClick();
      expect(navigateSpy).toHaveBeenCalledWith(['/change-password']);
    },
  ));

  it('onClick on logout menu item should log the user out', () => {
    const logOutSpy = spyOn(authService, 'logOut');

    component.userMenuItems.find((e) => e.text === 'Logout')?.onClick();
    expect(logOutSpy).toHaveBeenCalled();
  });
});
