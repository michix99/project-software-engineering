import { Component, NgModule, OnDestroy, OnInit } from '@angular/core';
import {
  Course,
  Priority,
  Role,
  Status,
  Ticket,
  User,
  courseFromJson,
  ticketFromJson,
  ticketToModel,
  userFromJson,
} from '../../models';
import {
  AuthenticationService,
  DataService,
  LoggingService,
} from '../../services';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { Subscription } from 'rxjs';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import {
  DxButtonModule,
  DxFormModule,
  DxLoadIndicatorModule,
  DxTextAreaModule,
  DxTextBoxModule,
} from 'devextreme-angular';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

@Component({
  selector: 'app-ticket-editor',
  templateUrl: './ticket-editor.component.html',
  styleUrls: ['./ticket-editor.component.scss'],
})
export class TicketEditorComponent implements OnInit, OnDestroy {
  /** The identifier of the element of load. */
  id?: string = undefined;
  /** Indicates if a new element is created or an existing one is updated. */
  get isCreating(): boolean {
    return !!this.id === false || this.id === '0';
  }
  /** The header of the editor. */
  get title(): string {
    return this.isCreating ? 'Create New Ticket' : 'Update Ticket';
  }
  /** The related ticket data. */
  ticket!: Ticket;

  /** Indicates if the user has the role admin or editor. */
  isAdminOrEditor = false;
  /** Indicates if the page is currently submitting data. */
  loading = false;
  /** Indicates if the data is currently loaded. */
  dataLoading = false;

  updateSubscription: Subscription = new Subscription();
  roleUpdateSubscription: Subscription = new Subscription();
  idSubscription: Subscription = new Subscription();

  // The data lists used for editor selection.
  courses: Array<Course> = [];
  editors: Array<User> = [];
  statuses = Object.values(Status);
  priorities = Object.values(Priority);

  constructor(
    private authService: AuthenticationService,
    private logger: LoggingService,
    private dataService: DataService,
    private notificationService: MatSnackBar,
    private route: ActivatedRoute,
    private router: Router,
  ) {
    this.resetTicket();
  }

  ngOnInit(): void {
    this.id = this.route.snapshot.paramMap.get('id') ?? undefined;
    this.updateSubscription = this.authService.authState.subscribe((user) => {
      if (!user) return;

      if (!this.isCreating) {
        this.loadTicket();
      }

      if (this.courses.length === 0) {
        this.dataService
          .getAll('data/course')
          .then((value) => {
            this.courses = value.map((e) => courseFromJson(e));
          })
          .catch((error) => {
            this.courses = [];
            this.notificationService.open(
              `Failed to load courses: ${error}`,
              undefined,
              {
                duration: 2000,
                panelClass: ['red-snackbar'],
              },
            );
            this.logger.error(error);
          });
      }
    });

    this.idSubscription = this.route.paramMap.subscribe((paramMap) => {
      const newId = paramMap.get('id') ?? undefined;
      if (newId !== this.id) {
        this.id = newId;
        if (this.isCreating) {
          this.resetTicket();
        } else {
          this.loadTicket();
        }
      }
    });

    // Loading the users after we receive the user role, as we need to know if the user
    // has the permissions to load users
    this.roleUpdateSubscription = this.authService.roleState.subscribe(
      (role: Role | null) => {
        if (role) {
          this.isAdminOrEditor = role === Role.Admin || role === Role.Editor;

          if (this.editors.length === 0 && this.isAdminOrEditor) {
            this.dataService
              .getAll('api/user')
              .then((value) => {
                this.editors = value
                  .map((e) => userFromJson(e))
                  .filter((u) => u.admin || u.editor);
              })
              .catch((error) => {
                this.editors = [];
                this.notificationService.open(
                  `Failed to load users: ${error}`,
                  undefined,
                  {
                    duration: 2000,
                    panelClass: ['red-snackbar'],
                  },
                );
                this.logger.error(error);
              });
          }
        } else {
          this.isAdminOrEditor = false;
        }
      },
    );
  }

  ngOnDestroy(): void {
    this.updateSubscription.unsubscribe();
    this.idSubscription.unsubscribe();
    this.roleUpdateSubscription.unsubscribe();
  }

  /**
   * Parses a course to a display value for the drop down.
   * @param item A course item.
   * @returns The abbreviation and name of a course in one string.
   */
  getCourseDisplay(item: Course): string {
    return item && `${item.courseAbbreviation} - ${item.name}`;
  }

  /**
   * Parses a user to a display value for the drop down.
   * @param item A user item.
   * @returns The display name and email of a user in one string, or only the email.
   */
  getAssigneeDisplay(item: User): string {
    return (
      item &&
      (item.displayName ? `${item.displayName} - ${item.email}` : item.email)
    );
  }

  /**
   * Sets the ticket attributes to default values.
   */
  resetTicket(): void {
    this.ticket = {
      id: '',
      createdAt: new Date(),
      createdBy: '',
      modifiedAt: new Date(),
      modifiedBy: '',
      description: '',
      courseId: '',
      courseAbbreviation: '',
      courseName: '',
      title: '',
      status: Status.Open,
      priority: Priority.Undefined,
      assigneeId: '',
      assigneeName: '',
    };
  }

  /**
   * Loads the ticket data from the backend.
   */
  loadTicket(): void {
    if (!this.id) return;
    this.dataLoading = true;
    this.dataService
      .get('data/ticket', this.id)
      .then((value) => {
        this.ticket = ticketFromJson(value);
      })
      .catch((error) => {
        this.notificationService.open(
          `Failed to load ticket: ${error}`,
          undefined,
          {
            duration: 2000,
            panelClass: ['red-snackbar'],
          },
        );
        this.logger.error(error);
        this.router.navigate(['/ticket']);
      })
      .finally(() => {
        this.dataLoading = false;
      });
  }

  /**
   * Submits the ticket save event.
   * @param e The form submit event.
   */
  async onSubmit(e: Event): Promise<void> {
    e.preventDefault();
    if (!this.ticket) return;
    const dataModel = ticketToModel(this.ticket);
    try {
      this.loading = true;
      let response = undefined;
      if (this.isCreating) {
        response = await this.dataService.create('data/ticket', dataModel);
        this.notificationService.open(
          'Ticket creation successful!',
          undefined,
          {
            duration: 2500,
            panelClass: ['green-snackbar'],
          },
        );
      } else {
        response = await this.dataService.update(
          `data/ticket/${this.id}`,
          dataModel,
        );
        this.notificationService.open(
          'Ticket successfully updated!',
          undefined,
          {
            duration: 2500,
            panelClass: ['green-snackbar'],
          },
        );
      }
      this.router.navigate([`/ticket/${response.id}`]);
    } catch (error) {
      this.notificationService.open(
        this.isCreating
          ? `Failed to create ticket: ${error}`
          : `Failed to update ticket: ${error}`,
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
}

@NgModule({
  imports: [
    CommonModule,
    RouterModule,
    DxFormModule,
    DxLoadIndicatorModule,
    DxButtonModule,
    DxTextBoxModule,
    DxTextAreaModule,
    MatSnackBarModule,
    MatProgressSpinnerModule,
  ],
  declarations: [TicketEditorComponent],
  exports: [TicketEditorComponent],
})
export class TicketEditorModule {}
