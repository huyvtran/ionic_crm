import { Component } from '@angular/core';
import { NavParams, NavController } from 'ionic-angular';
import { DomSanitizer } from '@angular/platform-browser';
import _ from 'lodash';
import { UserInfo } from '../../utils/index';
import { TranslateService } from '../../providers/index';

@Component({
  selector: 'page-external-page',
  templateUrl: 'external-page.html'
})

export class ExternalPage{
  constructor(
    public navParams: NavParams,
    public navCtrl: NavController,
    public userInfo: UserInfo,
    public sanitizer: DomSanitizer,
    public translateService: TranslateService
  ){
  }

  header:any;
  url:any;

  ionViewWillEnter(){
    const tab = this.navParams.data;
    const openUrl = tab.external_page_src;
    const parmas = tab.external_page_param;
    const encryption = tab.param_encryption;
    this.header = this.transHeader(tab);
    this.lanchExternalUrl(openUrl, parmas, encryption);
  }

  transHeader(x){
    let key = 'tab.' + x.api_name;
    if (this.translateService.translateFunc(key) !== key) {
      return this.translateService.translateFunc(key);
    } else {
      return x.label;
    }
  }

  lanchExternalUrl(openUrl, parmas, encryption){
    let SearchParms = '';
    let addParamsFlag = false;
    if(parmas){
      parmas.split('\n').forEach((param, index) => {
        const values = parmas.split('\n');
        if(param.indexOf('=') > -1){
          const [key, value] = param.split('=');
          let converted = _.template(value.trim())({user: this.userInfo.user}) === value.trim() ? _.template(value.trim())({user: this.userInfo}) : _.template(value.trim())({user: this.userInfo.user});
          if(value.indexOf('{{') > -1){
            let x = value.replace("{{", '').replace("}}", '');
            converted = this.userInfo.user[x];
            if(!this.userInfo.user[x]){
              converted = this.userInfo[x];
            }
          }else if(value.indexOf('{') > -1){
            let x = value.replace("{", '').replace("}", '');
            converted = this.userInfo.user[x];
            if(!this.userInfo.user[x]){
              converted = this.userInfo[x];
            }
          }
          let encrypted = '';
          switch (encryption) {
            //TODO  BASE64起不到加密作用，仅仅做一下编码避免用户可以手工修改参数, 后续可以支持其它加密方式
            case 'base64':
              encrypted = window.btoa(converted);
              break;
            default:
              encrypted = converted;
              break;
          }
          if(values.length  > index + 1){
            SearchParms = SearchParms + key.trim() + '=' + encrypted + '&';
          }else{
            //console.log(index, key, converted);
            SearchParms = SearchParms + key.trim() + '=' + encrypted;
          }
          addParamsFlag = true
        }
      })
    }
    openUrl = addParamsFlag ? (openUrl + '?' + SearchParms) : openUrl;
    this.url = this.sanitizer.bypassSecurityTrustResourceUrl(openUrl);
  }
}
