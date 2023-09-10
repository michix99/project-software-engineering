import {
  Component,
  NgModule,
  Input,
  Output,
  EventEmitter,
  OnInit,
} from '@angular/core';
import { CommonModule } from '@angular/common';

import { AuthenticationService } from '../../services';
import { DxButtonModule } from 'devextreme-angular/ui/button';
import { DxToolbarModule } from 'devextreme-angular/ui/toolbar';

import { Router } from '@angular/router';
import { User } from '@angular/fire/auth';
import { DxContextMenuModule, DxListModule } from 'devextreme-angular';
@Component({
  selector: 'app-header',
  templateUrl: 'header.component.html',
  styleUrls: ['./header.component.scss'],
})
export class HeaderComponent implements OnInit {
  /** Notifies when the menu button is clicked. */
  @Output()
  menuToggle = new EventEmitter<boolean>();

  /** Indicates if the menu can be toggled. */
  @Input()
  menuToggleEnabled = false;

  /** The title of the header. */
  @Input()
  title!: string;

  /** Information about the logged in user. */
  user: User | null = null;

  /** The list of menu items shown in the context menu. */
  userMenuItems = [
    {
      text: 'Profile',
      icon: 'user',
      onClick: () => {
        this.router.navigate(['/profile']);
      },
    },
    {
      text: 'Logout',
      icon: 'runner',
      onClick: () => {
        this.authService.logOut();
      },
    },
    {
      text: 'Change Password',
      icon: 'refresh',
      onClick: () => {
        this.router.navigate(['/change-password']);
      },
    },
  ];

  constructor(
    private authService: AuthenticationService,
    private router: Router,
  ) {}

  ngOnInit() {
    this.user = this.authService.getUser().data ?? null;
  }

  /** Informs about clicking on the menu button. */
  toggleMenu = () => {
    this.menuToggle.emit();
  };
}

@NgModule({
  imports: [
    CommonModule,
    DxButtonModule,
    DxToolbarModule,
    DxListModule,
    DxContextMenuModule,
  ],
  declarations: [HeaderComponent],
  exports: [HeaderComponent],
})
export class HeaderModule {}
