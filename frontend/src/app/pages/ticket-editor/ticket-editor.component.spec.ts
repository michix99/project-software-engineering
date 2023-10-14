import {
  ComponentFixture,
  TestBed,
  fakeAsync,
  inject,
  tick,
} from '@angular/core/testing';
import {
  TicketEditorComponent,
  TicketEditorModule,
} from './ticket-editor.component';
import {
  AuthenticationService,
  DataService,
  LoggingService,
} from '../../services';
import { AuthenticationServiceMock } from '../../../test/authentication-service.mock';
import { LoggingServiceMock } from '../../../test/logging.service.mock';
import { MatSnackBar } from '@angular/material/snack-bar';
import { RouterTestingModule } from '@angular/router/testing';
import {
  ActivatedRoute,
  ActivatedRouteSnapshot,
  ParamMap,
  Router,
} from '@angular/router';
import { BehaviorSubject } from 'rxjs';
import { User } from '@angular/fire/auth';
import {
  Course,
  Role,
  User as ModelUser,
  Status,
  Priority,
  Ticket,
} from '../../models';

export class ActivatedRouteMock {
  paramMapSubject = new BehaviorSubject<ParamMap | null>({
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    get(_: string): string | null {
      return null;
    },
  } as ParamMap);
  paramMap = this.paramMapSubject;

  snapshot: ActivatedRouteSnapshot = {
    paramMap: {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      get(_: string): string | null {
        return null;
      },
    } as ParamMap,
  } as ActivatedRouteSnapshot;
}

describe('TicketEditorComponent', () => {
  let component: TicketEditorComponent;
  let fixture: ComponentFixture<TicketEditorComponent>;
  let notificationService: MatSnackBar;
  let dataService: DataService;
  let authService: AuthenticationServiceMock;
  let activatedRoute: ActivatedRouteMock;
  let logger: LoggingService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [TicketEditorComponent],
      providers: [
        { provide: AuthenticationService, useClass: AuthenticationServiceMock },
        { provide: LoggingService, useClass: LoggingServiceMock },
        { provide: ActivatedRoute, useClass: ActivatedRouteMock },
        DataService,
      ],
      imports: [RouterTestingModule, TicketEditorModule],
    });
    fixture = TestBed.createComponent(TicketEditorComponent);
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
    expect(component.ticket).toBeDefined();
    expect(component.isCreating).toBeTrue();
  });

  it('should load an existing ticket, if an id was provided', fakeAsync(() => {
    activatedRoute.snapshot = {
      paramMap: {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        get(_: string): string | null {
          return '123';
        },
      } as ParamMap,
    } as ActivatedRouteSnapshot;
    const getTicketSpy = spyOn(dataService, 'get').and.resolveTo({
      id: '12345',
      description: 'Description of the error.',
      title: 'Error in Course',
      course_id: '456',
      course_abbreviation: 'ISEF01',
      course_name: 'Projekt Software Engineering',
      status: 'DONE',
      priority: 'HIGH',
      assignee_id: '987',
      assignee_name: 'Assigne',
      created_at: new Date(2020, 7, 14).toString(),
      modified_at: new Date(2022, 9, 3).toString(),
      created_by_name: 'dummy',
      modified_by_name: 'author',
      type: 'ERROR',
    });
    const getAllCoursesSpy = spyOn(dataService, 'getAll').and.resolveTo([
      {
        id: '12345',
        course_abbreviation: 'ISEF01',
        name: 'Projekt Software Engineering',
        created_at: new Date(2020, 7, 14).toString(),
        modified_at: new Date(2022, 9, 3).toString(),
        created_by_name: 'dummy',
        modified_by_name: 'author',
      },
    ]);
    authService.authState.next({ email: 'test@user.de' } as User);
    fixture.detectChanges();
    tick();
    expect(getTicketSpy).toHaveBeenCalled();
    expect(getAllCoursesSpy).toHaveBeenCalled();
    expect(component.ticket).toEqual({
      id: '12345',
      description: 'Description of the error.',
      title: 'Error in Course',
      courseId: '456',
      courseAbbreviation: 'ISEF01',
      courseName: 'Projekt Software Engineering',
      status: 'DONE',
      priority: 'HIGH',
      assigneeId: '987',
      assigneeName: 'Assigne',
      createdAt: new Date(2020, 7, 14),
      modifiedAt: new Date(2022, 9, 3),
      createdBy: 'dummy',
      modifiedBy: 'author',
      type: 'ERROR',
    });
    expect(component.courses).toEqual([
      {
        id: '12345',
        courseAbbreviation: 'ISEF01',
        name: 'Projekt Software Engineering',
        createdAt: new Date(2020, 7, 14),
        modifiedAt: new Date(2022, 9, 3),
        createdBy: 'dummy',
        modifiedBy: 'author',
      },
    ]);
  }));

  it('should notify if the courses could not be loaded', fakeAsync(() => {
    const getAllCoursesSpy = spyOn(dataService, 'getAll').and.rejectWith(
      new Error('Error'),
    );
    const notifySpy = spyOn(notificationService, 'open');
    authService.authState.next({ email: 'test@user.de' } as User);
    fixture.detectChanges();
    tick();
    expect(notifySpy).toHaveBeenCalled();
    expect(getAllCoursesSpy).toHaveBeenCalled();
    expect(component.courses.length).toBe(0);
  }));

  it('should reload the ticket, if the id changed', fakeAsync(() => {
    authService.authState.next({ email: 'test@user.de' } as User);
    fixture.detectChanges();
    const loadSpy = spyOn(component, 'loadTicket');
    activatedRoute.paramMapSubject.next({
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      get(_: string): string | null {
        return '123';
      },
    } as ParamMap);
    tick();
    expect(loadSpy).toHaveBeenCalled();
    expect(component.id).toBe('123');
  }));

  it('should load the editors, if the user has the permissions to load them', fakeAsync(() => {
    const getAllUsersSpy = spyOn(dataService, 'getAll').and.resolveTo([
      {
        id: '12345',
        email: 'dummy@test.de',
        display_name: 'Dummy User',
        disabled: false,
        admin: false,
        editor: true,
        requester: true,
      },
    ]);
    authService.roleState.next(Role.Admin);
    fixture.detectChanges();
    tick();
    expect(getAllUsersSpy).toHaveBeenCalled();
    expect(component.editors).toEqual([
      {
        id: '12345',
        email: 'dummy@test.de',
        displayName: 'Dummy User',
        disabled: false,
        admin: false,
        editor: true,
        requester: true,
      },
    ]);
    expect(component.isAdminOrEditor).toBeTrue();
  }));

  it('should notify if the users could not be loaded', fakeAsync(() => {
    const getAllUsersSpy = spyOn(dataService, 'getAll').and.rejectWith(
      new Error('Error'),
    );
    const notifySpy = spyOn(notificationService, 'open');
    authService.roleState.next(Role.Editor);
    fixture.detectChanges();
    tick();
    expect(getAllUsersSpy).toHaveBeenCalled();
    expect(notifySpy).toHaveBeenCalled();
    expect(component.editors.length).toBe(0);
    expect(component.isAdminOrEditor).toBeTrue();
  }));

  it('should not load the editors, if the user does not have the permissions to load them', fakeAsync(() => {
    const getAllUsersSpy = spyOn(dataService, 'getAll');
    authService.roleState.next(Role.Requester);
    fixture.detectChanges();
    tick();
    expect(getAllUsersSpy).not.toHaveBeenCalled();
    expect(component.editors.length).toBe(0);
    expect(component.isAdminOrEditor).toBeFalse();
  }));

  it('getCourseDisplay should return a string presentation of a course', () => {
    expect(
      component.getCourseDisplay({
        id: '12345',
        courseAbbreviation: 'ISEF01',
        name: 'Projekt Software Engineering',
        createdAt: new Date(2020, 7, 14),
        modifiedAt: new Date(2022, 9, 3),
        createdBy: 'dummy',
        modifiedBy: 'author',
      }),
    ).toBe('ISEF01 - Projekt Software Engineering');
    expect(
      component.getCourseDisplay(undefined as unknown as Course),
    ).toBeUndefined();
  });

  it('getAssigneeDisplay should return a string presentation of a user', () => {
    expect(
      component.getAssigneeDisplay({
        id: '12345',
        email: 'dummy@test.de',
        displayName: 'Dummy User',
        disabled: false,
        admin: false,
        editor: true,
        requester: true,
      }),
    ).toBe('Dummy User - dummy@test.de');
    expect(
      component.getAssigneeDisplay({
        id: '12345',
        email: 'dummy@test.de',
        displayName: '',
        disabled: false,
        admin: false,
        editor: true,
        requester: true,
      }),
    ).toBe('dummy@test.de');
    expect(
      component.getAssigneeDisplay(undefined as unknown as ModelUser),
    ).toBeUndefined();
  });

  it('resetTicket should set the ticket to default values', () => {
    component.ticket = {
      id: '12345',
      description: 'Description of the error.',
      title: 'Error in Course',
      courseId: '456',
      courseAbbreviation: 'ISEF01',
      courseName: 'Projekt Software Engineering',
      status: 'DONE',
      priority: 'HIGH',
      assigneeId: '987',
      assigneeName: 'Assigne',
      createdAt: new Date(2020, 7, 14),
      modifiedAt: new Date(2022, 9, 3),
      createdBy: 'dummy',
      modifiedBy: 'author',
      type: 'ADDITION',
    };
    component.resetTicket();
    expect(component.ticket).toEqual({
      id: '',
      createdAt: new Date(),
      createdBy: '',
      modifiedAt: new Date(),
      modifiedBy: '',
      description: '',
      courseId: '',
      courseAbbreviation: '',
      courseName: '',
      title: '',
      status: Status.Open,
      priority: Priority.Undefined,
      assigneeId: '',
      assigneeName: '',
      type: 'UNDEFINED',
    });
  });

  it('loadTicket should not load anything, if no id was set', () => {
    const getTicketSpy = spyOn(dataService, 'get');
    component.id = undefined;
    component.loadTicket();
    expect(getTicketSpy).not.toHaveBeenCalled();
  });

  it('loadTicket should load a ticket for given id', fakeAsync(() => {
    const getTicketSpy = spyOn(dataService, 'get').and.resolveTo({
      id: '12345',
      description: 'Description of the error.',
      title: 'Error in Course',
      course_id: '456',
      course_abbreviation: 'ISEF01',
      course_name: 'Projekt Software Engineering',
      status: 'DONE',
      priority: 'HIGH',
      assignee_id: '987',
      assignee_name: 'Assigne',
      created_at: new Date(2020, 7, 14).toString(),
      modified_at: new Date(2022, 9, 3).toString(),
      created_by_name: 'dummy',
      modified_by_name: 'author',
      type: 'IMPROVEMENTS',
    });

    component.id = '123';
    component.loadTicket();
    tick();

    expect(getTicketSpy).toHaveBeenCalled();
    expect(component.ticket).toEqual({
      id: '12345',
      description: 'Description of the error.',
      title: 'Error in Course',
      courseId: '456',
      courseAbbreviation: 'ISEF01',
      courseName: 'Projekt Software Engineering',
      status: 'DONE',
      priority: 'HIGH',
      assigneeId: '987',
      assigneeName: 'Assigne',
      createdAt: new Date(2020, 7, 14),
      modifiedAt: new Date(2022, 9, 3),
      createdBy: 'dummy',
      modifiedBy: 'author',
      type: 'IMPROVEMENTS',
    });
  }));

  it('loadTicket should notify and navigate back, if the ticket could not be loaded', fakeAsync(
    inject([Router], (router: Router) => {
      const navigateSpy = spyOn(router, 'navigate');
      const notifySpy = spyOn(notificationService, 'open');
      const getTicketSpy = spyOn(dataService, 'get').and.rejectWith(
        new Error('Error'),
      );

      component.id = '123';
      component.loadTicket();
      tick();

      expect(getTicketSpy).toHaveBeenCalled();
      expect(notifySpy).toHaveBeenCalled();
      expect(navigateSpy).toHaveBeenCalledWith(['/ticket']);
    }),
  ));

  it('title should return if the editor is in creat or update mode', () => {
    component.id = '123';
    expect(component.title).toBe('Update Ticket');
    component.id = undefined;
    expect(component.title).toBe('Create New Ticket');
  });

  it('onSubmit should create a new ticket with the given data and notify about the success', inject(
    [Router],
    async (router: Router) => {
      const navigateSpy = spyOn(router, 'navigate');
      const notifySpy = spyOn(notificationService, 'open');
      const createTicketSpy = spyOn(dataService, 'create').and.resolveTo({
        id: '123',
      });

      component.id = undefined;
      await component.onSubmit(new SubmitEvent('submit'));

      expect(createTicketSpy).toHaveBeenCalled();
      expect(notifySpy).toHaveBeenCalled();
      expect(navigateSpy).toHaveBeenCalledWith(['/ticket/123']);
    },
  ));

  it('onSubmit should update a given ticket with the modified data and notify about the success', inject(
    [Router],
    async (router: Router) => {
      const navigateSpy = spyOn(router, 'navigate');
      const notifySpy = spyOn(notificationService, 'open');
      const updateTicketSpy = spyOn(dataService, 'update').and.resolveTo({
        id: '123',
      });

      component.id = '123';
      await component.onSubmit(new SubmitEvent('submit'));

      expect(updateTicketSpy).toHaveBeenCalled();
      expect(notifySpy).toHaveBeenCalled();
      expect(navigateSpy).toHaveBeenCalledWith(['/ticket/123']);
    },
  ));

  it('onSubmit should notify if creating a new ticket fails', inject(
    [Router],
    async (router: Router) => {
      const navigateSpy = spyOn(router, 'navigate');
      const notifySpy = spyOn(notificationService, 'open');
      const createTicketSpy = spyOn(dataService, 'create').and.rejectWith(
        new Error('Error'),
      );

      component.id = undefined;
      await component.onSubmit(new SubmitEvent('submit'));

      expect(createTicketSpy).toHaveBeenCalled();
      expect(notifySpy).toHaveBeenCalled();
      expect(navigateSpy).not.toHaveBeenCalled();
      expect(logger.error).toHaveBeenCalled();
    },
  ));

  it('onSubmit should notify if updating an existing ticket fails', inject(
    [Router],
    async (router: Router) => {
      const navigateSpy = spyOn(router, 'navigate');
      const notifySpy = spyOn(notificationService, 'open');
      const updateTicketSpy = spyOn(dataService, 'update').and.rejectWith(
        new Error('Error'),
      );

      component.id = '123';
      await component.onSubmit(new SubmitEvent('submit'));

      expect(updateTicketSpy).toHaveBeenCalled();
      expect(notifySpy).toHaveBeenCalled();
      expect(navigateSpy).not.toHaveBeenCalled();
      expect(logger.error).toHaveBeenCalled();
    },
  ));

  it('onSubmit should not create, if the ticket is not defined', async () => {
    const updateTicketSpy = spyOn(dataService, 'update');

    component.ticket = undefined as unknown as Ticket;
    component.id = '123';
    await component.onSubmit(new SubmitEvent('submit'));

    expect(updateTicketSpy).not.toHaveBeenCalled();
  });
});
