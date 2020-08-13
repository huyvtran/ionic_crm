import { Component } from '@angular/core';
import { NavParams, Events, ViewController } from 'ionic-angular';
import { TranslateService } from '../../providers/index';

@Component({
  selector: 'page-dropdown',
  templateUrl: 'dropdown.html'
})
export class DropDownPage {
  actions = [];
  constructor(private navParams: NavParams,
    public events: Events,
    public viewCtrl: ViewController,
    public translateService: TranslateService
  ) { }

  ionViewDidLoad() {
    if (this.navParams.data) {
      this.navParams.data.actions.forEach(action => {
        if(!action['action.i18n_key']){
          let key = 'action.' + action.action.toLowerCase();
          if(!action.label){
            action.label = this.translateService.translateFunc(key) === key ? action.label : this.translateService.translateFunc(key);
          }else{
            action.label = action.label;
          }
        }
        if (action['action.i18n_key'] && this.translateService.translateFunc(action['action.i18n_key']) !== action['action.i18n_key']) {
          action.label = this.translateService.translateFunc(action['action.i18n_key']);
        }
        if (action.show_when) {
          const showArray = action.show_when;
          let flag = 'false';
          showArray.forEach(element => {
            if (element === 'index') {
              flag = 'true';
              return;
            }
          });
          if (flag === 'true') {
            this.actions.push(action);
          }
        } else {
          this.actions.push(action);
        }
      });
    }
  }

  getAction(action) {
    this.viewCtrl.dismiss(action);
  }
}
