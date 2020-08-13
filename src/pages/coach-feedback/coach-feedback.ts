import { Component } from '@angular/core';
import { NavParams, Events, NavController, AlertController } from 'ionic-angular';
import { DomSanitizer } from '@angular/platform-browser';
import { InAppBrowser } from '@ionic-native/in-app-browser';
import { MainService, TranslateService } from '../../providers/index';
import { UserInfo } from '../../utils/index';
import { DetailPage } from '../../pages/index';

let jwtData = {
  "org": "mundi",
  "app": "crmpower",
  "data": {
    "version": "0",
    "callback": "",
    "coach_feedback_id": "",
    "update": {

    },
    "token": ''
  },
  "module": "coach",
  "source": "iPad"
}

@Component({
  selector: 'page-coach-feedback',
  templateUrl: 'coach-feedback.html'
})

export class CoachFeedback {
  constructor(
    public navCtrl: NavController,
    public navParams: NavParams,
    public events: Events,
    public mService: MainService,
    public sanitizer: DomSanitizer,
    public userInfo: UserInfo,
    public alertCtrl: AlertController,
    public iab: InAppBrowser,
    public translateService: TranslateService
  ) { }

  coachPeople: any;
  coachType: any;

  parentData: any;
  parentAction: any;
  result: any;

  apiName: any;
  recordType: any;
  version = "0";

  coachId: any;
  coach: any;
  url: any;
  preUrl: any;
  defaultFields = [];
  layout: any;

  isFinished = false;
  height:any;

  ionViewDidLoad() {
    this.parentData = this.navParams.data[0];
    this.apiName = this.navParams.data[1];
    this.recordType = this.navParams.data[2];
    this.parentAction = this.navParams.data[3];
    this.version = this.parentData.version;

    this.coachPeople = this.parentData.employee__r.name;

    const body = {
      objectApiName: 'coach',
      joiner: 'and',
      criterias: [
      ],
      orderBy: 'update_time',
      order: 'asc'
    }
    body.criterias.push({
      field: 'type',
      operator: '==',
      value: [this.recordType]
    });
    this.mService.getSearchData(body).then((res: any) => {
      if (res.head.code === 200) {
        const surveys = res.body.result;
        surveys.forEach(survey => {
          if (survey.profile) {
            console.log(survey.profile);
            const profiles = survey.profile;
            profiles.forEach(profile => {
              if (profile == this.userInfo.profile['id']) {
                this.result = survey;
              }
            })
          }
        });
        if (!this.result) {
          this.result = res.body.result[0];
        }
        this.coachType = this.result.name;
        this.preUrl = this.result.url;
        jwtData.data.coach_feedback_id = this.parentData.id;
        jwtData.data.token = this.userInfo.token;
        jwtData.data.callback = this.userInfo.baseURL;
        jwtData.data.version = this.version;
        this.mService.getJwtDataFromServer(jwtData).then((res: any) => {
          if (res.head.code === 200) {
            let field = res.body.result;
            let url = this.preUrl + '?x_field_1=' + field;
            this.url = url;
            this.isFinished = true;
          }
        })
      }
    })
  }

  loaded(){
    //$("#coachIframe").height(document.getElementById('coachIframe').scrollHeight);
  }

  gotoFeedbackDetail() {
    let alert = this.alertCtrl.create({
      title: this.translateService.translateFunc('pad.alert_remind_title'),
      subTitle: this.isFinished ? this.translateService.translateFunc('pad.coach_feedback_leave_survey') : this.translateService.translateFunc('pad.coach_feedback_leave_without_write'),
      buttons: [
        {
          text: this.translateService.translateFunc('pad.coach_feedback_wait_while'),
        }, {
          text: this.translateService.translateFunc('pad.coach_feedback_see_now'),
          handler: data => {
            this.mService.getDataByApiNameAndId(this.parentData.object_describe_name, this.parentData.id).then((res:any) => {
              this.navCtrl.setRoot(DetailPage, [res.body]);
            })
          }
        }
      ]
    })
    alert.present();
  }

  openFeedback() {
    const brsr = this.iab.create(this.url, '_blank', 'location=no,toolbar=yes,closebuttoncaption=关闭,presentationstyle=fullscreen');
    brsr.on('loadstart').subscribe(res => {
      if (res.url.indexOf('success') > -1) {
        console.log('success');
        brsr.close();
        this.isFinished = true;
        this.gotoFeedbackDetail();
      }
    });
  }
}
