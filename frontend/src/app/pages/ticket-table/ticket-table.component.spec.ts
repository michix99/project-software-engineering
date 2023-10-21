import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TicketTableComponent } from './ticket-table.component';
import { GenericDataTableModule } from '../../components';
import { AuthenticationService, LoggingService } from '../../services';
import { AuthenticationServiceMock, LoggingServiceMock } from '../../../test';

describe('TicketTableComponent', () => {
  let component: TicketTableComponent;
  let fixture: ComponentFixture<TicketTableComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [GenericDataTableModule],
      declarations: [TicketTableComponent],
      providers: [
        { provide: AuthenticationService, useClass: AuthenticationServiceMock },
        { provide: LoggingService, useClass: LoggingServiceMock },
      ],
    });
    fixture = TestBed.createComponent(TicketTableComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
