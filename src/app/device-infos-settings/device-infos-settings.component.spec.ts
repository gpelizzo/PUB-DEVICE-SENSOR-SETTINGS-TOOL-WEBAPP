import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CDeviceInfosSettingsComponent } from './device-infos-settings.component';

describe('DeviceSettingsComponent', () => {
  let component: CDeviceInfosSettingsComponent;
  let fixture: ComponentFixture<CDeviceInfosSettingsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ CDeviceInfosSettingsComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(CDeviceInfosSettingsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
