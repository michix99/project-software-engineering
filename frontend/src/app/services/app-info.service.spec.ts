import { TestBed } from '@angular/core/testing';
import { AppInfoService } from './app-info.service';

describe('AppInfoService', () => {
  let service: AppInfoService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [AppInfoService],
    });

    service = TestBed.inject(AppInfoService);
  });

  it('title should return the app title', () => {
    expect(service.title).toBe('Projekt Software Engineering');
  });

  it('currentYear should return the current year', () => {
    expect(service.currentYear).toBe(new Date().getFullYear());
  });
});
