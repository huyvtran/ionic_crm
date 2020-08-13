import { Component } from '@angular/core';
import { NavController, Events } from 'ionic-angular';
import { PickList } from '../../pages/index';
import { TranslateService } from '../../providers/index';

@Component({
  selector: 'form-comp',
  templateUrl: 'form-comp.html'
})
export class FormComp {
  components: any;
  FormItems = [];
  recordType: any;
  apiName: any;
  layout: any;
  pickValue: any;
  //header: any;
  constructor(
    public nav: NavController,
    public events: Events,
    public translateService: TranslateService
  ) { }

  ngOnInit() {
  }

  tapAction(e, item) {
    const itemApiName = item.key;
    this.events.subscribe('form-comp:pickList', (pickValue: any) => {
      item.value = pickValue[0].name;
    })
    this.nav.push(PickList, itemApiName);
  }

  ionViewWillEnter() {
  }

  onSubmit(e) {

  }

  ngOnDestroy() {
    this.events.unsubscribe('form-comp:pickList');
  }
}
