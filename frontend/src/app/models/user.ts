import { Role } from './role';

export interface User {
  id: string;
  email: string;
  displayName: string;
  disabled: boolean;
  role: Role;
}

export function userFromJson(parsedJson: Record<string, unknown>): User {
  let role = Role.Requester;
  if (parsedJson['admin'] === true) {
    role = Role.Admin;
  } else if (parsedJson['editor'] === true) {
    role = Role.Editor;
  }

  const user = {
    id: parsedJson['id'],
    email: parsedJson['email'],
    displayName: parsedJson['display_name'],
    disabled: parsedJson['disabled'],
    role: role,
  };
  return user as User;
}

export function userToModel(user: User): Record<string, unknown> {
  const parsedJson: Record<string, unknown> = {
    target_user_id: user.id,
    display_name: user.displayName,
    email: user.email,
  };
  return parsedJson;
}

export function roleToModel(user: User): Record<string, unknown> {
  const parsedJson: Record<string, unknown> = {
    target_user_id: user.id,
    role: user.role,
  };
  return parsedJson;
}
