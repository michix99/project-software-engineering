import {
  Component,
  OnInit,
  NgModule,
  Input,
  ViewChild,
  ElementRef,
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
export class SideNavOuterToolbarComponent implements OnInit {
  @ViewChild(DxScrollViewComponent, { static: true })
  scrollView!: DxScrollViewComponent;

  menu!: dxTreeView;
  selectedRoute = '';

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
  temporaryMenuOpened = false;

  @Input()
  title!: string;

  menuMode = 'shrink';
  menuRevealMode = 'expand';
  minMenuSize = 0;
  shaderEnabled = false;

  private _items: Record<string, unknown>[] = [];
  get items() {
    if (this._items.length === 0) {
      for (const item of navigation) {
        if (item.requiredRole && !this.authGuard.hasRole(item.requiredRole))
          break;

        let children = item.items ?? [];
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

  constructor(
    private screen: ScreenService,
    private router: Router,
    private elementRef: ElementRef,
    private authGuard: AuthenticationGuardService,
  ) {}

  ngOnInit() {
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

  ngAfterViewInit() {
    events.on(
      this.elementRef.nativeElement.querySelector('#treeView'),
      'dxclick',
      (_: Event) => {
        this.navigationClick();
      },
    );
  }

  ngOnDestroy() {
    events.off(
      this.elementRef.nativeElement.querySelector('#treeView'),
      'dxclick',
    );
  }

  updateDrawer() {
    const isXSmall = this.screen.sizes['screen-x-small'];
    const isLarge = this.screen.sizes['screen-large'];

    this.menuMode = isLarge ? 'shrink' : 'overlap';
    this.menuRevealMode = isXSmall ? 'slide' : 'expand';
    this.minMenuSize = isXSmall ? 0 : 60;
    this.shaderEnabled = !isLarge;
  }

  get hideMenuAfterNavigation() {
    return this.menuMode === 'overlap' || this.temporaryMenuOpened;
  }

  get showMenuAfterClick() {
    return !this.menuOpened;
  }

  navigationChanged(event: DxTreeViewTypes.ItemClickEvent) {
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

  navigationClick() {
    if (this.showMenuAfterClick) {
      this.temporaryMenuOpened = true;
      this.menuOpened = true;
    }
  }

  onTreeViewInitialized(event: DxTreeViewTypes.InitializedEvent) {
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
