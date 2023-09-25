import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import {
  AngularFireWrapper,
  AuthenticationService,
} from './authentication.service';
import { RouterTestingModule } from '@angular/router/testing';
import { Router } from '@angular/router';
import { LoggingService } from './logging.service';
import { LoggingServiceMock } from '../../test/logging.service.mock';
import { Auth, AuthErrorCodes, User } from '@angular/fire/auth';
import { BehaviorSubject } from 'rxjs';
import { FirebaseError } from '@angular/fire/app';
import { Role } from '../models';

describe('AuthenticationService', () => {
  let service: AuthenticationService;
  let router: Router;
  let logger: LoggingService;

  const mockUser = {
    displayName: 'displayName',
    email: 'some@email.com',
    uid: '123456',
  } as User;

  const auth = {
    get currentUser() {
      return mockUser;
    },
  };
  let authState = new BehaviorSubject<User | null>(null);

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [RouterTestingModule],
      providers: [
        AuthenticationService,
        { provide: LoggingService, useClass: LoggingServiceMock },
        { provide: Auth, useValue: auth },
      ],
    });

    spyOn(AngularFireWrapper, 'authState').and.returnValue(authState);
    service = TestBed.inject(AuthenticationService);
    logger = TestBed.inject(LoggingService);
    router = TestBed.inject(Router);
  });

  afterEach(() => {
    authState = new BehaviorSubject<User | null>(null);
  });

  it('should create', () => {
    expect(service).toBeTruthy();
    expect(localStorage.getItem('user')).toBe('null');
  });

  it('logIn should successfully log in the user', async () => {
    spyOn(AngularFireWrapper, 'signInWithEmailAndPassword').and.resolveTo();
    const user = { email: 'test@user.de' } as User;
    (service as unknown as { userData: User }).userData = user;
    const result = await service.logIn('test@user.de', 'password');
    expect(result.isOk).toBeTrue();
    expect(result.data).toBe(user);
  });

  it('logIn should return the error if the log in was failing with invalid password', async () => {
    spyOn(AngularFireWrapper, 'signInWithEmailAndPassword').and.rejectWith(
      new FirebaseError(AuthErrorCodes.INVALID_PASSWORD, 'Invalid Password'),
    );
    const result = await service.logIn('test@user.de', 'password');
    expect(result.isOk).toBeFalse();
    expect(result.message).toBe(
      'Failed to authenticate user. Password was incorrect.',
    );
  });

  it('logIn should return the error if the log in was failing with an error', async () => {
    spyOn(AngularFireWrapper, 'signInWithEmailAndPassword').and.rejectWith(
      new FirebaseError(AuthErrorCodes.INVALID_EMAIL, 'Invalid Email'),
    );
    const result = await service.logIn('test@user.de', 'password');
    expect(result.isOk).toBeFalse();
    expect(result.message).toBe('Failed to authenticate user. Invalid Email');
  });

  it('reauthenticateUser should successfully re-log in the user', async () => {
    spyOn(AngularFireWrapper, 'reauthenticateWithCredential').and.resolveTo();
    const result = await service.reauthenticateUser('password');
    expect(result.isOk).toBeTrue();
  });

  it('reauthenticateUser should fail if no email is provided', async () => {
    spyOnProperty(auth, 'currentUser', 'get').and.returnValue({} as User);
    spyOn(AngularFireWrapper, 'reauthenticateWithCredential').and.resolveTo();
    const result = await service.reauthenticateUser('password');
    expect(result.isOk).toBeFalse();
    expect(result.message).toBe(
      'Failed to reauthenticate user. Could not load current user.',
    );
  });

  it('reauthenticateUser should return the error if the log in was failing with an error', async () => {
    spyOn(AngularFireWrapper, 'reauthenticateWithCredential').and.rejectWith(
      new FirebaseError(AuthErrorCodes.INVALID_PASSWORD, 'Invalid Password'),
    );
    const result = await service.reauthenticateUser('password');
    expect(result.isOk).toBeFalse();
    expect(result.message).toBe(
      'Failed to reauthenticate user. Password was incorrect.',
    );
  });

  it('changePassword should successfully change the password of a user', async () => {
    spyOn(AngularFireWrapper, 'updatePassword').and.resolveTo();
    const result = await service.changePassword('new password');
    expect(result.isOk).toBeTrue();
  });

  it('changePassword should return the error if the password change was failing with an error', async () => {
    spyOnProperty(auth, 'currentUser', 'get').and.returnValue(
      undefined as unknown as User,
    );
    spyOn(AngularFireWrapper, 'updatePassword').and.rejectWith(
      new FirebaseError(AuthErrorCodes.INVALID_EMAIL, 'Invalid Email'),
    );
    const result = await service.changePassword('new password');
    expect(result.isOk).toBeFalse();
    expect(result.message).toBe(
      'Failed to change password. Could not load current user.',
    );
  });

  it('sendPasswordReset should successfully trigger a password reset', async () => {
    spyOn(AngularFireWrapper, 'sendPasswordResetEmail').and.resolveTo();
    const result = await service.sendPasswordReset('email');
    expect(result.isOk).toBeTrue();
  });

  it('sendPasswordReset should return the error if the password reset was failing with an error', async () => {
    spyOn(AngularFireWrapper, 'sendPasswordResetEmail').and.rejectWith(
      new FirebaseError(AuthErrorCodes.INVALID_EMAIL, 'Invalid Email'),
    );
    const result = await service.sendPasswordReset('email');
    expect(result.isOk).toBeFalse();
    expect(result.message).toBe('Failed to reset password. Invalid Email');
  });

  it('confirmPasswordReset should successfully confirm a password reset', async () => {
    spyOn(AngularFireWrapper, 'confirmPasswordReset').and.resolveTo();
    const result = await service.confirmPasswordReset('oobCode', 'password');
    expect(result.isOk).toBeTrue();
  });

  it('confirmPasswordReset should return the error if the confirm of a password reset was failing', async () => {
    spyOn(AngularFireWrapper, 'confirmPasswordReset').and.rejectWith(
      new FirebaseError(AuthErrorCodes.INVALID_EMAIL, 'Invalid Email'),
    );
    const result = await service.confirmPasswordReset('oobCode', 'password');
    expect(result.isOk).toBeFalse();
    expect(result.message).toBe('Failed to change password. Invalid Email');
  });

  it('logOut should log out the user', async () => {
    const navigateSpy = spyOn(router, 'navigate');
    spyOn(AngularFireWrapper, 'signOut').and.resolveTo();
    await service.logOut();
    expect(navigateSpy).toHaveBeenCalled();
    expect(localStorage.getItem('user')).toBeNull();
  });

  it('getToken should load an id token', async () => {
    const user = {
      displayName: 'displayName',
      email: 'some@email.com',
      uid: '123456',
      getIdToken: async () => {
        return Promise.resolve('test token');
      },
    } as unknown as User;

    (service as unknown as { userData: User }).userData = user;
    const token = await service.getToken();
    expect(token).toBe('test token');
  });

  it('getToken should return an empty token if user data is not defined', async () => {
    (service as unknown as { userData: User | undefined }).userData = undefined;
    const token = await service.getToken();
    expect(token).toBe('');
  });

  it('should set the user if the authState changed (admin)', fakeAsync(() => {
    const navigateSpy = spyOn(router, 'navigate');
    const updateRole = spyOn(service, 'updateRole');
    const user = {
      getIdTokenResult: async () => {
        return Promise.resolve({ claims: { admin: true } });
      },
    } as unknown as User;
    authState.next(user);
    tick();
    expect(updateRole).toHaveBeenCalledWith(Role.Admin);
    expect(navigateSpy).toHaveBeenCalled();
    expect(localStorage.getItem('user')).not.toBeNull();
  }));

  it('should set the user if the authState changed (editor)', fakeAsync(() => {
    const navigateSpy = spyOn(router, 'navigate');
    const updateRole = spyOn(service, 'updateRole');
    const user = {
      getIdTokenResult: async () => {
        return Promise.resolve({ claims: { editor: true } });
      },
    } as unknown as User;
    authState.next(user);
    tick();
    expect(updateRole).toHaveBeenCalledWith(Role.Editor);
    expect(navigateSpy).toHaveBeenCalled();
    expect(localStorage.getItem('user')).not.toBeNull();
  }));

  it('should set the user if the authState changed (requester)', fakeAsync(() => {
    const navigateSpy = spyOn(router, 'navigate');
    const updateRole = spyOn(service, 'updateRole');
    const user = {
      getIdTokenResult: async () => {
        return Promise.resolve({ claims: { requester: true } });
      },
    } as unknown as User;
    authState.next(user);
    tick();
    expect(updateRole).toHaveBeenCalledWith(Role.Requester);
    expect(navigateSpy).toHaveBeenCalled();
    expect(localStorage.getItem('user')).not.toBeNull();
  }));

  it('should log an error if the id token could not be loaded', fakeAsync(() => {
    const navigateSpy = spyOn(router, 'navigate');
    const updateRole = spyOn(service, 'updateRole');
    const user = {
      getIdTokenResult: async () => {
        return Promise.reject('Error');
      },
    } as unknown as User;
    authState.next(user);
    tick();
    expect(updateRole).not.toHaveBeenCalled();
    expect(navigateSpy).toHaveBeenCalled();
    expect(localStorage.getItem('user')).not.toBeNull();
    expect(logger.error).toHaveBeenCalled();
  }));

  it('loggedIn should indicate if the user is logged in', () => {
    localStorage.removeItem('user');
    expect(service.loggedIn).toBeFalse();
    const user = {
      displayName: 'displayName',
      email: 'some@email.com',
      uid: '123456',
    } as unknown as User;
    localStorage.setItem('user', JSON.stringify(user));
    expect(service.loggedIn).toBeTrue();
  });

  it('lastAuthenticatedPath should set a given path', () => {
    service.lastAuthenticatedPath = 'test';
    expect(
      (service as unknown as { _lastAuthenticatedPath: string })
        ._lastAuthenticatedPath,
    ).toBe('test');
  });

  it('currentRole should return the current role', () => {
    (service as unknown as { _currentRole: Role })._currentRole = Role.Editor;
    expect(service.currentRole).toBe(Role.Editor);
  });
});

describe('AuthenticationService (without auth)', () => {
  let service: AuthenticationService;
  let authStateSpy: jasmine.Spy;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [RouterTestingModule],
      providers: [
        AuthenticationService,
        { provide: LoggingService, useClass: LoggingServiceMock },
        { provide: Auth, useValue: undefined },
      ],
    });

    authStateSpy = spyOn(AngularFireWrapper, 'authState');
    service = TestBed.inject(AuthenticationService);
  });

  it('should not fail if auth is not provided', () => {
    expect(service).toBeTruthy();
    expect(authStateSpy).not.toHaveBeenCalled();
  });
});
