import { CommonModule } from '@angular/common';
import { Component, NgModule, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { DxFormModule } from 'devextreme-angular/ui/form';
import { DxLoadIndicatorModule } from 'devextreme-angular/ui/load-indicator';
import { AuthenticationService, LoggingService } from '../../services';
import { ChangePasswordFormModule } from '../change-password-form/change-password-form.component';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

@Component({
  selector: 'app-reset-password-form',
  templateUrl: './reset-password-form.component.html',
  styleUrls: ['./reset-password-form.component.scss'],
})
export class ResetPasswordFormComponent implements OnInit {
  /** Indicates if the loading spinner should be shown. */
  loading = false;
  /** The data fields for reseting the password. */
  resetFormData: { email: string } = { email: '' };
  /** The code used for confirming the password reset. */
  oobCode?: string;

  /** Indicates if the route contains a reset code. */
  get hasResetCode(): boolean {
    return this.oobCode != undefined;
  }

  constructor(
    private authService: AuthenticationService,
    private router: Router,
    private route: ActivatedRoute,
    private notificationService: MatSnackBar,
    private logger: LoggingService,
  ) {}

  ngOnInit() {
    this.route.queryParams.subscribe((params) => {
      this.oobCode = params['oobCode'];
    });
  }

  /**
   * Submits the password reset mail.
   * @param e The form submit event.
   */
  async onSubmit(e: Event) {
    e.preventDefault();
    this.loading = true;

    const { email } = this.resetFormData;
    const result = await this.authService.sendPasswordReset(email);
    const notificationText =
      "We've sent a link to reset your password. Check your inbox.";
    this.loading = false;

    if (result.isOk) {
      this.router.navigate(['/login-form']);
      this.notificationService.open(notificationText, 'OK', {
        duration: 2500,
        panelClass: ['green-snackbar'],
      });
    } else {
      this.logger.error(result.message);
      this.notificationService.open(
        result.message || 'Cannot send password reset!',
        undefined,
        {
          duration: 2000,
          panelClass: ['red-snackbar'],
        },
      );
    }
  }
}
@NgModule({
  imports: [
    CommonModule,
    RouterModule,
    DxFormModule,
    DxLoadIndicatorModule,
    ChangePasswordFormModule,
    MatSnackBarModule,
  ],
  declarations: [ResetPasswordFormComponent],
  exports: [ResetPasswordFormComponent],
})
export class ResetPasswordFormModule {}
