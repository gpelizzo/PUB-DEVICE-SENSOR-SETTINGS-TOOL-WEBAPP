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

import { Component, OnInit, Output, EventEmitter } from '@angular/core';

import { CSerialPortService } from './../serial-port.service';
import * as GLOBALS from './../globals';

enum ENM_AT_RESPONSE_PENDING {
  WAIT_RESP_GET_DEVICE_TYPE  = 'WAIT_RESP_GET_DEVICE_TYPE',
  WAIT_RESP_SET_NONE         = ''
}

/**
* 	Perform connection and disconnection to WEBUSB devices
*/
@Component({
  selector: 'app-connection',
  templateUrl: './connection.component.html',
  styleUrls: ['./connection.component.css']
})
export class CConnectionComponent implements OnInit {
  private m_serialPortService: CSerialPortService;
  private m_ATResponsePending:ENM_AT_RESPONSE_PENDING = ENM_AT_RESPONSE_PENDING.WAIT_RESP_SET_NONE;
  private m_strATResponseBuffer: string = '';

  public m_bShowSpinner: boolean = false;
  public m_bDeviceConnected: boolean = false;

  /*event emitter to notify main-container component*/
  @Output() evtConnectionStatus: EventEmitter<any> = new EventEmitter();

  /**
  *   Constructor
	*/  
  constructor(p_serialPosrtService: CSerialPortService) { 
    this.m_serialPortService = p_serialPosrtService;
  }

  /**
  *   Init Component: Subsribe to serial-port service in order to be up-to-date
  *   when connection status changes
  * 
  *   params: NONE
  * 
  *   return: send event emitter to main-container component (cf evtConnectionStatus)
	*/ 
  ngOnInit(): void {
    /*Subscribe to serial-port-service in order to be notified when events 
    occured: connect, disconnect and incomming payload*/
    this.m_serialPortService.subscribeIncomming().subscribe((p_message: any) => {
      
      switch (p_message.type) {
        /*incomming payload*/
        case GLOBALS.ENM_SERIAL_PORT_EVENT.SERIAL_PAYLOAD:
          switch (this.m_ATResponsePending) {
            /*waiting for a WEBUSB device response following an AT command to retreive device type*/
            case ENM_AT_RESPONSE_PENDING.WAIT_RESP_GET_DEVICE_TYPE:
              console.log('#11');
              this.m_strATResponseBuffer += new TextDecoder().decode(p_message.data);
              
              let l_jsonATResponse: any;
              /*check if end of transmission*/
              if ((l_jsonATResponse = this.m_serialPortService.parseATResponse(this.m_strATResponseBuffer)) != null) {
                
                /*stop spinner*/
                this.m_bShowSpinner = false;

                /*device responded 'ok', so notify main-container component that a WEBUSB device is connected, or an error
                occured*/
                if (l_jsonATResponse.is_response_ok) {
                  switch (l_jsonATResponse.response_value) {
                    case GLOBALS.ENM_DEVICES_TYPE.BRIDGE_SERVER_SENSOR:
                      this.evtConnectionStatus.emit(GLOBALS.ENM_CONNECTION_STATUS.CONNECTED_BRIDGE_SERVER_SENSOR)
                      break;

                    case GLOBALS.ENM_DEVICES_TYPE.SIMPLE_SENSOR:
                      this.evtConnectionStatus.emit(GLOBALS.ENM_CONNECTION_STATUS.CONNECTED_SIMPLE_SENSOR)
                      break;

                    default:
                      this.evtConnectionStatus.emit(GLOBALS.ENM_CONNECTION_STATUS.CONNECTED_UNKNOWN)
                      break;
                  }
                } else {
                  this.evtConnectionStatus.emit(GLOBALS.ENM_CONNECTION_STATUS.CONNECTED_ERROR)
                }

                this.m_ATResponsePending = ENM_AT_RESPONSE_PENDING.WAIT_RESP_SET_NONE;
                this.m_strATResponseBuffer = '';
              } 
            break;

            default:
              break;
          }
          break;

        /*WEBUSB device connection*/
        case GLOBALS.ENM_SERIAL_PORT_EVENT.SERIAL_CONNECT:
          this.m_strATResponseBuffer = '';
          this.m_bDeviceConnected = true;
          this.m_bShowSpinner = true;
          /*WEBUSB device connected: 1) notify main-container component 2) request device-type by sending an AT command*/
          this.evtConnectionStatus.emit(GLOBALS.ENM_CONNECTION_STATUS.CONNECTED_UNKNOWN);
          this.m_ATResponsePending = ENM_AT_RESPONSE_PENDING.WAIT_RESP_GET_DEVICE_TYPE;
          this.m_serialPortService.send(GLOBALS.ENM_AT_COMMANDS.AT_DEVICE_TYPE);
          break;

        /*WEBUSB device disconnection*/
        case GLOBALS.ENM_SERIAL_PORT_EVENT.SERIAL_DISCONNECT:
          this.m_strATResponseBuffer = '';
          this.m_bDeviceConnected = false;
          /*WEBUSB device disconnected. Notify main-container component*/
          this.evtConnectionStatus.emit(GLOBALS.ENM_CONNECTION_STATUS.DISCONNECTED)
          break;

        default:
          break;
      }
    });
  }

  /**
  *   Fired event when user click on button connect to device
  * 
  *   params: NONE
  * 
  *   return: NONE
	*/ 
  public onClickConnect() {
    /*request to display available WEBUSB devices list*/
    this.m_serialPortService.requestDevices().then((device: any) => {
        /*request serial-port service to connect the WEBUSB device*/
        this.m_serialPortService.connect().then(() => {
          //console.log('device connected');
        }).catch((err: any) => {
          console.log("connect error:" + err);
        });

    }).catch((err: any) => {
      console.log("open error:" + err);
    });
  }

  /**
  *   Fired event when user click on button disconnect from device
  * 
  *   params: NONE
  * 
  *   return: NONE
	*/ 
  public onClickDisconnect() {
    /*request serial-port service to disconnect from WEBUSB device*/
    this.m_serialPortService.disconnect().then(() => {
      //console.log('device disconnected');
    }).catch((err: any) => {
      console.log("disconnect error:" + err);
    });
  }
}
