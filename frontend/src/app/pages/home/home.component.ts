import { Component } from '@angular/core';
import { AuthenticationService } from '../../services';
import { environment } from '../../../environments/environment';

@Component({
  templateUrl: 'home.component.html',
  styleUrls: ['./home.component.scss'],
})
export class HomeComponent {
  constructor(private authService: AuthenticationService) {}
  path = '/';
  response = '';
  async callBackend(): Promise<void> {
    const token = await this.authService.getToken();
    const response = await fetch(`${environment.apiUrl}${this.path}`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    this.response = await response.text();
  }
}
