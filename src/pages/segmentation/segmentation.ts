import { Component } from '@angular/core';
import { NavParams, Events, NavController, AlertController } from 'ionic-angular';
import { DomSanitizer } from '@angular/platform-browser';
import { MainService, TranslateService } from '../../providers/index';
import { UserInfo } from '../../utils/index';
import { ViewPage } from '../index';

let jwtData = {
  "org": "mundi",
  "app": "crmpower",
  "data": {
    "version": "0",
    "callback": "",
    "segmentation_history_id": "56789abcdefg123",
    "update": {
      "segmentation": "",
    },
    "token": 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJ1c2VySWQiOiI2ODU4MjMwNDE4NjA3MTA2IiwidGVuYW50SWQiOiJUNjg1ODIzMDM2ODkzMDgyMCIsImV4cCI6MTUxMTUxMTc5OSwibmJmIjoxNTA2MzI3Nzk5fQ.FpwUCH8S0icqE7SyG4BKvhWeMNWDCaepsJ8rDccV_ck'
  },
  "module": "segment",
  "source": "iPad"
}

@Component({
  selector: 'page-segmentation',
  templateUrl: 'segmentation.html'
})

export class Segmentation {
  constructor(
    public navCtrl: NavController,
    public navParams: NavParams,
    public events: Events,
    public mService: MainService,
    public alertCtrl: AlertController,
    public sanitizer: DomSanitizer,
    public userInfo: UserInfo,
    public translateService: TranslateService
  ) { }

  customer: any;
  product: any;

  customerData: any;

  apiName: any;
  recordType: any;
  version: any;

  segmentationId: any;
  segmentation: any;
  url: any;
  preUrl: any;
  defaultFields = [];
  layout: any;
  height = 0;

  ionViewDidLoad() {
    this.apiName = this.navParams.data[1];
    this.customerData = this.navParams.data[3];
    this.customer = this.customerData[2];
    this.mService.getLayoutByApiNameAndPageType(this.apiName, 'detail_page', this.recordType).then((res: any) => {
      this.layout = res.body;
      if (this.layout.containers[0]) {
        let actions = this.layout.containers[0].components[0].actions;
        actions.forEach(action => {
          if(!action['action.i18n_key']){
            let key = 'action.' + action.action.toLowerCase();
            action.label = this.translateService.translateFunc(key);
          }
          if (action['action.i18n_key'] && this.translateService.translateFunc(action['action.i18n_key']) !== action['action.i18n_key']) {
            action.label = this.translateService.translateFunc(action['action.i18n_key']);
          }
          if (action.action.toLowerCase() === 'save') {
            if (action.default_field_val) {
              this.defaultFields = action.default_field_val;
            }
          }
        });
      }
      this.getProductOfCustomer();
    })

  }

  backToUp() {
    if (this.navCtrl.indexOf(this.navCtrl.last()) === 1) {
      this.events.publish('menu:back', 'third');
      this.navCtrl.pop();
    } else {
      this.events.publish('clear:data');
      this.events.publish('menu:back');
    }

    //返回的时候去掉多余的订阅
    this.events.unsubscribe('related:push');
    this.events.unsubscribe('related:relatepush');
    this.events.unsubscribe('relatedAdd:relatepush');
    this.events.unsubscribe('relatedEdit:relatepush');
  }

  getProductOfCustomer() {
    const user_info = this.userInfo.userid;
    const queryField = { "field": "", "operator": "==", "value": [] };
    queryField.field = 'user_info';
    queryField.value.push(user_info);
    let criterias = [];
    criterias.push(
      {
        field: 'product_level',
        operator: '==',
        value: ['3']
      }
    );
    criterias.push(queryField);

    const searchBody = {
      "joiner": "and",
      "criterias": criterias,
      "order": "asc",
      "objectApiName": 'user_product'
    }
    this.mService.getSearchData(searchBody).then((res: any) => {
      if (res.head.code === 200) {
        if (res.body.result[0]) {
          this.product = res.body.result[0];
          this.postCustomerProduct();
        } else {
          this.product = undefined;
        }
      }
    })
  }

  postCustomerProduct() {
    let body = {
      customer: this.customer.id,
      customer__r: {
        id: this.customer.id,
        name: this.customer.name
      },
      product: this.product.product,
      product__r: this.product.product__r,
    }
    this.defaultFields.forEach(field => {
      body[field.field] = field.val;
    })
    this.mService.pushDataByApiNameAndId(this.apiName, body).then((res: any) => {
      this.segmentationId = res.body.id;
      this.version = res.body.version;
      this.getProductSurvey(this.product.product);
    })
  }

  getProductSurvey(id) {
    const queryField = { "field": "", "operator": "==", "value": [] };
    queryField.field = 'product';
    queryField.value.push(id);
    let criterias = [];
    criterias.push(queryField);

    const searchBody = {
      "joiner": "and",
      "criterias": criterias,
      "order": "asc",
      "objectApiName": 'segmentation'
    }
    this.mService.getSearchData(searchBody).then((res: any) => {
      if (res.head.code === 200) {
        if (res.body.result && res.body.result.length > 0) {
          this.segmentation = res.body.result[0].id;
          this.preUrl = res.body.result[0].url;
          this.loadSurvyQuestions();
        }
      }
    })
  }

  viewSegmentation() {
    //view Data
    let alert = this.alertCtrl.create({
      title: this.translateService.translateFunc('pad.segmentation_remind_time'),
      buttons: [
        {
          text: this.translateService.translateFunc('pad.coach_feedback_wait_while'),
          handler: data => {

          }
        }, {
          text: this.translateService.translateFunc('pad.coach_feedback_see_now'),
          handler: data => {
            this.navCtrl.push(ViewPage, [this.apiName, this.segmentationId, this.customer, this.product]);
          }
        }
      ]
    })
    alert.present();

  }

  loaded(){
    //this.height = $("#segIframe").contents().find("body").height();
  }

  loadSurvyQuestions() {
    jwtData.data.segmentation_history_id = this.segmentationId;
    jwtData.data.token = this.userInfo.token;
    jwtData.data.callback = this.userInfo.baseURL;
    jwtData.data.version = this.version;
    jwtData.data.update.segmentation = this.segmentation;

    this.mService.getJwtDataFromServer(jwtData).then((res: any) => {
      if (res.head.code === 200) {
        let field = res.body.result;
        let url = this.preUrl + '?x_field_1=' + field;
        this.url = this.sanitizer.bypassSecurityTrustResourceUrl(url);
      }
    })
  }
}
