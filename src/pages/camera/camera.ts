/// <reference path="../../wechat/wechat.d.ts"/>
import { Component, NgZone } from "@angular/core";
import {
  NavParams,
  NavController,
  ActionSheetController,
  AlertController,
  LoadingController,
  ModalController,
  Events,
  Button
} from "ionic-angular";
import { Http } from "@angular/http";
import {
  ImageService,
  TranslateService,
  IdGeneratorService,
  MainService,
  HttpService
} from "../../providers/index";
import { config, UserInfo } from "../../utils/index";
import { DomSanitizer } from '@angular/platform-browser';
import _ from "lodash";
declare let wx: any;

@Component({
  templateUrl: "camera.html",
  selector: "page-camera"
})
export class CameraPicker {
  constructor(
    public imgService: ImageService,
    public navParams: NavParams,
    public navCtrl: NavController,
    public ngZone: NgZone,
    public actionSheet: ActionSheetController,
    public translateService: TranslateService,
    public userInfo: UserInfo,
    public IdService: IdGeneratorService,
    public alertCtrl: AlertController,
    public loadingCtrl: LoadingController,
    public modalController: ModalController,
    public events: Events,
    public mService: MainService,
    public http: Http,
    public httpService: HttpService,
    public sanitizer: DomSanitizer,
  ) {
    //this.checkDir();
    this.getWxConfig();
    if (this.navParams.data["value"]) {
      const values = this.navParams.data["value"];
      this.getPicFromServer(values);
    }
  }

  /**具有拍照功能的对象 */
  paramObject: any;
  /**最大上传数量 */
  maxUploadCount: number;
  /**最小上传数量 */
  minUploadCount: number;
  /**该对象的图片是否已经上传到服务器 */
  isUploadToServer: boolean;
  /**本地存储路径 */
  localFolder: string;
  /**未上传到服务器图片的列表 */
  unUploadList: any = [];
  /**未上传的时候显示的封面 */
  imgCover: string = "assets/img/add_image.png";
  /**图片文件夹 */
  filePath: string = "crmPhotos";
  /**目录是否存在 */
  isFilePathExist = true;
  /**当前拍照（选择照片对象路径） */
  path: any;
  /**当前拍照对象 */
  image: any;
  /**组件标题 */
  header: any;
  /**keyList */
  keyList = [];
  /**微信serverIds */
  serverIds = [];
  /**localIds */
  wxLocalIds = [];

  backToUp() {
    let alert = this.alertCtrl.create({
      title: "提示",
      subTitle: "是否保存并返回？",
      buttons: [
        {
          text: "是",
          handler: () => {
            this.saveToData();
            //this.navCtrl.pop();
          }
        },
        {
          text: "否",
          handler: () => {
            this.navCtrl.pop();
          }
        }
      ]
    });
    alert.present();
  }

  getWxConfig() {
    const body = {
      url: window.location.href.split("#")[0]
    };
    this.mService.getWxData(body).then((res: any) => {
      //console.log('wx.config res ======> ', res);
      wx.config({
        beta: true,
        signature: res.data.signature,
        appId: res.data.appId,
        nonceStr: res.data.noncestr,
        timestamp: res.data.timestamp,
        jsApiList: [
          "chooseImage",
          "uploadImage",
          "downloadImage",
          "getLocalImgData",
          "checkJsApi",
          "previewImage"
        ]
      });
    });
  }

  deletePics(picId: any) {
    _.each(this.unUploadList, upload => {
      if (upload.key === picId) {
        this.unUploadList.splice(this.unUploadList.indexOf(upload), 1);
        this.keyList.splice(this.keyList.indexOf(picId), 1);
      }
    })
    //this.navParams.data["value"] = this.;
  }

  getPicFromServer(picIds: any) {
    //todo
    const serverUrl = config.file_server + config.api.upload_image;
    _.each(picIds, picId => {
      this.unUploadList.push({ key: picId, url: serverUrl.replace("{key}", picId + '?token=' + this.userInfo.token) });
      this.keyList.push(picId);
    });
  }

  previewImage(picId: any, index: any) {
    const showUrls = [];
    let safeStr = 'http'
    let canPreView = _.includes(picId.url, safeStr)
    let isObject = _.isObject(picId.url)

    console.log('canpreview', canPreView)
    console.log('isObject', isObject)
    console.log(picId.url)
    if (!canPreView || isObject) {
      let alertBox = this.alertCtrl.create({
        title: '提示',
        subTitle: '保存后才能预览！',
        buttons: [{
          text: 'ok'
        }]
      }).present()
      return
    }


    showUrls.push(picId.url);
    _.each(this.unUploadList, upload => {
      showUrls.push(upload.url);
    })

    wx.previewImage({
      current: picId.url, // 当前显示图片的http链接
      urls: showUrls // 需要预览的图片http链接列表
    });

  }

  pictureActionSheet = () => {
        wx.chooseImage({
          count: 9, // 默认9
          sizeType: ["original", "compressed"], // 可以指定是原图还是压缩图，默认二者都有
          sourceType: ["album", "camera"], // 可以指定来源是相册还是相机，默认二者都有
          success: res => {
            var localIds = res.localIds; // 返回选定照片的本地ID列表，
            this.wxLocalIds = res.localIds;
            for (let i = 0; i < localIds.length; i++) {
              wx.uploadImage({
                localId: localIds[i],
                isShowProgressTips: 1, // 默认为1，显示进度提示
                success: res1 => {
                  var serverId = res1.serverId; // 返回图片的服务器端ID
                  wx.checkJsApi({
                    jsApiList: ["getLocalImgData"],
                    success: (res) => {
                      if (res.checkResult.getLocalImgData) {
                        wx.getLocalImgData({
                          localId: localIds[i],
                          success: res2 => {
                            let localData = res2.localData;
                            localData = localData.replace("jgp", "jpeg");
                            localData = this.sanitizer.bypassSecurityTrustResourceUrl(localData)
                            this.unUploadList.push({ key: serverId, url: localData });
                          }
                        });
                      } else {
                        this.unUploadList.push({ key: serverId, url: this.sanitizer.bypassSecurityTrustResourceUrl(localIds[i]) });
                      }
                      this.serverIds.push(serverId);
                      this.keyList.push(serverId);
                      this.upload([serverId]);
                    }
                  })
                  if (i === localIds.length - 1&&this.unUploadList<9) {
                    let alert = this.alertCtrl.create({
                      title: '提示',
                      subTitle: '是否继续上传图片？',
                      buttons: [
                        {
                          text: '是',
                          handler: () => {
                            this.pictureActionSheet();
                          }
                        },
                        {
                          text: '否',
                          handler: () => {

                          }
                        }
                      ]
                    })
                    alert.present();
                  }
                }
              });

            }
            // andriod中localId可以作为img标签的src属性显示图片；
            // 而在IOS中需通过上面的接口getLocalImgData获取图片base64数据，从而用于img标签的显示
          }
        });
  };

  saveToData = () => {
    _.each(this.serverIds, id => {
      if (this.keyList.indexOf(id) < 0) {
        this.keyList.push(id);
      }
    })
    this.navParams.data["value"] = this.keyList;
    this.events.publish("form-comp:pickValue", [{ name: this.keyList, number: this.keyList.length }]);
    this.navCtrl.pop();
  };

  upload(serverIds) {
    // const uploadUrl = 'http://192.168.188.158:8091/rest/api/uploadFile';
    const uploadUrl = config.weixin_server + '/rest/api/uploadFile'
    let body = {
      token: this.userInfo.token,
      media_id: serverIds
    }
    this.httpService.post(uploadUrl, body, true).then(res => {
      const resObj = res;
      if (resObj.head && resObj.head.code == 200) {
        //remind success
      } else {
        // remind failed
        let alert = this.alertCtrl.create({
          title: "提示",
          subTitle: '操作失败',
          buttons: ["确定"]
        });
        alert.present();
      }
    });
  }
}
