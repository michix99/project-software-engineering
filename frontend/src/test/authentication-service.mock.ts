import { Injectable } from '@angular/core';
import { AuthenticationService } from '../app/services';
import { User } from '@angular/fire/auth';

@Injectable()
export class AuthenticationServiceMock extends AuthenticationService {
  isLoggedIn = true;
  requestSuccess = true;
  requestError = false;

  override get loggedIn(): boolean {
    return this.isLoggedIn;
  }

  override async logIn(
    email: string,
    _password: string, // eslint-disable-line @typescript-eslint/no-unused-vars
  ): Promise<{ isOk: boolean; data?: User | null; message?: string }> {
    if (this.requestSuccess) {
      const returnValue = this.requestError
        ? { isOk: false, message: 'Failed to Login' }
        : {
            isOk: true,
            data: { email: email } as User,
          };

      return Promise.resolve(returnValue);
    }
    return Promise.reject('Error');
  }

  override async logOut(): Promise<void> {
    if (this.requestError) {
      return Promise.reject('Error while log out');
    }
    return Promise.resolve();
  }

  override async getToken(): Promise<string> {
    return Promise.resolve('dummy-token');
  }
}
