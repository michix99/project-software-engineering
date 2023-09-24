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
        text: 'Admin',
        path: '/tasks',
        requiredRole: Role.Admin,
      },
      {
        text: 'Editor',
        path: '/login-form',
        requiredRole: Role.Editor,
      },
      {
        text: 'Requester',
        path: '/rest-password',
        requiredRole: Role.Requester,
      },
    ],
  },
];
