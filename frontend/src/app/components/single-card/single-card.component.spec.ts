import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SingleCardComponent, SingleCardModule } from './single-card.component';

describe('SingleCardComponent ', () => {
  let component: SingleCardComponent;
  let fixture: ComponentFixture<SingleCardComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [SingleCardModule],
      providers: [],
      declarations: [SingleCardComponent],
    });

    fixture = TestBed.createComponent(SingleCardComponent);
    component = fixture.componentInstance;
  });

  it('should create the app', () => {
    expect(component).toBeTruthy();
  });
});
