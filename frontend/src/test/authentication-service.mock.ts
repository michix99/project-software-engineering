import { Injectable } from '@angular/core';
import { AuthenticationService } from '../app/services';
import { User } from '@angular/fire/auth';
import { Role } from 'src/app/models';

@Injectable()
export class AuthenticationServiceMock extends AuthenticationService {
  isLoggedIn = true;
  requestSuccess = true;
  role = Role.Admin;

  override get loggedIn(): boolean {
    return this.isLoggedIn;
  }

  override get currentRole(): Role {
    return this.role;
  }

  override async logIn(
    email: string,
    _password: string, // eslint-disable-line @typescript-eslint/no-unused-vars
  ): Promise<{ isOk: boolean; data?: User | null; message?: string }> {
    const returnValue = this.requestSuccess
      ? {
          isOk: true,
          data: { email: email } as User,
        }
      : { isOk: false, message: 'Failed to Login' };

    return Promise.resolve(returnValue);
  }

  override async logOut(): Promise<void> {
    if (this.requestSuccess) {
      return Promise.resolve();
    }
    return Promise.reject('Error while log out');
  }

  override async getToken(): Promise<string> {
    return Promise.resolve('dummy-token');
  }

  override reauthenticateUser(
    _: string, // eslint-disable-line @typescript-eslint/no-unused-vars
  ): Promise<{ isOk: boolean; message?: string | undefined }> {
    if (this.requestSuccess) {
      return Promise.resolve({
        isOk: true,
      });
    }
    return Promise.resolve({
      isOk: false,
      message: 'Failed to reauthenticate user!',
    });
  }

  override changePassword(
    _: string, // eslint-disable-line @typescript-eslint/no-unused-vars
  ): Promise<
    { isOk: boolean; message?: undefined } | { isOk: boolean; message: string }
  > {
    if (this.requestSuccess) {
      return Promise.resolve({
        isOk: true,
      });
    }
    return Promise.resolve({
      isOk: false,
      message: 'Failed to change password!',
    });
  }
}
