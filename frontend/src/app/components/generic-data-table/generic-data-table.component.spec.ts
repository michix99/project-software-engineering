import {
  ComponentFixture,
  TestBed,
  fakeAsync,
  flush,
  inject,
} from '@angular/core/testing';
import {
  GenericDataTableComponent,
  GenericDataTableModule,
} from './generic-data-table.component';
import {
  AuthenticationService,
  DataService,
  LoggingService,
} from '../../services';
import { AuthenticationServiceMock } from '../../../test/authentication-service.mock';
import { LoggingServiceMock } from 'src/test/logging.service.mock';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { User } from '@angular/fire/auth';
import { MatSnackBar } from '@angular/material/snack-bar';
import { RouterTestingModule } from '@angular/router/testing';
import { Router } from '@angular/router';
import { CellClickEvent } from 'devextreme/ui/data_grid';

describe('GenericDataTableComponent', () => {
  let component: GenericDataTableComponent;
  let fixture: ComponentFixture<GenericDataTableComponent>;
  let authService: AuthenticationServiceMock;
  let notificationService: MatSnackBar;
  let dataService: DataService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        GenericDataTableModule,
        BrowserAnimationsModule,
        RouterTestingModule,
      ],
      declarations: [GenericDataTableComponent],
      providers: [
        { provide: AuthenticationService, useClass: AuthenticationServiceMock },
        { provide: LoggingService, useClass: LoggingServiceMock },
        DataService,
      ],
    });

    authService = TestBed.inject(
      AuthenticationService,
    ) as AuthenticationServiceMock;
    notificationService = TestBed.inject(MatSnackBar);
    dataService = TestBed.inject(DataService);
    fixture = TestBed.createComponent(GenericDataTableComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  it('should load the data after view init, if no data was provided', fakeAsync(() => {
    const dataSpy = spyOn(dataService, 'getAll').and.resolveTo([
      { id: '0', field: 'test' },
    ]);
    fixture.detectChanges();
    authService.authState.next({ email: 'test@user.de' } as User);
    fixture.detectChanges();
    flush();
    expect(dataSpy).toHaveBeenCalled();
    expect(component.dataSource.length).toBe(1);
  }));

  it('should not load the data after view init, if data was provided', () => {
    const dataSpy = spyOn(dataService, 'getAll');
    component.dataSource = [{ id: '0', field: 'test' }];
    authService.authState.next({ email: 'test@user.de' } as User);
    fixture.detectChanges();
    expect(dataSpy).not.toHaveBeenCalled();
    expect(component.dataSource.length).toBe(1);
  });

  it('should notify if no data could be loaded', fakeAsync(() => {
    const notifySpy = spyOn(notificationService, 'open');
    const dataSpy = spyOn(dataService, 'getAll').and.rejectWith('Error');
    fixture.detectChanges();
    authService.authState.next({ email: 'test@user.de' } as User);
    flush();
    expect(dataSpy).toHaveBeenCalled();
    expect(component.dataSource.length).toBe(0);
    expect(notifySpy).toHaveBeenCalled();
  }));

  it('onEditClick should navigte to the editor of the clicked item', inject(
    [Router],
    (router: Router) => {
      const navigateSpy = spyOn(router, 'navigate');
      component.editRoute = '/dummy-edit-route';
      const clickEvent = {
        row: {
          data: {
            id: 'dummy-id',
          },
        },
      };
      component.onEditClick(clickEvent as CellClickEvent);
      expect(navigateSpy).toHaveBeenCalledWith(['/dummy-edit-route/dummy-id']);
    },
  ));
});
