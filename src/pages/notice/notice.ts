import { Component } from "@angular/core";
import { App, NavController, Events, ModalController } from 'ionic-angular';
import { Title } from '@angular/platform-browser';
import { Http } from '@angular/http';
import 'fullcalendar';
import moment from 'moment';
import { LoginService, MainService, TranslateService } from '../../providers/index';
import { UserInfo } from '../../utils/index';
import { NoticeDetail } from './detail';

@Component({
  selector: 'page-notice',
  templateUrl: 'notice.html'
})
export class NoticePage {

  constructor(app: App,
    public navController: NavController,
    public events: Events,
    public userInfo: UserInfo,
    public loginService: LoginService,
    public http: Http,
    public modalController: ModalController,
    public mainService: MainService,
    public translateService: TranslateService,
    public titleService: Title
  ) {
  }

  noticeList = [
    { name: '', description: '' }
  ];


  ionViewDidEnter() {
    this.titleService.setTitle('SFE');
    // $('#fc_calendar').fullCalendar(this.calendarOptions);
  }

  ionViewWillEnter() {
    this.loadDataFromServer();
  }

  loadDataFromServer() {
    //获取最新公告
    this.mainService.getSearchData({
      objectApiName: 'notice',
      criterias: [
        { field: 'profiles', operator: 'contains', value: ['$$CurrentProfileId$$'] }
      ],
      pageSize: 10,
      pageNo: 1,
      orderBy: 'publish_date',
      order: 'desc',
      joiner: 'and',
    }).then((res: any) => {
      const { result } = res.body;
      if (Array.isArray(result)) {
        this.noticeList = result;
      }
    })
  }

  convertTimeStamp(timestamp) {
    return moment(timestamp).format('YYYY-MM-DD');
    //return formatTime(timestamp)
  }

  showNoticeDetail(notice) {
    this.navController.push(NoticeDetail, { notice: notice });
    // let modal = this.modalController.create(NoticeDetail, { notice: notice });
    // modal.present();
    // modal.onDidDismiss(res => {
    //   this.loadDataFromServer();
    // })

  }
}
