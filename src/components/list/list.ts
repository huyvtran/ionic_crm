import { Component } from "@angular/core";
import {
  Events,
  AlertController,
  NavController,
  ItemSliding
} from "ionic-angular";
import _ from "lodash";
import { Storage } from "@ionic/storage";
import {
  MainService,
  ListService,
  LoginService,
  NetworkService,
  TranslateService,
  HttpService
} from "../../providers/index";
import {
  AddPage,
  EditPage,
  DetailPage,
  ClmDetailPage,
  BatchAddition
} from "../../pages/index";
import { UserInfo, config } from "../../utils/index";

@Component({
  selector: "list",
  templateUrl: "list.html"
})
export class List {
  data: any;
  layout: any;
  describe: any;
  layoutItem: any;
  layoutKeyItem: any = {};
  listData: any[];
  apiName: any;
  renderType: any;
  apiNameSecend: any;
  options: any;
  actions: any;
  filter: any;
  body = [];
  tabs = [];
  delData: any;
  total: any;
  newData = [];
  isPress = false;
  oldListData: any[];
  canGoToDetail = true;
  listAction: (action: any) => void;
  constructor(
    public nav: NavController,
    public mainService: MainService,
    public events: Events,
    public alertCtr: AlertController,
    public userInfo: UserInfo,
    public listService: ListService,
    public loginService: LoginService,
    public network: NetworkService,
    public translateService: TranslateService,
    public httpService: HttpService,
    public storage: Storage
  ) {}
  ngOnInit() {
    _.each(this.listData, items => {
      _.each(items.list.contents, filter => {
        if (filter.data == "医院级别：") {
          filter.data = `医院级别：${_.get(items.data, "hco_level", "")}`;
        }
        if (filter.data == "医院等级：") {
          filter.data = `医院等级：${_.get(items.data, "hco_sub_level", "")}`;
        }
      });
    });
    this.canGoToDetail = true;
    this.listAction = action => {
      this.openWindowWithActions(action);
    };
    if (this.userInfo.token) {
      this.mainService.getMenus().then((res: any) => {
        const array = _.sortBy(res.body.items, "display_order");
        for (let x in array) {
          if (array[x].api_name !== "alert") {
            this.tabs.push(array[x]);
          }
        }
        this.events.publish("menu:change", this.tabs, "main");
      });
    }
    this.apiName = this.listService.apiName;
    this.total = this.listService.total;
    this.isPress = false;
    this.storage.set("modal-comp:modalStorage", "");
  }

  openWindowWithActions(action, data?: any, listItem?: any) {
    this.network.checkServer();
    if (this.apiName == "call" && this.network.onlineStatus) {
      this.loginService
        .getCRMPowerSetting(this.userInfo.profile["id"], this.userInfo.token)
        .then((res: any) => {
          if (res.head.code === 200 && res.body.result[0]) {
            let CALL_BACKDATE_LIMIT = res.body.result[0].call_backdate_limit;
            if (CALL_BACKDATE_LIMIT != window["CALL_BACKDATE_LIMIT"]) {
              window["CALL_BACKDATE_LIMIT"] = CALL_BACKDATE_LIMIT;
            }
            this.windowActionHandler(action, data, listItem);
          } else {
            window["CALL_BACKDATE_LIMIT"] = undefined;
            this.windowActionHandler(action, data, listItem);
          }
        });
    } else {
      this.windowActionHandler(action, data, listItem);
    }
  }

  windowActionHandler(action, data?: any, listItem?: any) {
    if (data !== undefined) {
      this.renderType = data.record_type;
    } else {
      this.renderType = this.listService.recordType;
      if (listItem) {
        data = listItem.data;
      }
    }
    if (action.target_layout_record_type) {
      this.renderType = action.target_layout_record_type;
    }
    let body = {
      joiner: "and",
      needRelationQuery: true,
      objectApiName: "customer",
      order: "desc",
      orderBy: "update_time",
      pageNo: 1,
      pageSize: 10,
      criterias: []
    };
    if (action.target_filter_criterias) {
      body.criterias = action.target_filter_criterias.criterias;
    }
    switch (action.action.toLowerCase()) {
      case "add":
        this.httpService.reqStart();
        this.events.publish("cachePage", AddPage, [
          this.apiName,
          action,
          this.renderType
        ]);
        this.nav.push(AddPage, [this.apiName, action, this.renderType]);
        break;
      case "edit":
        this.httpService.reqStart();
        if (action.target_layout_record_type) {
          this.events.publish("cachePage", EditPage, [
            this.apiName,
            action,
            listItem.data,
            action.target_layout_record_type
          ]);
          this.nav.push(EditPage, [
            this.apiName,
            action,
            listItem.data,
            action.target_layout_record_type
          ]);
        } else {
          this.events.publish("cachePage", EditPage, [
            this.apiName,
            action,
            listItem.data,
            this.renderType
          ]);
          this.nav.push(EditPage, [
            this.apiName,
            action,
            listItem.data,
            this.renderType
          ]);
        }
        break;
      case "modify":
      case "relatedcollect":
        this.dataCollectHandler(action, listItem.data, listItem);
        break;
      case "delete":
      case "cancel":
        this.deleteData(action, data, listItem);
        break;
      case "detail":
        this.httpService.reqStart();
        this.events.publish("cachePage", DetailPage, [
          data,
          action,
          this.renderType
        ]);
        this.nav.push(DetailPage, [data, action, this.renderType]);
        break;
      case "update":
        this.updateData(action, listItem);
        break;
      case "custom_update":
        this.customUpdate(action, data, listItem);
        break;
      case "relatedupdate":
        this.relatedUpdateHandler(action, data, listItem);
        break;
      case "relatedadd":
        this.relatedAddHandler(action, data, listItem);
        break;
      case "batch_add_customer_territory":
        this.nav.push(BatchAddition, [
          action,
          "relation_lookup_page",
          this.listService.listGenerator(),
          body
        ]);
        break;
      default:
        return;
    }
  }

  relatedAddHandler(action, data, listItem) {
    let refApiName = action.ref_obj_describe;
    let refRecordType = action.target_layout_record_type;
    this.nav.push(AddPage, [refApiName, action, refRecordType, data]);
  }

  onPress(item) {
    this.listService.footerAction = [];
    this.listService.selectAllFlag = false;
    this.listService.layout.actions.forEach(action => {
      if (!action["action.i18n_key"]) {
        let key = "action." + action.action.toLowerCase();
        action.label = this.translateService.translateFunc(key);
      }
      if (
        action["action.i18n_key"] &&
        this.translateService.translateFunc(action["action.i18n_key"]) !==
          action["action.i18n_key"]
      ) {
        action.label = this.translateService.translateFunc(
          action["action.i18n_key"]
        );
      }
      if (action.action === "UPDATE_after_rows_selected") {
        const isHidden = this.callAnotherFunc(
          new Function("t", action.hidden_expression),
          item.data
        );
        if (!isHidden) {
          this.listService.footerAction.push(action);
        }
      }
      if (this.listService.footerAction.length > 0) {
        this.canGoToDetail = false;
        this.isPress = true;
        this.listService.footerDisplay = "flex";
      }
    });
  }

  itemCheckChange(item) {
    //console.log(this.listData, item);
  }

  checkFavorite(e) {
    this.newData = [];
    if (e.checked && this.listService.isFavorite) {
      this.oldListData = _.cloneDeep(this.listData);
      this.listService.listParam.pageSize = 1000;
      this.listService.listParam.pageNo = 1;
      this.mainService
        .getSearchData(this.listService.listParam)
        .then((res: any) => {
          if (res.head.code === 200) {
            const data = res.body.result;
            data.forEach(dt => {
              let flag = false;
              if (flag) {
                this.newData.push(dt);
              }
            });
          }
          this.listService.dataAfter = this.newData;
          this.listService.pageCount = 1;
          this.total = this.newData.length;
          this.listService.total = this.total;
          this.listService.isFavorite = true;
          this.listData = this.listService.listGenerator();
        });
    } else {
      this.listService.listParam.pageNo = 1;
      this.listService.listParam.pageSize = 10;
      this.mainService
        .getSearchData(this.listService.listParam)
        .then((res: any) => {
          if (res.head.code === 200) {
            const data = res.body.result;
            this.listService.dataAfter = data;
            this.listService.pageCount = res.body.pageCount;
            this.listService.listParam.pageNo = 1;
            this.listData = this.listService.listGenerator();
            this.total = this.listService.total;
            this.listService.total = this.total;
            this.listService.isFavorite = false;
          }
        });
    }
  }

  relatedUpdateHandler(action, data, listItem) {
    let value = action.update_val;
    let field = action.link_field;
    if (value) {
      data[field] = value;
      this.mainService
        .putDataByApiNameAndId(this.apiName, data, data.id)
        .then((res: any) => {
          if (res.body.id) {
            let updateItem = this.listService.listItemUpdate(
              res.body,
              this.listData.indexOf(listItem)
            );
            this.listData[this.listData.indexOf(listItem)] = updateItem;
          }
        });
    }
  }

  deleteData(action, data, listItem) {
    this.delData = data;
    if (data.id !== undefined) {
      let id = data.id;
      let alert = this.alertCtr.create({
        title: this.translateService.translateFunc("pad.alert_remind_title"),
        subTitle: this.translateService.translateFunc(
          "pad.alert_remind_if_delete_data"
        ),
        buttons: [
          {
            text: this.translateService.translateFunc("pad.action_cancel"),
            handler: dt => {
              //this.backToUp();
            }
          },
          {
            text: this.translateService.translateFunc("pad.action_ok"),
            handler: dt => {
              this.mainService
                .deleteDataByApiNameAndId(this.apiName, id)
                .then((res: any) => {
                  if (res.head.code == 200) {
                    this.deleteDataFromList(data, listItem);
                  }
                });
            }
          }
        ]
      });

      alert.present();
    }
  }

  updateData(action, listItem) {
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
      let alert = this.alertCtr.create({
        title: this.translateService.translateFunc("pad.alert_remind_title"),
        subTitle: action.confirm_message,
        buttons: [
          {
            text: this.translateService.translateFunc("pad.action_no"),
            handler: dt => {}
          },
          {
            text: this.translateService.translateFunc("pad.action_yes"),
            handler: dt => {
              this.handlerUpdate(action, listItem);
            }
          }
        ]
      });
      alert.present();
    } else {
      let valid_flag = true;
      if (action.valid_expression) {
        let msg;
        valid_flag = this.callAnotherFunc(
          new Function("t", action.valid_expression),
          action.data
        );
        if (valid_flag !== true) {
          msg = valid_flag;
          if (window[config.default_language][msg]) {
            const showMsg = window[config.default_language][msg];
            msg = showMsg;
          }
        }
        let actionDataRecordType = "";
        if (listItem.data.customer__r) {
          actionDataRecordType = listItem.data.customer__r["record_type"];
        }
        if (valid_flag !== true && actionDataRecordType !== "pharmacy") {
          let alert = this.alertCtr.create({
            title: this.translateService.translateFunc(
              "pad.alert_remind_title"
            ),
            subTitle: msg,
            buttons: [
              {
                text: this.translateService.translateFunc("pad.action_ok"),
                handler: data => {}
              }
            ]
          });
          alert.present();
        }
      }
      if (valid_flag == true) {
        this.handlerUpdate(action, listItem);
      }
    }
  }

  handlerUpdate(action, listItem) {
    let actionDataRecordType = "";
    if (listItem.data.customer__r) {
      actionDataRecordType = listItem.data.customer__r["record_type"];
    }
    if (action.pro_expression) {
      //list 添加update的pro_expression
      const expObj = action.pro_expression;
      const getApiName = expObj.pro_obj_api_name;
      const filters = expObj.pro_filter_criterias;
      const criterias = [];
      filters.forEach(filter => {
        if (filter.field_type) {
          if (filter.field_type === "js") {
            const value = this.callAnotherFunc(
              new Function("t", filter.value),
              listItem.data
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
      this.mainService.getSearchData(body).then((res: any) => {
        const list = res.body.result;
        const expression_type = expObj.pro_expression_render.expression_type;
        let exp_val = this.callAnotherFunc(
          new Function("list", expObj.pro_expression_render.expression),
          list
        );
        if (window[config.default_language][exp_val]) {
          exp_val = window[config.default_language][exp_val];
        }
        let actionDataRecordType = "";
        if (listItem.data.customer__r) {
          actionDataRecordType = listItem.data.customer__r["record_type"];
        }
        let isNotPharmacyCall = true;
        if (
          getApiName == "call_product" &&
          actionDataRecordType == "pharmacy"
        ) {
          isNotPharmacyCall = false;
        }
        if (
          expression_type === "alert" &&
          exp_val !== true &&
          isNotPharmacyCall
        ) {
          action.expression_type = "alert";
          // if (window[config.default_language][exp_val] !== exp_val) {
          //   exp_val = window[config.default_language][exp_val];
          // }
          action.pro_title = exp_val;
          let alert = this.alertCtr.create({
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
            // if (window[config.default_language][exp_val] !== exp_val) {
            //   exp_val = window[config.default_language][exp_val];
            // }
            action.pro_title = exp_val;
            return;
          }
        } else {
          this.updateEnd(action, listItem);
        }
      });
    } else {
      this.updateEnd(action, listItem);
    }
  }

  updateEnd(action, listItem) {
    if (action.default_field_val) {
      const data = {};
      if (action.default_field_val.length > 0) {
        action.default_field_val.forEach(item => {
          if (item.field_type === "js") {
            let value = this.callAnotherFunc(new Function("t", item.val), {});
            data[item.field] = value;
          } else {
            data[item.field] = item.val;
          }
        });
      }
      this.updateDataFromList(listItem, data);
    }
  }

  callAnotherFunc(fnFunction: Function, vArgument) {
    if (_.isFunction(fnFunction)) {
      return (<Function>fnFunction)(vArgument);
    } else {
      return true;
    }
  }

  //方法暂时没用
  customUpdate(action, data, listItem) {
    if (action.default_field_val) {
      action.default_field_val.forEach(item => {
        let x = _.get(data, item.field);
        if (x) {
          for (let index in data) {
            if (index == item.field) {
              data[index] = item.val;
            }
          }
        } else {
          data[item.field] = item.val;
        }
      });

      this.mainService
        .putDataByApiNameAndId(this.apiName, data, data.id)
        .then((res: any) => {
          if (res.body.id) {
            this.listService.load().then(res => {
              this.listData = res;
            });
          }
        });
    }
  }

  deleteDataFromList(data, listItem) {
    this.listData.forEach(item => {
      if (item === listItem) {
        this.listData.splice(this.listData.indexOf(item), 1);
      }
    });
    this.listService.load();
  }

  updateDataFromList(listItem, data) {
    data["version"] = listItem.data.version;
    this.mainService
      .putDataByApiNameAndId(this.apiName, data, listItem.data.id)
      .then((res: any) => {
        if (listItem.data.hco_name) {
          res.body.hco_name = listItem.data.hco_name;
        }
        if (res.body.id !== undefined) {
          let updateItem = this.listService.listItemUpdate(
            res.body,
            this.listData.indexOf(listItem)
          );
          this.listData[this.listData.indexOf(listItem)] = updateItem;
        }
        if (listItem.data.object_describe_name === "alert") {
          this.events.publish("menu:changeAlertCont");
        }
      });
  }

  closeSlide(slidingItem: ItemSliding) {
    slidingItem.close();
  }

  dataCollectHandler(action, data, listItem) {
    let isCollect = false;
    action.options.forEach(option => {
      if (option.label == action.label) {
        isCollect = option.value;
      }
    });
    let related_submit_object_field = action.related_submit_object_field;
    let body = {};
    related_submit_object_field.forEach(item => {
      if (item.field === "user_info") {
        body[item.field] = this.userInfo.userid;
      } else {
        if (data.object_describe_name == item.ref_object_api_name) {
          body[item.field] = data[item.ref_object_field];
        }
      }
    });

    let label = "";
    action.options.forEach(option => {
      if (!(option.label == action.label)) {
        label = option.label;
      }
    });
    if (isCollect) {
      //取消收藏
      if (action.collect) {
        const id = action.collect.id;
        this.mainService
          .deleteDataByApiNameAndId(action.related_describe_api_name, id)
          .then((res: any) => {
            if (res.head !== undefined) {
              if (res.head.code == 200) {
              }
            }
          });
      }
    } else {
      //收藏
      this.mainService
        .pushDataByApiNameAndId(action.related_describe_api_name, body)
        .then((res: any) => {
          if (res.body !== undefined && res.head !== undefined) {
            if (res.head.code == 200) {
              let updateItem = this.listService.listItemUpdate(
                data,
                this.listData.indexOf(listItem)
              );
              this.listData[this.listData.indexOf(listItem)] = updateItem;
              action.collect = res.body;
              action.label = label;
            }
          }
        });
    }
  }

  gotoDetail(listItem) {
    if (!this.canGoToDetail) {
      return;
    }
    const x = listItem.data;
    const rowActions = this.listService.layout.row_actions;
    rowActions.forEach(action => {
      if (!action["action.i18n_key"]) {
        let key = "action." + action.action.toLowerCase();
        action.label = this.translateService.translateFunc(key);
      }
      if (
        action["action.i18n_key"] &&
        this.translateService.translateFunc(action["action.i18n_key"]) !==
          action["action.i18n_key"]
      ) {
        action.label = this.translateService.translateFunc(
          action["action.i18n_key"]
        );
      }
      if (action.action.toLowerCase() === "detail") {
        if (action.default_field_val) {
          action.default_field_val.forEach(fields => {
            x[fields.field] = fields.val;
          });
          this.mainService
            .putDataByApiNameAndId(x.object_describe_name, x, x.id)
            .then((res: any) => {
              if (x.object_describe_name === "alert") {
                this.events.publish("menu:changeAlertCont");
              }
              const data = res.body;
              this.openDetail(data);
            });
        } else {
          this.openDetail(x);
        }
      }
    });
  }

  openDetail(x) {
    this.events.publish("cachePage", DetailPage, [
      x,
      this.listService.layoutItem
    ]);
    let page: any = DetailPage;
    if (this.listService.apiName === "clm_presentation") {
      page = ClmDetailPage;
    }
    this.nav.push(page, [x, this.listService.layoutItem]);
  }

  ngOnDestroy() {
    this.events.unsubscribe("list:data");
  }
}
