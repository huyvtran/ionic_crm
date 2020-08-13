import { Injectable } from "@angular/core";
import { Events } from "ionic-angular";
import { Http, Headers, RequestOptions } from "@angular/http";
import { Storage } from "@ionic/storage";
import { config, UserInfo, UserStorage } from "../utils/index";
import { Network } from '@ionic-native/network';
import _ from "lodash";
import { Device } from "@ionic-native/device";
import { HttpService } from "./http-service";
import * as createHash from "create-hash";
import { TranslateService } from "../providers/translate-service";
import moment from "moment";
import { ImageService } from "../providers/image-service";

/**登录服务 */
@Injectable()
export class LoginService {
  constructor(
    public http: Http,
    public storage: Storage,
    public userInfo: UserInfo,
    public events: Events,
    public httpService: HttpService,
    public network: Network,
    private device: Device,
    public translateService: TranslateService,
    public imageService: ImageService
  ) { }

  private loginBySendAjax(username: string, password: string, serverid: any, resolve: any, reject: any) {
    return new Promise((resolve, reject) => {
      const url = config.login_server[serverid] + config.api.login_url;
      const headers = new Headers({ "Content-Type": "application/json" });
      const options = new RequestOptions({ headers: headers });
      let body = JSON.stringify({
        deviceName: this.device.model,
        deviceType: this.device.platform,
        loginName: username,
        osVersion: this.device.version,
        pwd: password
      });
      this.http.post(url, body, options).subscribe(
        (res: any) => {
          let resObj = res.json();
          if (resObj.head.code == 200) {
              resolve(res);
              let userexec: UserStorage = {
                token: resObj.head.token,
                userid: resObj.body.userId,
                user: resObj.body.user_info,
                permission: resObj.body.permission,
                profile: resObj.body.profile,
                serverid: serverid,
                loginhaosen: resObj.body.adfs_status //增加豪森的处理
              };
  
              this.loginexec(userexec, resObj);
            
          } else {
            reject(resObj.head.msg);
          }
        },
        err => {
          reject(
            this.translateService.translateFunc("pad.login_request_failed")
          );
        }
      );
    })
  }

  /**登录 */
  login(username: string, password: string, serverid) {
    return new Promise((resolve, reject) => {
      if (username.indexOf("@") < 0) {
        username = username + (config.id_suffix ? config.id_suffix : "");
      }
      if (this.network.type !== 'none') {
        this.loginBySendAjax(username, password, serverid, resolve, reject).then(res =>{
          resolve(res);
        },
        err=>{
          reject(err);
        });
      } else {
        reject('请检查网络');
      }
    });
  }
  /**通过token 获取后端对应的信息 */
  loginByToken(token: string) {
    return new Promise((resolve, reject) => {
      const url = `${config.login_server[0]}${config.api.login_with_token}`;
      let headers = new Headers({ 'Content-Type': 'application/json' });
      headers.append('token', token);
      headers.set('Accept-Language', this.translateService.translateFunc('pad.http_lang_headers'));
      let options = new RequestOptions({ headers: headers });
      let bodys = {
        head: { token: token },
        body: { token: token }
      };
      this.http.post(url, bodys, options).subscribe((res: any) => {
        console.log(res)
        if (res) {
          resolve(res.json());
        }
      }, err => {
        reject(err);
      })
    })
  }
  /**
   * 登录成功以后要做的事情
   * @param userexec 传入的参数
   */
  loginexec(userexec: UserStorage, resObj?: any) {

    window['FC_CRM_TOKEN'] = userexec.token;
    localStorage.setItem('user_info', JSON.stringify(userexec.user || {}))
    this.userInfo.baseURL = config.baseURL[userexec.serverid];
    this.userInfo.token = userexec.token;
    this.userInfo.fc_token = userexec.token;
    this.userInfo.userid = userexec.userid;
    this.userInfo.user = userexec.user;
    this.userInfo.permission = userexec.permission;
    this.userInfo.profile = userexec.profile;
    if (userexec.loginhaosen) {
      this.userInfo.loginhaosen = userexec.loginhaosen;
    }
    this.events.publish("token", userexec.token);
    Object.assign(window, { FC_CRM_USERID: userexec.userid });
    this.getCRMPowerSetting(userexec.profile.id, userexec.token).then(
      (res: any) => {
        if (res.head.code === 200) {
          if (res.body.result.length > 0) {
            //如果网络不稳定，可能造成由于全局变量缺失而产生错误
            Object.assign(window, {
              SEGMENTATION_AUTHORITY: res.body.result[0].segmentation_authority
            });
            Object.assign(window, {
              CALL_BACKDATE_LIMIT: res.body.result[0].call_backdate_limit
            });
            Object.assign(window, {
              SEGMENTATION_PRODUCT_LEVEL:
                res.body.result[0].segmentation_product_level
            });
            Object.assign(window, {
              DCR_CREATE_CUSTOMER_RULE:
                res.body.result[0].dcr_create_customer_rule
            });
            Object.assign(window, {
              DCR_EDIT_CUSTOMER_RULE: res.body.result[0].dcr_edit_customer_rule
            });
            Object.assign(window, {
              CREATE_CLM_IN_CALL: res.body.result[0].create_clm_in_call
            });
          }
        }
      }
    );

    Promise.all([
      this.storage.set("token", resObj.head.token),
      this.storage.set("userid", resObj.body.userId),
      this.storage.set("user", JSON.stringify(resObj.body.user_info)),
      this.storage.set(
        "permission",
        JSON.stringify(resObj.body.permission)
      ),
      this.storage.set(
        "profile",
        JSON.stringify(resObj.body.profile)
      ),
      this.storage.set("serverid", userexec.serverid),
      // this.storage.set("pwhash", this.md5(password))
      this.storage.set('loginhaosen', userexec.loginhaosen)
    ]).then((res:any) => {
      console.log('res is ',res);
      //下面promise获取了homeconfig 这里没必要在获取一次。
      // this.getHomeConfig().then((config: any) => {
      //   if (config.body) {
      //     resObj.body['homeConfig'] = config.body.value;
      //   }
      // })
    });

    window["fc_getProfile"] = () => {
      return this.userInfo.profile;
    }

    window["fc_hasFunctionPrivilege"] = (
      functionCode,
      expectedCodeValue = 2
    ) => {
      return (
        this.userInfo.permission[`function.${functionCode}`] ===
        expectedCodeValue
      );
    };

    window["fc_combineTime"] = (time, defaultDate?: any) => {
      let dDate = moment(new Date().setHours(0, 0, 0, 0)).format("x");
      let convertTime = dDate + " " + time;
      if (defaultDate !== undefined) {
        let handlerTime = moment(defaultDate).format("YYYY-MM-DD");
        convertTime = handlerTime + " " + time;
      }
      return moment(new Date(convertTime)).valueOf();
    };

    window["fc_hasFieldPrivilege"] = (
      objCode,
      fieldCode,
      expectedCodeValues = [4]
    ) => {
      const permissionCode = _.get(
        this.userInfo.permission,
        `field.${objCode}.${fieldCode}`,
        4
      );
      return _.indexOf(expectedCodeValues, permissionCode) >= 0;
    };

    window["fc_hasObjectPrivilege"] = (objectCode, expectedCodeValue = 0) => {
      const objectPrivilegeCode = this.userInfo.permission[`obj.${objectCode}`];
      return (
        (objectPrivilegeCode | (2 ** expectedCodeValue)) === objectPrivilegeCode
      );
    };
    if (this.network.type!=='none') {
      Promise.all([
        this.getSubIdList(userexec.userid, userexec.token),
        this.getSubList(userexec.userid, userexec.token),
        this.getTranslate(userexec.token),
        this.getDefaultLang(),
        this.getLogoFromServer()
      ]).then((res: any) => {
        //顺序获取接口数据的同时 对获取到的homeconfig（res[5].body.value）存在本地和window['homeConfig']各存一份
        this.storage.set("subList", JSON.stringify(res));
        // if (res && res[5] && res[5].body && res[5].body.value) {
        //   window['homeConfig'] = res[5].body.value;
        // }
        this.saveSubList(userexec.userid, res);
      });
      //检查图片文件并上传
      this.imageService.checkFolder();
    } else {
      this.storage.get("subList").then(res => {
        this.saveSubList(userexec.userid, JSON.parse(res));
      });
    }
  }

  saveSubList(userid, res) {
    if (res[0].body) {
      const customerIds = res[0].body.result;
      window["fc_getTerritoryCustomerIds"] = () => {
        return customerIds === undefined ? [] : customerIds;
      };
    }
    if (res[1].body) {
      const subList = res[1].body.result;
      window["fc_getSubordinates"] = () => {
        return subList === undefined ? [] : subList;
      };
      window["fc_getSubordinateIds"] = () => {
        let subIds = [];
        subList.forEach(element => {
          subIds.push(element.id);
        });
        return subIds === undefined ? [] : subIds;
      };
      window["fc_getDirectSubordinates"] = () => {
        const derectSub = [];
        subList.forEach(sub => {
          if (sub.parent_id == userid) {
            derectSub.push(sub);
          }
        });
        return derectSub === undefined ? [] : derectSub;
      };
      window["fc_getDirectSubordinateIds"] = () => {
        let subIds = [];
        subList.forEach(element => {
          if (element.parent_id == userid) {
            subIds.push(element.id);
          }
        });
        return subIds === undefined ? [] : subIds;
      };
    }
    if (res[2].body) {
      const countTranslate = [];
      for (let x in res[2].body) {
        window[x] = res[2].body[x];
        countTranslate.push({ count: 0, default_language: x });
      }
      if (countTranslate.length === 1) {
        config.default_language = countTranslate[0].default_language;
        this.translateService.localTranslateObject =
          window[config.default_language];
      }
    }
    if (res[3].body) {
      const defaultValue = res[3].body.value;
      if (!defaultValue) {
        this.storage.get("default_language").then(res => {
          if (res) {
            config.default_language = res;
          } else {
            config.default_language = "zh_CN";
          }
        });
      } else {
        this.storage.get("default_language").then(res => {
          if (res) {
            config.default_language = res;
          } else {
            this.storage.set("default_language", defaultValue);
            config.default_language = defaultValue;
          }
          this.translateService.localTranslateObject =
            window[config.default_language];
        });
      }
    }
  }

  /**获取下属信息 */
  getSubList(userid, tokenid) {
    const url = config.api.listSubordinate.replace("{user_id}", userid);
    return this.httpService.get(url).catch();
  }

  /**获取代表管理的customer id集合 */
  getSubIdList(userid, tokenid) {
    const url = config.api.listCustomerId.replace("{user_id}", userid);
    return this.httpService.get(url).catch();
  }

  /**获取国际化的东西 */
  getTranslate(tokenid) {
    const url = config.api.translates;
    return this.httpService.get(url).catch();
  }

  /**获取默认语言 */
  getDefaultLang() {
    const url = config.api.default_lang;
    return this.httpService.get(url).catch();
  }

  /**get Logo */
  getLogoFromServer() {
    const url = config.api.get_logo;
    return this.httpService.get(url).catch();
  }

  /**
   * 获取首页配置
   */
  /**
   * 获取首页布局
   * @param
   */
  getHomeConfig() {
    const url = config.api.home_config;
    return this.httpService.get(url);
  }

  getWaterConfig(){
    const url = config.api.water_config
    return this.httpService.get(url);
  }

  /**退出 */
  logout() {
    return new Promise((resolve, reject) => {
      const url = config.login_server+ config.api.logout_url;
      const headers = new Headers({ 'Content-Type': 'application/json' });
      const options = new RequestOptions({ headers: headers });
      const token = this.userInfo.token
      const bodys = {
        'token':token
      }
      const body = { 'body': bodys };
      this.http.post(url, body, options).subscribe((res: any) => {
        
      }, err => {
        reject(this.translateService.translateFunc('pad.login_request_failed'));
      });
      this.userInfo.token = "";
      this.userInfo.fc_token = "";
      this.userInfo.userid = "";
      this.userInfo.baseURL = "";
      this.userInfo.permission = {};
      this.userInfo.loginhaosen = '';//退出不调接口
      //清除水印
      let mask_divs = document.getElementsByClassName('mask_div');
      if (window['watermark_flag']&& mask_divs) {
        const nodes = mask_divs;
        for (let i = 0; i < nodes.length; i++) {
          nodes[i].innerHTML = '';
        }
      }
      resolve();
    });
  }
  updatePwd(userid, oldpwd, newpwd) {
    return new Promise((resolve, reject) => {
      const url = config.login_server[0] + config.api.updatePwd;
      const headers = new Headers({ "Content-Type": "application/json" });
      const options = new RequestOptions({ headers: headers });
      let body = {
        deviceName: this.device.model,
        deviceType: this.device.platform,
        userId: userid,
        oldPwd: oldpwd,
        newPwd: newpwd,
        loginId: this.userInfo.user["account"],
        osVersion: this.device.version
      };

      const bodys = { head: { token: this.userInfo.token }, body: body };

      this.http.post(url, bodys, options).subscribe(
        (res: any) => {
          let resObj = res.json();
          if (resObj.head.code == 200) {
            this.storage.set("pwhash", this.md5(newpwd));
            resolve(resObj);
          } else {
            reject(resObj.head.msg);
          }
        },
        err => {
          reject(
            this.translateService.translateFunc("pad.login_request_failed")
          );
        }
      );
    });
  }

  forgetPwd(username, serverid) {
    return new Promise((resolve, reject) => {
      const url = config.login_server[serverid] + config.api.resetPwd;
      const headers = new Headers({ "Content-Type": "application/json" });
      const options = new RequestOptions({ headers: headers });
      if (username.indexOf("@") < 0) {
        username = username + (config.id_suffix ? config.id_suffix : "");
      }
      let body = {
        deviceName: this.device.model,
        deviceType: this.device.platform,
        osVersion: this.device.version,
        loginId: username
      };

      const bodys = { body: body };

      this.http.post(url, bodys, options).subscribe(
        (res: any) => {
          let resObj = res.json();
          if (resObj.head.code == 200) {
            resolve();
          } else {
            reject(resObj.head.msg);
          }
        },
        err => {
          reject(
            this.translateService.translateFunc("pad.login_request_failed")
          );
        }
      );
    });
  }



  getCRMPowerSetting(profileId, token) {
    return new Promise((resolve, reject) => {
      const url = config.baseURL + config.api.search_url;
      const headers = new Headers({ "Content-Type": "application/json" });
      const options = new RequestOptions({ headers: headers });
      let body = {
        joiner: "and",
        criterias: [
          {
            field: "profile",
            operator: "==",
            value: [profileId]
          }
        ],
        orderBy: "create_time",
        order: "asc",
        objectApiName: "crmpower_setting",
        pageSize: 10,
        pageNo: 1
      };

      let head = {
        token: token
      };
      const bodys = {
        head: head,
        body: body
      };

      this.http.post(url, bodys, options).subscribe(
        (res: any) => {
          let resObj = res.json();
          if (resObj.head.code == 200) {
            resolve(resObj);
          } else {
            reject(resObj.head.msg);
          }
        },
        err => {
          reject(
            this.translateService.translateFunc("pad.login_request_failed")
          );
        }
      );
    });
  }
  md5(str: string): string {
    let md5cal = function (s) {
      let hash = createHash("md5");
      hash.update(s);
      return hash.digest("base64");
    };
    return md5cal(str);
  }
}
// interface UserStorage {
//   token: string;
//   userid: string;
//   user: any;
//   permission: any;
//   profile: any;
//   serverid: any;
//   loginhaosen?: any
// }
