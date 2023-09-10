import { NavigationItem, Role } from '../../models';

export const navigation: NavigationItem[] = [
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
