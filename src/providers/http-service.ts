import { Injectable } from '@angular/core';
import { Http, Headers, RequestOptions, URLSearchParams } from '@angular/http';
import { Loading, LoadingController, ToastController } from 'ionic-angular';
import { Storage } from '@ionic/storage';
import { UserInfo } from '../utils/index';
import * as createHash from 'create-hash';
import { TranslateService } from './translate-service';

/**
 * 数据请求的通用底层服务
 */
@Injectable()
export class HttpService {
  requestCount: number = 0;
  lastUpdateTime: number;
  ldc: Loading;
  constructor(public http: Http, public storage: Storage, public userInfo: UserInfo, public toastCtrl: ToastController, public loadingCtrl: LoadingController, public translateService: TranslateService , ) { }
  /**
   * 初始化httpservice执行的方法
   */
  init() {
    return Promise.resolve('');
  }
  /**
   * 写入一个cacheget的缓存
   * @param url 不含baseURL的URL字符串
   * @param body 缓存的内容本体
   * @param param get请求的参数
   */
  cachesave(url: string, body: any, param?: string[][]) {
    const urlmd5 = this.md5(url + JSON.stringify(param)).substr(0, 10);
    let cachebody = {
      head: {
        url: url + '?' + JSON.stringify(param),
        expiration: 0,
        userid: this.userInfo.userid
      },
      body: body
    };
    return this.storage.set('reqcache:' + urlmd5, JSON.stringify(cachebody));
  }
  /**
   * 带自动缓存的get请求
   * @param url 不含baseURL的URL字符串  
   */
  cacheget(url: string, param?: string[][]) {
    const urlmd5 = this.md5(url + JSON.stringify(param)).substr(0, 10);
    return this.storage.get('reqcache:' + urlmd5).then(res => {
      if (res) {
        let resObj = JSON.parse(res);
        if (1) {
          return Promise.resolve(resObj.body);
        }
      } else {
        return this.get(url, param).then(res => {
          let cachebody = {
            head: {
              url: url + '?' + JSON.stringify(param),
              expiration: 0,
              userid: this.userInfo.userid
            },
            body: res
          };
          this.storage.set('reqcache:' + urlmd5, JSON.stringify(cachebody));
          return Promise.resolve(res);
        }, err => {
          return Promise.reject(err);
        });
      }
    });
  }
  /**
   * 普通的get请求
   * @param url 不含baseURL的URL字符串
   */
  get(url: string, param?: string[][], flag = false) {
    return new Promise((resolve, reject) => {
      let fullURL = this.userInfo.baseURL + url;
      if(flag){
        fullURL = url;
      }
      let params = new URLSearchParams();
      if (param) {
        for (let par of param) {
          if (par[0] !== undefined && par[1] !== undefined) {
            params.set(par[0], par[1]);
          }
        }
      }
      let headers = new Headers();
      headers.set('Accept-Language', this.translateService.translateFunc('pad.http_lang_headers'));
      params.set('token', this.userInfo.token);
      let options = new RequestOptions({ params: params, headers: headers });
      this.http.get(fullURL, options).subscribe(res => {
        let resObj = res.json();
        if (resObj.head && resObj.head.code == 200) {
          resolve(resObj);
        }else if(resObj.message === '请求成功!'){
          resolve(resObj);
        } else {
          this.presentToast(resObj.head.code, resObj.head.msg);
          console.log(resObj);
        }
      }, err => {
        reject(err);
      });
    });
  }
  md5(str: string): string {
    let md5cal = function (s) {
      let hash = createHash('md5');
      hash.update(s);
      return hash.digest('base64');
    };
    return md5cal(str);
  }
  /**
   * 清除layout/describe缓存
   */
  cacheclear(): Promise<string> {
    return new Promise(resolve => {
      this.storage.forEach((value, key, number) => {
        if (key.substr(0, 8) == 'reqcache') {
          this.storage.remove(key);
        }
      }).then(() => {
        resolve(this.storage.driver);
      });
    });
  }
  /**
   * 普通的post请求
   * @param url 不含baseURL的URL字符串
   * @param param post的body部分内容
   */
  post(url: string, param: any, flag?: boolean): Promise<any> {
    return new Promise((resolve, reject) => {
      let fullURL = this.userInfo.baseURL + url;
      if(flag){
        fullURL = url;
      }
      let headers = new Headers({ 'Content-Type': 'application/json' });
      headers.set('Accept-Language', this.translateService.translateFunc('pad.http_lang_headers'));
      let options = new RequestOptions({ headers: headers });
      let body = {
        head: { token: this.userInfo.token },
        body: param
      };
      //let ran = Math.random();
      this.http.post(fullURL, body, options).subscribe(res => {
        let resObj = res.json();
        if (resObj.head.code == 200) {
          resolve(resObj);
        } else {
          this.presentToast(resObj.head.code, resObj.head.msg);
          reject(resObj);
        }
      }, err => {
        reject(err);
      });
    })
  }
  /**
   * 普通的put请求
   * @param url 不含baseURL的URL字符串
   * @param param post的body部分内容
   */
  put(url: string, param: any): Promise<any> {
    return new Promise((resolve, reject) => {
      let fullURL = this.userInfo.baseURL + url;
      let headers = new Headers({ 'Content-Type': 'application/json' });
      headers.set('Accept-Language', this.translateService.translateFunc('pad.http_lang_headers'));
      let options = new RequestOptions({ headers: headers });
      let body = {
        head: { token: this.userInfo.token },
        body: param
      };
      this.http.put(fullURL, body, options).subscribe(res => {
        let resObj = res.json();
        if (resObj.head.code == 200) {
          resolve(resObj);
        } else {
          this.presentToast(resObj.head.code, resObj.head.msg);
          reject(resObj);
        }
      }, err => {
        reject(err);
      });
    })
  }
  /**
   * 普通的delete请求
   * @param url 不含baseURL的URL字符串
   */
  delete(url: string, param?: string[][]): Promise<any> {
    return new Promise((resolve, reject) => {
      let fullURL = this.userInfo.baseURL + url;
      let params = new URLSearchParams();
      if (param) {
        for (let par of param) {
          if (par[0] !== undefined && par[1] !== undefined) {
            params.set(par[0], par[1]);
          }
        }
      }
      params.set('token', this.userInfo.token);
      let headers = new Headers();
      headers.set('Accept-Language', this.translateService.translateFunc('pad.http_lang_headers'));
      let options = new RequestOptions({ params: params, headers: headers });
      this.http.delete(fullURL, options).subscribe(res => {
        let resObj = res.json();
        if (resObj.head.code == 200) {
          resolve(resObj);
        } else {
          this.presentToast(resObj.head.code, resObj.head.msg);
          reject(resObj);
        }
      }, err => {
        reject(err);
      });
    })
  }
    // // 跨域请求
    // jsonpGet(url, dataObj): Promise<any> {
    //   return new Promise((resolve, reject) =>{
    //     let params = new URLSearchParams();
    //     for(let key in dataObj){
    //       if(!key && !!dataObj[key]){
    //         params.set(key,dataObj[key]);
    //       }
    //     }

    //     this.jsonp.get(url, {search: params}).subscribe(res =>{
    //       let resObj = res.json();
    //       if (resObj.head.code == 200) {
    //         resolve(resObj);
    //       } else {
    //         this.presentToast(resObj.head.code, resObj.head.msg);
    //         reject(resObj);
    //       }
    //     })
    //   })
    // }

  /**错误提示 */
  presentToast(code, msg) {
    let toast = this.toastCtrl.create({
      message: msg ? msg : this.translateService.translateFunc('pad.alert_failed_title'),
      duration: 3000,
      position: "buttom",
      showCloseButton: true,
      closeButtonText: 'x',
      cssClass: 'danger',
      dismissOnPageChange: true
    });
    toast.present();
  }
  reqStart() {
    this.lastUpdateTime = new Date().getTime();
    if (this.requestCount < 1) {
      if (this.ldc) {
        console.warn('loaderNotDismiss');
        return;
      }
      if (this.requestCount < 0) {
        this.requestCount = 0;
      }
      this.ldc = this.loadingCtrl.create({
        content: '正在加载……'
      });
      this.ldc.present().catch(err => {
        console.warn(new Date().getTime(), this.lastUpdateTime, this.requestCount, 'reqEndPresentErr');
        console.warn(new Date().getTime(), 'PresentErrr', err)
      });
    }
    this.requestCount++;
  }
  reqEnd() {
    this.lastUpdateTime = new Date().getTime();
    if (this.requestCount > 1) {
      this.requestCount--;
    } else {
      setTimeout(() => {
        if (this.requestCount === 1) {
          this.requestCount--;
          this.ldc.dismiss().then(() => {
            this.ldc = undefined;
          }).catch(err => {
            console.warn(new Date().getTime(), this.lastUpdateTime, this.requestCount, 'reqEndDismissErr');
            console.warn(new Date().getTime(), 'DismissErrr', err)
          });
        } else if (this.requestCount > 1) {
          this.requestCount--;
        } else {
          console.warn(new Date().getTime(), 'reqEndErrrrrrrrrrrrrrrrrrr', this.requestCount);
          this.requestCount = 0;
          console.warn(new Date().getTime(), this.lastUpdateTime, this.requestCount, 'reqEndErrrrrrr');
        }
      }, 400);
    }
  }
}
