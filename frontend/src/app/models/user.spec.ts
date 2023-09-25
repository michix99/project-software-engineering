import { userFromJson } from './user';

describe('User ', () => {
  it('userFromJson should parse an object to a user instance', () => {
    const user = {
      id: '12345',
      email: 'dummy@test.de',
      display_name: 'Dummy User',
      disabled: false,
      admin: false,
      editor: true,
      requester: true,
    };

    const parsedUser = userFromJson(user);
    expect(parsedUser.id).toBe('12345');
    expect(parsedUser.email).toBe('dummy@test.de');
    expect(parsedUser.displayName).toBe('Dummy User');
    expect(parsedUser.disabled).toBeFalse();
    expect(parsedUser.admin).toBeFalse();
    expect(parsedUser.editor).toBeTrue();
    expect(parsedUser.requester).toBeTrue();
  });
});
