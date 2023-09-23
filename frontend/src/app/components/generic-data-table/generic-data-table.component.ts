import {
  AfterViewInit,
  Component,
  Input,
  NgModule,
  OnDestroy,
  ViewChild,
} from '@angular/core';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { DxDataGridComponent, DxDataGridModule } from 'devextreme-angular';
import { Subscription } from 'rxjs';
import { AuthenticationService, LoggingService } from '../../services';
import { environment } from '../../../environments/environment';
import { Column } from '../../models';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-generic-data-table',
  templateUrl: './generic-data-table.component.html',
})
export class GenericDataTableComponent implements AfterViewInit, OnDestroy {
  @ViewChild('dataGrid', { static: false }) dataGrid!: DxDataGridComponent;

  @Input()
  title = '';

  @Input()
  dataParser = (e: Record<string, unknown>) => {
    return e as object;
  };

  @Input()
  dataEndpoint = '';

  @Input()
  columns: Array<Column> = [];

  @Input()
  dataSource: Array<unknown> = [];
  updateSubscription: Subscription = new Subscription();

  constructor(
    private authService: AuthenticationService,
    private logger: LoggingService,
    private notificationService: MatSnackBar,
  ) {}
  ngAfterViewInit(): void {
    this.updateSubscription = this.authService.authState.subscribe((user) => {
      if (user && this.dataSource.length === 0) {
        this.dataGrid.instance.beginCustomLoading('Loading...');
        this.getData()
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

  async getData() {
    const token = await this.authService.getToken();
    const response = await fetch(`${environment.apiUrl}/${this.dataEndpoint}`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (response.status == 200) {
      const jsonResponse = (await response.json()) as unknown as Array<
        Record<string, unknown>
      >;

      this.dataSource = jsonResponse.map((e) => this.dataParser(e));
    } else {
      this.dataSource = [];
      throw new Error(await response.text());
    }
  }
}

@NgModule({
  imports: [CommonModule, DxDataGridModule, MatSnackBarModule],
  exports: [GenericDataTableComponent],
  declarations: [GenericDataTableComponent],
})
export class GenericDataTableModule {}
