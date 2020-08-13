import { Component } from '@angular/core';
import { NavController, NavParams, AlertController } from 'ionic-angular';
import _ from 'lodash';
import { TranslateService, MainService } from '../../providers/index';

@Component({
  selector: 'page-view',
  templateUrl: 'view.html'
})

export class ViewPage {
  constructor(
    public navCtrl: NavController,
    public navParams: NavParams,
    public mService: MainService,
    public alertCtrl: AlertController,
    public translateService: TranslateService
  ) {
  }

  apiName: any;

  customer: any;
  product: any;
  preLevel: any;
  userLevel: any;
  overalLevel: any;
  status = true;
  submitStatus = true;
  theState = false;
  data: any;

  ionViewDidLoad() {
  }

  ionViewWillEnter() {
    this.init();
  }

  init() {
    this.apiName = this.navParams.data[0];
    this.customer = this.navParams.data[2];
    this.product = this.navParams.data[3];
    Promise.all(
      [
        this.mService.getDataByApiNameAndId(this.apiName, this.navParams.data[1]),
        this.mService.getDescribeByApiName(this.apiName)
      ]
    ).then((res: any) => {
      this.data = res[0].body;
      let level = res[0].body.overall_segmentation;
      this.overalLevel = level;
      this.userLevel = res[0].body.adjust_segmentation;
      if (!this.userLevel) {
        this.userLevel = level;
      }
      if (level && (this.data.status == undefined || this.data.status == '3')) {
        this.submitStatus = true;
      } else {
        if (this.submitStatus && this.data.status !== undefined) {
          this.submitStatus = false;
          this.theState = false;
          if (this.data.status == '0') {
            this.theState = true
          }
        } else {
          this.submitStatus = false;
          this.theState = false;
        }
      }
      const describe = res[1].body.fields;
      describe.forEach(des => {
        if ('overall_segmentation' == des.api_name) {
          des.options.forEach(option => {
            if (option.value == level) {
              let translate = 'options.segmentation_history.overall_segmentation.' + option.value;
              if (this.translateService.translateFunc(translate) && this.translateService.translateFunc(translate) !== translate) {
                this.preLevel = this.translateService.translateFunc(translate);
              } else {
                this.preLevel = option.label;
              }
            }
          })
        }
      });
    })
  }

  ChangeSegmentation() {
    this.status = false;
    this.submitStatus = false;
  }

  refreshLevel() {
    this.init();
  }

  submitUserLevel() {
    this.data.adjust_segmentation = this.userLevel;
    this.data.overall_segmentation = this.overalLevel;
    this.mService.putDataByApiNameAndId(this.apiName, this.data, this.data.id).then((res: any) => {
      if (res.head.code === 200) {
        this.status = !this.status;
        this.theState = true;
        this.submitStatus = true;
        this.data = res.body;
        let alert = this.alertCtrl.create({
          title: res.head.msg,
          buttons: [
            {
              text: this.translateService.translateFunc('pad.action_ok'),

            }
          ]
        })
        alert.present();
      }
    })
  }

  submitLevel() {
    let body = {
      id: this.data.id,
      status: '0',
      version: this.data.version,
      submit_time: _.now(),
      adjust_segmentation: this.userLevel,
      overall_segmentation: this.overalLevel
    }
    this.mService.putDataByApiNameAndId(this.apiName, body, this.data.id).then((res: any) => {
      if (res.head.code === 200) {
        this.theState = true;
        this.submitStatus = false;
        this.data = res.body;
        let alert = this.alertCtrl.create({
          title: this.translateService.translateFunc('pad.alert_operate_success') !== 'pad.alert_operate_success' ? this.translateService.translateFunc('pad.alert_operate_success') : res.head.msg,
          buttons: [
            {
              text: this.translateService.translateFunc('pad.action_ok'),

            }
          ]
        })
        alert.present();
      }
    })
  }

  ionViewDidLeave() {
    let body = {
      id: this.data.id,
      version: this.data.version,
      submit_time: _.now(),
      adjust_segmentation: this.userLevel,
      overall_segmentation: this.overalLevel
    }
    this.mService.putDataByApiNameAndId(this.apiName, body, this.data.id).then((res: any) => {
      if (res.head.code === 200) {
        this.theState = true;
        this.submitStatus = false;
        this.data = res.body;
      }
    })
  }
}
