import { ComponentFixture, TestBed, inject } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { AuthenticationService, LoggingService } from '../../services';
import { AuthenticationServiceMock } from '../../../test/authentication-service.mock';
import {
  ResetPasswordFormComponent,
  ResetPasswordFormModule,
} from './reset-password-form.component';
import { ActivatedRoute, Router } from '@angular/router';
import { of } from 'rxjs';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { LoggingServiceMock } from '../../../test/logging.service.mock';
import { MatSnackBar } from '@angular/material/snack-bar';

describe('ResetPasswordFormComponent', () => {
  let component: ResetPasswordFormComponent;
  let fixture: ComponentFixture<ResetPasswordFormComponent>;
  let authService: AuthenticationServiceMock;
  let notificationService: MatSnackBar;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        RouterTestingModule,
        ResetPasswordFormModule,
        BrowserAnimationsModule,
      ],
      providers: [
        { provide: AuthenticationService, useClass: AuthenticationServiceMock },
        { provide: LoggingService, useClass: LoggingServiceMock },
      ],
      declarations: [ResetPasswordFormComponent],
    });

    authService = TestBed.inject(
      AuthenticationService,
    ) as AuthenticationServiceMock;
    notificationService = TestBed.inject(MatSnackBar);
    fixture = TestBed.createComponent(ResetPasswordFormComponent);
    component = fixture.componentInstance;
  });

  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  it('onSubmit should send a password reset mail and navigate to login on success', inject(
    [Router],
    async (router: Router) => {
      const sendSpy = spyOn(authService, 'sendPasswordReset').and.resolveTo({
        isOk: true,
      });
      const navSpy = spyOn(router, 'navigate');
      component.resetFormData.email = 'test@user.de';

      await component.onSubmit(new SubmitEvent('submit'));

      expect(sendSpy).toHaveBeenCalledWith('test@user.de');
      expect(navSpy).toHaveBeenCalledWith(['/login-form']);
      expect(component.loading).toBeFalse();
    },
  ));

  it('onSubmit should send a password reset mail and not navigate to login on failure', inject(
    [Router],
    async (router: Router) => {
      const sendSpy = spyOn(authService, 'sendPasswordReset').and.resolveTo({
        isOk: false,
        message: 'error',
      });
      const navSpy = spyOn(router, 'navigate');
      component.resetFormData.email = 'test@user.de';

      await component.onSubmit(new SubmitEvent('submit'));

      expect(sendSpy).toHaveBeenCalledWith('test@user.de');
      expect(navSpy).not.toHaveBeenCalled();
      expect(component.loading).toBeFalse();
    },
  ));

  it('onSubmit should send a password reset mail, not navigate to login on failure and notify with default message', inject(
    [Router],
    async (router: Router) => {
      const notifySpy = spyOn(notificationService, 'open');
      const sendSpy = spyOn(authService, 'sendPasswordReset').and.resolveTo({
        isOk: false,
      });
      const navSpy = spyOn(router, 'navigate');
      component.resetFormData.email = 'test@user.de';

      await component.onSubmit(new SubmitEvent('submit'));

      expect(sendSpy).toHaveBeenCalledWith('test@user.de');
      expect(navSpy).not.toHaveBeenCalled();
      expect(component.loading).toBeFalse();
      expect(notifySpy).toHaveBeenCalledWith(
        'Cannot send password reset!',
        undefined,
        jasmine.anything(),
      );
    },
  ));

  it('hasResetCode should indicate if a reset code was provided', inject(
    [ActivatedRoute],
    (activatedRoute: ActivatedRoute) => {
      activatedRoute.queryParams = of({ oobCode: '12345' });

      expect(component.hasResetCode).toBeFalse();
      fixture.detectChanges();
      expect(component.oobCode).toBe('12345');
      expect(component.hasResetCode).toBeTrue();
    },
  ));
});
