import { Component } from "@angular/core";
import { NavParams, ViewController, NavController } from 'ionic-angular';
import { TranslateService } from '../../providers/index';

@Component({
  selector: 'page-notice-detail',
  templateUrl: 'detail.html'
})
export class NoticeDetail {

  notice: object = {
    name: this.translateService.translateFunc('pad.notice_title'),
    description: this.translateService.translateFunc('pad.notice_content')
  }

  constructor(
    private navParams: NavParams,
    public viewCtrl: ViewController,
    public translateService: TranslateService,
    public navCtrl: NavController
  ) {
    const { notice } = this.navParams.data;
    this.notice = notice;
  }

  backToUp() {
    this.navCtrl.pop();
  }

  ionViewDidEnter() {
    // $('#fc_calendar').fullCalendar(this.calendarOptions);
  }

  ionViewWillEnter() {

  }
}
