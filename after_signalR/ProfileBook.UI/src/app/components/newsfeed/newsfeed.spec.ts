import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NewsfeedComponent } from './newsfeed';

describe('Newsfeed', () => {
  let component: NewsfeedComponent;
  let fixture: ComponentFixture<NewsfeedComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [NewsfeedComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(NewsfeedComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
