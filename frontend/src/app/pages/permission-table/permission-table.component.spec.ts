import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PermissionTableComponent } from './permission-table.component';
import { GenericDataTableModule } from '../../components';
import { AuthenticationService, LoggingService } from '../../services';
import { AuthenticationServiceMock, LoggingServiceMock } from '../../../test';

describe('PermissionTableComponent', () => {
  let component: PermissionTableComponent;
  let fixture: ComponentFixture<PermissionTableComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [GenericDataTableModule],
      declarations: [PermissionTableComponent],
      providers: [
        { provide: AuthenticationService, useClass: AuthenticationServiceMock },
        { provide: LoggingService, useClass: LoggingServiceMock },
      ],
    });
    fixture = TestBed.createComponent(PermissionTableComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
