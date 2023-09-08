import { ComponentFixture, TestBed, inject } from '@angular/core/testing';
import {
  SideNavOuterToolbarComponent,
  SideNavOuterToolbarModule,
} from './side-nav-outer-toolbar.component';
import { RouterTestingModule } from '@angular/router/testing';
import {
  AuthenticationGuardService,
  AuthenticationService,
  ScreenService,
} from 'src/app/services';
import { AuthenticationServiceMock } from '../../../test/authentication-service.mock';
import { NavigationEnd, Router } from '@angular/router';
import { Observable, Subject, of } from 'rxjs';
import { navigation } from './navigation';

class RouterMock {
  navEndEventSubject = new Subject<NavigationEnd>();
  events: Observable<NavigationEnd> = this.navEndEventSubject.asObservable();
}

describe('SideNavOuterToolbarComponent ', () => {
  let component: SideNavOuterToolbarComponent;
  let fixture: ComponentFixture<SideNavOuterToolbarComponent>;
  let screenService: ScreenService;
  let router: RouterMock;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [RouterTestingModule, SideNavOuterToolbarModule],
      providers: [
        ScreenService,
        AuthenticationGuardService,
        { provide: AuthenticationService, useClass: AuthenticationServiceMock },
        { provide: Router, useClass: RouterMock },
      ],
      declarations: [SideNavOuterToolbarComponent],
    });

    fixture = TestBed.createComponent(SideNavOuterToolbarComponent);
    component = fixture.componentInstance;
    screenService = TestBed.inject(ScreenService);
    router = TestBed.inject(Router) as unknown as RouterMock;
  });

  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  it('ngOnInit should close the menu on a small screen', () => {
    spyOnProperty(screenService, 'sizes').and.returnValue({
      'screen-x-small': true,
      'screen-small': false,
      'screen-medium': false,
      'screen-large': false,
    });

    fixture.detectChanges();
    expect(component.menuOpened).toBeFalse();
    expect(component.menuMode).toBe('overlap');
    expect(component.menuRevealMode).toBe('slide');
    expect(component.minMenuSize).toBe(0);
    expect(component.shaderEnabled).toBeTrue();
  });

  it('ngOnInit should open the menu on a large screen', () => {
    spyOnProperty(screenService, 'sizes').and.returnValue({
      'screen-x-small': false,
      'screen-small': false,
      'screen-medium': false,
      'screen-large': true,
    });

    fixture.detectChanges();
    expect(component.menuOpened).toBeTrue();
    expect(component.menuMode).toBe('shrink');
    expect(component.menuRevealMode).toBe('expand');
    expect(component.minMenuSize).toBe(60);
    expect(component.shaderEnabled).toBeFalse();
  });

  it('after navigation the menu selection should be applied as well as the selected route', () => {
    const navPath = navigation[0].path as string;
    fixture.detectChanges();
    router.navEndEventSubject.next(new NavigationEnd(0, navPath, navPath));

    fixture.detectChanges();
    expect(component.selectedRoute).toBe(navPath);
  });

  it('after navigation the menu selection should be reset if the path is not known', () => {
    fixture.detectChanges();
    const unselectSpy = spyOn(component.menu, 'unselectAll');
    router.navEndEventSubject.next(
      new NavigationEnd(0, '/unknown', '/unknown'),
    );

    fixture.detectChanges();
    expect(component.selectedRoute).toBe('');
    expect(unselectSpy).toHaveBeenCalled();
  });
});
