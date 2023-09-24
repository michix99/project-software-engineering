import { Injectable } from '@angular/core';
import { LoggingService } from 'src/app/services';

@Injectable()
export class LoggingServiceMock extends LoggingService {
  public override debug = jasmine.createSpy();
  public override error = jasmine.createSpy();
  public override info = jasmine.createSpy();
  public override log = jasmine.createSpy();
  public override trace = jasmine.createSpy();
  public override warn = jasmine.createSpy();
}
