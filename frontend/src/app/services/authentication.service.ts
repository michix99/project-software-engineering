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
import { BehaviorSubject } from 'rxjs';
import { Role } from '../models';
import { LoggingService } from './logging.service';

const defaultPath = '/home';

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
    return user !== null;
  }

  private _currentRole: Role | null = null;
  get currentRole(): Role | null {
    return this._currentRole;
  }

  private _lastAuthenticatedPath: string = defaultPath;
  set lastAuthenticatedPath(value: string) {
    this._lastAuthenticatedPath = value;
  }

  authState: BehaviorSubject<User | null> = new BehaviorSubject<User | null>(
    null,
  );

  roleState: BehaviorSubject<Role | null> = new BehaviorSubject<Role | null>(
    null,
  );

  constructor(
    private router: Router,
    private logger: LoggingService,
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
        user
          .getIdTokenResult()
          .then((idTokenResult) => {
            // Confirm the user is an Admin.
            if (idTokenResult.claims['admin']) {
              this.updateRole(Role.Admin);
              return;
            } else if (idTokenResult.claims['editor']) {
              this.updateRole(Role.Editor);
              return;
            }
            this.updateRole(Role.Requester);
          })
          .catch((error) => {
            logger.error(error);
          });
        localStorage.setItem('user', JSON.stringify(this.userData));
        this.router.navigate([this._lastAuthenticatedPath]);
      } else {
        this.authState.next(null);
        this.updateRole(null);
        localStorage.setItem('user', 'null');
      }
    });
  }

  updateRole(role: Role | null) {
    this._currentRole = role;
    this.roleState.next(role);
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
