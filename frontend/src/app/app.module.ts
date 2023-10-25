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
  GenericDataTableModule,
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
import {
  CourseEditorModule,
  CourseTableComponent,
  HomeModule,
  PermissionTableComponent,
  TicketEditorModule,
  TicketTableComponent,
  UserTableComponent,
} from './pages';
import {
  DxFormModule,
  DxButtonModule,
  DxTextBoxModule,
  DxLoadIndicatorModule,
  DxTextAreaModule,
} from 'devextreme-angular';
import { PrivacyPolicyComponent } from './pages/privacy-policy/privacy-policy.component';
import { AboutComponent } from './pages/about/about.component';

@NgModule({
  declarations: [
    AppComponent,
    TicketTableComponent,
    PermissionTableComponent,
    UserTableComponent,
    CourseTableComponent,
    PrivacyPolicyComponent,
    AboutComponent,
  ],
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
    GenericDataTableModule,
    DxFormModule,
    DxButtonModule,
    DxTextBoxModule,
    DxLoadIndicatorModule,
    DxTextAreaModule,
    TicketEditorModule,
    CourseEditorModule,
    HomeModule,
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
