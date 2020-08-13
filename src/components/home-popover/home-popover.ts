import { Component } from "@angular/core";
import { NavParams, ViewController } from "ionic-angular";
import _ from "lodash";

@Component({
  selector: "comp-home-popover",
  templateUrl: "home-popover.html"
})
export class HomePopover {
  constructor(public navParams: NavParams, public viewCtrl: ViewController) {}

  views: any = [];
  selectItem: any = {};
  ionViewDidEnter() {
    const params = this.navParams.data;
    this.views = _.get(params, "views", []);
  }

  itemSelected(item) {
    this.selectItem = item;
    this.viewCtrl.dismiss(item);
  }
}
