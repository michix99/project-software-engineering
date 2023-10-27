import {
  Component,
  NgModule,
  OnDestroy,
  OnInit,
  ViewChild,
} from '@angular/core';
import {
  Column,
  Comment,
  Course,
  Priority,
  Role,
  Status,
  Ticket,
  TicketHistory,
  Type,
  User,
  commentFromJson,
  commentToModel,
  courseFromJson,
  ticketFromJson,
  ticketHistoryFromJson,
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
  DxAccordionModule,
  DxButtonModule,
  DxDataGridComponent,
  DxDataGridModule,
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
  @ViewChild('dataGrid', { static: false }) dataGrid!: DxDataGridComponent;
  /** The identifier of the element of load. */
  id?: string = undefined;
  /** The identifier of the user. */
  userId?: string = undefined;
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
  /** Indicates if the data is currently loading. */
  dataLoading = false;
  /** Indicates if the ticket history data is currently loading. */
  historyDataLoading = false;
  /** Indicates if the comments are currently loading. */
  commentsLoading = false;

  updateSubscription: Subscription = new Subscription();
  roleUpdateSubscription: Subscription = new Subscription();
  idSubscription: Subscription = new Subscription();

  // The data lists used for editor selection.
  courses: Array<Course> = [];
  editors: Array<User> = [];
  statuses = Object.values(Status);
  priorities = Object.values(Priority);
  types = Object.values(Type);

  historyColumns: Array<Column> = [
    {
      fieldName: 'changedValues',
      caption: 'Changed',
      priority: 3,
      dataType: 'object',
      headerFilterEnabled: false,
      customizeText: function (cellInfo: { value: unknown }) {
        return JSON.stringify(cellInfo.value as object, null, 2)
          .replace('{\n', '')
          .replace('\n}', '')
          .replaceAll('"', '');
      },
    },
    {
      fieldName: 'previousValues',
      caption: 'Previous',
      priority: 2,
      dataType: 'object',
      headerFilterEnabled: false,
      customizeText: function (cellInfo: { value: unknown }) {
        return JSON.stringify(cellInfo.value as object, null, 2)
          .replace('{\n', '')
          .replace('\n}', '')
          .replaceAll('"', '');
      },
    },
    {
      fieldName: 'createdAt',
      caption: 'Changed At',
      priority: 1,
      dataType: 'date',
      headerFilterEnabled: false,
      format: 'dd/MM/yyyy HH:mm:ss',
    },
    {
      fieldName: 'createdBy',
      caption: 'Changed By',
      priority: 0,
      dataType: 'string',
      headerFilterEnabled: true,
    },
  ];
  historyDatasource: Array<TicketHistory> = [];

  newComment: string = '';
  commentDatasource: Array<Comment> = [];

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
      this.userId = user.uid;

      if (!this.isCreating) {
        this.loadTicket();
        if (this.historyDatasource.length == 0) {
          this.loadTicketHistory();
        }
        if (this.commentDatasource.length == 0) {
          this.loadComments();
        }
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
          this.historyDatasource = [];
          this.commentDatasource = [];
        } else {
          this.loadTicket();
          this.loadTicketHistory();
          this.loadComments();
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
                  .filter(
                    (u) => u.role === Role.Admin || u.role === Role.Editor,
                  );
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
      type: Type.Undefined,
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
   * Loads the ticket history from the backend.
   */
  loadTicketHistory(): void {
    if (!this.id) return;
    this.historyDataLoading = true;
    this.dataService
      .getAll(`data/ticket_history?ticket_id=${this.id}`)
      .then((value) => {
        this.historyDatasource = value.map((e) => ticketHistoryFromJson(e));
      })
      .catch((error) => {
        this.notificationService.open(
          `Failed to load history: ${error}`,
          undefined,
          {
            duration: 2000,
            panelClass: ['red-snackbar'],
          },
        );
        this.logger.error(error);
      })
      .finally(() => {
        this.historyDataLoading = false;
      });
  }

  /**
   * Loads the comments from the backend.
   */
  loadComments(): void {
    if (!this.id || !this.userId) return;
    this.commentsLoading = true;
    this.dataService
      .getAll(`data/comment?ticket_id=${this.id}`)
      .then((value) => {
        this.commentDatasource = value
          .map((e) => commentFromJson(e, this.userId!))
          .sort((a, b) => {
            return b.createdAt.getTime() - a.createdAt.getTime();
          });
      })
      .catch((error) => {
        this.notificationService.open(
          `Failed to load comments: ${error}`,
          undefined,
          {
            duration: 2000,
            panelClass: ['red-snackbar'],
          },
        );
        this.logger.error(error);
      })
      .finally(() => {
        this.commentsLoading = false;
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
      this.loadTicketHistory();
    }
  }

  /**
   * Navigates to the ticket overview.
   */
  navigateBack(): void {
    this.router.navigate(['/ticket']);
  }

  /**
   * Creates a new comment.
   */
  onAddCommentClick = async () => {
    if (!this.newComment || !this.id) return;

    const dataModel = commentToModel({
      content: this.newComment,
      ticketId: this.id!,
    } as Comment);
    try {
      await this.dataService.create('data/comment', dataModel);
      this.newComment = '';
    } catch (error) {
      this.notificationService.open(
        `Failed to create comment: ${error}`,
        undefined,
        {
          duration: 2000,
          panelClass: ['red-snackbar'],
        },
      );
      this.logger.error(error);
    } finally {
      this.loadComments();
    }
  };
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
    DxAccordionModule,
    DxDataGridModule,
  ],
  declarations: [TicketEditorComponent],
  exports: [TicketEditorComponent],
})
export class TicketEditorModule {}
