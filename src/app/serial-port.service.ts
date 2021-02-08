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
import { Injectable } from '@angular/core';
import { Observable, Subject} from 'rxjs';

import { USBDevice, USBInterface, USBAlternateInterface, USBOutTransferResult, USBInTransferResult, USBConnectionEvent } from './web-usb.interface';
import * as GLOBALS from './globals';

/**
* 	Perform SERIAL-WEBUSB operations
*/
@Injectable({
  providedIn: 'root'
})
export class SerialPortService {
  private m_webUSBDevice: USBDevice = null;
  private m_interfaceNumber: number;
  private m_endpointOut: number;
  private m_endpointIn: number;

  /*observable for clients containing a JSON:
    {
      type: <type of event, cf GLOBALS.OBS_SERIAL_xxx>
      data: <optional data: any>
    }
  */
  private m_subject = new Subject<any>();

  /**
  *   Constructor
	*/   
  constructor() { 
    /*Add listener to a onConnect event fired by USBDevice, usualy fired when device is already registered and 
    hot-plugged*/
    navigator.usb.addEventListener('connect', (event: USBConnectionEvent) => {
      this.m_webUSBDevice = event.device;
      /*open the port and perform connection*/
      this.m_webUSBDevice.open().then(() => {
        this.connect().then(() => {
        /*send message to subscribers*/
        //this.m_subject.next({type: GLOBALS.ENM_SERIAL_PORT_EVENT.SERIAL_CONNECT});
        });
      });
    });

    /*Add listener to a onDisconnect event fired by USBDevice, usualy fired when device 
    is hot-unplugged*/
    navigator.usb.addEventListener('disconnect', (event: USBConnectionEvent) => {
      /*send message to subscribers*/
      this.m_subject.next({type: GLOBALS.ENM_SERIAL_PORT_EVENT.SERIAL_DISCONNECT});
    });
  }

  /**
  *   register observables candidates to receive OBS_SERIAL_xxx notifications
  * 
  *   params: NONE
  * 
  *   return: Observable
	*/ 
  public subscribeIncomming(): Observable<any> {
    return this.m_subject.asObservable();
  }

  /**
  *   Following a user-action to retreive the list of WEBUSB devices recognized
  *   by the web-browser.
  *   Important: list of devices is filtered according to the their vendorId and productID
  *   cf GLOBALS.WEB_USB_DEVICES_FILTER
  * 
  *   params: NONE
  * 
  *   return: Promise with the webUSBDevice selected by the user, or a rejection
  *   if choice has been cancelled or error
	*/ 
  public requestDevices(): any {
    const filters = [{ vendorId: 0x2886, productId: 0x802F }];

    return new Promise((resolve: any, reject: any) => {
      /*open filtered WEBUSB devices list and wait for user to pick-up one*/
      navigator.usb.requestDevice({filters: GLOBALS.WEB_USB_DEVICES_FILTER})
      .then((p_webUSBDevice: USBDevice) => { 
        this.m_webUSBDevice = p_webUSBDevice;
        
        this.m_webUSBDevice.open().then(() => {
          resolve(this.m_webUSBDevice);
        });
      })
      .catch((err: any) => {
        reject(err);
      });
    });
  }

  /**
  *   Perform a connection to the WEBUSB device
  * 
  *   params: NONE
  * 
  *   return: Promise with the webUSBDevice selected by the user, or a rejection
  *   if choice has been cancelled or error
	*/ 
  public connect() {
    return new Promise((resolve: any) => {
      if (this.m_webUSBDevice.configuration === null) {
        /*WEBUSB device has already been registered. Just retreive the last configuration*/
        return this.m_webUSBDevice.selectConfiguration(1).then(() => {
          this.m_subject.next({type: GLOBALS.ENM_SERIAL_PORT_EVENT.SERIAL_CONNECT});
          resolve();
        });
      } else {
        /*New WEBUSB device: init USB endpoints*/
        this.m_webUSBDevice.configuration.interfaces.forEach((p_USBInterface: USBInterface) => {
          p_USBInterface.alternates.forEach((p_USBAlternateInterface: USBAlternateInterface) => {
            if (p_USBAlternateInterface.interfaceClass == 0xFF) {
              this.m_interfaceNumber = p_USBInterface.interfaceNumber;
              p_USBAlternateInterface.endpoints.forEach((p_endPoints: USBEndpoint) => {
                if (p_endPoints.direction == 'out') {
                  this.m_endpointOut = p_endPoints.endpointNumber;
                }

                if (p_endPoints.direction == 'in') {
                  this.m_endpointIn = p_endPoints.endpointNumber;
                }
              })
            }
          })
        })
      }

      /*claiming the interface also ensure that WEBUSB device's landing page fit the actual web page (incl. URL)*/
      this.m_webUSBDevice.claimInterface(this.m_interfaceNumber)
      .then(() => this.m_webUSBDevice.selectAlternateInterface(this.m_interfaceNumber, 0))
      .then(() => this.m_webUSBDevice.controlTransferOut({
        requestType: 'class',
        recipient: 'interface',
        request: 0x22,
        value: 0x01,
        index: this.m_interfaceNumber
      }))
      .then(() => {
        /*There is no event fired when an incomming payload is pending. 
        So, just call a recursive function to monitor the endpoint IN*/
        this.readLoop();
        /*send message to subscribers*/
        this.m_subject.next({type: GLOBALS.ENM_SERIAL_PORT_EVENT.SERIAL_CONNECT});
        resolve();
      })
    });
  }

  /**
  *   Perform a disconnection of the WEBUSB device = close port
  * 
  *   params: NONE
  * 
  *   return: Promise
	*/ 
  public disconnect() {
    return new Promise((resolve: any) => {
      this.m_webUSBDevice.controlTransferOut({
        requestType: 'class',
        recipient: 'interface',
        request: 0x22,
        value: 0x00,
        index: this.m_interfaceNumber
      })
      .then(() => {
        this.m_webUSBDevice.close();
      })
      .then(() => { 
        /*send message to subscribers*/
        this.m_subject.next({type: GLOBALS.ENM_SERIAL_PORT_EVENT.SERIAL_DISCONNECT});
        resolve();
      })
    });
  }

  /**
  *   Recursive operation to monitor endpoint IN of the USB interface
  *   and retreive incomming payloads
  * 
  *   params: NONE
  * 
  *   return: send message to subscribers whithin a JSON
	*/ 
  private readLoop() {
    if (this.m_webUSBDevice != null) {
      this.m_webUSBDevice.transferIn(this.m_endpointIn, 64).then((p_result: USBInTransferResult) => {
        /*send message to subscribers*/
        this.m_subject.next({type: GLOBALS.ENM_SERIAL_PORT_EVENT.SERIAL_PAYLOAD, data: p_result.data});

        /*recursive loop*/
        this.readLoop();
      }).catch((p_error: any) => {
        //console.log('p_error: ' + p_error);
      })
    }
  }

  /**
  *   Send payload to WEBUSB device
  * 
  *   params: 
  *     p_strCommand: <string to send>
  * 
  *   return: Promise with response
	*/ 
  public send(p_strCommand: String) {
    return new Promise((resolve: any) => {
      this.m_webUSBDevice.transferOut(this.m_endpointOut, new TextEncoder().encode(p_strCommand + '\r\n')).then((p_result: USBOutTransferResult) => {
        resolve(p_result);
      });
    });
  }

  /**
  *   Perform a quick parsing of the AT response sent by a WEBUSB device.
  *   Check if AT end transmission has been reached and retreive reponse
  * 
  *   params: 
  *     p_strATResponse: <AT message to parse>
  * 
  *   return: null if end-of_trasmission has not been yet reached, otherwise, a JSON:
  *     {
  *       is_response_ok: <boolean value: true is device responded 'OK'>
  *       response_value: <string response>
  *     }
	*/   
  public parseATResponse(p_strATResponse: String): any {
    let l_numIndex: number;

    /*wait for end of transmisison*/
    if ((l_numIndex = p_strATResponse.indexOf('\r\n\r\n')) != -1) {
        return {
                is_response_ok: ((p_strATResponse.indexOf('OK\r\n\r\n') != -1) ? true : false),
                response_value: p_strATResponse.substring(0, p_strATResponse.indexOf('\r\nOK\r\n\r\n'))
              };
    } else {
      return null;
    }
  }
}
