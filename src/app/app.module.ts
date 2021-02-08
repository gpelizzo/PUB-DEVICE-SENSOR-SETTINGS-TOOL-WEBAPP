import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppComponent } from './app.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms'; 
import { HttpClientModule } from '@angular/common/http';
import { FlexLayoutModule } from '@angular/flex-layout';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

import { SerialPortService } from './serial-port.service';
import { MainContainerComponent } from './main-container/main-container.component';
import { TerminalComponent } from './terminal/terminal.component';
import { SpinnerOverlayComponent } from './spinner-overlay/spinner-overlay.component';
import { ConnectionComponent } from './connection/connection.component';
import { DeviceInfosSettingsComponent } from './device-infos-settings/device-infos-settings.component';
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
    MainContainerComponent,
    TerminalComponent,
    DeviceInfosSettingsComponent,
    SpinnerOverlayComponent,
    ConnectionComponent
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
    SerialPortService
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
