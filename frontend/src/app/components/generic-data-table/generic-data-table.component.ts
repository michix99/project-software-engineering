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
import {
  AuthenticationService,
  DataService,
  LoggingService,
} from '../../services';
import { Column } from '../../models';
import { CommonModule } from '@angular/common';
import { CellClickEvent } from 'devextreme/ui/data_grid';
import { Router } from '@angular/router';

@Component({
  selector: 'app-generic-data-table',
  templateUrl: './generic-data-table.component.html',
})
export class GenericDataTableComponent implements AfterViewInit, OnDestroy {
  @ViewChild('dataGrid', { static: false }) dataGrid!: DxDataGridComponent;

  /** The header of the page. */
  @Input()
  title = '';

  /** The tranform function to parse the backend response to the typescript model. */
  @Input()
  dataParser = (e: Record<string, unknown>) => {
    return e as object;
  };

  /** The URL endpoint for loading the data. */
  @Input()
  dataEndpoint = '';

  /** The URL endpoint for editing a data element. */
  @Input()
  editRoute = '';

  /** The columns to be shown in the data table. */
  @Input()
  columns: Array<Column> = [];

  /** Optional: An external array to provide the data. */
  @Input()
  dataSource: Array<unknown> = [];
  updateSubscription: Subscription = new Subscription();

  constructor(
    private authService: AuthenticationService,
    private logger: LoggingService,
    private dataService: DataService,
    private notificationService: MatSnackBar,
    private router: Router,
  ) {
    this.onEditClick = this.onEditClick.bind(this);
  }

  ngAfterViewInit(): void {
    this.updateSubscription = this.authService.authState.subscribe((user) => {
      if (user && this.dataSource.length === 0) {
        this.dataGrid.instance.beginCustomLoading('Loading...');
        this.dataService
          .getAll(this.dataEndpoint)
          .then((value) => {
            this.dataSource = value.map((e) => this.dataParser(e));
          })
          .catch((error) => {
            this.dataSource = [];
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

  /**
   * Navigates to the related editor on row click.
   * @param e The event of the click.
   */
  onEditClick(e: CellClickEvent) {
    e.event?.preventDefault();
    this.router.navigate([`${this.editRoute}/${e.row.data.id}`]);
  }
}

@NgModule({
  imports: [CommonModule, DxDataGridModule, MatSnackBarModule],
  exports: [GenericDataTableComponent],
  declarations: [GenericDataTableComponent],
})
export class GenericDataTableModule {}
