import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { environment } from '../environments/environment';
import {
  ResetPasswordFormModule,
  ChangePasswordFormModule,
  LoginFormModule,
  SideNavOuterToolbarModule,
  SingleCardModule,
} from './components';
import {
  AuthenticationService,
  ScreenService,
  AppInfoService,
} from './services';
import { initializeApp, provideFirebaseApp } from '@angular/fire/app';
import { getAuth, provideAuth } from '@angular/fire/auth';
import {
  NAVIGATION_TOKEN,
  NAVIGATION,
} from './components/side-nav-outer-toolbar/navigation';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBarModule } from '@angular/material/snack-bar';

@NgModule({
  declarations: [AppComponent],
  imports: [
    BrowserModule,
    AppRoutingModule,
    provideFirebaseApp(() => initializeApp(environment.firebase)),
    provideAuth(() => getAuth()),
    SideNavOuterToolbarModule,
    SingleCardModule,
    ResetPasswordFormModule,
    ChangePasswordFormModule,
    LoginFormModule,
    BrowserAnimationsModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
  ],
  providers: [
    AuthenticationService,
    ScreenService,
    AppInfoService,
    { provide: NAVIGATION_TOKEN, useValue: NAVIGATION },
  ],
  bootstrap: [AppComponent],
})
export class AppModule {}
