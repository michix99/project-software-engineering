import { Injectable } from '@angular/core';

@Injectable()
export class AppInfoService {
  /** Returns the Application Title. */
  public get title() {
    return 'Correction Management System';
  }

  /** Returns the current year. */
  public get currentYear() {
    return new Date().getFullYear();
  }
}
