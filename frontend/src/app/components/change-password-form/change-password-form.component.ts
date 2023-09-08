import { CommonModule } from '@angular/common';
import { Component, NgModule, Input } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { ValidationCallbackData } from 'devextreme-angular/common';
import { DxFormModule } from 'devextreme-angular/ui/form';
import { DxLoadIndicatorModule } from 'devextreme-angular/ui/load-indicator';
import { AuthenticationService } from '../../services';
import notify from 'devextreme/ui/notify';

@Component({
  selector: 'app-change-passsword-form',
  templateUrl: './change-password-form.component.html',
  styleUrls: ['./change-password-form.component.scss'],
})
export class ChangePasswordFormComponent {
  /** Indicates if the loading spinner should be shown. */
  loading = false;
  /** The data fields for changing the password. */
  formData: { currentPassword: string; password: string } = {
    currentPassword: '',
    password: '',
  };

  /** The reset code to confirm the password reset. */
  @Input()
  oobCode?: string;

  constructor(
    private authService: AuthenticationService,
    private router: Router,
  ) {}

  /**
   * Submits the password reset/ the password change.
   * @param e The form submit event.
   */
  async onSubmit(e: Event): Promise<void> {
    e.preventDefault();
    const { currentPassword, password } = this.formData;
    this.loading = true;

    let result: { isOk: boolean; message?: string } = { isOk: false };
    if (this.oobCode) {
      result = await this.authService.confirmPasswordReset(
        this.oobCode!,
        password,
      );
    } else {
      result = await this.authService.reauthenticateUser(currentPassword);

      if (!result.isOk) {
        this.loading = false;
        notify(result.message, 'error', 2000);
        return;
      }

      result = await this.authService.changePassword(password);
    }

    this.loading = false;

    if (result.isOk) {
      notify('Successfully changed password!', 'success', 2000);
      this.router.navigate(['/']);
    } else {
      notify(result.message, 'error', 2000);
    }
  }

  /** Validates if the provided password and the confirm password value matches. */
  confirmPassword = (e: ValidationCallbackData) => {
    return e.value === this.formData.password;
  };
}
@NgModule({
  imports: [CommonModule, RouterModule, DxFormModule, DxLoadIndicatorModule],
  declarations: [ChangePasswordFormComponent],
  exports: [ChangePasswordFormComponent],
})
export class ChangePasswordFormModule {}
