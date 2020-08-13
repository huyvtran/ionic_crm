import { Component, NgZone } from '@angular/core';
import { AlertController, LoadingController, NavController, NavParams, Platform } from 'ionic-angular';
import { File } from '@ionic-native/file';
import { FileTransfer } from '@ionic-native/file-transfer';
import { Zip } from '@ionic-native/zip';
import { ClmPlayPage } from '../index';
import { TranslateService } from '../../providers/index';

@Component({
  selector: 'page-clm-detail',
  templateUrl: 'clm-detail.html'
})
export class ClmDetailPage {
  clmName: string;
  clmProduct: string;
  clmDes: string;
  /**媒体的封面缩略图 */
  clmCover: string = 'assets/img/mundi_white.png';
  /**媒体所在文件夹名称，目前是一个固定值 */
  clmDir: string = 'clm';
  /**媒体包名称，值和媒体的ID相同 */
  packageName: string = '';
  packageURL: string = '';
  constructor(
    public alertCtrl: AlertController,
    public file: File,
    public loadCtrl: LoadingController,
    public navCtrl: NavController,
    public navParams: NavParams,
    public ngZone: NgZone,
    public plt: Platform,
    public transfer: FileTransfer,
    public zip: Zip,
    public translateService: TranslateService
  ) { }
  ionViewWillEnter() {
    if (this.navParams.data[0].id) {
      this.packageName = this.navParams.data[0].id.toString();
      this.clmName = this.navParams.data[0].name;
      this.clmDes = this.navParams.data[0].description;
      this.clmProduct = this.navParams.data[0].product__r.name;
      //缩略图读取应该是个网址
      //this.clmCover = config.clm_server + this.clmProduct + '/' + this.clmName + '/thumbnail.jpg';
    }
    if (this.navParams.data[0].url) {
      this.packageURL = this.navParams.data[0].url;
    }
  }
  /**
   * 播放媒体包
   */
  play() {
    this.navCtrl.push(ClmPlayPage, [this.packageName, this.clmName, 0, this.clmProduct, this.packageURL]);
  }
  /**
   * 点击缩略图按钮后应该做的事情
   */
  clickThumbnail() {
    this.play();
  }
}
