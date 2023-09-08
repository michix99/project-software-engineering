import { CommonModule } from '@angular/common';
import { Component, NgModule, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { DxFormModule } from 'devextreme-angular/ui/form';
import { DxLoadIndicatorModule } from 'devextreme-angular/ui/load-indicator';

import { AuthenticationService } from '../../services';
import notify from 'devextreme/ui/notify';
import { ValidationCallbackData } from 'devextreme/common';
import { ChangePasswordFormModule } from '../change-password-form/change-password-form.component';

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
      notify(notificationText, 'success', 2500);
    } else {
      notify(result.message, 'error', 2000);
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
  ],
  declarations: [ResetPasswordFormComponent],
  exports: [ResetPasswordFormComponent],
})
export class ResetPasswordFormModule {}
