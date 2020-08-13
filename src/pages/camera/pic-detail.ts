import { Component } from "@angular/core";
import {
  NavParams,
  ViewController,
  NavController
} from "ionic-angular";
import { TranslateService } from "../../providers/index";

@Component({
  selector: "page-pic-detail",
  templateUrl: "pic-detail.html"
})
export class PicDetail {
  url: any;
  constructor(
    private navParams: NavParams,
    public viewCtrl: ViewController,
    public translateService: TranslateService,
    public navCtrl: NavController
  ) {
    const params = this.navParams.data;
    if (params) {
      alert(params.url)
      this.url = params.url;
    }
  }

  backToUp() {
    this.navCtrl.pop();
  }

  ionViewDidEnter() {
    // $('#fc_calendar').fullCalendar(this.calendarOptions);
  }

  ionViewWillEnter() {}
}
