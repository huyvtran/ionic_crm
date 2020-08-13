import { Injectable } from '@angular/core';
import { Storage } from '@ionic/storage';
import { AlertController } from 'ionic-angular';
import { Http } from '@angular/http';
import { TranslateService } from '../providers/translate-service';
import * as moment from 'moment';
import { UserInfo } from '../utils/index';

@Injectable()
export class DataService {
  constructor(
    public storage: Storage,
    public alertCtrl: AlertController,
    public translateService: TranslateService,
    public userInfo: UserInfo,
    public http: Http
  ) {
    this.init();
  }

  data: any;
  action: any;
  reportList = [];
  validComponent: any;
  customerFilter:any;
  recordListFilter:any;
  favoriteStatus:any;
  navigationTab: any;
  currentTemplate:any;

  init() {
    this.data = undefined;
    this.action = undefined;
    this.reportList = [];
    this.validComponent = undefined;
  }

  isString(str) {
    return (typeof str == 'string') && str.constructor == String;
  }

  validFieldWithMustWriteAndType(component) {
    let validFlag = false;
    for (let section of component[0].sections) {
      for (let formItem of section.formItems) {
        if (formItem.is_required == true) {
          if (formItem.value == undefined || (this.isString(formItem.value) && formItem.value.trim() == "")) {
            let alert = this.alertCtrl.create({
              title: this.translateService.translateFunc('pad.alert_failed_title'),
              subTitle: formItem.name + this.translateService.translateFunc('pad.alert_subtitle_valid'),
              buttons: [
                {
                  text: this.translateService.translateFunc('pad.action_callback'),
                  handler: data => {
                  }
                }, {
                  text: this.translateService.translateFunc('pad.action_ok'),
                  handler: data => {
                  }
                }
              ]
            })
            alert.present();
            validFlag = false;
            return validFlag;
          } else {
            validFlag = true;
          }
        }
        if (formItem.pattern !== undefined) {
          if (formItem.value) {
            let patt = '^' + formItem.pattern.replace("\\\\", "\\") + '$';
            let x = new RegExp(patt);
            let val = formItem.value;
            if (this.isString(val)) {
              val = val.trim();
            }
            let flag = x.test(val);
            // const pattern = formItem.pattern;
            // let flag = pattern.test(formItem.value);
            if (!flag) {
              let warning = formItem.name;
              if (formItem.type == 'big_int') {
                warning + '（' + this.translateService.translateFunc('pad.warning_type_number') + '）';
              }
              let alert = this.alertCtrl.create({
                title: this.translateService.translateFunc('pad.alert_failed_title'),
                subTitle: this.translateService.translateFunc('pad.warning_subtitle') + warning + this.translateService.translateFunc('pad.warning_type'),
                buttons: [
                  {
                    text: this.translateService.translateFunc('pad.action_callback'),
                    handler: data => {
                    }
                  }, {
                    text: this.translateService.translateFunc('pad.action_ok'),
                    handler: data => {
                    }
                  }
                ]
              })
              alert.present();
              validFlag = false;
              return validFlag;
            } else {
              validFlag = true;
            }
          }
        }
        if (formItem.des) {
          if (formItem.des.max_length) {
            if (formItem.value) {
              let x = JSON.stringify(formItem.value);
              if (x.length > formItem.des.max_length) {
                let alert = this.alertCtrl.create({
                  title: this.translateService.translateFunc('pad.alert_failed_title'),
                  subTitle: this.translateService.translateFunc('pad.warning_subtitle_not_more') + formItem.des.max_length + this.translateService.translateFunc('pad.warning_langth') + formItem.name + "！",
                  buttons: [
                    {
                      text: this.translateService.translateFunc('pad.action_callback'),
                      handler: data => {
                      }
                    }, {
                      text: this.translateService.translateFunc('pad.action_ok'),
                      handler: data => {
                      }
                    }
                  ]
                })
                alert.present();
                validFlag = false;
                return validFlag;
              } else {
                validFlag = true;
              }
            }
          }
        }
      }
    }
    return validFlag;
  }

  generatorFilterParams(customerFilter){
    const filterParam = [];
    for (let element of customerFilter) {
      if (element.operator.value && element.value.length > 0) {
          let elem: any = {
              field: element.field.value,
              operator: element.operator.value,
              value: [element.value[0].value]
          }
          switch (element.operator.type) {
              case 'date':
                  elem.value = [moment(element.value[0].value).format("x")];
                  break;
              case 'select_many':
                  elem.value = element.value[0].value;
                  break;
              case 'relation':
                  elem.field = elem.field + '__r.name';
                  break;
          }
          if (elem.field.indexOf('create_by') > -1) {
              filterParam.push({
                  field: 'create_by__r.name',
                  operator: elem.operator,
                  value: elem.value
              });
          } else if (elem.field.indexOf('owner') > -1) {
              filterParam.push({
                  field: 'owner__r.name',
                  operator: elem.operator,
                  value: elem.value
              });
          } else if (elem.field.indexOf('update_by') > -1) {
              filterParam.push({
                  field: 'update_by__r.name',
                  operator: elem.operator,
                  value: elem.value
              });
          } else {
              filterParam.push(elem);
          }
      }
    }
    return filterParam;
  }

  compareParamas(sourceParams, filterParams){
    if(sourceParams.length > 0){
      filterParams.forEach(fp => {
        let is_have = false;
        sourceParams.forEach(sr => {
          if(fp.field == sr.field){
            is_have = true;
            fp.operator = sr.operator;
            fp.value = sr.value;
          }
        })
        if(!is_have){
          sourceParams.push(fp);
        }
      })
      
    }else{
      filterParams.forEach(fp => {
        sourceParams.push(fp);
      })
    }
    return sourceParams;
  }

  dataReset(userId: any, apiName?:string){
    // const url = config.data_server + config.api.dataReset;
    // //post or get
    // return new Promise(()=>{

    // })
  }

  dataCheckUpdate(){
    // const url = config.data_server + config.api.dataReset;
    return new Promise(() => {});
  }
}
