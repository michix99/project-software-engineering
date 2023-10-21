import {
  ComponentFixture,
  TestBed,
  fakeAsync,
  inject,
  tick,
} from '@angular/core/testing';
import {
  CourseEditorComponent,
  CourseEditorModule,
} from './course-editor.component';
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
import { User } from '@angular/fire/auth';
import { Course } from '../../models';

describe('CourseEditorComponent', () => {
  let component: CourseEditorComponent;
  let fixture: ComponentFixture<CourseEditorComponent>;
  let notificationService: MatSnackBar;
  let dataService: DataService;
  let authService: AuthenticationServiceMock;
  let activatedRoute: ActivatedRouteMock;
  let logger: LoggingService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [CourseEditorComponent],
      providers: [
        { provide: AuthenticationService, useClass: AuthenticationServiceMock },
        { provide: LoggingService, useClass: LoggingServiceMock },
        { provide: ActivatedRoute, useClass: ActivatedRouteMock },
        DataService,
      ],
      imports: [RouterTestingModule, CourseEditorModule],
    });
    fixture = TestBed.createComponent(CourseEditorComponent);
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
    expect(component.course).toBeDefined();
    expect(component.isCreating).toBeTrue();
  });

  it('should load an existing course, if an id was provided', fakeAsync(() => {
    activatedRoute.snapshot = {
      paramMap: {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        get(_: string): string | null {
          return '123';
        },
      } as ParamMap,
    } as ActivatedRouteSnapshot;
    const getCourseSpy = spyOn(dataService, 'get').and.resolveTo({
      id: '12345',
      course_abbreviation: 'ISEF01',
      name: 'Projekt Software Engineering',
      created_at: new Date(2020, 7, 14).toString(),
      modified_at: new Date(2022, 9, 3).toString(),
      created_by_name: 'dummy',
      modified_by_name: 'author',
    });

    authService.authState.next({ email: 'test@user.de' } as User);
    fixture.detectChanges();
    tick();
    expect(getCourseSpy).toHaveBeenCalled();
    expect(component.course).toEqual({
      id: '12345',
      courseAbbreviation: 'ISEF01',
      name: 'Projekt Software Engineering',
      createdAt: new Date(2020, 7, 14),
      createdBy: 'dummy',
      modifiedAt: new Date(2022, 9, 3),
      modifiedBy: 'author',
    });
  }));

  it('should reload the course, if the id changed', fakeAsync(() => {
    authService.authState.next({ email: 'test@user.de' } as User);
    fixture.detectChanges();
    const loadSpy = spyOn(component, 'loadCourse');
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

  it('resetCourse should set the course to default values', () => {
    component.course = {
      id: '12345',
      courseAbbreviation: 'ISEF01',
      name: 'Projekt Software Engineering',
      createdAt: new Date(2020, 7, 14),
      createdBy: 'dummy',
      modifiedAt: new Date(2022, 9, 3),
      modifiedBy: 'author',
    };
    component.resetCourse();
    expect(component.course).toEqual({
      id: '',
      courseAbbreviation: '',
      name: '',
      createdAt: new Date(),
      createdBy: '',
      modifiedAt: new Date(),
      modifiedBy: '',
    });
  });

  it('loadCourse should not load anything, if no id was set', () => {
    const getCourseSpy = spyOn(dataService, 'get');
    component.id = undefined;
    component.loadCourse();
    expect(getCourseSpy).not.toHaveBeenCalled();
  });

  it('loadCourse should load a course for given id', fakeAsync(() => {
    const getCourseSpy = spyOn(dataService, 'get').and.resolveTo({
      id: '12345',
      course_abbreviation: 'ISEF01',
      name: 'Projekt Software Engineering',
      created_at: new Date(2020, 7, 14).toString(),
      modified_at: new Date(2022, 9, 3).toString(),
      created_by_name: 'dummy',
      modified_by_name: 'author',
    });

    component.id = '12345';
    component.loadCourse();
    tick();

    expect(getCourseSpy).toHaveBeenCalled();
    expect(component.course).toEqual({
      id: '12345',
      courseAbbreviation: 'ISEF01',
      name: 'Projekt Software Engineering',
      createdAt: new Date(2020, 7, 14),
      createdBy: 'dummy',
      modifiedAt: new Date(2022, 9, 3),
      modifiedBy: 'author',
    });
  }));

  it('loadCourse should notify and navigate back, if the course could not be loaded', fakeAsync(
    inject([Router], (router: Router) => {
      const navigateSpy = spyOn(router, 'navigate');
      const notifySpy = spyOn(notificationService, 'open');
      const getCourseSpy = spyOn(dataService, 'get').and.rejectWith(
        new Error('Error'),
      );

      component.id = '123';
      component.loadCourse();
      tick();

      expect(getCourseSpy).toHaveBeenCalled();
      expect(notifySpy).toHaveBeenCalled();
      expect(navigateSpy).toHaveBeenCalledWith(['/course']);
    }),
  ));

  it('title should return if the editor is in create or update mode', () => {
    component.id = '123';
    expect(component.title).toBe('Update Course');
    component.id = undefined;
    expect(component.title).toBe('Create New Course');
  });

  it('onSubmit should create a new course with the given data and notify about the success', inject(
    [Router],
    async (router: Router) => {
      const navigateSpy = spyOn(router, 'navigate');
      const notifySpy = spyOn(notificationService, 'open');
      const createCourseSpy = spyOn(dataService, 'create').and.resolveTo({
        id: '123',
      });

      component.id = undefined;
      await component.onSubmit(new SubmitEvent('submit'));

      expect(createCourseSpy).toHaveBeenCalled();
      expect(notifySpy).toHaveBeenCalled();
      expect(navigateSpy).toHaveBeenCalledWith(['/course/123']);
    },
  ));

  it('onSubmit should update a given course with the modified data and notify about the success', inject(
    [Router],
    async (router: Router) => {
      const navigateSpy = spyOn(router, 'navigate');
      const notifySpy = spyOn(notificationService, 'open');
      const updateCourseSpy = spyOn(dataService, 'update').and.resolveTo({
        id: '123',
      });

      component.id = '123';
      await component.onSubmit(new SubmitEvent('submit'));

      expect(updateCourseSpy).toHaveBeenCalled();
      expect(notifySpy).toHaveBeenCalled();
      expect(navigateSpy).toHaveBeenCalledWith(['/course/123']);
    },
  ));

  it('onSubmit should notify if creating a new course fails', inject(
    [Router],
    async (router: Router) => {
      const navigateSpy = spyOn(router, 'navigate');
      const notifySpy = spyOn(notificationService, 'open');
      const createCourseSpy = spyOn(dataService, 'create').and.rejectWith(
        new Error('Error'),
      );

      component.id = undefined;
      await component.onSubmit(new SubmitEvent('submit'));

      expect(createCourseSpy).toHaveBeenCalled();
      expect(notifySpy).toHaveBeenCalled();
      expect(navigateSpy).not.toHaveBeenCalled();
      expect(logger.error).toHaveBeenCalled();
    },
  ));

  it('onSubmit should notify if updating an existing course fails', inject(
    [Router],
    async (router: Router) => {
      const navigateSpy = spyOn(router, 'navigate');
      const notifySpy = spyOn(notificationService, 'open');
      const updateCourseSpy = spyOn(dataService, 'update').and.rejectWith(
        new Error('Error'),
      );

      component.id = '123';
      await component.onSubmit(new SubmitEvent('submit'));

      expect(updateCourseSpy).toHaveBeenCalled();
      expect(notifySpy).toHaveBeenCalled();
      expect(navigateSpy).not.toHaveBeenCalled();
      expect(logger.error).toHaveBeenCalled();
    },
  ));

  it('onSubmit should not create, if the course is not defined', async () => {
    const updateCourseSpy = spyOn(dataService, 'update');

    component.course = undefined as unknown as Course;
    component.id = '123';
    await component.onSubmit(new SubmitEvent('submit'));

    expect(updateCourseSpy).not.toHaveBeenCalled();
  });

  it('navigateBack should navigte to the course table view', inject(
    [Router],
    (router: Router) => {
      const navigateSpy = spyOn(router, 'navigate');
      component.navigateBack();
      expect(navigateSpy).toHaveBeenCalledWith(['/course']);
    },
  ));
});
