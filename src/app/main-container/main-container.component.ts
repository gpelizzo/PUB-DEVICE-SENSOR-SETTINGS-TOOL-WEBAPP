/**	This is free software: you can redistribute it and/or modify
*	it under the terms of the GNU General Public License as published by
*	the Free Software Foundation, either version 3 of the License, or
*	(at your option) any later version.
*
*	This software is distributed in the hope that it will be useful,
*	but WITHOUT ANY WARRANTY; without even the implied warranty of
*	MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
*	GNU General Public License for more details.
*
*	You should have received a copy of the GNU General Public License
*	along with Foobar.  If not, see <https://www.gnu.org/licenses/>.
*
*
*	Author: Gilles PELIZZO
*	Date: February 8th, 2021.
*/
import { Component, OnInit, ViewChild } from '@angular/core';
import { MatTabGroup } from '@angular/material/tabs';
import * as GLOBALS from './../globals';

enum ENM_TABS_INDEX {
  TAB_CONNEXION = 0,
  TAB_INFOS_SETTINGS = 1,
  TAB_TERMINAL = 2
}
/**
* 	Main component 
*/
@Component({
  selector: 'app-main-container',
  templateUrl: './main-container.component.html',
  styleUrls: ['./main-container.component.css']
})
export class MainContainerComponent implements OnInit {
  public m_bEnableTerminalComponent: boolean = false;
  public m_bEnableDeviceInfosSettingsComponent: boolean = false;

  @ViewChild('child_matTabGroup') m_tabGroup: MatTabGroup; 
  /**
  *   Constructor
	*/ 
  constructor() { }

  /**
  *   Init Component
  * 
  *   params: NONE
  * 
  *   return: NONE
	*/ 
  ngOnInit(): void { }


  /**
  *   NG event fired by connection component after a WEBUSB device 
  *   connection/disconnection occured. According to the event, 
  *   create or destroy device-settings and terminal components 
  * 
  *   params: p_evt: <information about the connection/disconnection>
  * 
  *   return: NONE
	*/ 
  public onChangeConnectionStatus(p_evt: any) {

    switch (p_evt) {
      /*WEBUSB device disconneced: destroy both components => destroy both components*/
      case GLOBALS.ENM_CONNECTION_STATUS.DISCONNECTED:
        this.m_bEnableTerminalComponent = false;
        this.m_bEnableDeviceInfosSettingsComponent = false;
        /*Move to connection component's tab*/
        this.m_tabGroup.selectedIndex = ENM_TABS_INDEX.TAB_CONNEXION;
        break;

      /*WEBUSB device connected but not identify, or error => only create terminal component*/
      case GLOBALS.ENM_CONNECTION_STATUS.CONNECTED_UNKNOWN:
      case GLOBALS.ENM_CONNECTION_STATUS.CONNECTED_ERROR:
        this.m_bEnableTerminalComponent = true;
        this.m_bEnableDeviceInfosSettingsComponent = false;
        break;

      /*WEBUSB device connected and identifide aither as simple-sensor or bridge/server => create both components*/
      case GLOBALS.ENM_CONNECTION_STATUS.CONNECTED_BRIDGE_SERVER_SENSOR: 
      case GLOBALS.ENM_CONNECTION_STATUS.CONNECTED_SIMPLE_SENSOR:
        this.m_bEnableTerminalComponent = true;
        this.m_bEnableDeviceInfosSettingsComponent = true;
        /*Move to device-settings component's tab*/
        this.m_tabGroup.selectedIndex = ENM_TABS_INDEX.TAB_INFOS_SETTINGS;
        break;

      default:
        break;
    }
  }
}
