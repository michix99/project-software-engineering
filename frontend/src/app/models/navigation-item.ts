import { Role } from './user-info';

export interface NavigationItem {
  text: string;
  path?: string;
  icon?: string;
  requiredRole?: Role;
  items?: NavigationItem[];
}
