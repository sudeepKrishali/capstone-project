import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AdminApproval } from './admin-approval';

describe('AdminApproval', () => {
  let component: AdminApproval;
  let fixture: ComponentFixture<AdminApproval>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [AdminApproval],
    }).compileComponents();

    fixture = TestBed.createComponent(AdminApproval);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
