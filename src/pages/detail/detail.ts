import {
  Component,
  ComponentFactoryResolver,
  ViewChild,
  ViewContainerRef,
  ComponentRef
} from "@angular/core";
import {
  NavParams,
  Events,
  NavController,
  AlertController
} from "ionic-angular";
import _ from "lodash";
import {
  MainService,
  DataService,
  TranslateService,
  HttpService
} from "../../providers/index";
import { DetailForm, ModalComponent } from "../../components/index";
import { RelatedList, EditPage, AddPage } from "../../pages/index";
import {
  UserInfo,
  PermissionHelper,
  callMultiAnotherFunc
} from "../../utils/index";

@Component({
  selector: "page-detail",
  templateUrl: "detail.html"
})
export class DetailPage {
  @ViewChild("insertDiv", { read: ViewContainerRef })
  insertDiv: ViewContainerRef;
  @ViewChild("relatedListFields", { read: ViewContainerRef })
  relatedListFields: ViewContainerRef;
  constructor(
    public navParams: NavParams,
    public mainService: MainService,
    public cfr: ComponentFactoryResolver,
    public events: Events,
    public nav: NavController,
    public userInfo: UserInfo,
    public alertCtrl: AlertController,
    public permissionHelper: PermissionHelper,
    public dataService: DataService,
    public translateService: TranslateService,
    public httpService: HttpService
  ) {
    //this.navParams.data = [ data, 'layout', pageFlag :sting ='detail']
    if (this.navParams.data[2]) {
      this.pageFlag = this.navParams.data[2];
    }
  }

  params = _.cloneDeep(this.navParams.data);
  data = this.params[0];
  layout = this.params[1];
  apiName = this.params[0].object_describe_name;
  id = this.params[0].id;
  header: any;
  recordType: any;
  // mainPage = InputItem;
  subMenu = [];
  mainData = [];
  metadata: any;
  describe = this.params[2];

  relatedActions = [];
  actions = [];
  allActions = [];
  detaiRef: any;
  tabs = [];
  isCreateClm = true;
  pageFlag = "detail";
  parentData: any = this.params[3] ? this.params[3] : {};

  //modal fields
  modalFields = [];
  compRef: ComponentRef<ModalComponent>;
  compRefs = [];

  ionViewWillEnter() {
    this.dataService.init();
    this.listenRelatedPush();
  }

  listenRelatedPush() {
    this.events.subscribe(
      "related:push",
      (page: any, params: any, pageType: any) => {
        this.events.unsubscribe("related:push");
        this.nav.setRoot(page, params);
      }
    );
    this.events.publish("menu:pageRealType", "detail");
  }

  ionViewDidLeave() {}

  backToUp() {
    if (this.pageFlag === "main") {
    } else if (this.pageFlag === "detail") {
      if (this.userInfo.token) {
        this.mainService.getMenus().then((res: any) => {
          this.tabs = [];
          for (let x in res.body.items) {
            if (res.body.items[x].api_name !== "alert") {
              this.tabs.push(res.body.items[x]);
            }
          }
          this.events.publish("menu:change", this.tabs, "main");
        });
      }
    } else if (this.pageFlag === "fakeDetail") {
      this.nav.pop();
    }

    if (this.pageFlag !== "fakeDetail") {
      if (this.nav.indexOf(this.nav.last()) === 1) {
        if (this.pageFlag === "subDetail") {
          this.events.publish("menu:back", "third");
          this.pageFlag = "detail";
        } else {
          this.events.publish("clear:data");
        }
        this.nav.pop();
      } else {
        this.events.publish("menu:back");
        this.events.publish("clear:data");
      }
    }
    //返回的时候去掉多余的订阅
    this.events.unsubscribe("related:push");
    //
  }

  ionViewDidLoad() {
    this.httpService.reqEnd();
    let isOnline = true;
    if (
      window["CREATE_CLM_IN_CALL"] !== undefined &&
      window["CREATE_CLM_IN_CALL"] == false
    ) {
      this.isCreateClm = false;
    } else {
      this.isCreateClm = true;
    }
    if (
      this.apiName == "segmentation_history" ||
      this.apiName == "coach_feedback"
    ) {
      isOnline = false;
    }
    if (this.data["fakeId"]) {
      Promise.all([
        this.mainService.getLayoutByApiNameAndPageType(
          this.apiName,
          "detail_page",
          this.data.record_type
        ),
        this.mainService.getDescribeByApiName(this.apiName)
      ]).then((res: any) => {
        const layout = res[0].body;
        this.recordType = layout.record_type;
        const describe = res[1].body;
        const metadata = this.data;
        this.renderDom(layout, describe, metadata);
      });
    } else {
      Promise.all([
        this.mainService.getLayoutByApiNameAndPageType(
          this.apiName,
          "detail_page",
          this.data.record_type
        ),
        this.mainService.getDescribeByApiName(this.apiName),
        this.mainService.getDataByApiNameAndId(this.apiName, this.id, isOnline)
      ]).then((res: any) => {
        const layout = res[0].body;
        this.recordType = layout.record_type;
        const describe = res[1].body;
        const metadata = res[2].body;

        console.log("detail metadata", metadata);
        this.renderDom(layout, describe, metadata);
      });
    }
  }

  ionViewWillLeave() {
    //this.events.publish('menu:control', true);
  }

  renderDom(layout, describe, metadata) {
    this.insertDiv.clear();
    this.header = layout.display_name;
    if (
      layout["layout.i18n_key"] &&
      this.translateService.translateFunc(layout["layout.i18n_key"]) !==
        layout["layout.i18n_key"]
    ) {
      this.header = this.translateService.translateFunc(
        layout["layout.i18n_key"]
      );
    }
    if (layout.containers != undefined) {
      const components = layout.containers[0].components;
      components.forEach(component => {
        if (component.show_in_phone_detail) {
          this.generatorModalList(component, describe, metadata);
        } else {
          this.insertComponent(component, describe, metadata);
        }
      });
      if (this.subMenu.length > 0 || this.relatedActions.length > 0) {
        this.events.publish(
          "menu:change",
          this.subMenu,
          "sub",
          this.header,
          this.navParams.data
        );
      } else if (this.pageFlag !== "subDetail") {
        if (this.userInfo.token) {
          this.mainService.getMenus().then((res: any) => {
            for (let x in res.body.items) {
              if (res.body.items[x].api_name !== "alert") {
                this.tabs.push(res.body.items[x]);
              }
            }
            this.events.publish("menu:change", this.tabs, "main");
          });
        }
      }
    }
  }

  pageAction(action) {
    console.log(action, "========action=======");
    this.metadata = this.detaiRef.instance.metadata;
    switch (action.action.toLowerCase()) {
      case "callback":
        this.backToUp();
        break;
      case "save":
        break;
      case "edit":
        this.nav.push(EditPage, [this.apiName, action, this.metadata]);
        break;
      case "add":
        this.nav.push(AddPage, [this.apiName, action]);
        break;
      case "custom_update":
        this.customUpdate(action);
        break;
      case "relatedadd":
        break;
      case "cancel":
        this.deleteData();
        break;
      case "update":
        //this.update
        break;
      default:
        return;
    }
  }

  deleteData() {
    this.mainService
      .deleteDataByApiNameAndId(this.apiName, this.data.id)
      .then((res: any) => {
        if (res.head.code === 200) {
          let alert = this.alertCtrl.create({
            title: res.head.msg,
            buttons: [
              {
                text: this.translateService.translateFunc("pad.action_ok"),
                handler: data => {}
              }
            ]
          });
          alert.present();
          this.backToUp();
        } else {
          let alert = this.alertCtrl.create({
            title: this.translateService.translateFunc(
              "pad.alert_failed_title"
            ),
            buttons: [
              {
                text: this.translateService.translateFunc("pad.action_ok"),
                handler: data => {}
              }
            ]
          });
          alert.present();
        }
      });
  }

  customUpdate(action) {
    let record_type = this.recordType;
    if (action.default_field_val) {
      action.default_field_val.forEach(item => {
        if (item.field === "record_type") {
          record_type = item.val;
        }
      });
    }
    if (action.to === "back") {
      //handler
      this.backToUp();
    } else if (action.to === "edit") {
      //handler
      this.nav.push(EditPage, [
        this.apiName,
        action,
        this.metadata,
        record_type
      ]);
    } else {
      //noting todo
      this.nav.push(EditPage, [
        this.apiName,
        action,
        this.metadata,
        record_type
      ]);
    }
  }

  insertComponent(component, describe, metadata) {
    switch (component.type) {
      case "detail_form":
        this.mainData = [component, describe, metadata];
        component.actions.forEach(action => {
          if (!action.label && !action["action.i18n_key"]) {
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
          if (action.show_when) {
            action.show_when.forEach(type => {
              if (
                type === "detail" &&
                action.action.toLowerCase() !== "callback"
              ) {
                this.allActions.push(action);
                if (action.action.toLowerCase().indexOf("related") < 0) {
                  if (this.isHavePermission(action)) {
                    this.actions.push(action);
                  }
                }
              }
            });
          }
        });
        this.isCollectInSystem(this.data, this.allActions);
        this.gotoDeatilFormPage(this.mainData);
        break;
      case "related_list":
        if (component.show_number) {
          if (
            component["header.i18n_key"] &&
            this.translateService.translateFunc(
              component["header.i18n_key"]
            ) !== component["header.i18n_key"]
          ) {
            component.header = this.translateService.translateFunc(
              component["header.i18n_key"]
            );
          }
          let object = {
            title: component.header,
            data: [component, describe, metadata],
            count: 0
          };
          this.subMenu.push(object);
          component.show_number.forEach(page => {
            if (page == "detail") {
              let body = {
                joiner: "and",
                objectApiName: component.ref_obj_describe,
                criterias: [
                  {
                    field: "record_type",
                    operator: "in",
                    value: component.record_type
                  },
                  {
                    field: this.apiName,
                    operator: "==",
                    value: [this.data.id]
                  }
                ]
              };
              this.mainService.getSearchData(body).then((res: any) => {
                if (res.body) {
                  if (res.body.resultCount !== undefined) {
                    object.count = res.body.resultCount;
                  }
                }
              });
            }
          });
        } else {
          if (
            component["header.i18n_key"] &&
            this.translateService.translateFunc(
              component["header.i18n_key"]
            ) !== component["header.i18n_key"]
          ) {
            component.header = this.translateService.translateFunc(
              component["header.i18n_key"]
            );
          }
          this.subMenu.push({
            title: component.header,
            data: [component, describe, metadata]
          });
        }
        break;
      default:
        break;
    }
  }

  isHavePermission(action) {
    // if (action.action.toLowerCase().indexOf("add") > -1) {
    //   return this.permissionHelper.fc_hasObjectPrivilege(this.apiName, 1);
    // } else if (action.action.toLowerCase().indexOf("edit") > -1) {
    //   return this.permissionHelper.fc_hasObjectPrivilege(this.apiName, 2);
    // } else if (action.action.toLowerCase().indexOf("detail") > -1) {
    //   return this.permissionHelper.fc_hasObjectPrivilege(this.apiName, 3);
    // } else if (action.action.toLowerCase().indexOf("delete") > -1) {
    //   return this.permissionHelper.fc_hasObjectPrivilege(this.apiName, 4);
    // } else {
    //   return true;
    // }
    return this.permissionHelper.judgeFcObjectPrivilvege(
      action.action,
      this.apiName
    );
  }

  isCollectInSystem(data, actions) {
    //判断在收藏表里面是否有这条数据，如果有的话，就返回true，否则返回false;
    //在这里判断是否已经收藏
    if (actions !== undefined) {
      actions.forEach(action => {
        if (!action.label && !action["action.i18n_key"]) {
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
        if (this.isHavePermission(action)) {
          let show_when_flag = true;
          let hidden_expression_flag = false;
          let hidden_divice_flag = false;
          if (action.show_when) {
            action.show_when.forEach(item => {
              if (item === "detail") {
                show_when_flag = false;
              }
            });
          }
          if (action.hidden_expression) {
            let expression = action.hidden_expression;
            if (!_.isEmpty(this.parentData)) {
              hidden_expression_flag = callMultiAnotherFunc(
                new Function("t", "p", action.disabled_expression),
                data,
                this.parentData
              );
            } else {
              hidden_expression_flag = callMultiAnotherFunc(
                new Function("t", "p", expression),
                data,
                this.parentData
              );
            }
          }
          if (action.hidden_devices) {
            action.hidden_devices.forEach(item => {
              if (
                item.toLowerCase() === "ipad" ||
                item.toLowerCase() === "phone"
              ) {
                hidden_divice_flag = true;
              }
            });
          }
          if (hidden_expression_flag || show_when_flag || hidden_divice_flag) {
          } else {
            let isDisabled = false;
            if (action.disabled_expression) {
              if (!_.isEmpty(this.parentData)) {
                isDisabled = callMultiAnotherFunc(
                  new Function("t", "p", action.disabled_expression),
                  data,
                  this.parentData
                );
              } else {
                isDisabled = this.callAnotherFunc(
                  new Function("t", action.disabled_expression),
                  data
                );
              }
            }
            action.isDisabled = isDisabled;
            action.data = data;
            action.object_describe_api_name = this.apiName;
            action.actions = actions;
            if (!isDisabled) {
              if (!action.label && !action["action.i18n_key"]) {
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
              this.relatedActions.push(action);
            }
          }
        }
      });
    }
    this.events.publish("related:actions", this.relatedActions);
  }

  callAnotherFunc(fnFunction: Function, vArgument) {
    if (_.isFunction(fnFunction)) {
      return (<Function>fnFunction)(vArgument);
    } else {
      return true;
    }
  }

  gotoRelatePage(metadata) {
    const data = _.cloneDeep(metadata);
    const related = this.cfr.resolveComponentFactory(RelatedList);
    this.insertDiv.clear();
    let relatedRef = this.insertDiv.createComponent(related);
    relatedRef.instance.layout = data[0];
    relatedRef.instance.describe = data[1];
    relatedRef.instance.metadata = data[2];
  }

  generatorModalList(component, describe, metadata) {
    if (this.relatedListFields) {
      //this.relatedListFields.clear();
      if (this.relatedListFields.length === 0) {
        let cpnt = this.cfr.resolveComponentFactory(ModalComponent);
        const compRef = this.relatedListFields.createComponent(cpnt);
        compRef.instance.params = {
          layout: this.layout,
          describe: describe,
          modalComp: component,
          data: this.data
        };
        compRef.instance.pageType = "detail";
        this.compRefs.push(compRef);
      }
    }
  }

  gotoDeatilFormPage(metadata) {
    console.log(metadata, "========metadata=========");
    const data = _.cloneDeep(metadata);
    let form = this.cfr.resolveComponentFactory(DetailForm);
    this.insertDiv.clear();
    this.detaiRef = this.insertDiv.createComponent(form);
    this.detaiRef.instance.init();
    this.detaiRef.instance.layout = data[0];
    this.detaiRef.instance.describe = data[1];
    this.detaiRef.instance.metadata = data[2];
    console.log("detail-data is==>", data);
  }
}
