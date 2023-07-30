import { Component, HostBinding } from '@angular/core';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import {
  AppInfoService,
  AuthenticationService,
  ScreenService,
} from './services';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent {
  title = 'projekt-software-engineering';
  @HostBinding('class') get getClass() {
    return Object.keys(this.screen.sizes)
      .filter((cl) => this.screen.sizes[cl])
      .join(' ');
  }

  constructor(
    public fireBaseAuthentication: AngularFireAuth,
    private authService: AuthenticationService,
    private screen: ScreenService,
    public appInfo: AppInfoService,
  ) {}

  isAuthenticated() {
    return this.authService.loggedIn;
  }
}
