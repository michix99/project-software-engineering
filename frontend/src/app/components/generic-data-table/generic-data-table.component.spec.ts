import {
  ComponentFixture,
  TestBed,
  fakeAsync,
  flush,
} from '@angular/core/testing';
import {
  GenericDataTableComponent,
  GenericDataTableModule,
} from './generic-data-table.component';
import { AuthenticationService, LoggingService } from '../../services';
import { AuthenticationServiceMock } from '../../../test/authentication-service.mock';
import { LoggingServiceMock } from 'src/test/logging.service.mock';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { User } from '@angular/fire/auth';
import { MatSnackBar } from '@angular/material/snack-bar';

describe('GenericDataTableComponent', () => {
  let component: GenericDataTableComponent;
  let fixture: ComponentFixture<GenericDataTableComponent>;
  let authService: AuthenticationServiceMock;
  let notificationService: MatSnackBar;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [GenericDataTableModule, BrowserAnimationsModule],
      declarations: [GenericDataTableComponent],
      providers: [
        { provide: AuthenticationService, useClass: AuthenticationServiceMock },
        { provide: LoggingService, useClass: LoggingServiceMock },
      ],
    });

    authService = TestBed.inject(
      AuthenticationService,
    ) as AuthenticationServiceMock;
    notificationService = TestBed.inject(MatSnackBar);
    fixture = TestBed.createComponent(GenericDataTableComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  it('should load the data after view init, if no data was provided', () => {
    const dataSpy = spyOn(component, 'getData').and.callFake(() => {
      component.dataSource = [{ id: '0', field: 'test' }];
      return Promise.resolve();
    });
    fixture.detectChanges();
    authService.authState.next({ email: 'test@user.de' } as User);
    fixture.detectChanges();
    expect(dataSpy).toHaveBeenCalled();
    expect(component.dataSource.length).toBe(1);
  });

  it('should not load the data after view init, if data was provided', () => {
    const dataSpy = spyOn(component, 'getData');
    component.dataSource = [{ id: '0', field: 'test' }];
    authService.authState.next({ email: 'test@user.de' } as User);
    fixture.detectChanges();
    expect(dataSpy).not.toHaveBeenCalled();
    expect(component.dataSource.length).toBe(1);
  });

  it('should notify if no data could be loaded', fakeAsync(() => {
    const notifySpy = spyOn(notificationService, 'open');
    const dataSpy = spyOn(component, 'getData').and.callFake(() => {
      return Promise.reject('Error');
    });
    fixture.detectChanges();
    authService.authState.next({ email: 'test@user.de' } as User);
    flush();
    expect(dataSpy).toHaveBeenCalled();
    expect(component.dataSource.length).toBe(0);
    expect(notifySpy).toHaveBeenCalled();
  }));

  it('getData should load the given data endpoint and parse the data', async () => {
    const data = [
      {
        id: '0',
        field: 'test',
      },
    ];
    spyOn(globalThis, 'fetch').and.resolveTo({
      status: 200,
      json: () => Promise.resolve(data),
    } as unknown as Response);

    await component.getData();
    expect(component.dataSource).toEqual(data);
  });

  it('getData should load the given data endpoint and parse the data', async () => {
    spyOn(globalThis, 'fetch').and.resolveTo({
      status: 403,
      text: () => Promise.resolve('Sample Error'),
    } as unknown as Response);

    try {
      await component.getData();
      fail('Should throw error!');
    } catch (error) {
      expect(component.dataSource.length).toBe(0);
      expect((error as Error).message).toBe('Sample Error');
    }
  });
});
