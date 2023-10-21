import { Component, NgModule, OnDestroy, OnInit } from '@angular/core';
import {
  Role,
  User,
  roleToModel,
  userFromJson,
  userToModel,
} from '../../models';
import { Subscription } from 'rxjs';
import {
  AuthenticationService,
  DataService,
  LoggingService,
} from '../../services';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { ValueChangedEvent } from 'devextreme/ui/select_box';
import { CommonModule } from '@angular/common';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import {
  DxFormModule,
  DxLoadIndicatorModule,
  DxButtonModule,
  DxTextBoxModule,
} from 'devextreme-angular';

@Component({
  templateUrl: 'profile.component.html',
  styleUrls: ['./profile.component.scss'],
})
export class ProfileComponent implements OnInit, OnDestroy {
  /** The identifier of the element of load. */
  id?: string = undefined;
  /** Indicates if the own profile is shown or a user element is modified. */
  get isOwnProfile(): boolean {
    return !!this.id === false;
  }
  /** The header of the editor. */
  get title(): string {
    return this.isOwnProfile ? 'Profile' : 'Update User';
  }
  /** The related user data. */
  user!: User;

  /** Indicates if the page is currently submitting data. */
  loading = false;
  /** Indicates if the data is currently loaded. */
  dataLoading = false;

  updateSubscription: Subscription = new Subscription();
  idSubscription: Subscription = new Subscription();

  roleHasChanged = false;

  // The data lists used for editor selection.
  roles = Object.values(Role).map((role) => {
    return {
      id: role,
      displayName: role.charAt(0).toUpperCase() + role.slice(1),
    };
  });

  constructor(
    private authService: AuthenticationService,
    private logger: LoggingService,
    private dataService: DataService,
    private notificationService: MatSnackBar,
    private route: ActivatedRoute,
    private router: Router,
  ) {
    this.resetUser();
    this.onRoleChanged = this.onRoleChanged.bind(this);
  }

  ngOnInit(): void {
    this.id = this.route.snapshot.paramMap.get('id') ?? undefined;
    this.updateSubscription = this.authService.authState.subscribe((user) => {
      if (!user) return;

      if (this.isOwnProfile) {
        this.loadUser(user.uid);
      } else {
        this.loadUser();
      }
    });

    this.idSubscription = this.route.paramMap.subscribe((paramMap) => {
      const newId = paramMap.get('id') ?? undefined;
      if (newId !== this.id) {
        this.id = newId;
        if (!this.isOwnProfile) {
          this.loadUser();
        }
      }
    });
  }

  ngOnDestroy(): void {
    this.updateSubscription.unsubscribe();
    this.idSubscription.unsubscribe();
  }

  /**
   * Sets the user attributes to default values.
   */
  resetUser(): void {
    this.user = {
      id: '',
      email: '',
      displayName: '',
      disabled: false,
      role: Role.Requester,
    };
  }

  /**
   * Loads the user data from the backend.
   */
  loadUser(uid?: string): void {
    if (!this.id && !uid) return;
    this.dataLoading = true;
    this.dataService
      .get('api/user', uid ?? this.id!)
      .then((value) => {
        this.user = userFromJson(value);
      })
      .catch((error) => {
        this.notificationService.open(
          `Failed to load user: ${error}`,
          undefined,
          {
            duration: 2000,
            panelClass: ['red-snackbar'],
          },
        );
        this.logger.error(error);
        if (this.isOwnProfile) {
          this.router.navigate(['/home']);
        } else {
          this.router.navigate(['/user']);
        }
      })
      .finally(() => {
        this.dataLoading = false;
        this.roleHasChanged = false;
      });
  }

  /**
   * Submits the user save event.
   * @param e The form submit event.
   */
  async onSubmit(e: Event): Promise<void> {
    e.preventDefault();
    if (!this.user) return;
    const dataModel = userToModel(this.user);
    try {
      this.loading = true;
      const response = await this.dataService.update(
        'api/updateUser',
        dataModel,
      );
      if (!this.isOwnProfile && this.roleHasChanged) {
        const roleDataModel = roleToModel(this.user);
        await this.dataService.update('api/setRole', roleDataModel);
      }
      this.notificationService.open('User successfully updated!', undefined, {
        duration: 2500,
        panelClass: ['green-snackbar'],
      });
      this.roleHasChanged = false;
      if (this.isOwnProfile) {
        this.router.navigate(['/profile']);
      } else {
        this.router.navigate([`/user/${response.id}`]);
      }
    } catch (error) {
      this.notificationService.open(
        `Failed to update user: ${error}`,
        undefined,
        {
          duration: 2000,
          panelClass: ['red-snackbar'],
        },
      );
      this.logger.error(error);
    } finally {
      this.loading = false;
    }
  }

  /**
   * Navigates to the user overview.
   */
  navigateBack(): void {
    this.router.navigate(['/user']);
  }

  /**
   * Sets the indicator, if the user role has been changed.
   * @param event The handler event.
   */
  onRoleChanged(event: ValueChangedEvent): void {
    if (event.value !== event.previousValue) {
      this.roleHasChanged = true;
    }
  }
}

@NgModule({
  imports: [
    CommonModule,
    RouterModule,
    DxFormModule,
    DxLoadIndicatorModule,
    DxButtonModule,
    DxTextBoxModule,
    MatSnackBarModule,
    MatProgressSpinnerModule,
  ],
  declarations: [ProfileComponent],
  exports: [ProfileComponent],
})
export class ProfileModule {}
