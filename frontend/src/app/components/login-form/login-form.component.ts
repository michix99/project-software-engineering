import { CommonModule } from '@angular/common';
import { Component, NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { DxFormModule } from 'devextreme-angular/ui/form';
import { DxLoadIndicatorModule } from 'devextreme-angular/ui/load-indicator';
import { AuthenticationService, LoggingService } from '../../services';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

@Component({
  selector: 'app-login-form',
  templateUrl: './login-form.component.html',
  styleUrls: ['./login-form.component.scss'],
})
export class LoginFormComponent {
  /** Indicates if the loading spinner should be shown. */
  loading = false;
  /** The data used for login the user. */
  formData: { password: string; email: string } = { password: '', email: '' };

  constructor(
    private authService: AuthenticationService,
    private notificationService: MatSnackBar,
    private logger: LoggingService,
  ) {}

  /**
   * Submits the login reset.
   * @param e The form submit event.
   */
  async onSubmit(e: Event): Promise<void> {
    e.preventDefault();
    const { email, password } = this.formData;
    this.loading = true;

    const result = await this.authService.logIn(email, password);
    this.loading = false;
    if (!result.isOk && result.message) {
      this.logger.error(result.message);
      this.notificationService.open(result.message, 'Try again!', {
        duration: 2000,
        panelClass: ['red-snackbar'],
      });
    }
  }
}
@NgModule({
  imports: [
    CommonModule,
    RouterModule,
    DxFormModule,
    DxLoadIndicatorModule,
    MatSnackBarModule,
  ],
  declarations: [LoginFormComponent],
  exports: [LoginFormComponent],
})
export class LoginFormModule {}
