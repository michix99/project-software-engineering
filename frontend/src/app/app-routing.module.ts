import { NgModule, inject } from '@angular/core';
import { ActivatedRouteSnapshot, RouterModule, Routes } from '@angular/router';
import {
  ChangePasswordFormComponent,
  LoginFormComponent,
  ResetPasswordFormComponent,
} from './components';
import { AuthenticationGuardService } from './services';
import { Role } from './models';
import {
  AboutComponent,
  CourseEditorComponent,
  CourseTableComponent,
  HomeComponent,
  PermissionTableComponent,
  PrivacyPolicyComponent,
  ProfileComponent,
  TicketEditorComponent,
  TicketTableComponent,
  UserTableComponent,
} from './pages';

const routes: Routes = [
  {
    path: 'privacy-policy',
    component: PrivacyPolicyComponent,
    canActivate: [
      (route: ActivatedRouteSnapshot) =>
        inject(AuthenticationGuardService).canActivate(route),
    ],
  },
  {
    path: 'about',
    component: AboutComponent,
    canActivate: [
      (route: ActivatedRouteSnapshot) =>
        inject(AuthenticationGuardService).canActivate(route),
    ],
  },
  {
    path: 'profile',
    component: ProfileComponent,
    canActivate: [
      (route: ActivatedRouteSnapshot) =>
        inject(AuthenticationGuardService).canActivate(route),
    ],
  },
  {
    path: 'home',
    component: HomeComponent,
    canActivate: [
      (route: ActivatedRouteSnapshot) =>
        inject(AuthenticationGuardService).canActivate(route),
    ],
  },
  {
    path: 'login-form',
    component: LoginFormComponent,
    canActivate: [
      (route: ActivatedRouteSnapshot) =>
        inject(AuthenticationGuardService).canActivate(route),
    ],
  },
  {
    path: 'reset-password',
    component: ResetPasswordFormComponent,
    canActivate: [
      (route: ActivatedRouteSnapshot) =>
        inject(AuthenticationGuardService).canActivate(route),
    ],
  },
  {
    path: 'change-password',
    component: ChangePasswordFormComponent,
    canActivate: [
      (route: ActivatedRouteSnapshot) =>
        inject(AuthenticationGuardService).canActivate(route),
    ],
  },
  {
    path: 'course',
    component: CourseTableComponent,
    canActivate: [
      (route: ActivatedRouteSnapshot) =>
        inject(AuthenticationGuardService).canActivate(route, Role.Admin),
    ],
  },
  {
    path: 'course/:id',
    component: CourseEditorComponent,
    canActivate: [
      (route: ActivatedRouteSnapshot) =>
        inject(AuthenticationGuardService).canActivate(route, Role.Admin),
    ],
  },
  {
    path: 'ticket',
    component: TicketTableComponent,
    canActivate: [
      (route: ActivatedRouteSnapshot) =>
        inject(AuthenticationGuardService).canActivate(route),
    ],
  },
  {
    path: 'ticket/:id',
    component: TicketEditorComponent,
    canActivate: [
      (route: ActivatedRouteSnapshot) =>
        inject(AuthenticationGuardService).canActivate(route),
    ],
  },
  {
    path: 'permission',
    component: PermissionTableComponent,
    canActivate: [
      (route: ActivatedRouteSnapshot) =>
        inject(AuthenticationGuardService).canActivate(route, Role.Admin),
    ],
  },
  {
    path: 'user',
    component: UserTableComponent,
    canActivate: [
      (route: ActivatedRouteSnapshot) =>
        inject(AuthenticationGuardService).canActivate(route, Role.Admin),
    ],
  },
  {
    path: 'user/:id',
    component: ProfileComponent,
    canActivate: [
      (route: ActivatedRouteSnapshot) =>
        inject(AuthenticationGuardService).canActivate(route, Role.Admin),
    ],
  },
  {
    path: '**',
    redirectTo: 'home',
  },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
  providers: [AuthenticationGuardService],
})
export class AppRoutingModule {}
