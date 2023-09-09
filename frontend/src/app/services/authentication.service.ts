import { Injectable, Optional } from '@angular/core';
import { FirebaseError } from '@angular/fire/app';
import {
  Auth,
  AuthErrorCodes,
  EmailAuthProvider,
  User,
  authState,
  confirmPasswordReset,
  reauthenticateWithCredential,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signOut,
  updatePassword,
} from '@angular/fire/auth';
import { Router } from '@angular/router';
import { AuthUserInfo } from '../models';
import { BehaviorSubject } from 'rxjs';

const defaultPath = '/';

export abstract class AngularFireWrapper {
  static readonly authState = authState;
  static readonly confirmPasswordReset = confirmPasswordReset;
  static readonly reauthenticateWithCredential = reauthenticateWithCredential;
  static readonly sendPasswordResetEmail = sendPasswordResetEmail;
  static readonly signInWithEmailAndPassword = signInWithEmailAndPassword;
  static readonly signOut = signOut;
  static readonly updatePassword = updatePassword;
}

@Injectable()
export class AuthenticationService {
  private userData: User | null = null;
  get loggedIn(): boolean {
    const user = JSON.parse(localStorage.getItem('user') ?? 'null') as User;
    return (
      user !== null && (user.emailVerified || user.email === 'test@user.de')
    );
    // return !!this._user;
  }

  get authUserInfo(): AuthUserInfo {
    return JSON.parse(
      localStorage.getItem('userInfo') ?? 'null',
    ) as AuthUserInfo;
  }

  private _lastAuthenticatedPath: string = defaultPath;
  set lastAuthenticatedPath(value: string) {
    this._lastAuthenticatedPath = value;
  }

  authState: BehaviorSubject<User | null> = new BehaviorSubject<User | null>(
    null,
  );

  constructor(
    private router: Router,
    @Optional() private auth: Auth, // Inject Firebase auth service
  ) {
    if (!auth) {
      return;
    }

    /* Saving user data in localstorage when 
    logged in and setting up null when logged out */
    AngularFireWrapper.authState(this.auth).subscribe((user: User | null) => {
      if (user) {
        this.userData = user;
        this.authState.next(this.userData);
        localStorage.setItem('user', JSON.stringify(this.userData));
        this.router.navigate([this._lastAuthenticatedPath]);
      } else {
        this.authState.next(null);
        localStorage.setItem('user', 'null');
        localStorage.setItem('userInfo', 'null');
      }
    });
  }

  async logIn(
    email: string,
    password: string,
  ): Promise<{ isOk: boolean; data?: User | null; message?: string }> {
    try {
      await AngularFireWrapper.signInWithEmailAndPassword(
        this.auth,
        email,
        password,
      );

      // Get role from backend
      // const response = await fetch(`${environment.apiUrl}/userInfo/${email}`);
      // const userInfo = response.json() as unknown as AuthUserInfo;
      const userInfo = { id: 'test', role: 'admin' } as unknown as AuthUserInfo;
      localStorage.setItem('userInfo', JSON.stringify(userInfo));

      return {
        isOk: true,
        data: this.userData,
      };
    } catch (error) {
      const fireError = error as FirebaseError;
      const errorMessage =
        fireError.code === AuthErrorCodes.INVALID_PASSWORD
          ? 'Password was incorrect.'
          : fireError.message;
      return {
        isOk: false,
        message: `Failed to authenticate user. ${errorMessage}`,
      };
    }
  }

  async reauthenticateUser(
    password: string,
  ): Promise<{ isOk: boolean; message?: string }> {
    try {
      if (!this.auth.currentUser?.email)
        throw new FirebaseError('500', 'Could not load current user.');
      const credential = EmailAuthProvider.credential(
        this.auth.currentUser.email,
        password,
      );
      await AngularFireWrapper.reauthenticateWithCredential(
        this.auth.currentUser,
        credential,
      );

      return {
        isOk: true,
      };
    } catch (error) {
      const fireError = error as FirebaseError;
      const errorMessage =
        fireError.code === AuthErrorCodes.INVALID_PASSWORD
          ? 'Password was incorrect.'
          : fireError.message;
      return {
        isOk: false,
        message: `Failed to reauthenticate user. ${errorMessage}`,
      };
    }
  }

  getUser(): { isOk: boolean; data?: User | null; message?: string } {
    if (!this.userData) {
      this.userData = JSON.parse(localStorage.getItem('user') ?? 'null');
    }

    return this.userData !== null
      ? {
          isOk: true,
          data: this.userData,
        }
      : {
          isOk: false,
          message: 'Failed to load current User!',
        };
  }

  async changePassword(newPassword: string) {
    try {
      if (!this.auth.currentUser)
        throw new FirebaseError('500', 'Could not load current user.');
      await AngularFireWrapper.updatePassword(
        this.auth.currentUser,
        newPassword,
      );

      return {
        isOk: true,
      };
    } catch (error) {
      return {
        isOk: false,
        message: `Failed to change password. ${
          (error as FirebaseError).message
        }`,
      };
    }
  }

  async sendPasswordReset(email: string) {
    try {
      await AngularFireWrapper.sendPasswordResetEmail(this.auth, email);

      return {
        isOk: true,
      };
    } catch (error) {
      return {
        isOk: false,
        message: `Failed to reset password. ${
          (error as FirebaseError).message
        }`,
      };
    }
  }

  async confirmPasswordReset(oobCode: string, password: string) {
    try {
      await AngularFireWrapper.confirmPasswordReset(
        this.auth,
        oobCode,
        password,
      );

      return {
        isOk: true,
      };
    } catch (error) {
      return {
        isOk: false,
        message: `Failed to change password. ${
          (error as FirebaseError).message
        }`,
      };
    }
  }

  async logOut(): Promise<void> {
    await AngularFireWrapper.signOut(this.auth);
    localStorage.removeItem('user');
    this.router.navigate(['/login-form']);
  }

  async getToken(): Promise<string> {
    return this.userData ? this.userData.getIdToken() : '';
  }
}
