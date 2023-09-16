import { Role } from './role';

export interface NavigationItem {
  text: string;
  path?: string;
  icon?: string;
  requiredRole?: Role;
  items?: NavigationItem[];
}
