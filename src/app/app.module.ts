import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppComponent } from './app.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms'; 
import { HttpClientModule } from '@angular/common/http';
import { FlexLayoutModule } from '@angular/flex-layout';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

import { CSerialPortService } from './serial-port.service';
import { CMainContainerComponent } from './main-container/main-container.component';
import { CTerminalComponent } from './terminal/terminal.component';
import { CSpinnerOverlayComponent } from './spinner-overlay/spinner-overlay.component';
import { CConnectionComponent } from './connection/connection.component';
import { CDeviceInfosSettingsComponent } from './device-infos-settings/device-infos-settings.component';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';

import { MatTabsModule } from '@angular/material/tabs';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatInputModule}  from '@angular/material/input';
import { MatTableModule } from '@angular/material/table';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatIconModule } from '@angular/material/icon';

@NgModule({
  declarations: [
    AppComponent,
    CMainContainerComponent,
    CTerminalComponent,
    CDeviceInfosSettingsComponent,
    CSpinnerOverlayComponent,
    CConnectionComponent
  ],
  imports: [
    BrowserModule,
    FormsModule,
    ReactiveFormsModule,
    HttpClientModule,
    FlexLayoutModule,
    BrowserAnimationsModule,
    MatTabsModule,
    MatFormFieldModule,
    MatAutocompleteModule,
    MatInputModule,
    MatTableModule,
    MatSelectModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule
  ],
  providers: [
    CSerialPortService
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
