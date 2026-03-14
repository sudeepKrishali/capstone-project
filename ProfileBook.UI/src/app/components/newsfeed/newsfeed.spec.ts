import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Newsfeed } from './newsfeed';

describe('Newsfeed', () => {
  let component: Newsfeed;
  let fixture: ComponentFixture<Newsfeed>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [Newsfeed],
    }).compileComponents();

    fixture = TestBed.createComponent(Newsfeed);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
