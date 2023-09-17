import { AfterViewInit, Component, OnDestroy, ViewChild } from '@angular/core';
import 'devextreme/data/odata/store';
import { AuthenticationService, LoggingService } from '../../services';
import { environment } from 'src/environments/environment';
import { Course, courseFromJson } from 'src/app/models';
import { Subscription } from 'rxjs';
import { DxDataGridComponent } from 'devextreme-angular';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  templateUrl: 'tasks.component.html',
})
export class TasksComponent implements AfterViewInit, OnDestroy {
  @ViewChild('dataGrid', { static: false }) dataGrid!: DxDataGridComponent;
  dataSource: Course[] = [];
  updateSubscription: Subscription = new Subscription();

  constructor(
    private authService: AuthenticationService,
    private logger: LoggingService,
    private notificationService: MatSnackBar,
  ) {}
  ngAfterViewInit(): void {
    this.updateSubscription = this.authService.authState.subscribe((user) => {
      if (user) {
        this.dataGrid.instance.beginCustomLoading('Loading...');
        this.getCourses()
          .catch((error) => {
            this.notificationService.open(
              `Failed to load courses: ${error}`,
              undefined,
              {
                duration: 2000,
                panelClass: ['red-snackbar'],
              },
            );
            this.logger.error(error);
          })
          .finally(() => {
            this.dataGrid.instance.endCustomLoading();
          });
      }
    });
  }

  ngOnDestroy(): void {
    this.updateSubscription.unsubscribe();
  }

  async getCourses() {
    const token = await this.authService.getToken();
    const coursesResponse = await fetch(`${environment.apiUrl}/data/course`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (coursesResponse.status == 200) {
      const jsonResponse = (await coursesResponse.json()) as unknown as Array<
        Record<string, unknown>
      >;
      this.dataSource = jsonResponse.map((e) => courseFromJson(e));
    } else {
      this.dataSource = [];
      throw new Error(await coursesResponse.text());
    }
  }
}
