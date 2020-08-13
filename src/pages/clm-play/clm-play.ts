import { Component } from '@angular/core';
import { AlertController, ActionSheetController, Events, NavController, NavParams, Platform, ViewController } from 'ionic-angular';
import { File } from '@ionic-native/file';
import { FileTransfer } from '@ionic-native/file-transfer';
import { TranslateService } from '../../providers/index';
import { AddPage } from '../index';
@Component({
  selector: 'page-clm-play',
  templateUrl: 'clm-play.html'
})
export class ClmPlayPage {
  playURL: string = '';
  clmURL: string = '';
  clmDir: string = 'clm';
  clmName: string;
  /**媒体包内部发送message事件时触发的函数 */
  clmCallback;
  /**
   * 媒体文件的显示类型
   * - 0: 通过媒体详情页进入，完成后有询问环节
   * - 1: 通过拜访记录页进入，完成后直接返回并传输数据，不询问
   */
  clmPopType: number;
  clmStartTime: number;
  constructor(
    public alertCtrl: AlertController,
    public actionCtrl: ActionSheetController,
    public events: Events,
    public file: File,
    public navCtrl: NavController,
    public navParams: NavParams,
    public plt: Platform,
    public transfer: FileTransfer,
    public viewCtrl: ViewController,
    public translateService: TranslateService
  ) {
    let me = this;
    this.clmCallback = function (c) {
      me.getData(c);
    }
  }
  ionViewWillEnter() {
    this.viewCtrl.showBackButton(false);
  }
  ionViewDidEnter() {
    this.clmURL = this.navParams.data[4] ? this.navParams.data[4] : this.clmDir + '/' + this.navParams.data[0] + '/index.html?timestemp=' + (new Date()).getTime();
    window.addEventListener('message', this.clmCallback);
    this.events.publish('menu:control', false);
    this.loadClm();
    this.clmName = this.navParams.data[1];
    if (this.navParams.data[2]) {
      this.clmPopType = 1;
    } else {
      this.clmPopType = 0;
    }
    this.clmStartTime = new Date().getTime();
  }
  ionViewWillLeave() {
    window.removeEventListener('message', this.clmCallback);
    this.events.publish('menu:control', true);
  }
  /**
   * 接收到表单数据的时候，显示一个成功的提示框，并执行下一步操作
   * @param content 接收到的媒体表单信息
   */
  showinfo(content) {
    let alert = this.alertCtrl.create({
      title: this.translateService.translateFunc('pad.alert_operate_success'),
      buttons: [this.translateService.translateFunc('pad.action_ok')]
    });
    alert.onDidDismiss(() => {
      if (this.navParams.data[2]) {
        this.addCallBack(content);
      } else {
        this.actionSheetBack(content);
      }
    });
    alert.present();
  }
  /**
   * 加载媒体文件的过程
   */
  loadClm() {
    this.playURL = this.clmURL;
  }
  /**
   * message事件触发的函数调用的内部方法
   * @param event message事件返回的参数
   */
  getData(event) {
    this.showinfo(event.data);
  }
  /**
   * 媒体详情页进入的播放执行完成后，显示的action sheet
   * @param content 传输的表单数据
   */
  actionSheetBack(content?: any) {
    console.log(this.navParams);
    let asheet = this.actionCtrl.create({
      title: this.translateService.translateFunc('pad.clm_media_operations'),
      buttons: [{
        text: this.translateService.translateFunc('pad.call_add_report'),
        handler: () => {
          let addParam = [
            'call',
            {
              action: 'ADD',
              action_code: 'call_history',
              label: this.translateService.translateFunc('pad.call_add_report'),
              record_type: 'report',
              show_when: ['index'],
              update_val: '2'
            },
            'report',
            undefined,
            undefined,
            {
              id: this.navParams.data[0],
              name: this.clmName,
              survey: JSON.stringify(content),
              start: this.clmStartTime,
              end: new Date().getTime(),
              product: this.navParams.data[1],
              url: this.navParams.data[4]
            }
          ];
          this.navCtrl.push(AddPage, addParam);
        }
      }, {
        text: this.translateService.translateFunc('pad.action_exit'),
        handler: () => {
          this.navCtrl.pop();
        }
      }]
    });
    asheet.present();
  }
  /**
   * 向拜访记录页返回数据
   * @param content 拜访记录页的返回数据
   */
  addCallBack(content?: any) {
    this.events.publish('clm:survey', {
      id: this.navParams.data[0],
      survey: content ? JSON.stringify(content) : undefined
    });
    this.navCtrl.pop();
  }
  /**
   * 点击右上角返回按钮执行的方法
   */
  buttonBack() {
    if (this.navParams.data[2]) {
      this.addCallBack();
    } else {
      this.actionSheetBack();
    }
  }
}
