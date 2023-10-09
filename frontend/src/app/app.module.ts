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
import { CourseEditorComponent } from './pages/course-editor/course-editor.component';
import { TicketEditorComponent } from './pages/ticket-editor/ticket-editor.component';
import { TicketTableComponent } from './pages/ticket-table/ticket-table.component';
import { PermissionTableComponent } from './pages/permission-table/permission-table.component';
import { UserTableComponent } from './pages/user-table/user-table.component';
import { GenericDataTableModule } from './components/generic-data-table/generic-data-table.component';
import { CourseTableComponent, HomeComponent, ProfileComponent } from './pages';
import {
  DxFormModule,
  DxButtonModule,
  DxTextBoxModule,
  DxLoadIndicatorModule,
  DxTextAreaModule,
} from 'devextreme-angular';

@NgModule({
  declarations: [
    AppComponent,
    HomeComponent,
    ProfileComponent,
    CourseEditorComponent,
    TicketEditorComponent,
    TicketTableComponent,
    PermissionTableComponent,
    UserTableComponent,
    CourseTableComponent,
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
