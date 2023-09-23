import { ComponentFixture, TestBed, inject } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { AuthenticationService, LoggingService } from '../../services';
import { AuthenticationServiceMock } from '../../../test/authentication-service.mock';
import {
  ChangePasswordFormComponent,
  ChangePasswordFormModule,
} from './change-password-form.component';
import { Router } from '@angular/router';
import { ValidationCallbackData } from 'devextreme/common';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { LoggingServiceMock } from '../../../test/logging.service.mock';
import { MatSnackBar } from '@angular/material/snack-bar';

describe('ChangePasswordFormComponent', () => {
  let component: ChangePasswordFormComponent;
  let fixture: ComponentFixture<ChangePasswordFormComponent>;
  let authService: AuthenticationServiceMock;
  let notificationService: MatSnackBar;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        RouterTestingModule,
        ChangePasswordFormModule,
        BrowserAnimationsModule,
      ],
      providers: [
        { provide: AuthenticationService, useClass: AuthenticationServiceMock },
        { provide: LoggingService, useClass: LoggingServiceMock },
      ],
      declarations: [ChangePasswordFormComponent],
    });

    authService = TestBed.inject(
      AuthenticationService,
    ) as AuthenticationServiceMock;
    notificationService = TestBed.inject(MatSnackBar);
    fixture = TestBed.createComponent(ChangePasswordFormComponent);
    component = fixture.componentInstance;
  });

  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  it('onSubmit should change the password and navigate to home afterwards (no oobCode)', inject(
    [Router],
    async (router: Router) => {
      fixture.detectChanges();
      const changeSpy = spyOn(authService, 'changePassword').and.callThrough();
      const navigateSpy = spyOn(router, 'navigate');
      await component.onSubmit(new SubmitEvent('submit'));

      expect(changeSpy).toHaveBeenCalled();
      expect(navigateSpy).toHaveBeenCalledWith(['/']);
      expect(component.loading).toBeFalse();
    },
  ));

  it('onSubmit should change the password and not navigate on error result (no oobCode)', inject(
    [Router],
    async (router: Router) => {
      fixture.detectChanges();
      const changeSpy = spyOn(authService, 'changePassword').and.resolveTo({
        isOk: false,
        message: 'error',
      });
      const navigateSpy = spyOn(router, 'navigate');
      await component.onSubmit(new SubmitEvent('submit'));

      expect(changeSpy).toHaveBeenCalled();
      expect(navigateSpy).not.toHaveBeenCalled();
      expect(component.loading).toBeFalse();
    },
  ));

  it('onSubmit should change the password, not navigate on error result and notify with default message (no oobCode)', inject(
    [Router],
    async (router: Router) => {
      fixture.detectChanges();
      const changeSpy = spyOn(authService, 'changePassword').and.resolveTo({
        isOk: false,
      });
      const notifySpy = spyOn(notificationService, 'open');
      const navigateSpy = spyOn(router, 'navigate');
      await component.onSubmit(new SubmitEvent('submit'));

      expect(changeSpy).toHaveBeenCalled();
      expect(navigateSpy).not.toHaveBeenCalled();
      expect(component.loading).toBeFalse();
      expect(notifySpy).toHaveBeenCalledWith(
        'Cannot change password.',
        jasmine.anything(),
        jasmine.anything(),
      );
    },
  ));

  it('onSubmit should not change the password if the reauth was not successful (no oobCode)', async () => {
    fixture.detectChanges();
    const changeSpy = spyOn(authService, 'changePassword').and.callThrough();
    authService.requestSuccess = false;
    await component.onSubmit(new SubmitEvent('submit'));

    expect(changeSpy).not.toHaveBeenCalled();
    expect(component.loading).toBeFalse();
  });

  it('onSubmit should not change the password if the reauth was not successful and notify with default message (no oobCode)', async () => {
    fixture.detectChanges();
    const changeSpy = spyOn(authService, 'changePassword').and.callThrough();
    const notifySpy = spyOn(notificationService, 'open');
    spyOn(authService, 'reauthenticateUser').and.returnValue(
      Promise.resolve({ isOk: false }),
    );
    await component.onSubmit(new SubmitEvent('submit'));

    expect(changeSpy).not.toHaveBeenCalled();
    expect(component.loading).toBeFalse();
    expect(notifySpy).toHaveBeenCalledWith(
      'Reauthentication was not successful',
      undefined,
      jasmine.anything(),
    );
  });

  it('onSubmit should change the password and navigate to home afterwards (with oobCode)', inject(
    [Router],
    async (router: Router) => {
      fixture.detectChanges();
      component.oobCode = 'code';
      const confirmSpy = spyOn(
        authService,
        'confirmPasswordReset',
      ).and.resolveTo({ isOk: true });
      const navigateSpy = spyOn(router, 'navigate');
      await component.onSubmit(new SubmitEvent('submit'));

      expect(confirmSpy).toHaveBeenCalled();
      expect(navigateSpy).toHaveBeenCalledWith(['/']);
      expect(component.loading).toBeFalse();
    },
  ));

  it('confirmPassword should check if the password and the confirm password matches', () => {
    component.formData.password = 'test';
    expect(
      component.confirmPassword({ value: 'test' } as ValidationCallbackData),
    ).toBeTrue();
    expect(
      component.confirmPassword({
        value: 'another test',
      } as ValidationCallbackData),
    ).toBeFalse();
  });
});
