import { Injectable } from '@angular/core';

@Injectable()
export class AppInfoService {
  public get title() {
    return 'Projekt Software Engineering';
  }

  public get currentYear() {
    return new Date().getFullYear();
  }
}
