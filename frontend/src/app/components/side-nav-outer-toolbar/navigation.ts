import { InjectionToken } from '@angular/core';
import { NavigationItem, Role } from '../../models';

export const NAVIGATION_TOKEN = new InjectionToken<NavigationItem[]>(
  'navigation',
);

export const NAVIGATION: NavigationItem[] = [
  {
    text: 'Home',
    path: '/home',
    icon: 'home',
  },
  {
    text: 'Examples',
    icon: 'folder',
    items: [
      {
        text: 'Profile',
        path: '/profile',
      },
      {
        text: 'Tasks',
        path: '/tasks',
        requiredRole: Role.Admin,
      },
    ],
  },
];
