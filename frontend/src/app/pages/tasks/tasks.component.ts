import { AfterViewInit, Component, OnInit } from '@angular/core';
import 'devextreme/data/odata/store';
import { AuthenticationService } from '../../services';
import { environment } from 'src/environments/environment';
import { Course, courseFromJson } from 'src/app/models';
import notify from 'devextreme/ui/notify';
import { timeout } from 'rxjs';

@Component({
  templateUrl: 'tasks.component.html',
})
export class TasksComponent implements OnInit {
  dataSource: Course[] = [];
  isLoading = false;

  constructor(private authService: AuthenticationService) {}

  ngOnInit() {
    this.isLoading = true;
    this.authService.authState.subscribe((user) => {
      if (user) {
        this.getCourses()
          .catch((error) => {
            console.log('Error:', error);
          })
          .finally(() => {
            this.isLoading = false;
          });
      }
    });
  }

  async getCourses() {
    try {
      console.log('loading');
      const token = await this.authService.getToken();
      const coursesResponse = await fetch(`${environment.apiUrl}/course`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const jsonResponse = (await coursesResponse.json()) as unknown as Array<
        Record<string, unknown>
      >;
      this.dataSource = jsonResponse.map((e) => courseFromJson(e));
    } catch (error) {
      notify(`Failed to load courses: ${error}`, 'error', 2000);
    }
  }
}
