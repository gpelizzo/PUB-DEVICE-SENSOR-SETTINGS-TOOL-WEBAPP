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

import { Component, OnInit, Input, ChangeDetectorRef} from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { MatSnackBar } from '@angular/material/snack-bar';
import { HttpClient, HttpHeaders  } from '@angular/common/http';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';

import { CSerialPortService } from '../serial-port.service';
import * as GLOBALS from '../globals';

enum ENM_SNACKBAR_MSG_TYPE {
  INFO,
  ERROR
}; 

enum ENM_AT_RESPONSE_PENDING {
  WAIT_RESP_SET_JSONSETTINGS  = 'WAIT_RESP_SET_JSONSETTINGS',
  WAIT_RESP_SET_SAVESETTINGS  = 'WAIT_RESP_SET_SAVESETTINGS',
  WAIT_RESP_GET_JSONSTATUS    = 'WAIT_RESP_GET_JSONSTATUS',
  WAIT_RESP_SET_FACTORYRESET  = 'WAIT_RESP_SET_FACTORYRESET',
  WAIT_RESP_NONE              = 'NONE'
}

enum ENM_SCHEMA {
  INFOS,
  SETTINGS
}

/**
* 	Manage Infos and Settings to/from WEBUSB device
*/
@Component({
  selector: 'app-device-infos-settings',
  templateUrl: './device-infos-settings.component.html',
  styleUrls: ['./device-infos-settings.component.css']
})
export class CDeviceInfosSettingsComponent implements OnInit {
  
  private m_serialPortService: CSerialPortService;
  private m_strATResponseBuffer: string;
  private m_http: HttpClient;
  private m_jsonSchemaInfosSettings: any = null;
  private m_ATResponsePending:ENM_AT_RESPONSE_PENDING = ENM_AT_RESPONSE_PENDING.WAIT_RESP_NONE;
  private m_snackBar: MatSnackBar;
  private m_currentDeviceType: GLOBALS.ENM_DEVICES_TYPE = GLOBALS.ENM_DEVICES_TYPE.UNKNOWN;

  public m_dataSourceInfos: MatTableDataSource<any> = null; 
  public m_dataSourceSettings: MatTableDataSource<any> = null; 
  public m_formBuilder: FormBuilder;
  public m_formGroupSettings: FormGroup;
  public m_bShowSpinner: boolean = false;

  /**
  *   Constructor
	*/  
  constructor(p_serialPosrtService: CSerialPortService, p_http: HttpClient, p_formBuilder: FormBuilder, private changeDetectorRefs: ChangeDetectorRef, p_snackBar: MatSnackBar) { 
    this.m_serialPortService = p_serialPosrtService;
    this.m_http = p_http;
    this.m_formBuilder = p_formBuilder;
    this.m_snackBar = p_snackBar;

    /*load schema infos&settings file*/
    const l_HttpOptions = {
      headers: new HttpHeaders({
          'Content-Type': 'application/json; charset=UTF-8',
          'Accept': 'application/json'
      })
    };

    this.m_http.get('/assets/schema.json', l_HttpOptions).toPromise().then((p_data: any) => {
      this.m_jsonSchemaInfosSettings = p_data;
    }).catch((p_error: any) => {
      this.shownSnackBarMessage(ENM_SNACKBAR_MSG_TYPE.ERROR, 'JSON Schema can\'t be loaded');
    });
  }

  /**
  *   Init Component: Subsribe to serial-port service in order to be up-to-date
  *   when connection status changes
  * 
  *   params: NONE
  * 
  *   return: NONE
	*/ 
  ngOnInit(): void {

    this.m_serialPortService.subscribeIncomming().subscribe((p_message: any) => {
      switch (p_message.type) {
        case GLOBALS.ENM_SERIAL_PORT_EVENT.SERIAL_PAYLOAD:
          this.m_strATResponseBuffer += new TextDecoder().decode(p_message.data);

          let l_jsonATResponse: any;
          if ((l_jsonATResponse = this.m_serialPortService.parseATResponse(this.m_strATResponseBuffer)) != null) {
            switch (this.m_ATResponsePending) {
              case ENM_AT_RESPONSE_PENDING.WAIT_RESP_SET_JSONSETTINGS:
                if (l_jsonATResponse.is_response_ok) {
                  this.m_ATResponsePending = ENM_AT_RESPONSE_PENDING.WAIT_RESP_SET_SAVESETTINGS;
                  this.m_serialPortService.send(GLOBALS.ENM_AT_COMMANDS.AT_SAVE_SETTINGS);
                } else {
                  this.m_bShowSpinner = false;
                  this.m_ATResponsePending = ENM_AT_RESPONSE_PENDING.WAIT_RESP_NONE;
                  this.shownSnackBarMessage(ENM_SNACKBAR_MSG_TYPE.ERROR, GLOBALS.ENM_AT_COMMANDS.AT_SAVE_SETTINGS + ' error');
                }
                break;

              case ENM_AT_RESPONSE_PENDING.WAIT_RESP_SET_SAVESETTINGS:
                this.m_bShowSpinner = false;
                if (l_jsonATResponse.is_response_ok) {
                  this.shownSnackBarMessage(ENM_SNACKBAR_MSG_TYPE.INFO, 'New settings have been saved');
                } else {
                  this.shownSnackBarMessage(ENM_SNACKBAR_MSG_TYPE.ERROR, GLOBALS.ENM_AT_COMMANDS.AT_SAVE_SETTINGS + ' error');
                }
                break;

              case ENM_AT_RESPONSE_PENDING.WAIT_RESP_GET_JSONSTATUS:
                this.m_bShowSpinner = false;
                if (l_jsonATResponse.is_response_ok) {
                  this.processRetreiveDeviceSettings(l_jsonATResponse.response_value);
                } else {
                  this.shownSnackBarMessage(ENM_SNACKBAR_MSG_TYPE.ERROR, GLOBALS.ENM_AT_COMMANDS.AT_JSON_STATUS + ' error');
                }
                this.m_ATResponsePending = ENM_AT_RESPONSE_PENDING.WAIT_RESP_NONE;
                break;

              case ENM_AT_RESPONSE_PENDING.WAIT_RESP_SET_FACTORYRESET:
                this.m_bShowSpinner = false;
                if (l_jsonATResponse.is_response_ok) {
                  this.shownSnackBarMessage(ENM_SNACKBAR_MSG_TYPE.INFO, 'A factory reset has been performed');
                } else {
                  this.shownSnackBarMessage(ENM_SNACKBAR_MSG_TYPE.ERROR, GLOBALS.ENM_AT_COMMANDS.AT_FACTORY_RESET + ' error');
                }
                this.m_ATResponsePending = ENM_AT_RESPONSE_PENDING.WAIT_RESP_NONE;
                break;
            }

            this.m_strATResponseBuffer = '';
          }
          break;
      }
    });
    
    this.m_bShowSpinner = true;
    this.m_strATResponseBuffer = '';
    this.m_ATResponsePending = ENM_AT_RESPONSE_PENDING.WAIT_RESP_GET_JSONSTATUS;
    this.m_serialPortService.send(GLOBALS.ENM_AT_COMMANDS.AT_JSON_STATUS);
  }

  /**
  *   Populate Table data sources
  * 
  *   params: 
  *     p_strJsonSettings: <incomming JSON from device>
  * 
  *   return: NONE
	*/ 
  private processRetreiveDeviceSettings(p_strJsonSettings: string) {
    let l_parsedJsonSettings = JSON.parse(p_strJsonSettings);

    switch (l_parsedJsonSettings.device_type) {
      case GLOBALS.ENM_DEVICES_TYPE.BRIDGE_SERVER_SENSOR:
        this.m_currentDeviceType = GLOBALS.ENM_DEVICES_TYPE.BRIDGE_SERVER_SENSOR;
        break;

      case GLOBALS.ENM_DEVICES_TYPE.SIMPLE_SENSOR:
        this.m_currentDeviceType = GLOBALS.ENM_DEVICES_TYPE.SIMPLE_SENSOR;
        break;

      default:
        this.m_currentDeviceType = GLOBALS.ENM_DEVICES_TYPE.UNKNOWN;
        break;
    }
    
    //parse infos data and populate corresponding Table Data Source - value into this table are not supposed to be updated
    this.m_dataSourceInfos = new MatTableDataSource(this.parseSchemaInfosAndSettings(l_parsedJsonSettings, ENM_SCHEMA.INFOS));

    //parse settings data - data into the table ca be updated
    let l_settingsArray: any[] = this.parseSchemaInfosAndSettings(l_parsedJsonSettings, ENM_SCHEMA.SETTINGS);
    //create a form group in order to update validation control on components
    let l_formGroup: any = {};
    l_settingsArray.forEach(element => {
      /*validation is only applied on non-list components*/
      if ((!element.is_category) && (element.update_allowed) && (element.type !== 'list')) {
        /*IMPORTANT: non-list values are stored into input components with a formControlName parameter. It gives the ability to
        perform automatic validation control. But the only way to update the input value is from the element control group*/
        l_formGroup[element.key] = [element.value, [Validators.required, Validators.pattern(element.pattern)]];
      }
    });

    this.m_formGroupSettings = this.m_formBuilder.group(l_formGroup);

    /*and populate corresponding Table Data Source*/
    this.m_dataSourceSettings = new MatTableDataSource(l_settingsArray);
  }

  /**
  *   Process incomming JSON Status from device: all incomming json keys are going to be compared to 
  *   the one declared into the schema json file (load previoulsy - constructor) in order to retreive 
  *   readable data and specific params, e.g. key-readable-nae, category, display order, etc.
  * 
  *   params: 
  *     p_strJsonSettings: <incomming JSON from device>
  *     p_schemaEntry: <Entry into the schema to operate>
  * 
  *   return: Array containing fullfilled data 
	*/ 
  private parseSchemaInfosAndSettings(p_jsonInfosSettings: any, p_schemaEntry: ENM_SCHEMA): any[] {
    let l_jsonArrayCategories = [];
    let l_jsonArrayItems = []

    let l_schemaEntryData: any;

    /*retreive part of the schema to operate*/
    switch (p_schemaEntry) {
      case ENM_SCHEMA.SETTINGS:
        l_schemaEntryData = this.m_jsonSchemaInfosSettings.settings;
        break;

      case ENM_SCHEMA.INFOS:
        l_schemaEntryData = this.m_jsonSchemaInfosSettings.infos;
        break;

      default:
        return [];
    }

    /*iterate all keys of JSON sent by the device - only a 1-level json without any array or encapsulated json*/
    for (let l_jsonInfosSettingsKey in p_jsonInfosSettings) {
      /*iterate key of the correspondinf schema*/
      for (let l_infosKeys in l_schemaEntryData.values) {
        
        let l_bCategoryAlreadyExists: boolean = false;

        /*1st level of the schema concerns the category the key belongs to
        First create a json array with caterogies, ensuring unicity*/
        for (let l_category of l_jsonArrayCategories) {
          if (l_category.name === l_schemaEntryData.values[l_infosKeys].name) {
            l_bCategoryAlreadyExists = true;
            break;
          }
        }
        /*category has not yet been inserted into the json array. Do it*/
        if (!l_bCategoryAlreadyExists) {
          l_jsonArrayCategories.push({
            is_category: true,    /*<--IMPORTANT: the category will be displayed into the table but with a specific behaviour*/
            key: l_infosKeys,
            name: l_schemaEntryData.values[l_infosKeys].name,
            display_order: l_schemaEntryData.values[l_infosKeys].display_order});
        }

        //now, look for the corresponding schema key in order to retreive all the data
        for (let l_shemaItem of l_schemaEntryData.values[l_infosKeys].values) {
          if (l_shemaItem.key === l_jsonInfosSettingsKey) {
            /*IMPORTANT: copy by value - otherwise 'l-item = l_schemaItem' will proceed has a pointer and 
            eventualy damage the schema*/
            let l_item: any = { ...l_shemaItem };

            /*if key-value correspond to a list, retreive the list items and add them to the item*/
            if (l_item.type === 'list') {
              l_item.list_items = this.retreiveListItems(l_shemaItem.list_items);
            }

            l_item.is_category = false, /*<--IMPORTANT: cf above*/
            l_item.info_name = l_schemaEntryData.name;
            l_item.category = l_infosKeys;
            l_item.category_name = l_schemaEntryData.values[l_infosKeys].name;
            l_item.category_display_order = l_schemaEntryData.values[l_infosKeys].display_order;
            /*now, insert the value corresponding to the key, as provided by the device*/ 
            l_item.value = p_jsonInfosSettings[l_jsonInfosSettingsKey];

            /*and add the item to an array*/
            l_jsonArrayItems.push(l_item);
            break;
          }
        }
      }
    };

    /*At this stage, all keys and values provided by the device has been populated with schema data*/
    /*First perform categories ordering according to the display order set into the schema file*/
    l_jsonArrayCategories.sort((a, b) => {
      return a.display_order - b.display_order;
    });

    /*array of data return to the Tables data sources*/
    let l_retArray = [];
    
    /*categories are ordered. Now, iterate all categories*/
    l_jsonArrayCategories.forEach((categoryItem) => {
      /*retreive all the data belonging to the category*/
      let l_tempArray = l_jsonArrayItems.filter(arrayItem => arrayItem.category === categoryItem.key);
      /*and oredred the data according to the display order set into the schema file*/
      l_tempArray.sort((a, b) => {
        return a.display_order - b.display_order;
      })
      
      /*some categories regard only a device type, and not an other. For this reason,
      it's possible that device doesn't return keys/value belonging to the iterated category,
      e.g WiFI category while the device is a simple-sensor with no wifi capabilities*/
      if (l_tempArray.length != 0) {
        /*insert the category*/
        l_retArray.push(categoryItem);
        /*insert the ordered data*/
        l_retArray = l_retArray.concat(l_tempArray);
      }   
    });

    return l_retArray;
  }

  /**
  *   Retreive all items from a list into the schema file
  * 
  *   params: 
  *     p_strListItemsName: <list id>
  * 
  *   return: Array containing all items of the list 
	*/ 
  private retreiveListItems(p_strListItemsName: String) {
    for (let l_list of this.m_jsonSchemaInfosSettings.params.lists) {
      if (l_list.name === p_strListItemsName) {
        return l_list.values;
      }
    }
  }

  /**
  *   Event fired when user click on send to device button: send AT command
  *   to transmit new settings to device, followed by an AT command to tell
  *   the device to save the new settings into the EEPROM
  * 
  *   params: NONE
  * 
  *   return: NONE
	*/ 
  public onClickSendSettingsToDevice() {
    let l_ATJSonSettings: any = {};

    /*build JSON compliant with the device*/
    for (let l_dataItem of this.m_dataSourceSettings.data) {
      if (!l_dataItem.is_category) {
        l_ATJSonSettings[l_dataItem.key] = l_dataItem.value;
      }
    }

    //display the spinner
    this.m_bShowSpinner = true;

    //sens AT command
    this.m_ATResponsePending = ENM_AT_RESPONSE_PENDING.WAIT_RESP_SET_JSONSETTINGS;
    this.m_serialPortService.send(GLOBALS.ENM_AT_COMMANDS.AT_JSON_SETTINGS + '=' + JSON.stringify(l_ATJSonSettings));
  }

  public onKeyUp(p_evt: any, p_element: any) {
    for (let l_item of this.m_dataSourceSettings.data) {
      if (l_item.key === p_element.key) {
        l_item.value = p_evt.target.value;
      }
    }
  }

  /**
  *   Event fired when user click on load settings file button: read the json file,
  *   ensure that the json settings correspond to the current device type and load
  *   the settings value into the Table by performing a 'parseSchemaInfosAndSettings'
  *   in order to retreive fullfilled data from schema
  * 
  *   params: 
  *     p_evt: <contain file details returned by binded input-file control from HTML>
  * 
  *   return: NONE
	*/ 
  public onClickSelectFile(p_evt: any) {
    let l_fileReader = new FileReader();

    l_fileReader.addEventListener('load', (e) => {
      /*retreive file content*/
      let l_jsonFileContent: any = JSON.parse(e.target.result.toString());

      /*check that settings fit with the current device type*/
      if (this.m_currentDeviceType === l_jsonFileContent.device_type) {
        /*build a fullfilled data array*/
        let l_settingsArray: any[] = this.parseSchemaInfosAndSettings(l_jsonFileContent, ENM_SCHEMA.SETTINGS);
        
        /*and update the settings-table data source - but only the lists because...cf above*/
        this.m_dataSourceSettings.data = l_settingsArray;

        /*iterate the file-settings in order to update the settings table data source*/
        l_settingsArray.forEach(element => {
          /*IMPORTANT: non-list values are stored into input components with a formControlName parameter. It gives the ability to
          perform automatic validation control. But the only way to update the input value is from the element control: formgroup.get(componentID)*/
          if ((!element.is_category) && (element.update_allowed) && (element.type !== 'list')) {
            /**/
            this.m_formGroupSettings.get(element.key).setValue(element.value);
          }
        });
      } else {
        this.shownSnackBarMessage(ENM_SNACKBAR_MSG_TYPE.ERROR, GLOBALS.ENM_AT_COMMANDS.AT_SAVE_SETTINGS + 'Device delared into the file does not fit the one connected');
      }
    })
    
    /*start file-reder: listen above*/
    l_fileReader.readAsText(p_evt.target.files[0]);
  }


  /**
  *   Event fired when user click on save settings file button: save settings from
  *   settings-table-data-source to a local json file
  * 
  *   params: NONE
  * 
  *   return: NONE
	*/ 
  public onClickSaveFile() {
    let l_ATJSonSettings: any = {};

    /*build JSON compliant with the device*/
    for (let l_dataItem of this.m_dataSourceSettings.data) {
      if (!l_dataItem.is_category) {
        l_ATJSonSettings[l_dataItem.key] = l_dataItem.value;
      }
    }

    /*add device_type key*/
    l_ATJSonSettings.device_type = this.m_currentDeviceType;

    /*write to local file*/
    let l_AElementDocument: HTMLAnchorElement = document.createElement('a');
    let l_fileBlob: Blob = new Blob([JSON.stringify(l_ATJSonSettings)], {type: 'json/plain'});
    l_AElementDocument.href = URL.createObjectURL(l_fileBlob);
    l_AElementDocument.download = 'xxx_device.json';
    l_AElementDocument.click();
  }

  /*
  private writeContents(content, fileName, contentType) {
    var a = document.createElement('a');
    var file = new Blob([content], {type: contentType});
    a.href = URL.createObjectURL(file);
    a.download = fileName;
    a.click();
  }
*/

  /**
  *   Event fired when user click on factory reset: Ask for confirmation
  *   before sending the AT command to the device.
  *   Factory reset will erase the whole content of the EEPROM into the device
  *   and for bride/server-sensor devices, will also erase Access Point credentials
  *  
  *   params: NONE
  * 
  *   return: NONE
	*/ 
  public onClickFactoryReset() {
    if (window.confirm('This operation will erase all settings including Access Point credential. Do you confirm ?')) {
      this.m_bShowSpinner = true;
      this.m_ATResponsePending = ENM_AT_RESPONSE_PENDING.WAIT_RESP_SET_FACTORYRESET;
      this.m_serialPortService.send(GLOBALS.ENM_AT_COMMANDS.AT_FACTORY_RESET);
    }
  }

  /**
  *   Show a snack bar message to update the user about status of the operations
  *  
  *   params: NONE
  * 
  *   return: NONE
	*/ 
  private shownSnackBarMessage(p_msgType: ENM_SNACKBAR_MSG_TYPE, p_strMessage: string) {
    this.m_snackBar.open(p_strMessage, (p_msgType == ENM_SNACKBAR_MSG_TYPE.INFO) ? 'Info' : 'Error', 
      {duration: 200000, panelClass: [(p_msgType == ENM_SNACKBAR_MSG_TYPE.INFO) ? 'info-snackbar' : 'error-snackbar']})
  }
}
