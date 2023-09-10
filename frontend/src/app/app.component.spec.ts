import { TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { AppComponent } from './app.component';
import {
  AppInfoService,
  AuthenticationService,
  ScreenService,
} from './services';
import { AuthenticationServiceMock } from 'src/test/authentication-service.mock';
import { SideNavOuterToolbarModule } from './components';

describe('AppComponent', () => {
  beforeEach(() =>
    TestBed.configureTestingModule({
      imports: [RouterTestingModule, SideNavOuterToolbarModule],
      providers: [
        { provide: AuthenticationService, useClass: AuthenticationServiceMock },
        ScreenService,
        AppInfoService,
      ],
      declarations: [AppComponent],
    }),
  );

  it('should create the app', () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });
});
