import { ComponentFixture, TestBed } from '@angular/core/testing';
import {
  GenericDataTableComponent,
  GenericDataTableModule,
} from './generic-data-table.component';
import { AuthenticationService, LoggingService } from '../../services';
import { AuthenticationServiceMock } from '../../../test/authentication-service.mock';
import { LoggingServiceMock } from 'src/test/logging.service.mock';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

describe('GenericDataTableComponent', () => {
  let component: GenericDataTableComponent;
  let fixture: ComponentFixture<GenericDataTableComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [GenericDataTableModule, BrowserAnimationsModule],
      declarations: [GenericDataTableComponent],
      providers: [
        { provide: AuthenticationService, useClass: AuthenticationServiceMock },
        { provide: LoggingService, useClass: LoggingServiceMock },
      ],
    });
    fixture = TestBed.createComponent(GenericDataTableComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
