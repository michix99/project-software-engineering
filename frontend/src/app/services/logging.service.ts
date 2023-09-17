/* eslint-disable no-console */
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class LoggingService {
  /** Logs a trace message */
  public trace(...params: unknown[]): void {
    console.trace(...params);
  }

  /** Logs a debug message */
  public debug(...params: unknown[]): void {
    console.debug(...params);
  }

  /** Logs a log message */
  public log(...params: unknown[]): void {
    console.log(...params);
  }

  /** Logs a info message */
  public info(...params: unknown[]): void {
    console.info(...params);
  }

  /** Logs a warn message */
  public warn(...params: unknown[]): void {
    console.warn(...params);
  }

  /** Logs a error message */
  public error(...params: unknown[]): void {
    console.error(...params);
  }
}
