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
  loading = false;
  resetFormData: { email: string } = { email: '' };
  changeFormData: { password: string } = {
    password: '',
  };
  oobCode?: string;

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

  confirmPassword = (e: ValidationCallbackData) => {
    return e.value === this.changeFormData.password;
  };
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
