import {
  Component,
  OnInit,
  NgModule,
  Input,
  ViewChild,
  ElementRef,
  AfterViewInit,
  OnDestroy,
} from '@angular/core';
import { HeaderModule } from '..';
import { AuthenticationGuardService, ScreenService } from '../../services';
import {
  DxTreeViewModule,
  DxTreeViewTypes,
} from 'devextreme-angular/ui/tree-view';
import { DxDrawerModule } from 'devextreme-angular/ui/drawer';
import {
  DxScrollViewModule,
  DxScrollViewComponent,
} from 'devextreme-angular/ui/scroll-view';
import { CommonModule } from '@angular/common';

import { Router, NavigationEnd } from '@angular/router';
import dxTreeView from 'devextreme/ui/tree_view';
import * as events from 'devextreme/events';
import { navigation } from './navigation';

@Component({
  selector: 'app-side-nav-outer-toolbar',
  templateUrl: './side-nav-outer-toolbar.component.html',
  styleUrls: ['./side-nav-outer-toolbar.component.scss'],
})
export class SideNavOuterToolbarComponent
  implements OnInit, AfterViewInit, OnDestroy
{
  /** The scroll view reference. */
  @ViewChild(DxScrollViewComponent, { static: true })
  scrollView!: DxScrollViewComponent;
  /** The menu reference. */
  menu!: dxTreeView;
  /** The selected element (route). */
  selectedRoute = '';
  /** Indicates if the toolbar is opened or closed. */
  private _menuOpened!: boolean;
  get menuOpened(): boolean {
    return this._menuOpened;
  }
  set menuOpened(val: boolean) {
    this._menuOpened = val;

    if (!this.menu) return;

    if (val) {
      this.menu.expandItem(this.selectedRoute);
      this.navigationClick();
    } else {
      this.menu.collapseAll();
    }
  }
  /** Indicates if the overlay menu is opened. */
  temporaryMenuOpened = false;
  /** The title of the application. */
  @Input()
  title!: string;
  /** Depending on the screen size the menu mode is shrink or overlap. */
  menuMode = 'shrink';
  /** Depending on the screen size the menu should be revealed with slide or expand. */
  menuRevealMode = 'expand';
  /** Depending on the screen size the minimum menu size. */
  minMenuSize = 0;
  /** Depending on the screen size the toolbar will be closed on outside click. */
  shaderEnabled = false;
  /** The menu items shown in the toolbar. */
  private _items: Record<string, unknown>[] = [];
  get items() {
    if (this._items.length === 0) {
      for (const item of navigation) {
        // Checking if the user has the claim to see the item
        if (item.requiredRole && !this.authGuard.hasRole(item.requiredRole))
          break;

        const children = item.items ?? [];
        item.items = [];
        for (const child of children) {
          if (child.requiredRole && !this.authGuard.hasRole(child.requiredRole))
            break;

          item.items.push(child);
        }

        this._items.push({ ...item, expanded: this.menuOpened });
      }
    }

    return this._items;
  }

  /** Indicates if the menu should be hidden after navigating. */
  get hideMenuAfterNavigation() {
    return this.menuMode === 'overlap' || this.temporaryMenuOpened;
  }

  /** Indicates if the menu should be shown after selecting an item. */
  get showMenuAfterClick() {
    return !this.menuOpened;
  }

  constructor(
    private screen: ScreenService,
    private router: Router,
    private elementRef: ElementRef,
    private authGuard: AuthenticationGuardService,
  ) {}

  ngOnInit(): void {
    this.menuOpened = this.screen.sizes['screen-large'];

    this.router.events.subscribe((val) => {
      if (!(val instanceof NavigationEnd)) return;

      const newRoute = val.urlAfterRedirects.split('?')[0];

      if (this.menu.selectItem(newRoute)) {
        this.selectedRoute = newRoute;
        return;
      }
      this.selectedRoute = '';
      this.menu.unselectAll();
    });

    this.screen.changed.subscribe(() => this.updateDrawer());

    this.updateDrawer();
  }

  ngAfterViewInit(): void {
    events.on(
      this.elementRef.nativeElement.querySelector('#treeView'),
      'dxclick',
      () => {
        this.navigationClick();
      },
    );
  }

  ngOnDestroy(): void {
    events.off(
      this.elementRef.nativeElement.querySelector('#treeView'),
      'dxclick',
    );
  }

  /**
   * Updates the drawer depending on the screen size.
   */
  updateDrawer(): void {
    const isXSmall = this.screen.sizes['screen-x-small'];
    const isLarge = this.screen.sizes['screen-large'];

    this.menuMode = isLarge ? 'shrink' : 'overlap';
    this.menuRevealMode = isXSmall ? 'slide' : 'expand';
    this.minMenuSize = isXSmall ? 0 : 60;
    this.shaderEnabled = !isLarge;
  }

  /**
   * Navigates to the selected element.
   * @param event The click event of the tree item.
   */
  navigationChanged(event: DxTreeViewTypes.ItemClickEvent): void {
    const path = (event.itemData as { path: string }).path;
    const pointerEvent = event.event;

    if (path && this.menuOpened) {
      if (event.node?.selected) {
        pointerEvent?.preventDefault();
      } else {
        this.router.navigate([path]);
        this.scrollView.instance.scrollTo(0);
      }

      if (this.hideMenuAfterNavigation) {
        this.temporaryMenuOpened = false;
        this.menuOpened = false;
        pointerEvent?.stopPropagation();
      }
    } else {
      pointerEvent?.preventDefault();
    }
  }

  /**
   * Opens the menu if the menu should be open after a selection.
   */
  navigationClick(): void {
    if (this.showMenuAfterClick) {
      this.temporaryMenuOpened = true;
      this.menuOpened = true;
    }
  }

  /**
   * Sets the tree view to a value after initialization.
   * @param event The initialization event.
   */
  onTreeViewInitialized(event: DxTreeViewTypes.InitializedEvent): void {
    if (!event.component) {
      return;
    }
    this.menu = event.component;
  }
}

@NgModule({
  imports: [
    DxDrawerModule,
    HeaderModule,
    DxScrollViewModule,
    DxTreeViewModule,
    CommonModule,
  ],
  exports: [SideNavOuterToolbarComponent],
  declarations: [SideNavOuterToolbarComponent],
})
export class SideNavOuterToolbarModule {}
