import { Component } from '@angular/core';
import { NavController } from 'ionic-angular';
import { TranslateService } from '../../providers/index';
import moment from 'moment';

@Component({
  templateUrl: 'about.html',
  selector: 'page-about'
})

export class AboutPage {
  constructor(
    public translateService: TranslateService,
    public navCtrl: NavController
  ) { }

  backToUp(){
    this.navCtrl.pop();
  }

  customLogoUrl = 'assets/img/haosenlogo1.png';

  getVersion(){
    let t = new Date().getTime();
    return moment(t).format("YYYY-MM-DD");
  }
}
