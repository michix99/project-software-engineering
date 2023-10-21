import { ComponentFixture, TestBed } from '@angular/core/testing';
import { UserTableComponent } from './user-table.component';
import { GenericDataTableModule } from '../../components';
import { AuthenticationService, LoggingService } from '../../services';
import { AuthenticationServiceMock, LoggingServiceMock } from '../../../test';

describe('UserTableComponent', () => {
  let component: UserTableComponent;
  let fixture: ComponentFixture<UserTableComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [GenericDataTableModule],
      declarations: [UserTableComponent],
      providers: [
        { provide: AuthenticationService, useClass: AuthenticationServiceMock },
        { provide: LoggingService, useClass: LoggingServiceMock },
      ],
    });
    fixture = TestBed.createComponent(UserTableComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('column role should be transformed to a uppercase value', () => {
    const cellInfo = {
      value: 'admin',
    };
    const roleColumn = component.columns.find(
      (item) => item.fieldName === 'role',
    );
    expect(roleColumn).toBeDefined();
    const result =
      roleColumn?.customizeText && roleColumn.customizeText(cellInfo);
    expect(result).toBe('Admin');
  });
});
