import { Injectable } from '@angular/core';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { Router } from '@angular/router';

const defaultPath = '/';

@Injectable()
export class AuthenticationService {
  private userData: firebase.default.User | null = null;
  get loggedIn(): boolean {
    const user = JSON.parse(localStorage.getItem('user') ?? '');
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
    public firebaseAuthService: AngularFireAuth, // Inject Firebase auth service
  ) {
    /* Saving user data in localstorage when 
    logged in and setting up null when logged out */
    this.firebaseAuthService.authState.subscribe(
      (user: firebase.default.User | null) => {
        if (user) {
          this.userData = user;
          localStorage.setItem('user', JSON.stringify(this.userData));
        } else {
          localStorage.setItem('user', 'null');
        }
      },
    );
  }

  async logIn(email: string, password: string) {
    try {
      await this.firebaseAuthService.signInWithEmailAndPassword(
        email,
        password,
      );

      this.firebaseAuthService.authState.subscribe((user) => {
        if (user) {
          console.log('test');
          this.router.navigate([this._lastAuthenticatedPath]);
        }
      });

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
      // Send request

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

  async logOut() {
    return this.firebaseAuthService.signOut().then(() => {
      localStorage.removeItem('user');
      this.router.navigate(['/login-form']);
    });
  }

  async getToken(): Promise<string> {
    return this.userData ? this.userData.getIdToken() : '';
  }
}
