import { Component, ComponentFactoryResolver, ViewChild, ViewContainerRef } from '@angular/core';
import { NavController, NavParams, Events, ViewController } from 'ionic-angular';
import { MainService, ListService, TranslateService } from '../../providers/index';
import { DetailForm } from '../../components/index';

@Component({
  selector: 'page-detail-info',
  templateUrl: 'detail-info.html'
})

export class DetailInfoPage {
  @ViewChild('insertDiv', { read: ViewContainerRef }) insertDiv: ViewContainerRef;

  constructor(
    public navCtrl: NavController,
    public navParams: NavParams,
    public mService: MainService,
    public cfr: ComponentFactoryResolver,
    public events: Events,
    public viewCtrl: ViewController,
    public listService: ListService,
    public translateService: TranslateService
  ) { }

  apiName: any;
  recordType: any;
  pageType: any;
  layout: any;
  describe: any;
  header: any;
  detailInstance: any;

  data: any;

  ionViewDidLoad() {
    this.data = this.navParams.data;
    this.apiName = this.navParams.data.object_describe_name;
    this.pageType = 'detail_page';
    this.recordType = this.navParams.data.record_type;
    Promise.all([
      this.mService.getLayoutByApiNameAndPageType(this.apiName, this.pageType, this.recordType),
      this.mService.getDescribeByApiName(this.apiName)]).then((res: any) => {
        this.layout = res[0].body;
        this.describe = res[1].body;
        this.renderDom(this.layout, this.describe, this.navParams.data);
      })
  }

  backToUp(){
    this.navCtrl.pop();
  }

  renderDom(layout, describe, data) {
    let component = layout.containers[0].components[0];
    if (component.header !== undefined) {
      this.header = component.header;
      if (component['header.i18n_key'] && this.translateService.translateFunc(layout['header.i18n_key']) !== layout['header.i18n_key']) {
        this.header = this.translateService.translateFunc(layout['header.i18n_key']);
      }
    } else {
      this.header = layout.display_name;
      if (layout['layout.i18n_key'] && this.translateService.translateFunc(layout['layout.i18n_key']) !== layout['layout.i18n_key']) {
        this.header = this.translateService.translateFunc(layout['layout.i18n_key']);
      }
    }
    //handler components
    this.insertDiv.clear();
    let form = this.cfr.resolveComponentFactory(DetailForm);
    this.detailInstance = this.insertDiv.createComponent(form);
    this.detailInstance.instance.layout = component;
    this.detailInstance.instance.describe = describe;
    this.detailInstance.instance.metadata = data;
    this.detailInstance.instance.isCalendar = true;
  }

  gotoDetailPage() {
    let record_type = this.data.record_type;
    let api_name = this.data.object_describe_name;
    this.mService.getLayoutByApiNameAndPageType(api_name, 'detail_page', record_type).then((res: any) => {
      const detail_layout = res.body;
      let flag = 'false';
      if (detail_layout.containers != undefined) {
        const components = detail_layout.containers[0].components;
        components.forEach(component => {
          if (component.type == 'related_list') {
            flag = 'true';
          }
        });
      }
      if (flag == 'true') {
        //this.events.publish('menu:control', false);
      }
      this.viewCtrl.dismiss([this.data, '', 'detail']);
    })
  }
}
