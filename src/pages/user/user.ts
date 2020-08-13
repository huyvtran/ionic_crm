import { Component } from '@angular/core';
import { AlertController, Events, LoadingController, NavController } from 'ionic-angular';
import { Title } from '@angular/platform-browser';
import { Storage } from '@ionic/storage';
import { MainService, LoginService, TranslateService } from '../../providers/index';
import { LoginHaoSenPage, AboutPage } from '../index';
import { UserInfo, config } from '../../utils/index';

@Component({
  selector: 'page-user',
  templateUrl: 'user.html'
})
export class UserPage {
  isRefresh: boolean = false;
  constructor(
    public alertCtrl: AlertController,
    public events: Events,
    public loadCtrl: LoadingController,
    public navCtrl: NavController,
    public mainService: MainService,
    public login: LoginService,
    public userInfo: UserInfo,
    public translateService: TranslateService,
    public storage: Storage,
    public titleService: Title
  ) {
  }
  refreshcache() {
    this.isRefresh = true;
    this.mainService.refreshBasicData(true).then(() => {
      this.isRefresh = false;
      let alert = this.alertCtrl.create({
        title: this.translateService.translateFunc('pad.alert_remind_title'),
        subTitle: this.translateService.translateFunc('pad.user_setting_update_subtitle'),
        buttons: [this.translateService.translateFunc('pad.action_ok')]
      });
      alert.onDidDismiss(() => {
        this.logout();
      });
      alert.present();
    });
  }

  changeLanguage() {
    this.storage.get('subList').then(rest => {
      let res = JSON.parse(rest);
      if (res[2].body) {
        let languageSettings = [
        ]
        const countTranslate = [];
        for (let x in res[2].body) {
          window[x] = res[2].body[x];
          countTranslate.push(x);
        }
        if (countTranslate.length > 0) {
          countTranslate.forEach(trans => {
            languageSettings.push({
              text: this.translateService.translateFunc('pad.user_setting_lang_' + trans),
              value: trans
            })
          })
        }
        let alert = this.alertCtrl.create();
        alert.setTitle(this.translateService.translateFunc('pad.user_setting_lang_title'));
        languageSettings.forEach(lang => {
          if (lang.value == config.default_language) {
            alert.addInput({
              type: 'radio',
              label: lang.text,
              value: lang.value,
              checked: true
            })
          } else {
            alert.addInput({
              type: 'radio',
              label: lang.text,
              value: lang.value
            })
          }

        })
        alert.addButton(this.translateService.translateFunc('pad.action_cancel'));
        alert.addButton({
          text: this.translateService.translateFunc('pad.action_ok'),
          handler: data => {
            if (data !== 'more') {
              config.default_language = data;
              this.storage.set('default_language', config.default_language)
              this.translateService.localTranslateObject = window[config.default_language];
            }
          }
        })
        alert.present();
      }
    })
  }

  logout() {
    this.login.logout().then(() => {
      this.events.publish('menu:control', false);
      this.navCtrl.setRoot(LoginHaoSenPage);
    });
  }
  gotoAbout() {
    this.navCtrl.push(AboutPage);
  }
  updatePwd() {
    let prompt = this.alertCtrl.create({
      title: this.translateService.translateFunc('pad.user_change_password_title'),
      inputs: [
        {
          name: 'oldpassword',
          placeholder: this.translateService.translateFunc('pad.user_old_password'),
          type: 'password',
        },
        {
          name: 'password',
          placeholder: this.translateService.translateFunc('pad.user_new_password'),
          type: 'password',
        },
        {
          name: 'mspassword',
          placeholder: this.translateService.translateFunc('pad.user_confirm_password'),
          type: 'password',
        },
      ],
      buttons: [
        {
          text: this.translateService.translateFunc('pad.action_cancel'),
          handler: data => {

          }
        },
        {
          text: this.translateService.translateFunc('pad.action_ok'),
          handler: data => {
            if (!data.oldpassword) {
              let alert = this.alertCtrl.create({
                title: this.translateService.translateFunc('pad.user_failed_title'),
                subTitle: this.translateService.translateFunc('pad.user_input_old_password'),
                buttons: [this.translateService.translateFunc('pad.action_ok')]
              });
              alert.present();
            } else if (!data.password || !data.mspassword) {
              let alert = this.alertCtrl.create({
                title: this.translateService.translateFunc('pad.user_failed_title'),
                subTitle: this.translateService.translateFunc('pad.user_input_new_password'),
                buttons: [this.translateService.translateFunc('pad.action_ok')]
              });
              alert.present();
            } else if (data.password != data.mspassword) {
              let alert = this.alertCtrl.create({
                title: this.translateService.translateFunc('pad.user_failed_title'),
                subTitle: this.translateService.translateFunc('pad.user_input_different'),
                buttons: [this.translateService.translateFunc('pad.action_ok')]
              });
              alert.present();
            } else {
              this.login.updatePwd(this.userInfo.userid, data.oldpassword, data.mspassword).then(() => {
                let alert = this.alertCtrl.create({
                  title: this.translateService.translateFunc('pad.alert_remind_title'),
                  subTitle: this.translateService.translateFunc('pad.user_change_success'),
                  buttons: [this.translateService.translateFunc('pad.action_ok')]
                });
                alert.present();
              }, err => {
                let alert = this.alertCtrl.create({
                  title: this.translateService.translateFunc('pad.login_mail_send_failed'),
                  subTitle: err,
                  buttons: [this.translateService.translateFunc('pad.action_ok')]
                });
                alert.present();
              });
            }
          }
        }
      ]
    });
    prompt.present();
  }

  ionViewDidEnter(){
    this.titleService.setTitle('SFE');
  }
}
