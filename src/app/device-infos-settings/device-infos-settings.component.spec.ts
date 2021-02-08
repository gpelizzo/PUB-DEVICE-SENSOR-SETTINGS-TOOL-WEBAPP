import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DeviceInfosSettingsComponent } from './device-infos-settings.component';

describe('DeviceSettingsComponent', () => {
  let component: DeviceInfosSettingsComponent;
  let fixture: ComponentFixture<DeviceInfosSettingsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ DeviceInfosSettingsComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(DeviceInfosSettingsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
