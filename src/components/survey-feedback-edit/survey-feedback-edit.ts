import { Component } from '@angular/core';
import { Events, ModalController, NavController, Platform, NavParams} from 'ionic-angular';
import { File } from '@ionic-native/file';
import _ from 'lodash';
import { ClmPickListPage, ClmListItem, ClmPlayPage } from '../../pages/index';
import { MainService, TranslateService } from '../../providers/index';

@Component({
  selector: 'comp-survey-feedback-edit',
  templateUrl: 'survey-feedback-edit.html'
})
export class SurveyFeedbackEditComp {
  clmDir: string = 'clm';
  surveyData: SurveyDataItem[] = [];
  surveyDataBeforeEdit: SurveyDataPreItem[] = [];
  clmDownloadedList: { [index: string]: ClmListItem } = {};
  listid: number = 0;
  callId: string = '';
  constructor(
    public events: Events,
    public file: File,
    public mainService: MainService,
    public modalCtrl: ModalController,
    public navCtrl: NavController,
    public plt: Platform,
    public translateService: TranslateService,
    public navParams: NavParams
  ) { }
  ngOnInit() {
    this.events.subscribe('clm:survey', res => {
      if (res.survey && this.surveyData[this.listid] !== undefined) {
        this.surveyData[this.listid].survey = res.survey;
      }
    });
  }
  init() {
    let preList = this.readPreList();
    if (this.plt.is('cordova')) {
      let dlList = this.readDownloadedList();
      Promise.all([preList, dlList]).then(() => {
        for (let sd in this.surveyData) {
          let sdItem = this.surveyData[sd];
          if (this.clmDownloadedList[sdItem.id]) {
            this.surveyData[sd].isDownloaded = true;
          }
        }
      });
    } else {
      Promise.all([preList]).then(() => {
        for (let it in this.surveyData) {
          if (Math.random() > 0.5) {
            this.surveyData[it].isDownloaded = true;
          }
        }
      });
    }
  }
  ngOnDestroy() {
    this.events.unsubscribe('clm:survey');
  }
  readPreList() {
    let searchParam = {
      "joiner": "and",
      "criterias": [
        { "field": "call", "operator": "==", "value": [] }
      ],
      "orderBy": "create_time",
      "order": "asc",
      "objectApiName": 'survey_feedback',
      "pageSize": 10000,
      "pageNo": 1
    };
    searchParam.criterias[0].value.push(this.callId);
    return this.mainService.getSearchData(searchParam).then((res: any) => {
      let clmResult = res.body.result;
      for (let clmr of clmResult) {
        let surveyItem: SurveyDataItem = {
          id: clmr.clm_presentation,
          name: clmr.clm_presentation__r.name,
          reaction: clmr.reaction,
          survey: undefined,
          isDownloaded: false
        };
        if (clmr.survey_answer) {
          surveyItem.survey = clmr.survey_answer;
        }
        this.surveyData.push(surveyItem);
        let surveyPreItem: SurveyDataPreItem = JSON.parse(JSON.stringify(surveyItem));
        surveyPreItem['version'] = clmr.version;
        surveyPreItem['dataid'] = clmr.id;
        this.surveyDataBeforeEdit.push(surveyPreItem);
      }
      if (this.navParams.data[2].fakeFlag === 'sub') {
        this.handlerVitrulData(this.navParams.data[2]);
      }
      return Promise.resolve();
    })
  }
  //
  handlerVitrulData(realData) {
    if (realData._cascade) {
      if (realData._cascade.create && !_.isEmpty(realData._cascade.create)) {
        if (realData._cascade.create.call_survey_feedback_list && realData._cascade.create.call_survey_feedback_list.length > 0) {
          _.each(realData._cascade.create.call_survey_feedback_list, survyData => {
            let surveyItem: SurveyDataItem = {
              id: survyData.clm_presentation,
              name: survyData.clm_presentation__r.name,
              reaction: survyData.reaction,
              survey: undefined,
              isDownloaded: false
            };
            if (survyData.survey_answer) {
              surveyItem.survey = survyData.survey_answer;
            }
            this.surveyData.push(surveyItem)
          })
        }
      }
      if (realData._cascade.update && !_.isEmpty(realData._cascade.update)) {
        if (realData._cascade.update.call_survey_feedback_list && realData._cascade.update.call_survey_feedback_list.length > 0) {
          _.each(realData._cascade.update.call_survey_feedback_list, survyData => {
            let surveyItem: SurveyDataItem = {
              id: survyData.clm_presentation,
              name: survyData.clm_presentation__r.name,
              reaction: survyData.reaction,
              survey: undefined,
              isDownloaded: false
            };
            _.each(this.surveyData, (data, index) => {
              if (data.id === surveyItem.id) {
                this.surveyData.splice(index, 1, surveyItem);
              }
            })
          })
        }
      }
      if (realData._cascade.delete && !_.isEmpty(realData._cascade.delete)) {
        if (realData._cascade.delete.call_survey_feedback_list && realData._cascade.delete.call_survey_feedback_list.length > 0) {
          _.each(realData._cascade.delete.call_survey_feedback_list, survyData => {
            let surveyItem: SurveyDataItem = {
              id: survyData.clm_presentation,
              name: survyData.clm_presentation__r.name,
              reaction: survyData.reaction,
              survey: undefined,
              isDownloaded: false
            };
            _.each(this.surveyData, (data, index) => {
              if (data.id === surveyItem.id) {
                this.surveyData.splice(index, 1);
              }
            })
          })
        }
      }
    }
  }
  /**读取本地所有媒体文件列表 */
  readDownloadedList() {
    return this.file.listDir(this.file.dataDirectory, this.clmDir).then(res => {
      let downloadItem: Promise<void>[] = [];
      for (let re of res) {
        if (re.isDirectory) {
          downloadItem.push(this.readDownloadedItem(re));
        }
      }
      return Promise.all(downloadItem);
    });
  }
  /**读取单个媒体文件内信息 */
  readDownloadedItem(re) {
    return this.file.readAsText(this.file.dataDirectory + this.clmDir + '/' + re.name + '/', 'clminfo.json').then(res2 => {
      let resObj: ClmListItem = JSON.parse(res2);
      let clmItem: ClmListItem = {
        id: resObj.id,
        name: resObj.name,
        version: resObj.version,
        download: true,
        select: false
      };
      this.clmDownloadedList[resObj.id] = clmItem;
    }, err => {
    });
  }
  /**打开媒体添加窗口 */
  openmodal(surveyData) {
    this.navCtrl.push(ClmPickListPage, {
      surveyData
    })
    // let listModal = this.modalCtrl.create(ClmPickListPage, this.surveyData);
    // listModal.onDidDismiss((res: ClmListItem) => {
    //   if (res) {
    //     this.addSurvey(res.id, res.name, res.download, res.url, res.product);
    //   }
    // });
    // listModal.present();
    
  }
  /**添加新的媒体信息 */
  addSurvey(id: string, name: string, download: boolean, url?: string, product?: any) {
    let surveyItem: SurveyDataItem = {
      id: id,
      name: name,
      isDownloaded: download,
      reaction: undefined,
      survey: undefined,
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
    // let alert = this.alertCtrl.create({
    //   title: this.translateService.translateFunc('pad.clm_alert_cant_open_title'),
    //   subTitle: this.translateService.translateFunc('pad.clm_alert_cant_subtitle'),
    //   buttons: [this.translateService.translateFunc('pad.action_ok')]
    // });
    // if (this.plt.is('cordova')) {
    //   console.log('11111111'),
    //   this.file.checkFile(this.file.dataDirectory + this.clmDir + '/' + id + '/', 'index.html').then(res => {
    //     if (res) {
    //       this.listid = i;
    //       this.navCtrl.push(ClmPlayPage, [id, name, 1, surveyd.product, surveyd.url]);
    //     } else {
    //       this.surveyData[i].isDownloaded = false;
    //       alert.present();
    //     }
    //   }, err => {
    //     this.surveyData[i].isDownloaded = false;
    //     alert.present();
    //   });
    // } else {
    //   console.log('1112222111'),
    //   this.listid = i;
    //   this.mainService.getDataByApiNameAndId('clm_presentation', id).then((res: any) => {
    //     if(res.head && res.head.code === 200) {
    //       this.navCtrl.push(ClmPlayPage, [id, name, 1, surveyd.product, res.body.url]);
    //     }
    //   })
    // }
    this.listid = i;
    this.mainService.getDataByApiNameAndId('clm_presentation', id).then((res: any) => {
      if(res.head && res.head.code === 200) {
        this.navCtrl.push(ClmPlayPage, [id, name, 1, surveyd.product, res.body.url]);
      }
    })
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
  /**导出媒体数据变更 */
  exportSurveyData() {
    interface SurveyInsertItem {
      clm_presentation: string;
      clm_presentation__r: {
        id: string;
        name: string;
      };
      reaction: string;
      survey_answer?: string;
    }
    interface SurveyUpdateItem {
      id: string;
      reaction: string;
      version: string;
      survey_answer?: string;
    }
    interface SurveyDeleteItem {
      id: string;
    }
    // 预先定义一些数据比对的变量
    let dataDiff: { [index: string]: string } = {};
    let itemInsert: SurveyInsertItem[] = [];
    let itemUpdate: SurveyUpdateItem[] = [];
    let itemDelete: SurveyDeleteItem[] = [];
    // 在dataDiff当中保存修改前信息的id和index
    for (let s1 in this.surveyDataBeforeEdit) {
      dataDiff[this.surveyDataBeforeEdit[s1].id] = s1;
    }
    // 用修改后的信息逐个按clm_presentation的id进行比对
    for (let s2 of this.surveyData) {
      if (dataDiff[s2.id]) {
        let s2index: string = dataDiff[s2.id];
        // 将dataDiff当中依然还在的项目移除
        dataDiff[s2.id] = '';
        // 如果reaction被改了或者添加了survey，执行update
        if (s2.reaction && this.surveyDataBeforeEdit[s2index].reaction !== s2.reaction) {
          itemUpdate.push({
            id: this.surveyDataBeforeEdit[s2index].dataid,
            reaction: s2.reaction,
            version: this.surveyDataBeforeEdit[s2index].version
          });
        } else if (!this.surveyDataBeforeEdit[s2index].survey && s2.survey) {
          itemUpdate.push({
            id: this.surveyDataBeforeEdit[s2index].dataid,
            reaction: s2.reaction,
            survey_answer: s2.survey,
            version: this.surveyDataBeforeEdit[s2index].version
          });
        }
      } else {
        // 原来没有的数据，执行insert
        itemInsert.push({
          clm_presentation: s2.id,
          clm_presentation__r: {
            id: s2.id,
            name: s2.name
          },
          reaction: s2.reaction,
          survey_answer: s2.survey
        });
      }
    }
    // 到这里剩下有值的dataDiff都已经不在新data里面了，对其执行删除操作
    for (let did in dataDiff) {
      if (dataDiff[did]) {
        itemDelete.push({ id: this.surveyDataBeforeEdit[dataDiff[did]].dataid });
      }
    }
    return [itemInsert, itemUpdate, itemDelete];
  }
}
export interface SurveyDataItem {
  id: string;
  name: string;
  isDownloaded: boolean;
  reaction: string;
  survey: string;
  url?: string;
  product?: any;
}
export interface SurveyDataPreItem extends SurveyDataItem {
  version: string;
  dataid: string;
}
