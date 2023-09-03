export enum Role {
  Admin = 'admin',
  User = 'user',
}

export interface AuthUserInfo {
  id: string;
  role: Role;
}
