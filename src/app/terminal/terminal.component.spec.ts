import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CTerminalComponent } from './terminal.component';

describe('TerminalComponent', () => {
  let component: CTerminalComponent;
  let fixture: ComponentFixture<CTerminalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ CTerminalComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(CTerminalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
