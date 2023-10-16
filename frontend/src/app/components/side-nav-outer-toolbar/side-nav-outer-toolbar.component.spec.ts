import {
  ComponentFixture,
  TestBed,
  fakeAsync,
  tick,
} from '@angular/core/testing';
import {
  SideNavOuterToolbarComponent,
  SideNavOuterToolbarModule,
} from './side-nav-outer-toolbar.component';
import { RouterTestingModule } from '@angular/router/testing';
import {
  AuthenticationGuardService,
  AuthenticationService,
  ScreenService,
} from '../../services';
import {
  NavigationEnd,
  NavigationStart,
  Router,
  RouterEvent,
} from '@angular/router';
import { Observable, Subject } from 'rxjs';
import { NAVIGATION, NAVIGATION_TOKEN } from './navigation';
import { EventEmitter } from '@angular/core';
import dxTreeView, { ItemClickEvent } from 'devextreme/ui/tree_view';
import { Role, NavigationItem } from '../../models';
import { AuthenticationServiceMock } from '../../../test';

class RouterMock {
  navEventSubject = new Subject<RouterEvent>();
  events: Observable<RouterEvent> = this.navEventSubject.asObservable();
  navigate() {}
}

const navigation: NavigationItem[] = [
  {
    text: 'Test',
    path: '/test',
    requiredRole: Role.Admin,
  },
  {
    text: 'Another',
    path: '/another',
    items: [
      {
        text: 'Allowed',
        path: '/allowed',
        requiredRole: Role.Editor,
      },
      {
        text: 'Not Allowed',
        path: '/notallowed',
        requiredRole: Role.Admin,
      },
    ],
  },
  {
    text: 'Sample',
    path: '/sample',
    requiredRole: Role.Requester,
  },
];

describe('SideNavOuterToolbarComponent ', () => {
  let component: SideNavOuterToolbarComponent;
  let fixture: ComponentFixture<SideNavOuterToolbarComponent>;
  let screenService: ScreenService;
  let router: RouterMock;
  let authService: AuthenticationServiceMock;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [RouterTestingModule, SideNavOuterToolbarModule],
      providers: [
        ScreenService,
        AuthenticationGuardService,
        { provide: AuthenticationService, useClass: AuthenticationServiceMock },
        { provide: Router, useClass: RouterMock },
        { provide: NAVIGATION_TOKEN, useValue: navigation },
      ],
      declarations: [SideNavOuterToolbarComponent],
    });

    fixture = TestBed.createComponent(SideNavOuterToolbarComponent);
    component = fixture.componentInstance;
    screenService = TestBed.inject(ScreenService);
    router = TestBed.inject(Router) as unknown as RouterMock;
    authService = TestBed.inject(
      AuthenticationService,
    ) as AuthenticationServiceMock;
    authService.role = Role.Admin;
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
    const navPath = navigation[1].path as string;
    fixture.detectChanges();
    const selectSpy = spyOn(component.menu, 'selectItem').and.returnValue(true);
    router.navEventSubject.next(new NavigationEnd(0, navPath, navPath));

    fixture.detectChanges();
    expect(component.selectedRoute).toBe(navPath);
    expect(selectSpy).toHaveBeenCalled();
  });

  it('after navigation the menu selection should be reset if the path is not known', () => {
    fixture.detectChanges();
    const unselectSpy = spyOn(component.menu, 'unselectAll');
    router.navEventSubject.next(new NavigationEnd(0, '/unknown', '/unknown'));

    fixture.detectChanges();
    expect(component.selectedRoute).toBe('');
    expect(unselectSpy).toHaveBeenCalled();
  });

  it('should only update the route when the navigation is ended', () => {
    const navPath = NAVIGATION[0].path as string;
    fixture.detectChanges();
    component.selectedRoute = 'test';
    router.navEventSubject.next(new NavigationStart(0, navPath));

    fixture.detectChanges();
    expect(component.selectedRoute).toBe('test');
  });

  it('should update the drawer when the screen size changed', () => {
    const updateSpy = spyOn(component, 'updateDrawer');
    const emitter = new EventEmitter<boolean>();
    screenService.changed = emitter;
    fixture.detectChanges();

    emitter.next(true);
    fixture.detectChanges();
    expect(updateSpy).toHaveBeenCalled();
  });

  it('menuOpened should expand the right item and open the drawer if true', () => {
    component.menu = {
      expandItem: (_) => Promise.resolve(), // eslint-disable-line @typescript-eslint/no-unused-vars
      collapseAll: () => {},
    } as dxTreeView;
    const expandSpy = spyOn(component.menu, 'expandItem');
    component.menuOpened = true;
    expect(expandSpy).toHaveBeenCalled();
  });

  it('menuOpened should collapse all items and close the drawer if false', () => {
    component.menu = {
      expandItem: (_) => Promise.resolve(), // eslint-disable-line @typescript-eslint/no-unused-vars
      collapseAll: () => {},
    } as dxTreeView;
    const collapseSpy = spyOn(component.menu, 'collapseAll');
    component.menuOpened = false;
    expect(collapseSpy).toHaveBeenCalled();
  });

  it('should not add items if they do not have the required role', fakeAsync(() => {
    fixture.detectChanges();
    authService.role = Role.Editor;
    authService.roleState.next(Role.Editor);
    tick();
    const items = component.items;

    expect(items.length).toBe(2);
    expect(items[0]['text']).toBe('Another');
    const children = items[0]['items'] as NavigationItem[];
    expect(children.length).toBe(1);
    expect(children[0].text).toBe('Allowed');
  }));

  it('navigationChanged should navigate to the selected element', () => {
    const routerSpy = spyOn(router, 'navigate');
    const event = {
      itemData: {
        path: '/test',
      },
      event: new Event('click'),
    } as unknown as ItemClickEvent;

    fixture.detectChanges();
    component.menuOpened = true;
    component.navigationChanged(event);
    expect(routerSpy).toHaveBeenCalled();
  });

  it('navigationChanged should not navigate if a node was selected', () => {
    const routerSpy = spyOn(router, 'navigate');
    const event = {
      itemData: {
        path: '/test',
      },
      event: new Event('click'),
      node: {
        selected: true,
      },
    } as unknown as ItemClickEvent;

    fixture.detectChanges();
    component.menuOpened = true;
    component.navigationChanged(event);
    expect(routerSpy).not.toHaveBeenCalled();
  });

  it('navigationChanged should prevent the event if the path is not defined', () => {
    const routerSpy = spyOn(router, 'navigate');
    const event = {
      itemData: {
        path: '',
      },
      event: new Event('click'),
      node: {
        selected: true,
      },
    } as unknown as ItemClickEvent;

    fixture.detectChanges();
    component.menuOpened = false;
    component.navigationChanged(event);
    expect(routerSpy).not.toHaveBeenCalled();
  });

  it('navigationClick should set the menu opened if the showMenuAfterClick variable is set', () => {
    component.menuOpened = false;
    component.navigationClick();
    expect(component.temporaryMenuOpened).toBeTrue();
    expect(component.menuOpened).toBeTrue();
  });

  it('hideMenuAfterNavigation should indicate if the menu is in overlap mode or temporary opened', () => {
    component.menuMode = 'overlap';
    expect(component.hideMenuAfterNavigation).toBeTrue();
    component.menuMode = 'shrink';
    component.temporaryMenuOpened = false;
    expect(component.hideMenuAfterNavigation).toBeFalse();
    component.temporaryMenuOpened = true;
    expect(component.hideMenuAfterNavigation).toBeTrue();
  });

  it('should trigger the navigationClick if the tree view was clicked', () => {
    const navigationSpy = spyOn(component, 'navigationClick');
    fixture.detectChanges();
    const treeViewRef =
      fixture.elementRef.nativeElement.querySelector('#treeView');
    treeViewRef.dispatchEvent(new CustomEvent('dxclick'));
    fixture.detectChanges();
    expect(navigationSpy).toHaveBeenCalled();
  });

  it('onTreeViewInitialized should not set the menu reference if the component is not defined', () => {
    component.onTreeViewInitialized({});
    expect(component.menu).toBeUndefined();
  });
});
