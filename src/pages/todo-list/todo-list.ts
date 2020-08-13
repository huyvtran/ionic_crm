import { Component } from "@angular/core";
import { NavParams } from "ionic-angular";
import _ from "lodash";
import { TranslateService } from '../../providers/index';

@Component({
  selector: "page-todo-list",
  templateUrl: "todo-list.html"
})
export class TodoPage {
  constructor(
      public navParams: NavParams,
      public translateService: TranslateService
  ) {
      //console.log(navParams.data);
      this.newDisplayList = navParams.data;
  }

  newDisplayList: any = [];

  getContent(renderContents){
    //console.log(renderContents);
    let value = '';
    _.each(renderContents, render => {
      value += render.value;
    })
    return value;
  }
}
