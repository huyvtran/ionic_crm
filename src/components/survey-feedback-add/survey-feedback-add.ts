import { Component } from '@angular/core';
import { Events, ModalController, NavController, Platform } from 'ionic-angular';
import { File } from '@ionic-native/file';
import { ClmPickListPage, ClmListItem, ClmPlayPage } from '../../pages/index';
import { TranslateService } from '../../providers/index';

@Component({
  selector: 'comp-survey-feedback-add',
  templateUrl: 'survey-feedback-add.html'
})
export class SurveyFeedbackAddComp {
  clmDir: string = 'clm';
  surveyData: SurveyDataItem[] = [];
  listid: number = 0;
  constructor(
    // public alertCtrl: AlertController,
    public events: Events,
    public file: File,
    public modalCtrl: ModalController,
    public navCtrl: NavController,
    public plt: Platform,
    public translateService: TranslateService
  ) { }
  ngOnInit() {
    this.events.subscribe('clm:survey', res => {
      if (res.survey && this.surveyData[this.listid] !== undefined) {
        this.surveyData[this.listid].survey = res.survey;
      }
    });
  }
  ngOnDestroy() {
    this.events.unsubscribe('clm:survey');
  }
  /**打开媒体添加窗口 */
  openmodal(surveyData) {
    // let listModal = this.modalCtrl.create(ClmPickListPage, this.surveyData);
    // listModal.onDidDismiss((res: ClmListItem) => {
    //   if (res) {
    //     this.addSurvey(res.id, res.name, res.download, res.url, res.product);
    //   }
    // });
    // listModal.present();
    this.navCtrl.push(ClmPickListPage, {
      surveyData
    })
  }
  /**添加新的媒体信息 */
  addSurvey(id: string, name: string, download: boolean, url: string, product?: any) {
    let surveyItem: SurveyDataItem = {
      id: id,
      name: name,
      isDownloaded: download,
      reaction: undefined,
      url: url,
      product: product
    };
    this.surveyData.push(surveyItem);
  }
  /**删除一条媒体信息 */
  delSurvey(id: number) {
    if (this.surveyData[id] !== undefined) {
      this.surveyData.splice(id, 1);
    }
  }
  /**开启媒体播放器 */
  openClmPlayer(id: string, name: string, i: number, surveyd: any) {
    this.listid = i;
    this.navCtrl.push(ClmPlayPage, [id, name, 1, surveyd.product, surveyd.url]);

  }
  /**开启媒体下载器 TODO:当前没有下载器因此弹出一个提示框 */
  // openClmDownloader() {
  //   let alert = this.alertCtrl.create({
  //     title: this.translateService.translateFunc('pad.clm_alert_cant_open_title'),
  //     subTitle: this.translateService.translateFunc('pad.clm_alert_nodownload_subtitle'),
  //     buttons: [this.translateService.translateFunc('pad.action_ok')]
  //   });
  //   alert.present();
  // }
}
export interface SurveyDataItem {
  id: string;
  name: string;
  isDownloaded: boolean;
  reaction: string;
  survey?: string;
  url?: string;
  product?: any
}
