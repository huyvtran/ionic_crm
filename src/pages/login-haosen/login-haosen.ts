import { Component, NgZone } from '@angular/core';
import { NavController, AlertController, Events, LoadingController, Platform } from 'ionic-angular';
import { DomSanitizer } from '@angular/platform-browser';
import { Storage } from '@ionic/storage';
import { Network } from '@ionic-native/network';
import { LoginService, TranslateService, CRMUtils,MainService } from '../../providers/index';
import { MainPage } from '../index';
declare let wx: any;


@Component({
  selector: 'page-login-haosen',
  templateUrl: 'login-haosen.html'
})
export class LoginHaoSenPage {
  login: { username?: string, password?: string, serverid?: number } = {};
  customLogoUrl: any;
  findPwdMode = false;
  loader = false;
  acbox: number = 0;
  acboxClass = {
    acbox: true,
    boxhide: false
  };
  isAdmin = false;
  admin: any;
  usernameList: string[] = [];
  constructor(
    public loginService: LoginService,
    public events: Events,
    public navCtrl: NavController,
    public alertCtrl: AlertController,
    public loadingCtrl: LoadingController,
    public plt: Platform,
    public storage: Storage,
    public network: Network,
    public ngZone: NgZone,
    public translateService: TranslateService,
    public sanitizer: DomSanitizer,
    public mService:MainService
  ) {
  }

  ionViewDidEnter() {
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

      wx.ready(function(){
        // config信息验证后会执行ready方法，所有接口调用都必须在config接口获得结果之后，config是一个客户端的异步操作，所以如果需要在页面加载时就调用相关接口，则须把相关接口放在ready函数中调用来确保正确执行。对于用户触发时才调用的接口，则可以直接调用，不需要放在ready函数中。
        wx.hideOptionMenu();
      });
    });


    this.translateService.judgeLanguage();
    this.customLogoUrl = 'assets/img/mundi.png';
    this.storage.get('namecache').then(res => {
      if (res) {
        this.usernameList = JSON.parse(res);
        if (this.usernameList.length > 0) {
          this.login.username = this.usernameList[0];
        }
      }
    });
    this.storage.get('subList').then(res => {
      if (res) {
        let subList = JSON.parse(res);
        if (subList[4] && subList[4].body['value']) {
          this.customLogoUrl = this.sanitizer.bypassSecurityTrustResourceUrl('data:image/png;base64,' + subList[4].body['value'] + '');
        }
      }
    })
    this.plt.ready().then(() => {
      window['CRMUtils'] = new CRMUtils();
      /**注册date对象的format方法，默认用moment的format方法 */
      Date.prototype['format'] = function (format) {
        const o = {
          'y+': this.getYear(),
          'Y+': this.getYear(),
          'M+': this.getMonth() + 1,
          'D+': this.getDate(),
          'd+': this.getDate(),
          'h+': this.getHours(),
          'H+': this.getHours(),
          'm+': this.getMinutes(),
          's+': this.getSeconds(),
          'q+': Math.floor((this.getMonth() + 3) / 3),
          S: this.getMilliseconds(),
        };
        if (/(y+)/.test(format)) {
          format = format.replace(RegExp.$1, `${this.getFullYear()}`.substr(4 - RegExp.$1.length));
        }
        for (const k in o) {
          if (new RegExp(`(${k})`).test(format)) {
            format = format.replace(RegExp.$1, RegExp.$1.length === 1 ? o[k] : (`00${o[k]}`).substr(`${o[k]}`.length));
          }
        }
        return format;
      };

      //因为没用用函数闭包，所以下面方法的this调用的是login页面，所以会出错，应该用上面的扩展。
      // Date.prototype['format'] = (format, compareTime?: any) => {
      //   console.log(this);
      //   return moment(compareTime).format(format);
      // }
    });
  }

  ionViewWillEnter() {
    this.login.username = '';
    this.login.password = '';
    this.login.serverid = 0;
    this.findPwdMode = false;
    this.loader = false;
    this.acbox = 0;
    this.acboxClass.boxhide = false;
  }

  startPwdMode() {
    this.findPwdMode = true;
  }

  inputAdmin() {
  }

  endPwdMode() {
    this.findPwdMode = false;
    this.login.password = '';
  }
  showAutocomplete() {
    if (this.usernameList.length > 0) {
      this.acbox = 1;
    }
  }
  hideAutocomplete() {
    if (this.acbox < 2) {
      this.acboxClass.boxhide = true;
      setTimeout(() => {
        if (this.acbox < 2) {
          this.acbox = 0;
          this.acboxClass.boxhide = false;
        }
      }, 500);
    }
  }
  fixAutocomplete() {
    if (this.acbox === 1) {
      this.acbox = 2;
    }
  }
  closeAutocomplete() {
    if (this.acbox === 2) {
      this.acbox = 1;
      this.hideAutocomplete();
    }
  }
  selectItem(i) {
    this.login.username = this.usernameList[i];
    this.closeAutocomplete();
  }
  delItem(i) {
    if (this.acbox < 2) {
      this.acbox = 2;
      this.acboxClass.boxhide = false;
      setTimeout(() => {
        this.acboxClass.boxhide = false;
      }, 100);
    }
    this.usernameList.splice(i, 1);
    this.storage.set('namecache', JSON.stringify(this.usernameList));
    if (this.usernameList.length < 1) {
      this.acbox = 0;
    }
  }
  updateNameCache() {
    let index = this.usernameList.indexOf(this.login.username);
    if (index !== 0) {
      if (index > 0) {
        this.usernameList.splice(index, 1);
      }
      this.usernameList.unshift(this.login.username);
      this.storage.set('namecache', JSON.stringify(this.usernameList));
    }
  }

  onSubmit() {
    if (this.findPwdMode) {
      this.forgetPwd();
    } else {
      this.onLogin();
    }
  }
  onLogin() {
    this.loader = true;
    let username = this.login.username.trim();
    this.loginService.login(username, this.login.password, this.login.serverid).then((res: any) => {
      const resObj = res.json();
      let homeConfig = {};
      this.loginService.getHomeConfig().then( (res1:any) =>{
        if(res1 && res1.body ){
          // homeConfig = JSON.parse(res.body.value)
          window['homeConfig'] = res1.body.value
          this.loginService.getWaterConfig().then((res2: any) => {
            this.loginService.getCRMPowerSetting(resObj.body.profile.id, resObj.head.token).then((res3: any) => {
              if(res3.body && res3.body.result[0]){
                window['crmpowerSetting'] = res3.body.result[0];
              }
              if(res2.body && res2.body.value){
                window['waterMarkConfig'] = JSON.parse(res2.body.value)
              }
              this.loader = false;
              this.updateNameCache();
              this.events.publish('menu:control', true);
              this.navCtrl.setRoot(MainPage, homeConfig);
            }, (err) => {
              if(res2.body && res2.body.value){
                window['waterMarkConfig'] = JSON.parse(res2.body.value)
              }
              this.loader = false;
              this.updateNameCache();
              this.events.publish('menu:control', true);
              this.navCtrl.setRoot(MainPage, homeConfig);
            });
          }, (err2) => {
            // if(res2.body && res2.body.value){
            //   window['waterMarkConfig'] = JSON.parse(res2.body.value)
            // }
            this.loader = false;
            this.updateNameCache();
            this.events.publish('menu:control', true);
            this.navCtrl.setRoot(MainPage, homeConfig);
          })
        }
      })
    }, err => {
      let warning = err;
      if ( err && err.indexOf('密码错误') > -1) {
        warning = err;
      }
      let alert = this.alertCtrl.create({
        title: this.translateService.translateFunc('pad.login_login_failed'),
        subTitle: warning || '',
        buttons: [this.translateService.translateFunc('pad.action_ok')]
      });
      alert.onDidDismiss(() => {
        this.loader = false;
      });
      alert.present();
    });
  }

  getLogoFromServer() {
    this.loginService.getLogoFromServer().then((res: any) => {
      console.log(res);
    })
  }

  forgetPwd() {
    this.loader = true;
    this.updateNameCache();
    this.loginService.forgetPwd(this.login.username, this.login.serverid).then(() => {
      this.loader = false;
      let alert = this.alertCtrl.create({
        title: this.translateService.translateFunc('pad.login_send_mail'),
        subTitle: this.translateService.translateFunc('pad.login_mail_remind'),
        buttons: [this.translateService.translateFunc('pad.action_ok')]
      });
      alert.onDidDismiss(() => {
        this.endPwdMode();
      });
      alert.present();
    }, err => {
      this.loader = false;
      let alert = this.alertCtrl.create({
        title: this.translateService.translateFunc('pad.login_mail_send_failed'),
        subTitle: err,
        buttons: [this.translateService.translateFunc('pad.action_ok')]
      });
      alert.present();
    });
  }
  handleError(error: any) {
    console.error(error)
  }
}
