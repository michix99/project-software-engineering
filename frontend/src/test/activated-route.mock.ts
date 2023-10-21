import { ParamMap, ActivatedRouteSnapshot } from '@angular/router';
import { BehaviorSubject } from 'rxjs';

export class ActivatedRouteMock {
  paramMapSubject = new BehaviorSubject<ParamMap | null>({
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    get(_: string): string | null {
      return null;
    },
  } as ParamMap);
  paramMap = this.paramMapSubject;

  snapshot: ActivatedRouteSnapshot = {
    paramMap: {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      get(_: string): string | null {
        return null;
      },
    } as ParamMap,
  } as ActivatedRouteSnapshot;
}
