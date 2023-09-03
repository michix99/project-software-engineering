import { NgModule, inject } from '@angular/core';
import { ActivatedRouteSnapshot, RouterModule, Routes } from '@angular/router';
import {
  ChangePasswordFormComponent,
  LoginFormComponent,
  ResetPasswordFormComponent,
} from './components';
import { AuthenticationGuardService } from './services';
import { HomeComponent } from './pages/home/home.component';
import { ProfileComponent } from './pages/profile/profile.component';
import { TasksComponent } from './pages/tasks/tasks.component';
import {
  DxButtonModule,
  DxDataGridModule,
  DxFormModule,
  DxTextBoxModule,
} from 'devextreme-angular';
import { Role } from './models';

const routes: Routes = [
  {
    path: 'tasks',
    component: TasksComponent,
    canActivate: [
      (route: ActivatedRouteSnapshot) =>
        inject(AuthenticationGuardService).canActivate(route),
      () => inject(AuthenticationGuardService).hasRole(Role.Admin),
    ],
  },
  {
    path: 'profile',
    component: ProfileComponent,
    canActivate: [AuthenticationGuardService],
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
    path: '**',
    redirectTo: 'home',
  },
];

@NgModule({
  imports: [
    RouterModule.forRoot(routes),
    DxDataGridModule,
    DxFormModule,
    DxButtonModule,
    DxTextBoxModule,
  ],
  exports: [RouterModule],
  providers: [AuthenticationGuardService],
  declarations: [HomeComponent, ProfileComponent, TasksComponent],
})
export class AppRoutingModule {}
