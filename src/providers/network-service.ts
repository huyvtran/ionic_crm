import { Injectable } from '@angular/core';
import { Http } from '@angular/http';
import { Platform } from 'ionic-angular'
import { Network } from '@ionic-native/network';
import { config } from '../utils/index';
import 'rxjs/add/operator/timeout';
import { TranslateService } from '../providers/translate-service';

/**网络检查服务 */
@Injectable()
export class NetworkService {
  onlineStatus: boolean = true;
  message: string = '';
  networkSubscriber;
  constructor(
    public http: Http,
    public network: Network,
    public plt: Platform,
    public translateService: TranslateService
  ) { }
  init() {
    if (this.plt.is('cordova')) {
      this.checkNetwork();
      this.networkSubscriber = this.network.onchange().subscribe(res => {
        if (res.type === 'online') {
          this.onlineStatus = true;
          setTimeout(() => {
            this.checkServer();
          }, 2000);
        } else if (res.type === 'offline') {
          this.onlineStatus = false;
          this.message = this.translateService.translateFunc('pad.network_offline');
          console.log('check fail network none');
        } else {
          this.checkNetwork();
        }
      });
    } else {
      this.checkServer();
    }
  }
  checkNetwork() {
    if (this.network.type === 'none') {
      this.onlineStatus = false;
      this.message = this.translateService.translateFunc('pad.network_offline');
      console.log('check fail network none');
    } else {
      this.checkServer();
    }
  }
  checkServer() {
    this.http.options(config.baseURL + config.api.index_menu).timeout(10000).subscribe(res => {
      if (res.ok) {
        this.onlineStatus = true;
        this.message = this.translateService.translateFunc('pad.network_online');
        console.log('check success');
      } else {
        this.onlineStatus = false;
        this.message = this.translateService.translateFunc('pad.network_server_failed');
        console.log('check fail bad server');
      }
    }, err => {
      this.onlineStatus = false;
      this.message = this.translateService.translateFunc('pad.network_connect_failed');
      console.log('check fail conn fail');
      console.log(err);
    });
  }
}
