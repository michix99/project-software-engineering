import { TestBed } from '@angular/core/testing';
import { LoggingService } from './logging.service';

describe('LoggingService', () => {
  let service: LoggingService;
  let trace: jasmine.Spy;
  let debug: jasmine.Spy;
  let log: jasmine.Spy;
  let info: jasmine.Spy;
  let warn: jasmine.Spy;
  let error: jasmine.Spy;

  beforeEach(() => {
    // spy on console functions
    trace = spyOn(console, 'trace');
    debug = spyOn(console, 'debug');
    log = spyOn(console, 'log');
    info = spyOn(console, 'info');
    warn = spyOn(console, 'warn');
    error = spyOn(console, 'error');

    // Create service instance
    TestBed.configureTestingModule({});
    service = TestBed.inject(LoggingService);
    expect(service).toBeTruthy();
  });

  it('should log trace message', () => {
    const msg = 'Trace Message';
    service.trace(msg);
    expect(trace).toHaveBeenCalledWith(msg);
  });

  it('should log debug message', () => {
    const msg = 'Debug Message';
    service.debug(msg);
    expect(debug).toHaveBeenCalledWith(msg);
  });

  it('should log log message', () => {
    const msg = 'Log Message';
    service.log(msg);
    expect(log).toHaveBeenCalledWith(msg);
  });

  it('should log info message', () => {
    const msg = 'Info Message';
    service.info(msg);
    expect(info).toHaveBeenCalledWith(msg);
  });

  it('should log warn message', () => {
    const msg = 'Warn Message';
    service.warn(msg);
    expect(warn).toHaveBeenCalledWith(msg);
  });

  it('should log error message', () => {
    const msg = 'Error Message';
    service.error(msg);
    expect(error).toHaveBeenCalledWith(msg);
  });
});
