import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CSpinnerOverlayComponent } from './spinner-overlay.component';

describe('SpinnerOverlayComponent', () => {
  let component: CSpinnerOverlayComponent;
  let fixture: ComponentFixture<CSpinnerOverlayComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ CSpinnerOverlayComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(CSpinnerOverlayComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
