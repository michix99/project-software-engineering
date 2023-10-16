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
    text: 'Create Ticket',
    icon: 'add',
    path: '/ticket/0',
  },
  {
    text: 'Ticket Overview',
    icon: 'description',
    path: '/ticket',
  },
  {
    text: 'Settings',
    icon: 'preferences',
    requiredRole: Role.Admin,
    items: [
      {
        text: 'Permissions',
        path: '/permission',
      },
      {
        text: 'Course Management',
        path: '/course',
      },
      {
        text: 'User Management',
        path: '/user',
      },
    ],
  },
  {
    text: 'Privacy Policy',
    path: '/privacy-policy',
    icon: 'eyeopen',
  },
  {
    text: 'About Us',
    path: '/about',
    icon: 'card',
  },
];
