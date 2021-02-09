import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CMainContainerComponent } from './main-container.component';

describe('MainContainerComponent', () => {
  let component: CMainContainerComponent;
  let fixture: ComponentFixture<CMainContainerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ CMainContainerComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(CMainContainerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
