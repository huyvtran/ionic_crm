import { Component } from '@angular/core';
import { Events, NavController } from 'ionic-angular';
import { MainService, TranslateService } from '../../providers/index';
import { UserInfo } from '../../utils/index';

@Component({
  selector: 'page-subordinate',
  templateUrl: 'subordinate.html'
})

export class SubordinatePage {
  constructor(
    public mService: MainService,
    public userInfo: UserInfo,
    public events: Events,
    public nav: NavController,
    public translateService: TranslateService
  ) { }

  header = this.translateService.translateFunc('pad.employee_selector_header');
  itemLists = [];

  ionViewDidLoad() {
    const userId = this.userInfo.userid;
    this.mService.getlistTutorial(userId).then((res: any) => {
      this.itemLists = res.body.result;
    })
  }
  backToUp() {
    this.nav.pop();
  }

  pickValue(item) {
    this.events.publish('form-comp:pickValue', [item]);
    this.nav.pop();
  }
}
