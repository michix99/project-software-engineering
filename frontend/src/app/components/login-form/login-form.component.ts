import { CommonModule } from '@angular/common';
import { Component, NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { DxFormModule } from 'devextreme-angular/ui/form';
import { DxLoadIndicatorModule } from 'devextreme-angular/ui/load-indicator';
import notify from 'devextreme/ui/notify';
import { AuthenticationService } from '../../services';

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

  constructor(private authService: AuthenticationService) {}

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
    if (!result.isOk) {
      notify(result.message, 'error', 2000);
    }
  }
}
@NgModule({
  imports: [CommonModule, RouterModule, DxFormModule, DxLoadIndicatorModule],
  declarations: [LoginFormComponent],
  exports: [LoginFormComponent],
})
export class LoginFormModule {}
