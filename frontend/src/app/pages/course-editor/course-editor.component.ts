import { Component, OnDestroy, OnInit } from '@angular/core';
import { Course, courseFromJson, courseToModel } from '../../models';
import { Subscription } from 'rxjs';
import {
  AuthenticationService,
  DataService,
  LoggingService,
} from '../../services';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ActivatedRoute, Router } from '@angular/router';

@Component({
  selector: 'app-course-editor',
  templateUrl: './course-editor.component.html',
  styleUrls: ['./course-editor.component.scss'],
})
export class CourseEditorComponent implements OnInit, OnDestroy {
  /** The identifier of the element of load. */
  id?: string = undefined;
  /** Indicates if a new element is created or an existing one is updated. */
  get isCreating(): boolean {
    return !!this.id === false || this.id === '0';
  }
  /** The header of the editor. */
  get title(): string {
    return this.isCreating ? 'Create New Course' : 'Update Course';
  }
  /** The related course data. */
  course!: Course;

  /** Indicates if the page is currently submitting data. */
  loading = false;
  /** Indicates if the data is currently loaded. */
  dataLoading = false;

  updateSubscription: Subscription = new Subscription();
  idSubscription: Subscription = new Subscription();

  constructor(
    private authService: AuthenticationService,
    private logger: LoggingService,
    private dataService: DataService,
    private notificationService: MatSnackBar,
    private route: ActivatedRoute,
    private router: Router,
  ) {
    this.resetCourse();
  }

  ngOnInit(): void {
    this.id = this.route.snapshot.paramMap.get('id') ?? undefined;
    this.updateSubscription = this.authService.authState.subscribe((user) => {
      if (user && !this.isCreating) {
        this.loadCourse();
      }
    });

    this.idSubscription = this.route.paramMap.subscribe((paramMap) => {
      const newId = paramMap.get('id') ?? undefined;
      if (newId !== this.id) {
        this.id = newId;
        if (this.isCreating) {
          this.resetCourse();
        } else {
          this.loadCourse();
        }
      }
    });
  }

  ngOnDestroy(): void {
    this.updateSubscription.unsubscribe();
    this.idSubscription.unsubscribe();
  }

  /**
   * Sets the course attributes to default values.
   */
  resetCourse(): void {
    this.course = {
      id: '',
      createdAt: new Date(),
      createdBy: '',
      modifiedAt: new Date(),
      modifiedBy: '',
      courseAbbreviation: '',
      name: '',
    };
  }

  /**
   * Loads the course data from the backend.
   */
  loadCourse(): void {
    if (!this.id) return;
    this.dataLoading = true;
    this.dataService
      .get('data/course', this.id)
      .then((value) => {
        this.course = courseFromJson(value);
      })
      .catch((error) => {
        this.notificationService.open(
          `Failed to load course: ${error}`,
          undefined,
          {
            duration: 2000,
            panelClass: ['red-snackbar'],
          },
        );
        this.logger.error(error);
        this.router.navigate(['/course']);
      })
      .finally(() => {
        this.dataLoading = false;
      });
  }

  /**
   * Submits the course save event.
   * @param e The form submit event.
   */
  async onSubmit(e: Event): Promise<void> {
    e.preventDefault();
    if (!this.course) return;
    const dataModel = courseToModel(this.course);
    try {
      this.loading = true;
      let response = undefined;
      if (this.isCreating) {
        response = await this.dataService.create('data/course', dataModel);
        this.notificationService.open(
          'Course creation successful!',
          undefined,
          {
            duration: 2500,
            panelClass: ['green-snackbar'],
          },
        );
      } else {
        response = await this.dataService.update(
          `data/course/${this.id}`,
          dataModel,
        );
        this.notificationService.open(
          'Course successfully updated!',
          undefined,
          {
            duration: 2500,
            panelClass: ['green-snackbar'],
          },
        );
      }
      this.router.navigate([`/course/${response.id}`]);
    } catch (error) {
      this.notificationService.open(
        this.isCreating
          ? `Failed to create course: ${error}`
          : `Failed to update course: ${error}`,
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
