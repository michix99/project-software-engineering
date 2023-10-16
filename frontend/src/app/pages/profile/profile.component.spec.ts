import {
  ComponentFixture,
  TestBed,
  fakeAsync,
  inject,
  tick,
} from '@angular/core/testing';
import {
  ActivatedRoute,
  ActivatedRouteSnapshot,
  ParamMap,
  Router,
} from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import {
  AuthenticationService,
  LoggingService,
  DataService,
} from '../../services';
import {
  ActivatedRouteMock,
  AuthenticationServiceMock,
  LoggingServiceMock,
} from '../../../test';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ProfileComponent, ProfileModule } from './profile.component';
import { User } from '@angular/fire/auth';
import { Role, User as UserModel } from '../../models';
import { ValueChangedEvent } from 'devextreme/ui/select_box';

describe('ProfileComponent', () => {
  let component: ProfileComponent;
  let fixture: ComponentFixture<ProfileComponent>;
  let notificationService: MatSnackBar;
  let dataService: DataService;
  let authService: AuthenticationServiceMock;
  let activatedRoute: ActivatedRouteMock;
  let logger: LoggingService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [ProfileComponent],
      providers: [
        { provide: AuthenticationService, useClass: AuthenticationServiceMock },
        { provide: LoggingService, useClass: LoggingServiceMock },
        { provide: ActivatedRoute, useClass: ActivatedRouteMock },
        DataService,
      ],
      imports: [RouterTestingModule, ProfileModule],
    });
    fixture = TestBed.createComponent(ProfileComponent);
    component = fixture.componentInstance;

    notificationService = TestBed.inject(MatSnackBar);
    dataService = TestBed.inject(DataService);
    authService = TestBed.inject(
      AuthenticationService,
    ) as AuthenticationServiceMock;
    activatedRoute = TestBed.inject(
      ActivatedRoute,
    ) as unknown as ActivatedRouteMock;
    logger = TestBed.inject(LoggingService);
  });

  it('should create', () => {
    fixture.detectChanges();
    expect(component).toBeTruthy();
    expect(component.user).toBeDefined();
    expect(component.isOwnProfile).toBeTrue();
  });

  it('should load a user for a specific id, if one was provided', fakeAsync(() => {
    activatedRoute.snapshot = {
      paramMap: {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        get(_: string): string | null {
          return '123';
        },
      } as ParamMap,
    } as ActivatedRouteSnapshot;
    const getUserSpy = spyOn(dataService, 'get').and.resolveTo({
      id: '12345',
      email: 'dummy@test.de',
      display_name: 'Dummy User',
      disabled: false,
      admin: false,
      editor: false,
      requester: true,
    });

    authService.authState.next({ email: 'test@user.de' } as User);
    fixture.detectChanges();
    tick();
    expect(getUserSpy).toHaveBeenCalled();
    expect(component.user).toEqual({
      id: '12345',
      email: 'dummy@test.de',
      displayName: 'Dummy User',
      disabled: false,
      role: Role.Requester,
    });
  }));

  it('should load own user, if no id was provided', fakeAsync(() => {
    const getUserSpy = spyOn(dataService, 'get').and.resolveTo({
      id: '6543',
      email: 'dummy@test.de',
      display_name: 'Dummy Editor',
      disabled: false,
      admin: false,
      editor: true,
      requester: false,
    });

    authService.authState.next({ email: 'test@user.de', uid: '6543' } as User);
    fixture.detectChanges();
    tick();
    expect(getUserSpy).toHaveBeenCalled();
    expect(component.user).toEqual({
      id: '6543',
      email: 'dummy@test.de',
      displayName: 'Dummy Editor',
      disabled: false,
      role: Role.Editor,
    });
  }));

  it('should reload the user, if the id changed', fakeAsync(() => {
    const loadSpy = spyOn(component, 'loadUser');
    authService.authState.next({
      email: 'test@user.de',
      uid: '6543',
    } as User);
    fixture.detectChanges();
    activatedRoute.paramMapSubject.next({
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      get(_: string): string | null {
        return '123';
      },
    } as ParamMap);
    tick();
    expect(loadSpy).toHaveBeenCalledTimes(2);
    expect(component.id).toBe('123');
  }));

  it('resetUser should set the user to default values', () => {
    component.user = {
      id: '6543',
      email: 'dummy@test.de',
      displayName: 'Dummy Editor',
      disabled: false,
      role: Role.Editor,
    };
    component.resetUser();
    expect(component.user).toEqual({
      id: '',
      email: '',
      displayName: '',
      disabled: false,
      role: Role.Requester,
    });
  });

  it('loadUser should not load anything, if no id was set', () => {
    const getUserSpy = spyOn(dataService, 'get');
    component.id = undefined;
    component.loadUser();
    expect(getUserSpy).not.toHaveBeenCalled();
  });

  it('loadUser should load a user for given id', fakeAsync(() => {
    const getUserSpy = spyOn(dataService, 'get').and.resolveTo({
      id: '5432',
      email: 'dummy@test.de',
      display_name: 'Dummy Admin',
      disabled: false,
      admin: true,
      editor: false,
      requester: false,
    });

    component.id = '12345';
    component.loadUser();
    tick();

    expect(getUserSpy).toHaveBeenCalled();
    expect(component.user).toEqual({
      id: '5432',
      email: 'dummy@test.de',
      displayName: 'Dummy Admin',
      disabled: false,
      role: Role.Admin,
    });
  }));

  it('loadUser should notify and navigate back to the table view, if a user could not be loaded', fakeAsync(
    inject([Router], (router: Router) => {
      const navigateSpy = spyOn(router, 'navigate');
      const notifySpy = spyOn(notificationService, 'open');
      const getUserSpy = spyOn(dataService, 'get').and.rejectWith(
        new Error('Error'),
      );

      component.id = '123';
      component.loadUser();
      tick();

      expect(getUserSpy).toHaveBeenCalled();
      expect(notifySpy).toHaveBeenCalled();
      expect(navigateSpy).toHaveBeenCalledWith(['/user']);
    }),
  ));

  it('loadUser should notify and navigate back to home, if the profile could not be loaded', fakeAsync(
    inject([Router], (router: Router) => {
      const navigateSpy = spyOn(router, 'navigate');
      const notifySpy = spyOn(notificationService, 'open');
      const getUserSpy = spyOn(dataService, 'get').and.rejectWith(
        new Error('Error'),
      );

      component.id = undefined;
      component.loadUser('123');
      tick();

      expect(getUserSpy).toHaveBeenCalled();
      expect(notifySpy).toHaveBeenCalled();
      expect(navigateSpy).toHaveBeenCalledWith(['/home']);
    }),
  ));

  it('title should return if the editor is showing the own profile, or a selected user', () => {
    component.id = '123';
    expect(component.title).toBe('Update User');
    component.id = undefined;
    expect(component.title).toBe('Profile');
  });

  it('onSubmit should update the own user with the modified data and notify about the success', inject(
    [Router],
    async (router: Router) => {
      const navigateSpy = spyOn(router, 'navigate');
      const notifySpy = spyOn(notificationService, 'open');
      const updateUserSpy = spyOn(dataService, 'update').and.resolveTo();

      component.id = undefined;
      await component.onSubmit(new SubmitEvent('submit'));

      expect(updateUserSpy).toHaveBeenCalled();
      expect(notifySpy).toHaveBeenCalled();
      expect(navigateSpy).toHaveBeenCalledWith(['/profile']);
    },
  ));

  it('onSubmit should also update the role if changed with given data', inject(
    [Router],
    async (router: Router) => {
      const navigateSpy = spyOn(router, 'navigate');
      const notifySpy = spyOn(notificationService, 'open');
      const updateUserSpy = spyOn(dataService, 'update').and.resolveTo();

      component.id = '123';
      component.roleHasChanged = true;
      await component.onSubmit(new SubmitEvent('submit'));

      expect(updateUserSpy).toHaveBeenCalledTimes(2);
      expect(updateUserSpy).toHaveBeenCalledWith(
        'api/updateUser',
        jasmine.anything(),
      );
      expect(updateUserSpy).toHaveBeenCalledWith(
        'api/setRole',
        jasmine.anything(),
      );
      expect(notifySpy).toHaveBeenCalled();
      expect(navigateSpy).toHaveBeenCalledWith(['/user/123']);
    },
  ));

  it('onSubmit should notify if updating an existing user fails', inject(
    [Router],
    async (router: Router) => {
      const navigateSpy = spyOn(router, 'navigate');
      const notifySpy = spyOn(notificationService, 'open');
      const updateUserSpy = spyOn(dataService, 'update').and.rejectWith(
        new Error('Error'),
      );

      component.id = '123';
      await component.onSubmit(new SubmitEvent('submit'));

      expect(updateUserSpy).toHaveBeenCalled();
      expect(notifySpy).toHaveBeenCalled();
      expect(navigateSpy).not.toHaveBeenCalled();
      expect(logger.error).toHaveBeenCalled();
    },
  ));

  it('onSubmit should not create, if the user is not defined', async () => {
    const updateUserSpy = spyOn(dataService, 'update');

    component.user = undefined as unknown as UserModel;
    component.id = '123';
    await component.onSubmit(new SubmitEvent('submit'));

    expect(updateUserSpy).not.toHaveBeenCalled();
  });

  it('navigateBack should navigte to the user table view', inject(
    [Router],
    (router: Router) => {
      const navigateSpy = spyOn(router, 'navigate');
      component.navigateBack();
      expect(navigateSpy).toHaveBeenCalledWith(['/user']);
    },
  ));

  it('onRoleChanged should indicate if the role has changed', () => {
    component.roleHasChanged = false;
    component.onRoleChanged({
      value: Role.Requester,
      previousValue: Role.Requester,
    } as ValueChangedEvent);
    expect(component.roleHasChanged).toBeFalse();

    component.onRoleChanged({
      value: Role.Requester,
      previousValue: Role.Editor,
    } as ValueChangedEvent);
    expect(component.roleHasChanged).toBeTrue();
  });
});
