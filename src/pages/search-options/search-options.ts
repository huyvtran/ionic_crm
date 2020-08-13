import { Component } from '@angular/core';
import { NavParams, NavController, Events } from 'ionic-angular';
import _ from 'lodash';
import { TranslateService } from '../../providers/index';

@Component({
  selector: 'page-search-options',
  templateUrl: 'search-options.html'
})

export class SearchOptions {
  constructor(
    public navParams: NavParams,
    public events: Events,
    public nav: NavController,
    public translateService: TranslateService
  ) { }

  placeHolder: any;
  searchBoxValue = "";
  itemLists = [];
  item: any;
  searchVisible = true;

  itemSearchList = [];

  ionViewDidLoad() {
    this.item = this.navParams.data;
    if (this.item.options) {
      this.placeHolder = this.translateService.translateFunc('pad.partici_search_text') + this.item.name;
      this.itemLists = _.cloneDeep(this.item.options);
    }
  }

  pickValue(item) {
    if(typeof item.value ==='number'){
      item.value +='';
    }
    this.events.publish('form-comp:optionsSearch', item);
    this.nav.pop();
  }

  backToUp() {
    this.events.publish('form-comp:optionsSearch', this.item);
    this.nav.pop();
  }

  searchList() {
    this.itemSearchList = [];
    if (this.searchBoxValue) {
      this.itemLists.forEach(item => {
        if (item.label.indexOf(this.searchBoxValue) > -1) {
          this.itemSearchList.push(item);
        }
      })
    } else {
      this.itemSearchList = _.cloneDeep(this.item.options);
    }
    this.itemLists = this.itemSearchList;
  }

}
