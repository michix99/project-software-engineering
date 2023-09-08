import { ComponentFixture, TestBed } from '@angular/core/testing';
import { LoginFormComponent, LoginFormModule } from './login-form.component';
import { AuthenticationServiceMock } from '../../../test/authentication-service.mock';
import { AuthenticationService } from '../../services';
import { RouterTestingModule } from '@angular/router/testing';

describe('LoginFormComponent ', () => {
  let component: LoginFormComponent;
  let fixture: ComponentFixture<LoginFormComponent>;
  let authService: AuthenticationServiceMock;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [RouterTestingModule, LoginFormModule],
      providers: [
        { provide: AuthenticationService, useClass: AuthenticationServiceMock },
      ],
      declarations: [LoginFormComponent],
    });

    fixture = TestBed.createComponent(LoginFormComponent);
    component = fixture.componentInstance;
    authService = TestBed.inject(
      AuthenticationService,
    ) as AuthenticationServiceMock;
  });

  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  it('onSubmit should login the user', async () => {
    const loginSpy = spyOn(authService, 'logIn').and.callThrough();
    await component.onSubmit(new SubmitEvent('submit'));

    expect(component.loading).toBeFalse();
    expect(loginSpy).toHaveBeenCalled();
  });

  it('onSubmit should notify on failed login', async () => {
    const loginSpy = spyOn(authService, 'logIn').and.callThrough();
    authService.requestSuccess = false;
    await component.onSubmit(new SubmitEvent('submit'));

    expect(component.loading).toBeFalse();
    expect(loginSpy).toHaveBeenCalled();
  });
});
