import { Component, ViewChild } from "@angular/core";
import {
  Platform,
  Nav,
  Events,
  ToastController,
  LoadingController,
  ItemSliding,
  AlertController,
  MenuController
} from "ionic-angular";
import { StatusBar } from "@ionic-native/status-bar";
import { ScreenOrientation } from "@ionic-native/screen-orientation";
import { Storage } from "@ionic/storage";
import { DomSanitizer } from "@angular/platform-browser";
import { InAppBrowser } from "@ionic-native/in-app-browser";
import { UserInfo, config, UserStorage } from "../utils/index";

import {
  HomePage,
  MainPage,
  LoginHaoSenPage,
  AddPage,
  EditPage,
  DetailPage,
  CalendarPage,
  UserPage,
  RelatedList,
  NoticePage,
  SurveyPage,
  CoachFeedback,
  ExternalPage,
  IFramePage
} from "../pages/index";

import {
  MainService,
  LoginService,
  HttpService,
  DataService,
  NetworkService,
  ImageService,
  TranslateService
} from "../providers/index";
import _ from "lodash";

@Component({
  templateUrl: "app.html"
})
export class MyApp {
  rootPage: any;
  @ViewChild(Nav) nav: Nav;
  tabs = [];
  showit: boolean = false;
  icons = [];
  apiName: any;
  flag = 0;
  header: any;
  menuType: any;
  params: any;
  cachePage = [];
  pageParams: any;
  pageType: any;
  pageRealType: any;
  alertTab: any;
  relatedActions = [];
  newAlertsCount = 0;
  relatePageType = "index";

  activeList = false;
  activeListData = [];
  saveData = [];
  initEventData = [];
  addEventList = [];

  thirdTabs = [];
  thirdParams: any;
  thirdMenuType: any;
  thirdRelatedActions = [];
  thirdHeader: any;
  pauseTimestamp: number;
  customLogoUrl: any;

  constructor(
    platform: Platform,
    statusBar: StatusBar,
    screenOri: ScreenOrientation,
    public events: Events,
    public login: LoginService,
    public httpService: HttpService,
    public storage: Storage,
    public userInfo: UserInfo,
    public mService: MainService,
    public toastCtrl: ToastController,
    public alertCtrl: AlertController,
    public dataService: DataService,
    public nsv: NetworkService,
    public loadingCtrl: LoadingController, // loading 2017-09-27 15:32:38 by K
    public imgService: ImageService,
    public translateService: TranslateService,
    public sanitizer: DomSanitizer,
    public inAppBrowser: InAppBrowser,
    public menuCtrl: MenuController,
    public loginService: LoginService
  ) {
    this.showit = false;

    this.rootPage = LoginHaoSenPage;

    platform.ready().then(() => {
      this.loginByToken();
      // Okay, so the platform is ready and our plugins are available.
      // Here you can do any higher level native things you might need.
      const href = window.location.href.split("#")[0];
      if (href.indexOf("wxid=") > -1) {
        let wxid = href.substring(href.indexOf("wxid=") + 5);
        let enabledEncrypt = undefined;
        if (href.indexOf("&") > -1) {
          wxid = href.substring(href.indexOf("wxid=") + 5, href.indexOf("&"));
          enabledEncrypt = href.substring(href.indexOf("&") + 16);
        }
        // console.log(wxid, enabledEncrypt);

        this.nav.setRoot(LoginHaoSenPage);
      } else {
        this.httpService.reqEnd();

        this.nav.setRoot(LoginHaoSenPage);
      }
      this.events.subscribe("token", token => {
        this.storage.get("version").then(
          ver => {
            this.httpServiceInit();
          },
          err => {
            this.httpServiceInit();
          }
        );
      });

      if (platform.is("cordova")) {
        statusBar.styleDefault();
        statusBar.styleLightContent();
        screenOri.lock("landscape");
      }
      nsv.init();
      this.customLogoUrl = "assets/img/haosenlogo.png";
      this.events.subscribe("menu:control", (show: boolean) => {
        this.showit = show;
      });
      this.events.subscribe("menu:jump", (page: any, params: any) => {
        this.gotoPage(page, params);
      });

      this.events.subscribe(
        "menu:change",
        (value: any, menuType: any, header: any, params) => {
          this.header = header;
          this.changeMenu(value, menuType, header, params);
        }
      );

      this.events.subscribe("cachePage", (page: any, params: any) => {
        if (params[1].action !== undefined) {
          this.pageType = params[1].action;
        } else {
          this.pageType = "detail";
        }
        this.flag = 0;
        this.cachePage = [page, params];
      });

      this.events.subscribe("menu:back", (params: any) => {
        console.log("menu:back ===>", params, this.apiName);
        if (params === "third") {
          this.tabs = this.thirdTabs;
          this.params = this.thirdParams;
          this.relatedActions = this.thirdRelatedActions;
          this.header = this.thirdHeader;
          this.menuType = this.thirdMenuType;
        } else if (params === "walkin_attendee") {
        } else {
          this.openPage(this.apiName);
        }
      });
      this.events.subscribe("menu:third", () => {
        this.thirdTabs = _.cloneDeep(this.tabs);
        this.thirdRelatedActions = _.cloneDeep(this.relatedActions);
        this.thirdParams = _.cloneDeep(this.params);
        this.thirdHeader = this.header;
        this.thirdMenuType = _.cloneDeep(this.menuType);
      });

      this.events.subscribe("add:pageParams", (pageParams: any) => {
        this.pageParams = pageParams;
      });

      this.events.subscribe("related:actions", (relatedActions: any) => {
        this.relatedActions = relatedActions;
      });
      this.events.subscribe("clear:data", (param: any) => {
        console.log("clear:data ====>", this.pageParams);
        if (param === "mainList") {
          this.pageParams = undefined;
        }
        this.relatedActions = [];
      });
      this.events.subscribe("menu:activeList", (flag: any, data: any) => {
        this.activeList = flag;
      });
      this.events.subscribe("menu:relatePageType", (flag: any) => {
        this.relatePageType = flag;
      });
      this.events.subscribe("menu:pageRealType", (type: any) => {
        this.pageRealType = type;
      });
      this.events.subscribe("menu:changeAlertCont", () => {
        this.getNewAlert(mService);
      });
      this.events.subscribe("menu:activeListData", (data: any) => {
        if (data[0] === "add") {
          this.activeListData.push(data[1]);
        } else if (data[0] === "save") {
          this.activeListData = [];
        } else if (data[0] === "init") {
          this.initEventData = data[1];
          this.activeListData = _.cloneDeep(this.initEventData);
        }
      });
      platform.pause.subscribe(() => {
        this.pauseTimestamp = new Date().getTime();
      });
      platform.resume.subscribe(() => {
        let newDate = new Date().getTime();
        if (this.pauseTimestamp && newDate - this.pauseTimestamp > 600000) {
          this.pauseTimestamp = 0;
          this.login.logout().then(() => {
            this.tabs = [];
            this.showit = false;

            this.nav.setRoot(LoginHaoSenPage);
          });
        } else {
          this.pauseTimestamp = 0;
          nsv.checkNetwork();
        }
      });
    });
  }

  loginByToken() {
    Promise.all([
      this.storage.get("token"),
      this.storage.get("loginhaosen")
    ]).then((res: any) => {
      let [token, haosenFlag] = res;

      if (token && !haosenFlag) {
        let alert = this.alertCtrl.create({
          title: "提示",
          subTitle: "个人信息已失效，请重新登录！",
          buttons: [
            {
              text: "确定",
              handler: () => {
                this.gotoPage(LoginHaoSenPage, "");
              }
            }
          ]
        });
        alert.present();
        return;
      }

      // if (token && haosenFlag) {
      if (token && haosenFlag) {
        //this.userinfo.token
        if (!this.userInfo.token) {
          this.userInfo.token = token;
        }
        if (!this.userInfo.baseURL) {
          this.userInfo.baseURL = config.baseURL[0];
        }
        //免进入login 通过token 获取必要的信息

        this.loginService.loginByToken(token).then((resObj: any) => {
          if (resObj && resObj.body) {
            let userexec: UserStorage = {
              token: resObj.head.token,
              userid: resObj.body.userId,
              user: resObj.body.user_info,
              permission: resObj.body.permission,
              profile: resObj.body.profile,
              serverid: 0
            };

            this.loginService.loginexec(userexec, resObj);
            this.loginService.getHomeConfig().then(
              (res: any) => {
                this.loginService.getWaterConfig().then((res2: any) => {
                  this.loginService
                    .getCRMPowerSetting(
                      resObj.body.profile.id,
                      resObj.head.token
                    )
                    .then(
                      (res3: any) => {
                        if (res3.body && res3.body.result[0]) {
                          window["crmpowerSetting"] = res3.body.result[0];
                        }
                        if (res2.body && res2.body.value) {
                          window["waterMarkConfig"] = JSON.parse(
                            res2.body.value
                          );
                        }
                        if (res && res.body) {
                          window["homeConfig"] = res.body.value;
                          this.showit = true;
                          this.gotoMainPage();
                        }
                      },
                      err => {
                        if (res2.body && res2.body.value) {
                          window["waterMarkConfig"] = JSON.parse(
                            res2.body.value
                          );
                        }
                        if (res && res.body) {
                          window["homeConfig"] = res.body.value;
                          this.showit = true;
                          this.gotoMainPage();
                        }
                      }
                    );
                });
              },
              err => {
                this.showit = true;
                this.gotoMainPage();
              }
            );
          }
        });
      }
    });
  }

  httpServiceInit() {
    this.httpService.reqStart();
    this.httpService.init().then((msg: string) => {
      this.httpService.reqEnd();
      this.tabs = [];
      this.thirdTabs = [];
      this.mService.getMenus().then((res: any) => {
        console.log("this is in the data of the service to get memu,", res);
        const array = _.sortBy(res.body.items, "display_order");
        this.changeMenu(array, "main", this.header, "");
        //this.events.publish('menu:change', this.tabs);
      });
      this.storage.get("lastLoginPerson").then(res => {
        if (!res && res == this.userInfo.token) {
          this.mService.refreshBasicData();
        } else {
          this.mService.refreshBasicData(true);
        }
      });
      this.getNewAlert(this.mService);
      this.storage.get("subList").then(res => {
        if (res) {
          //let subList = JSON.parse(res);
          //修改首页图
          // if (subList[4] && subList[4].body["value"]) {
          //   this.customLogoUrl = this.sanitizer.bypassSecurityTrustResourceUrl(
          //     "data:image/png;base64," + subList[4].body["value"] + ""
          //   );
          // }
        }
      });
    });
  }

  private getNewAlert(mService: MainService) {
    mService
      .getSearchData({
        objectApiName: "alert",
        joiner: "and",
        criterias: [
          { field: "status", operator: "==", value: [0] },
          { field: "owner", operator: "==", value: [this.userInfo.userid] }
        ]
      })
      .then((res: any) => {
        const {
          body: { resultCount }
        } = res;
        this.newAlertsCount = resultCount;
      });
  }
  // loading 2017-09-27 15:32:38 by K
  presentLoading() {
    this.mService.doSync().then(res => {
      this.getNewAlert(this.mService);
    });
  }

  translateLanguage(x) {
    let key = "tab." + x.api_name;
    if (this.translateService.translateFunc(key) !== key) {
      return this.translateService.translateFunc(key);
    } else {
      return x.label;
    }
  }

  changeMenu(value, menuType, header, params) {
    this.tabs = [];
    this.menuType = menuType;
    this.params = params;
    if (menuType === "sub") {
      this.tabs = value;
    } else {
      for (let x in value) {
        let menuItem = value[x];
        let hiddenFlag = false;
        if (menuItem.hidden_devices) {
          menuItem.hidden_devices.forEach(dv => {
            if (dv == "tablet") {
              hiddenFlag = true;
            }
          });
          // for (let dv of menuItem.hidden_devices) {
          //   if (dv == 'tablet') {
          //     hiddenFlag = true;
          //   }
          // }
        }
        if (this.userInfo.permission["tab." + menuItem.api_name] === 2) {
          if (menuItem.api_name === "alert") {
            this.alertTab = menuItem;
          } else if (hiddenFlag) {
            // Do nothing
          } else {
            this.tabs.push(menuItem);
          }
        }
      }
    }
  }

  logout() {
    this.login.logout().then(() => {
      this.events.publish("menu:control", false);

      this.nav.setRoot(LoginHaoSenPage);
    });
  }

  openRelatePage(relate) {
    this.menuCtrl.close();
    if (this.pageRealType === "edit") {
      let alert = this.alertCtrl.create({
        title: this.translateService.translateFunc("pad.alert_remind_title"),
        subTitle: this.translateService.translateFunc(
          "pad.alert_remind_giveup_edit"
        ),
        buttons: [
          {
            text: this.translateService.translateFunc("pad.action_no"),
            handler: data => {}
          },
          {
            text: this.translateService.translateFunc("pad.action_yes"),
            handler: data => {
              this.gotoRelatedPage(relate);
            }
          }
        ]
      });
      alert.present();
    } else {
      this.gotoRelatedPage(relate);
    }
  }

  gotoRelatedPage(relate) {
    console.log(relate, this.relatePageType);
    if (this.pageType === "ADD" && this.pageParams === undefined) {
      let alert = this.alertCtrl.create({
        title: this.translateService.translateFunc("pad.alert_remind_title"),
        subTitle: this.translateService.translateFunc(
          "pad.alert_remind_save_info"
        ),
        buttons: [
          {
            text: this.translateService.translateFunc("pad.action_ok"),
            handler: data => {}
          }
        ]
      });
      alert.present();
      return;
    } else if (this.flag > 0) {
      this.events.publish(
        "related:relatepush",
        RelatedList,
        relate,
        this.relatePageType
      );
    } else {
      this.events.publish(
        "related:push",
        RelatedList,
        relate,
        this.relatePageType
      );
    }
    if (this.pageType) {
      this.flag = 1;
    }
  }

  backToMainInfo() {
    this.menuCtrl.close();
    this.flag = 0;
    this.events.publish(
      "related:relatepush",
      this.cachePage[0],
      this.cachePage[1]
    );
  }

  relatedAction(action) {
    this.menuCtrl.close();
    if (action.action == "RESURVEY") {
      if (!this.nsv.onlineStatus) {
        let alert = this.alertCtrl.create({
          title: this.translateService.translateFunc("pad.alert_confirm_title"),
          subTitle: this.translateService.translateFunc(
            "pad.alert_remind_offline_survey"
          ),
          buttons: [
            {
              text: this.translateService.translateFunc("pad.action_ok"),
              handler: data => {}
            }
          ]
        });
        alert.present();
      } else {
        this.nav.push(CoachFeedback, [
          action.data,
          action.coach_feedback,
          action.data.record_type,
          action
        ]);
      }
    }
    //去掉多余的订阅
    //正式处理逻辑

    this.events.publish("menuAction:click");
    if (this.dataService.validComponent) {
      let dataServiceValid = this.dataService.validFieldWithMustWriteAndType(
        this.dataService.validComponent
      );
      if (!dataServiceValid) {
        return;
      }
    }
    if (this.pageRealType === "edit" && !action.need_confirm) {
      //this.events.publish('left:menu-actions', action);
      let alert = this.alertCtrl.create({
        title: this.translateService.translateFunc("pad.alert_remind_title"),
        subTitle: this.translateService.translateFunc(
          "pad.alert_remind_save_data"
        ),
        buttons: [
          {
            text: this.translateService.translateFunc("pad.action_no"),
            handler: data => {
              this.relatedActionHandler(action);
            }
          },
          {
            text: this.translateService.translateFunc("pad.action_yes"),
            handler: data => {
              action.data = this.dataService.data;
              this.relatedActionHandler(action);
            }
          }
        ]
      });
      alert.present();
    } else {
      if (this.pageRealType === "edit") {
        action.data = this.dataService.data;
      }
      this.relatedActionHandler(action);
    }
  }

  relatedActionHandler(action) {
    if (action.action.toLowerCase() === "relatedadd") {
      const parentApiName = action.ref_obj_describe;
      const parentRecordType = action.target_layout_record_type;
      this.gotoPage(AddPage, [
        parentApiName,
        action,
        parentRecordType,
        this.params[0]
      ]);
    } else if (action.action.toLowerCase() === "relatedupdate") {
      const updateApiName = action.object_describe_api_name;
      let data = action.data;
      let field = action.link_field;
      if (action.update_val) {
        let value = action.update_val;
        data[field] = value;
        this.mService
          .putDataByApiNameAndId(updateApiName, data, data.id)
          .then((res: any) => {
            action.options.forEach(opt => {
              if (data[field] == opt.value) {
                action.label = opt.label;
              }
            });
            //修改当前btn的显示文字和本地存储的数据的值
          });
      }
    } else if (action.action.toLowerCase() === "relatedurl") {
      this.nav.push(SurveyPage, [action.object_describe_api_name, action.data]);
    } else if (action.action.toLowerCase() === "update") {
      if (action.need_confirm) {
        if (
          action["confirm_message.i18n_key"] &&
          this.translateService.translateFunc(
            action["confirm_message.i18n_key"]
          ) !== action["confirm_message.i18n_key"]
        ) {
          action.confirm_message = this.translateService.translateFunc(
            action["confirm_message.i18n_key"]
          );
        }
        let alert = this.alertCtrl.create({
          title: this.translateService.translateFunc("pad.alert_remind_title"),
          subTitle: action.confirm_message,
          buttons: [
            {
              text: this.translateService.translateFunc("pad.action_no"),
              handler: data => {}
            },
            {
              text: this.translateService.translateFunc("pad.action_yes"),
              handler: data => {
                if (
                  action.data.object_describe_name == "call" &&
                  action.data.record_type == "report"
                ) {
                  if (this.pageRealType == "detail") {
                    this.handlerUpdate(action);
                  } else {
                    this.handlerUpdate(action);
                  }
                } else {
                  this.handlerUpdate(action);
                }
              }
            }
          ]
        });
        alert.present();
      } else {
        if (
          action.data.object_describe_name == "call" &&
          action.data.record_type == "report"
        ) {
          if (
            JSON.stringify(action.data._cascade) == "{}" ||
            action.data._cascade == undefined
          ) {
            if (this.pageRealType == "detail") {
              this.handlerUpdate(action);
            } else {
              this.handlerUpdate(action);
            }
          } else {
            this.handlerUpdate(action);
          }
        } else {
          this.handlerUpdate(action);
        }
      }
    } else if (action.action.toLowerCase() === "edit") {
      if (action.target_layout_record_type) {
        this.gotoPage(EditPage, [
          action.object_describe_api_name,
          action,
          action.data,
          action.target_layout_record_type
        ]);
      } else {
        this.gotoPage(EditPage, [
          action.object_describe_api_name,
          action,
          action.data,
          action.data.record_type
        ]);
      }
    }
  }

  handlerUpdate(action) {
    if (action.pro_expression) {
      const expObj = action.pro_expression;
      const getApiName = expObj.pro_obj_api_name;
      const filters = expObj.pro_filter_criterias;
      const criterias = [];
      filters.forEach(filter => {
        if (filter.field_type) {
          if (filter.field_type === "js") {
            const value = this.callAnotherFunc(
              new Function("t", filter.value),
              action.data
            );
            criterias.push({
              field: filter.field,
              operator: filter.operator,
              value: [value]
            });
          }
        } else {
          criterias.push({
            field: filter.field,
            operator: filter.operator,
            value: filter.value
          });
        }
      });

      let body = {
        objectApiName: getApiName,
        joiner: "and",
        criterias: criterias
      };
      this.mService.getSearchData(body).then((res: any) => {
        const list = res.body.result;
        const expression_type = expObj.pro_expression_render.expression_type;
        let exp_val = this.callAnotherFunc(
          new Function("list", expObj.pro_expression_render.expression),
          list
        );
        console.log("exp_val =====>", exp_val);
        if (
          (action.data.object_describe_name == "call" &&
            action.data.record_type == "report") ||
          (action.data.object_describe_name == "call" &&
            action.data.record_type == "plan" &&
            action.data._cascade)
        ) {
          if (
            (action.data.object_describe_name == "call" &&
              action.data.record_type == "report") ||
            (action.data._cascade["create"] &&
              action.data.record_type == "plan")
          ) {
            if (
              JSON.stringify(action.data._cascade) == "{}" ||
              action.data._cascade == undefined
            ) {
              let actionDataRecordType = "";
              if (action.data.customer__r) {
                actionDataRecordType = action.data.customer__r["record_type"];
              }
              if (exp_val !== true && actionDataRecordType !== "pharmacy") {
                let alert = this.alertCtrl.create({
                  title: this.translateService.translateFunc(
                    "pad.alert_remind_title"
                  ),
                  subTitle: this.translateService.translateFunc(
                    "pad.alert_remind_cant_complete_call_without_product_reaction"
                  ),
                  buttons: [
                    {
                      text: this.translateService.translateFunc(
                        "pad.action_ok"
                      ),
                      handler: data => {}
                    }
                  ]
                });
                alert.present();
                return;
              } else {
                if (this.pageRealType == "edit") {
                  if (
                    this.dataService.data._cascade == undefined ||
                    JSON.stringify(this.dataService.data._cascade) == "{}"
                  ) {
                    if (!exp_val && actionDataRecordType !== "pharmacy") {
                      let alert = this.alertCtrl.create({
                        title: this.translateService.translateFunc(
                          "pad.alert_remind_title"
                        ),
                        subTitle: this.translateService.translateFunc(
                          "pad.alert_remind_cant_complete_call_without_product_reaction"
                        ),
                        buttons: [
                          {
                            text: this.translateService.translateFunc(
                              "pad.action_ok"
                            ),
                            handler: data => {}
                          }
                        ]
                      });
                      alert.present();
                      return;
                    }
                  }
                  this.updateEnd(action);
                } else {
                  if (
                    expression_type === "alert" &&
                    exp_val !== true &&
                    actionDataRecordType !== "pharmacy"
                  ) {
                    action.expression_type = "alert";
                    if (window[config.default_language][exp_val] !== exp_val) {
                      exp_val = window[config.default_language][exp_val];
                    }
                    action.pro_title = exp_val;
                    let alert = this.alertCtrl.create({
                      title: this.translateService.translateFunc(
                        "pad.alert_remind_title"
                      ),
                      subTitle: exp_val,
                      buttons: [
                        {
                          text: this.translateService.translateFunc(
                            "pad.action_ok"
                          ),
                          handler: data => {}
                        }
                      ]
                    });
                    alert.present();
                    return;
                  } else {
                    this.updateEnd(action);
                  }
                }
              }
            } else if (expression_type === "hidden") {
              if (!exp_val) {
                return;
              }
            } else if (expression_type === "disabled") {
              if (exp_val) {
                action.expression_type = "disabled";
                action.disabled = true;
                if (window[config.default_language][exp_val] !== exp_val) {
                  exp_val = window[config.default_language][exp_val];
                }
                action.pro_title = exp_val;
                return;
              }
            } else {
              if (action.data._cascade) {
                if (
                  action.data._cascade.delete &&
                  !action.data._cascade.update &&
                  !action.data._cascade.create
                ) {
                  const report = this.dataService.reportList;
                  const newReportList = [];
                  const newData = action.data._cascade.delete;
                  let actionDataRecordType = "";
                  if (action.data.customer__r) {
                    actionDataRecordType =
                      action.data.customer__r["record_type"];
                  }
                  if (newData.call_call_key_message_list) {
                    newData.call_call_key_message_list.forEach(km => {
                      newReportList.push(km);
                    });
                  }
                  if (newData.call_call_product_list) {
                    newData.call_call_product_list.forEach(pm => {
                      newReportList.push(pm);
                    });
                  }
                  if (
                    report.length === newReportList.length &&
                    actionDataRecordType !== "pharmacy"
                  ) {
                    let alert = this.alertCtrl.create({
                      title: this.translateService.translateFunc(
                        "pad.alert_remind_title"
                      ),
                      subTitle: this.translateService.translateFunc(
                        "pad.alert_remind_cant_complete_call_without_product_reaction"
                      ),
                      buttons: [
                        {
                          text: this.translateService.translateFunc(
                            "pad.action_ok"
                          ),
                          handler: data => {}
                        }
                      ]
                    });
                    alert.present();
                    return;
                  }
                }
              }
              this.updateEnd(action);
            }
          } else if (expression_type === "alert" && exp_val !== true) {
            action.expression_type = "alert";
            if (window[config.default_language][exp_val] !== exp_val) {
              exp_val = window[config.default_language][exp_val];
            }
            action.pro_title = exp_val;
            let alert = this.alertCtrl.create({
              title: this.translateService.translateFunc(
                "pad.alert_remind_title"
              ),
              subTitle: exp_val,
              buttons: [
                {
                  text: this.translateService.translateFunc("pad.action_ok"),
                  handler: data => {}
                }
              ]
            });
            alert.present();
            return;
          } else if (expression_type === "hidden") {
            if (!exp_val) {
              return;
            }
          } else if (expression_type === "disabled") {
            if (exp_val) {
              action.expression_type = "disabled";
              action.disabled = true;
              if (window[config.default_language][exp_val] !== exp_val) {
                exp_val = window[config.default_language][exp_val];
              }
              action.pro_title = exp_val;
              return;
            }
          } else {
            this.updateEnd(action);
          }
        } else if (expression_type === "alert" && exp_val !== true) {
          action.expression_type = "alert";
          if (
            window[config.default_language][exp_val] &&
            window[config.default_language][exp_val] !== exp_val
          ) {
            exp_val = window[config.default_language][exp_val];
          }
          action.pro_title = exp_val;
          let alert = this.alertCtrl.create({
            title: this.translateService.translateFunc(
              "pad.alert_remind_title"
            ),
            subTitle: exp_val,
            buttons: [
              {
                text: this.translateService.translateFunc("pad.action_ok"),
                handler: data => {}
              }
            ]
          });
          alert.present();
          return;
        } else if (expression_type === "hidden") {
          if (!exp_val) {
            return;
          }
        } else if (expression_type === "disabled") {
          if (exp_val) {
            action.expression_type = "disabled";
            action.disabled = true;
            if (window[config.default_language][exp_val] !== exp_val) {
              exp_val = window[config.default_language][exp_val];
            }
            action.pro_title = exp_val;
            return;
          }
        } else {
          this.updateEnd(action);
        }
      });
    } else {
      this.updateEnd(action);
    }
  }

  updateEnd(action) {
    let data = action.data;
    const dataUpdate = {};
    dataUpdate["version"] = data.version;
    let valid_flag = true;
    let msg;
    if (action.valid_expression) {
      valid_flag = this.callAnotherFunc(
        new Function("t", action.valid_expression),
        action.data
      );
      if (valid_flag !== true) {
        msg = valid_flag;
      }
    }
    if (valid_flag !== true) {
      let alert = this.alertCtrl.create({
        title: msg,
        buttons: [
          {
            text: this.translateService.translateFunc("pad.action_ok"),
            handler: data => {}
          }
        ]
      });
      alert.present();
      return;
    } else if (action.default_field_val) {
      action.default_field_val.forEach(item => {
        if (item.field_type === "js") {
          dataUpdate[item.field] = this.callAnotherFunc(
            new Function("t", item.val),
            action.data
          );
        } else {
          dataUpdate[item.field] = item.val;
        }
      });
      let actions = action.actions;
      const updateApiName = action.object_describe_api_name;
      this.mService
        .putDataByApiNameAndId(updateApiName, dataUpdate, data.id)
        .then((res: any) => {
          if (res.head.code === 200) {
            let toast = this.toastCtrl.create({
              message: this.translateService.translateFunc(
                "pad.alert_operate_success"
              ),
              duration: 2000,
              position: "top",
              cssClass: "toast_success"
            });
            toast.present();
            this.gotoPage(DetailPage, [res.body, "", "detail"]);
            actions.forEach(act => {
              if (!action["action.i18n_key"]) {
                let key = "action." + action.action.toLowerCase();
                action.label = this.translateService.translateFunc(key);
              }
              if (
                action["action.i18n_key"] &&
                this.translateService.translateFunc(
                  action["action.i18n_key"]
                ) !== action["action.i18n_key"]
              ) {
                action.label = this.translateService.translateFunc(
                  action["action.i18n_key"]
                );
              }
              if (act.action.toLowerCase() === "update") {
                if (act.expression) {
                  const validResult = this.callAnotherFunc(
                    new Function("t", act.expression),
                    res.body
                  );
                  if (validResult) {
                    action.label = act.label;
                  }
                }
              }
            });
          }
        });
    }
  }

  callAnotherFunc(fnFunction: Function, vArgument) {
    if (_.isFunction(fnFunction)) {
      return (<Function>fnFunction)(vArgument);
    } else {
      return true;
    }
  }

  matchIcon(item) {
    switch (item.object_describe_api_name) {
      case "customer":
        if (item.record_type === "hco") {
          return "medkit";
        } else {
          return "people";
        }
      case "home":
        return "home";
      case "call":
        return "megaphone";
      case "event":
        return "briefcase";
      case "calendar":
        return "calendar";
      case "help":
        return "hand";
      case "bonus":
        return "usd";
      case "user":
        return "person";
      case "report":
        return "podium";
      case "product":
        return "medkit";
      case "coach_feedback":
        return "pricetag";
      case "time_off_territory":
        return "time";
      case "clm_presentation":
        return "paper";
      default:
        return "bookmark";
    }
  }

  openPage(tab) {
    console.log(tab, "=====tab======");
    this.apiName = tab;
    this.menuCtrl.close();
    if (this.apiName === "user") {
      this.menuCtrl.close();
      this.gotoPage(UserPage, "");
    } else if (this.apiName === "calendar" || this.apiName === "fc_calendar") {
      this.gotoCalendarPage();
    } else if (this.apiName === "main" || !this.apiName) {
      this.gotoMainPage();
    } else if (this.apiName === "notice" || this.apiName === "fc_notice") {
      this.gotoNoticePage();
    } else {
      console.log(tab);
      switch (tab.type) {
        case "object_index":
          this.menuCtrl.close();
          //console.log(tab);
          if (tab.api_name === "fc_calendar") {
            this.gotoCalendarPage();
          } else if (tab.api_name === "fc_notice") {
            this.gotoNoticePage();
          } else {
            this.gotoPage(HomePage, tab);
          }
          return;
        case "external_page":
          this.httpService.reqEnd();
          this.gotoExternalPage(tab);
          return;
        // case 'internal_page':
        //   this.gotoExternalPage(tab);
        //   return;
        default:
          this.httpService.reqEnd();
          console.error("不支持的布局格式 layout_type=" + tab.type);
          return;
      }
    }
  }

  gotoInternalPage(tab) {
    this.menuCtrl.close();
    this.nav.setRoot(ExternalPage, tab);
  }

  //tab参数示例
  // {
  //   "id": 1616890092143682,
  //   "tenant_id": "T8324214946008073",
  //   "create_by": "8445624276675592",
  //   "update_by": "8445624276675592",
  //   "is_deleted": false,
  //   "create_time": 1578994230610,
  //   "update_time": 1579177833150,
  //   "version": 5,
  //   "hidden_devices": [],
  //   "display_order": 3,
  //   "external_page_param": "token={{fc_token}}",
  //   "define_type": "custom",
  //   "type": "external_page",
  //   "external_page_src": "https://stg.hspharm.com:8000/report/",
  //   "api_name": "tab_reports",
  //   "label": "报表"
  // }
  gotoExternalPage(tab) {
    this.menuCtrl.close();
    this.nsv.checkServer();
    if (!this.nsv.onlineStatus) {
      let alert = this.alertCtrl.create({
        title: this.translateService.translateFunc("pad.alert_confirm_title"),
        subTitle: this.translateService.translateFunc(
          "pad.online_status_offline"
        ),
        buttons: [
          {
            text: this.translateService.translateFunc("pad.action_ok"),
            handler: data => {}
          }
        ]
      });
      alert.present();
    } else {
      if (tab.label === "奖金") {
        this.gotoInternalPage(tab);
      } else {
        //默认情况走到这里
        const openUrl = tab.external_page_src;
        const parmas = tab.external_page_param;
        const encryption = tab.param_encryption;
        const title = tab.label;
        const showHeader = _.get(tab, "showHeader", false); //布局中可以控制是否显示header，默认不显示header
        this.lanchIFramePage(openUrl, parmas, encryption, title, showHeader);
      }
    }
  }

  //openUrl为 https://stg.hspharm.com:8000/report/
  //parmas为token={{fc_token}}
  lanchIFramePage(openUrl, parmas, encryption, title, showHeader) {
    let SearchParms = "";
    let addParamsFlag = false;
    if (parmas) {
      parmas.split("\n").forEach((param, index) => {
        const values = parmas.split("\n");
        if (param.indexOf("=") > -1) {
          const [key, value] = param.split("=");
          let converted =
            _.template(value.trim())({ user: this.userInfo.user }) ===
            value.trim()
              ? _.template(value.trim())({ user: this.userInfo })
              : _.template(value.trim())({ user: this.userInfo.user });
          if (value.indexOf("{{") > -1) {
            let x = value.replace("{{", "").replace("}}", "");
            converted = this.userInfo.user[x];
            if (!this.userInfo.user[x]) {
              converted = this.userInfo[x];
            }
          } else if (value.indexOf("{") > -1) {
            let x = value.replace("{", "").replace("}", "");
            converted = this.userInfo.user[x];
            if (!this.userInfo.user[x]) {
              converted = this.userInfo[x];
            }
          }
          let encrypted = "";
          switch (encryption) {
            //TODO  BASE64起不到加密作用，仅仅做一下编码避免用户可以手工修改参数, 后续可以支持其它加密方式
            case "base64":
              encrypted = window.btoa(converted);
              break;
            default:
              encrypted = converted;
              break;
          }
          if (values.length > index + 1) {
            SearchParms = SearchParms + key.trim() + "=" + encrypted + "&";
          } else {
            //console.log(index, key, converted);
            SearchParms = SearchParms + key.trim() + "=" + encrypted;
          }
          addParamsFlag = true;
        }
      });
    }
    openUrl = addParamsFlag ? openUrl + "?" + SearchParms : openUrl;
    this.gotoPage(IFramePage, { title, showHeader, url: openUrl });

    //this.inAppBrowser = this.sanitizer.bypassSecurityTrustResourceUrl(openUrl);
  }

  gotoUserPage() {
    this.menuCtrl.close();
    this.apiName = "user";
    this.gotoPage(UserPage, "");
  }

  gotoCalendarPage() {
    this.httpService.reqStart();
    this.menuCtrl.close();
    this.apiName = "calendar";
    this.mService.getCalendarLayout().then((res: any) => {
      this.httpService.reqEnd();
      if (res.body.value) {
        const calendarLayout = JSON.parse(res.body.value);
        this.gotoPage(CalendarPage, calendarLayout);
      } else {
        console.error("calendar layout missing");
      }
    });
  }

  gotoNoticePage() {
    this.menuCtrl.close();
    this.apiName = "notice";
    this.gotoPage(NoticePage, "");
  }

  gotoMainPage() {
    this.httpService.reqStart();
    this.menuCtrl.close();
    this.apiName = "main";
    this.gotoPage(MainPage, "");
  }

  refreshApp() {
    this.tabs = [];
    this.thirdTabs = [];
    this.mService.getMenus().then((res: any) => {
      const array = _.sortBy(res.body.items, "display_order");
      this.changeMenu(array, "main", this.header, "");
      this.gotoPage(MainPage, "");
    });
  }

  gotoPage(page, params) {
    console.log(page, "============params========");
    this.nav.setRoot(page, params);
  }

  deleteEventData(item) {
    if (item.id) {
      this.activeListData.splice(this.activeListData.indexOf(item), 1);
      this.mService
        .deleteDataByApiNameAndId("event_attendee", item.id)
        .then((res: any) => {});
    } else {
      this.activeListData.splice(this.activeListData.indexOf(item), 1);
      this.addEventList.splice(this.addEventList.indexOf(item), 1);
    }
    this.events.publish("event:delete", item);
  }

  closeSlide(slidingItem: ItemSliding) {
    slidingItem.close();
  }
}
