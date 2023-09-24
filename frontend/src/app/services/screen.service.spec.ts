import { TestBed } from '@angular/core/testing';
import { ScreenService } from './screen.service';
import { BreakpointObserver, BreakpointState } from '@angular/cdk/layout';
import { Observable, Subject } from 'rxjs';

class BreakpointObserverMock {
  breakPointChanged = new Subject<BreakpointState>();

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  observe(_: string[]): Observable<BreakpointState> {
    return this.breakPointChanged.asObservable();
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  isMatched(_: string): boolean {
    return true;
  }
}

describe('ScreenService', () => {
  let service: ScreenService;
  let breakPointObserver: BreakpointObserverMock;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        ScreenService,
        { provide: BreakpointObserver, useClass: BreakpointObserverMock },
      ],
    });

    service = TestBed.inject(ScreenService);
    breakPointObserver = TestBed.inject(
      BreakpointObserver,
    ) as unknown as BreakpointObserverMock;
  });

  it('sizes should return the current size classes', () => {
    expect(service.sizes).toEqual({
      'screen-x-small': true,
      'screen-small': true,
      'screen-medium': true,
      'screen-large': true,
    });
  });

  it('should inform if the width has changed', () => {
    const changedSpy = spyOn(service.changed, 'next');
    breakPointObserver.breakPointChanged.next({
      matches: true,
    } as BreakpointState);
    expect(changedSpy).toHaveBeenCalled();
  });
});
