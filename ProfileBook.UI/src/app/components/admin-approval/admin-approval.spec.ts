import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AdminApprovalComponent } from './admin-approval';

describe('AdminApproval', () => {
  let component: AdminApprovalComponent;
  let fixture: ComponentFixture<AdminApprovalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [AdminApprovalComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(AdminApprovalComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
