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

import { Component, OnInit, ElementRef, ViewChild } from '@angular/core';
import { Observable } from 'rxjs';
import { FormControl } from '@angular/forms';
import { map, startWith } from 'rxjs/operators';
import { MatAutocompleteTrigger } from '@angular/material/autocomplete';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { SerialPortService } from './../serial-port.service';
import * as GLOBALS from './../globals';

/**
* 	Operate AT Terminal
*/
@Component({
  selector: 'app-terminal',
  templateUrl: './terminal.component.html',
  styleUrls: ['./terminal.component.css']
})
export class TerminalComponent implements OnInit {
  public m_strTextareaValue: String = '';
  public m_inputValue: any = '';
  public m_ATCommandsList: any[];
  public m_filteredATCommandsList: Observable<String[]>;
  public m_inputFormCtrl = new FormControl();
  
  private m_unsubscribe = new Subject<any>();

  @ViewChild('childATResponses', {static: false}) m_ATResponsesTextArea: ElementRef<HTMLTextAreaElement>;
  @ViewChild('childATCommandTrigger', { read: MatAutocompleteTrigger }) m_ATCommandInputTrigger: MatAutocompleteTrigger;

  /**
  *   Constructor
	*/ 
  constructor(public p_serialPosrtService: SerialPortService) { 
  }

  /**
  *   Init Component: Subsribe to serial-port service in order to be up-to-date
  *   when connection status changes. But in this case, only incomming message
  *   is useful
  * 
  *   params: NONE
  * 
  *   return: NONE
	*/ 
  ngOnInit(): void {
    /*Subscribe to serial-port-service in order to be notified when events 
    occured: connect, disconnect and incomming payload*/
    this.p_serialPosrtService.subscribeIncomming().subscribe((p_message: any) => {
      switch (p_message.type) 
      {
        case GLOBALS.ENM_SERIAL_PORT_EVENT.SERIAL_PAYLOAD:
          /*add decoded incomming message to the text area*/
          this.m_strTextareaValue += new TextDecoder().decode(p_message.data);
          /*auto-scroll to the bottom of the TestArea*/
          this.m_ATResponsesTextArea.nativeElement.scrollTop = this.m_ATResponsesTextArea.nativeElement.scrollHeight;
        break;
      }
    })

    /*Populate autocompletion AT commands list*/
    this.m_ATCommandsList = Array.from(GLOBALS.AT_COMMANDS_LIST);
    /*listen input compenent in order to apply AT commands filter according to the characters entered by user in order
    to perform autocompletion*/
    this.m_filteredATCommandsList = this.m_inputFormCtrl.valueChanges
      .pipe(
        startWith(''),
        map(value => this.filteredATCommands(value))
      );
  }

  /**
  *   Perform AT Comman filter for autocompletion 
  * 
  *   params: 
  *     p_value: char or string entered by user
  * 
  *   return: list of filtered AT commands according to the char or string entered
	*/ 
  private filteredATCommands(p_value) {
    const filterValue = p_value.toUpperCase();
    return this.m_ATCommandsList.filter(option => option.toUpperCase().includes(filterValue));
  }

  /**
  *   Event fired when user click 'enter' into the AT command input component.
  *   Send AT command to the WEBUSB device 
  * 
  *   params: 
  *     p_evt: <event>
  * 
  *   return: NONE
	*/ 
  public onSubmit(p_evt: any) {
    /*Send AT command to the WEBUSB device via serial-port service*/
    this.p_serialPosrtService.send(p_evt.target.value).then((p_result: any) => {
      /*clear value of the AT command input component*/
      this.m_inputFormCtrl.setValue('');

      /*close the autocompletion list*/
      this.m_ATCommandInputTrigger.closePanel();
    });
  }
}
