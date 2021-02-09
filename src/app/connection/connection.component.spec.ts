import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CConnectionComponent } from './connection.component';

describe('ConnectionComponent', () => {
  let component: CConnectionComponent;
  let fixture: ComponentFixture<CConnectionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ CConnectionComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(CConnectionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
