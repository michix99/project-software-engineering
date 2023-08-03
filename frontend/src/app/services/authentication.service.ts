import { Injectable, Optional } from '@angular/core';
import {
  Auth,
  User,
  authState,
  signInWithEmailAndPassword,
  signOut,
} from '@angular/fire/auth';
import { Router } from '@angular/router';

const defaultPath = '/';

@Injectable()
export class AuthenticationService {
  private userData: User | null = null;
  get loggedIn(): boolean {
    const user = JSON.parse(localStorage.getItem('user') ?? 'null');
    return (
      user !== null && (user.emailVerified || user.email === 'test@user.de')
    );
    // return !!this._user;
  }

  private _lastAuthenticatedPath: string = defaultPath;
  set lastAuthenticatedPath(value: string) {
    this._lastAuthenticatedPath = value;
  }

  constructor(
    private router: Router,
    @Optional() private auth: Auth, // Inject Firebase auth service
  ) {
    if (!auth) {
      return;
    }

    /* Saving user data in localstorage when 
    logged in and setting up null when logged out */
    authState(this.auth).subscribe((user: User | null) => {
      if (user) {
        this.userData = user;
        localStorage.setItem('user', JSON.stringify(this.userData));
        this.router.navigate([this._lastAuthenticatedPath]);
      } else {
        localStorage.setItem('user', 'null');
      }
    });
  }

  async logIn(
    email: string,
    password: string,
  ): Promise<{ isOk: boolean; data?: User | null; message?: string }> {
    try {
      await signInWithEmailAndPassword(this.auth, email, password);

      return {
        isOk: true,
        data: this.userData,
      };
    } catch {
      return {
        isOk: false,
        message: 'Authentication failed',
      };
    }
  }

  async getUser() {
    try {
      if (!this.userData) {
        this.userData = JSON.parse(localStorage.getItem('user') ?? 'null');
      }

      return {
        isOk: true,
        data: this.userData,
      };
    } catch {
      return {
        isOk: false,
        data: null,
      };
    }
  }

  // async createAccount(email: string, password: string) {
  //   try {
  //     // Send request

  //     this.router.navigate(['/create-account']);
  //     return {
  //       isOk: true,
  //     };
  //   } catch {
  //     return {
  //       isOk: false,
  //       message: 'Failed to create account',
  //     };
  //   }
  // }

  // async changePassword(email: string, recoveryCode: string) {
  //   try {
  //     // Send request

  //     return {
  //       isOk: true,
  //     };
  //   } catch {
  //     return {
  //       isOk: false,
  //       message: 'Failed to change password',
  //     };
  //   }
  // }

  // async resetPassword(email: string) {
  //   try {
  //     // Send request

  //     return {
  //       isOk: true,
  //     };
  //   } catch {
  //     return {
  //       isOk: false,
  //       message: 'Failed to reset password',
  //     };
  //   }
  // }

  async logOut(): Promise<void> {
    await signOut(this.auth);
    localStorage.removeItem('user');
    this.router.navigate(['/login-form']);
  }

  async getToken(): Promise<string> {
    return this.userData ? this.userData.getIdToken() : '';
  }
}
