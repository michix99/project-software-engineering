import { Role } from './role';
import { User, roleToModel, userFromJson, userToModel } from './user';

describe('User ', () => {
  [
    { admin: false, editor: true, requester: false, expected: Role.Editor },
    { admin: true, editor: false, requester: false, expected: Role.Admin },
    { admin: false, editor: false, requester: true, expected: Role.Requester },
  ].forEach((item) => {
    it(`userFromJson should parse an object to a user instance (${item.expected})`, () => {
      const user = {
        id: '12345',
        email: 'dummy@test.de',
        display_name: 'Dummy User',
        disabled: false,
        admin: item.admin,
        editor: item.editor,
        requester: item.requester,
      };

      const parsedUser = userFromJson(user);
      expect(parsedUser.id).toBe('12345');
      expect(parsedUser.email).toBe('dummy@test.de');
      expect(parsedUser.displayName).toBe('Dummy User');
      expect(parsedUser.disabled).toBeFalse();
      expect(parsedUser.role).toBe(item.expected);
    });
  });

  it('userToModel should parse a user to the json format expected by the backend', () => {
    const user: User = {
      id: '56789',
      email: 'dummy@test.de',
      displayName: 'Dummy User',
      disabled: false,
      role: Role.Requester,
    };

    const parsedUser = userToModel(user);
    expect(parsedUser['target_user_id']).toBe('56789');
    expect(parsedUser['display_name']).toBe('Dummy User');
    expect(parsedUser['email']).toBe('dummy@test.de');
  });

  it('roleToModel should parse a user role to the json format expected by the backend', () => {
    const user: User = {
      id: '2468',
      email: 'dummy@test.de',
      displayName: 'Dummy User',
      disabled: false,
      role: Role.Requester,
    };

    const parsedUser = roleToModel(user);
    expect(parsedUser['target_user_id']).toBe('2468');
    expect(parsedUser['role']).toBe('requester');
  });
});
