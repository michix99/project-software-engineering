import { Component, NgModule, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

import { DxListModule } from 'devextreme-angular/ui/list';
import { DxContextMenuModule } from 'devextreme-angular/ui/context-menu';
import { Item } from 'devextreme/ui/list';
import { User } from '@angular/fire/auth';

@Component({
  selector: 'app-user-panel',
  templateUrl: 'user-panel.component.html',
  styleUrls: ['./user-panel.component.scss'],
})
export class UserPanelComponent {
  @Input()
  menuItems: Item[] = [];

  @Input()
  menuMode!: string;

  @Input()
  user!: User | null;
}

@NgModule({
  imports: [DxListModule, DxContextMenuModule, CommonModule],
  declarations: [UserPanelComponent],
  exports: [UserPanelComponent],
})
export class UserPanelModule {}
