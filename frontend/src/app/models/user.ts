export interface User {
  id: string;
  email: string;
  displayName: string;
  disabled: boolean;
  admin: boolean;
  editor: boolean;
  requester: boolean;
}

export function userFromJson(parsedJson: Record<string, unknown>): User {
  const user = {
    id: parsedJson['id'],
    email: parsedJson['email'],
    displayName: parsedJson['display_name'],
    disabled: parsedJson['disabled'],
    admin: parsedJson['admin'],
    editor: parsedJson['editor'],
    requester: parsedJson['requester'],
  };
  return user as User;
}
