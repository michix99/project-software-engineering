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
  ],
  providers: [AuthenticationService, ScreenService, AppInfoService],
  bootstrap: [AppComponent],
})
export class AppModule {}
