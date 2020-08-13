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
  AlertController,
  ToastController
} from "ionic-angular";
import moment from "moment";
import { Storage } from "@ionic/storage";
import _ from "lodash";
import { isNullOrUndefined } from "util";
import {
  MainService,
  DataService,
  TranslateService,
  HttpService
} from "../../providers/index";
import {
  ProductEdit,
  ModalComponent,
  StarRating
} from "../../components/index";
import {
  PickList,
  DetailPage,
  SearchOptions,
  CameraPicker,
  SignInPage
} from "../../pages/index";
import {
  UserInfo,
  config,
  DcrHandler,
  PermissionHelper,
  evalStr
} from "../../utils/index";
import { SurveyPage } from "../survey/survey";
import { SurveyFeedbackEditComp } from "../../components/survey-feedback-edit/survey-feedback-edit";

@Component({
  selector: "page-edit",
  templateUrl: "edit.html"
})
export class EditPage {
  subMenu = [];
  mainData = [];

  params: any;
  layout: any;
  describe: any;
  data: any;
  apiName: any;
  recordType: any;
  actions = [];
  relatedActions = [];
  header: any;
  components = [];
  pageParams: any;
  dcrDetail = [];
  onLookupChangeFields = [];
  dcrItems = [];
  parent: any;
  id: any;
  version: any;
  compRef: any;
  turnType = "back";
  initData: any;

  /**mention_bar */
  default_bar = 0;
  primary_bar = 0;
  success_bar = 0;
  info_bar = 0;
  warning_bar = 0;
  danger_bar = 0;
  link_bar = 0;
  expression: any;
  isCreateClm = true;
  editTimes = 0;
  rating = 0;
  max = 5;
  readonly = false;
  //modal fields
  modalFields = [];
  compRefEdit: ComponentRef<ModalComponent>;
  compRefEdits = [];

  @ViewChild("prod", { read: ViewContainerRef }) prod: ViewContainerRef;
  @ViewChild(SurveyPage) surveyPage: SurveyPage;
  @ViewChild("StarRating") StarRating: StarRating;
  @ViewChild(SurveyFeedbackEditComp) surveyFeedback: SurveyFeedbackEditComp;
  @ViewChild("relatedListFields", { read: ViewContainerRef })
  relatedListFields: ViewContainerRef;

  constructor(
    public navCtrl: NavController,
    public navParams: NavParams,
    public events: Events,
    public mService: MainService,
    public alertCtrl: AlertController,
    public dcrHandler: DcrHandler,
    public cfr: ComponentFactoryResolver,
    public dataService: DataService,
    public permissionHelper: PermissionHelper,
    public toastCtrl: ToastController,
    public userInfo: UserInfo,
    public translateService: TranslateService,
    public httpService: HttpService,
    public storage: Storage
  ) {}

  backToUp() {
    if (this.turnType == "back") {
      let alert = this.alertCtrl.create({
        title: this.translateService.translateFunc("pad.alert_remind_title"),
        subTitle: this.translateService.translateFunc(
          "pad.alert_remind_save_data"
        ),
        buttons: [
          {
            text: this.translateService.translateFunc("pad.action_no"),
            handler: data => {
              this.gotoAnother(this.initData);
            }
          },
          {
            text: this.translateService.translateFunc("pad.action_yes"),
            handler: data => {
              this.actions.forEach(action => {
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
                if (action.action.toLowerCase() === "save") {
                  let default_field_val;
                  if (action.default_field_val) {
                    default_field_val = action.default_field_val;
                  }
                  this.onSubmit(default_field_val);
                }
              });
              //this.onSubmit('');
            }
          }
        ]
      });
      alert.present();
    } else {
      this.gotoAnother();
    }
  }

  gotoAnother(data?: any) {
    if (data && data["fakeId"] && !data["id"]) {
      this.navCtrl.pop();
    } else {
      let pageParams = this.pageParams;
      if (data) {
        pageParams = data;
      }
      if (this.navCtrl.indexOf(this.navCtrl.last()) === 1) {
        this.navCtrl.pop();
      } else {
        /**当从日历返回的时候，会出现菜单混乱的情况，先去掉，有问题再考虑 */
        //this.events.publish('menu:back');
        this.navCtrl.setRoot(DetailPage, [pageParams]);
      }
      this.events.publish("cachePage", DetailPage, [
        pageParams,
        this.navParams.data[1],
        pageParams["record_type"]
      ]);
      this.events.publish("clear:data");
    }

    //返回的时候去掉多余的订阅
    this.events.unsubscribe("related:push");
  }

  ionViewWillEnter() {
    this.events.subscribe("related:push", (page: any, params: any) => {
      this.events.unsubscribe("related:push");
      this.navCtrl.setRoot(page, params);
    });
    this.events.publish("menu:pageRealType", "edit");
    // this.events.subscribe('left:menu-actions', (action: any) => {
    //   this.relatedActionHandler(action);
    // });
  }

  getDcrStatus() {}

  ionViewDidLoad() {
    this.httpService.reqEnd();
    this.editTimes = 0;
    this.dataService.init();
    this.dataService.data = _.cloneDeep(this.navParams.data[2]);
    this.initData = _.cloneDeep(this.navParams.data[2]);
    this.pageParams = _.cloneDeep(this.navParams.data[2]);
    this.events.publish("add:pageParams", this.navParams.data[2]);
    this.params = this.navParams.data;
    this.apiName = this.params[0];
    this.recordType = this.params[3];
    if (
      window["CREATE_CLM_IN_CALL"] !== undefined &&
      window["CREATE_CLM_IN_CALL"] == false
    ) {
      this.isCreateClm = false;
    } else {
      this.isCreateClm = true;
    }
    Promise.all([
      this.mService.getLayoutByApiNameAndPageType(
        this.apiName,
        "detail_page",
        this.recordType
      ),
      this.mService.getDescribeByApiName(this.apiName)
    ]).then((res: any) => {
      const layout = res[0].body;
      this.layout = res[0].body;
      const describe = res[1].body;
      this.describe = res[1].body;
      const data = _.cloneDeep(this.params[2]);
      if (data != undefined) {
        this.data = data;
        this.id = data.id;
        //this.surveyPage.initData(this.data);
      }
      if (this.recordType === "report") {
        this.getProductList(this.id);
      }
      this.version = data.version;
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
      if (layout.containers) {
        layout.containers[0].components.forEach(comp => {
          const sections = [];
          if (comp.type === "detail_form") {
            this.expression = comp.expression;
            this.getActions(comp);
            comp.field_sections.forEach(section => {
              const formItems = [];
              let isShow = true;
              if (section.hidden_when) {
                section.hidden_when.forEach(page => {
                  if (page.toLowerCase() == "edit") {
                    isShow = false;
                  }
                });
              }
              if (section.show_in_device) {
                if (
                  section.show_in_device.phone &&
                  section.show_in_device.phone.length > 0
                ) {
                  let is_have = false;
                  _.each(section.show_in_device.phone, page => {
                    if (page === "edit") {
                      is_have = true;
                    }
                  });
                  if (!is_have) {
                    isShow = false;
                  }
                }
              }
              if (section.is_extender && isShow) {
                if (
                  section.form_item_extender === "SignInLiteFormItem" ||
                  section.form_item_extender === "CustomSignFormItem"
                ) {
                  const item = {};
                  item["name"] = section.header;
                  item["key"] = item["type"] = "select_one";
                  item["is_required"] = section.is_required;
                  item["need_show_search"] = true;
                  item["search_visible"] = false;
                  item["is_extender"] = true;
                  item["value"] = _.get(data, "sign_in_location");
                  item["data"] = data;
                  item["origin"] = section;

                  formItems.push(item);
                  sections.push({
                    title: section.header,
                    columns: section.columns,
                    formItems: formItems
                  });
                }
              } else if (section.fields && isShow) {
                section.fields.forEach(field => {
                  let isPermission = this.permissionHelper.fc_hasFieldPrivilege(
                    this.apiName,
                    field.field
                  );
                  if (isPermission !== "hidden") {
                    let item = JSON.parse("{}");
                    //item.need_show_search = false;
                    item.need_show_search = true; //手机微信端修改为跳转页面形式
                    if (!field.field) {
                      let hidden = false;
                      if (field.hidden_when) {
                        field.hidden_when.forEach(item => {
                          if (item === "edit") {
                            hidden = true;
                          }
                        });
                      }
                      if (!hidden) {
                        item.type = field.render_type;
                        item.value = field.label;
                        let some_bar;
                        if (field.render_type === "default_bar") {
                          some_bar = this.default_bar;
                          this.default_bar + 1;
                        } else if (field.render_type === "primary_bar") {
                          some_bar = this.primary_bar;
                          this.primary_bar + 1;
                        } else if (field.render_type === "success_bar") {
                          some_bar = this.success_bar;
                          this.success_bar + 1;
                        } else if (field.render_type === "info_bar") {
                          some_bar = this.info_bar;
                          this.info_bar + 1;
                        } else if (field.render_type === "warning_bar") {
                          some_bar = this.warning_bar;
                          this.warning_bar + 1;
                        } else if (field.render_type === "danger_bar") {
                          some_bar = this.danger_bar;
                          this.default_bar + 1;
                        } else if (field.render_type === "link_bar") {
                          some_bar = this.link_bar;
                          this.link_bar + 1;
                        }
                        if (field["label.i18n_key"]) {
                          const trans = this.translateService.translateFunc(
                            field["label.i18n_key"]
                          );
                          if (trans && trans !== field["label.i18n_key"]) {
                            item.value = trans;
                          }
                        }
                        item.name = "";
                        item.key = field.render_type + "_" + some_bar;
                        formItems.push(item);
                      }
                      //如何添加一些属性，来让item满足唯一性的key和添加name，以及实现级联改变时间的一个field
                    } else {
                      describe.fields.forEach(des => {
                        if (field.field === des.api_name) {
                          item.name = des.label;
                          if (field.label) {
                            item.name = field.label;
                          }
                          let translateKey =
                            "field." + this.apiName + "." + field.field;
                          if (
                            this.translateService.translateFunc(
                              translateKey
                            ) !== translateKey
                          ) {
                            item.name = this.translateService.translateFunc(
                              translateKey
                            );
                          }

                          if (
                            field["field.i18n_key"] &&
                            this.translateService.translateFunc(
                              field["field.i18n_key"]
                            ) !== field["field.i18n_key"]
                          ) {
                            item.name = this.translateService.translateFunc(
                              field["field.i18n_key"]
                            );
                          }
                          item.type = des.type;
                          if (field.render_type) {
                            item.type = field.render_type;
                          }
                          item.key = des.api_name;
                          item.is_required = des.is_required;
                          if (field.is_required) {
                            item.is_required = field.is_required;
                          }
                          item.value = _.get(data, des.api_name);
                          if (_.get(data, des.api_name + "__r")) {
                            item.value = _.get(data, des.api_name + "__r").name;
                          }
                          if (field.render_type == "json_table") {
                            field.showFlag = false;
                            field.json_table = true;
                          } else {
                            field.json_table = false;
                          }
                          item.des = des;
                          item.data = data;
                          item.field = field;
                          if (
                            des.type === "date" ||
                            des.type === "date_time" ||
                            des.type.indexOf("date") > -1
                          ) {
                            item.date_format = des.date_format;
                            if (field.date_time_format) {
                              item.date_format = field.date_time_format;
                            }
                            let disabled_expression_flag = false;
                            if (field.disabled_expression) {
                              disabled_expression_flag = this.callAnotherFunc(
                                new Function("t", field.disabled_expression),
                                this.navParams.data[4][2]
                              );
                            }
                            if (field.disabled_when) {
                              field.disabled_when.forEach(when => {
                                if (when == "edit") {
                                  disabled_expression_flag = true;
                                }
                              });
                            }
                            if (
                              !disabled_expression_flag &&
                              item.value !== undefined
                            ) {
                              item.value = moment(item.value).format();
                            } else {
                              item.value = undefined;
                            }
                          } else if (
                            item.type === "select_one" ||
                            (item.type === "select_multiple" &&
                              !field.data_source) ||
                            (item.des.type === "select_many" &&
                              !field.data_source)
                          ) {
                            item.options = des.options;
                            if (item.options && item.options.length > 0) {
                              item.options.forEach(option => {
                                let key =
                                  "options." +
                                  this.apiName +
                                  "." +
                                  field.field +
                                  "." +
                                  option.value;
                                if (
                                  this.translateService.translateFunc(key) !==
                                  key
                                ) {
                                  option.label = this.translateService.translateFunc(
                                    key
                                  );
                                }
                              });
                            }

                            if (field.need_show_search || true) {
                              //添加true条件，为手机微信端作为强制跳转
                              item.need_show_search = true;
                              if (item.options) {
                                item.options.forEach(option => {
                                  if (option.value == item.value) {
                                    item.value = option.label;
                                    item.pickValue = option;
                                  }
                                });
                              }
                            }
                            if (field.data_source && !item.options) {
                              item.data_source = _.cloneDeep(field.data_source);
                              this.getSelectOptionsAndValue(item, field, data);
                            }
                          } else if (
                            (item.type === "select_multiple" ||
                              item.des.type === "select_many") &&
                            field.data_source
                          ) {
                            item.data_source = _.cloneDeep(field.data_source);
                            this.getMultipleOptionsAndValue(item, field, data);
                          } else if (item.type == "image_upload") {
                            if (item.value !== undefined && item.value !== "") {
                              let pics = item.value;
                              item.number = pics.length;
                            } else {
                              item.value = [];
                            }
                          }
                          if (field.is_dcr) {
                            let val = _.get(data, des.api_name);
                            let realValue = _.get(data, des.api_name);
                            if (data[des.api_name + "__r"]) {
                              val = data[des.api_name + "__r"].name;
                            }
                            if (item.des.type == "select_one") {
                              item.des.options &&
                                item.des.options.forEach(option => {
                                  let key =
                                    "options." +
                                    this.apiName +
                                    "." +
                                    field.field +
                                    "." +
                                    option.value;
                                  if (
                                    this.translateService.translateFunc(key) !==
                                    key
                                  ) {
                                    option.label = this.translateService.translateFunc(
                                      key
                                    );
                                  }
                                  if (data[des.api_name] == option.value) {
                                    val = option.label;
                                  }
                                });
                            }
                            this.dcrItems.push({
                              key: des.api_name,
                              value: val,
                              data: realValue
                            });
                          }

                          if (field.onLookupChange) {
                            let fields = field.onLookupChange.setFields;
                            fields.forEach(fld => {
                              if (data[fld.source + "__r"]) {
                                this.onLookupChangeFields.push({
                                  field: fld,
                                  data: data[fld.source + "__r"]
                                });
                              }
                              if (data[fld.target + "__r"]) {
                                this.onLookupChangeFields.push({
                                  field: fld,
                                  data: data[fld.target + "__r"]
                                });
                              }
                            });
                          }

                          let disabled = false;
                          let disabled_exp = false;
                          if (field.disabled_when) {
                            field.disabled_when.forEach(type => {
                              if (type === "edit") {
                                disabled = true;
                              }
                            });
                          }
                          if (field.disabled_expression) {
                            disabled_exp = this.callAnotherFunc(
                              new Function("t", field.disabled_expression),
                              data
                            );
                          }
                          item.disabled = disabled || disabled_exp;
                          if (isPermission == "disabled") {
                            item.disabled = true;
                          }

                          let hidden_flag = false;
                          let hidden_exp_flag = false;
                          if (field.hidden_when) {
                            field.hidden_when.forEach(item => {
                              if (item === "add") {
                                hidden_flag = true;
                              }
                            });
                          }
                          if (field.hidden_expression) {
                            hidden_exp_flag = this.callAnotherFunc(
                              new Function("t", field.hidden_expression),
                              data
                            );
                          }
                          const hidden = hidden_flag || hidden_exp_flag;
                          if (
                            section.columns === "1" ||
                            field.render_type === "long_text"
                          ) {
                            field.widecol = true;
                          }

                          if (!hidden) {
                            if (item.type === "phone") {
                              item.pattern =
                                "(^(([0+]\\d{2,3}-)?(0\\d{2,3})-)(\\d{7,8})(-(\\d{3,}))?$)|(^0{0,1}1[3|4|5|6|7|8|9][0-9]{9}$)";
                            }
                            if (item.type === "email") {
                              item.pattern =
                                "\\w+([-+.]\\w+)*@\\w+([-.]\\w+)*\\.\\w+([-.]\\w+)*";
                              //item.pattern = '[a-zA-Z0-9_-]+@[a-zA-Z0-9_-]+[.][a-zA-Z0-9_-]+';
                            }
                            if (item.type === "big_int") {
                              item.pattern = "[1-9]*[1-9][0-9]*";
                            }
                            if (item.type === "real_number") {
                              const des = item.des;
                              let x = des.decimal_places;
                              item.pattern = "(-?\\d+)(\\.)?(\\d){0," + x + "}";
                            }
                            formItems.push(item);
                          }
                        }
                      });
                    }
                  }
                });
                if (this.onLookupChangeFields.length > 0) {
                  this.getRelatedFields(this.onLookupChangeFields, formItems);
                }
                if (
                  this.translateService.translateFunc(
                    section["header.i18n_key"]
                  ) !== section["header.i18n_key"]
                ) {
                  section.header = this.translateService.translateFunc(
                    section["header.i18n_key"]
                  );
                }
                sections.push({
                  title: section.header,
                  columns: section.columns,
                  formItems: formItems
                });
              }
            });
            if (
              this.translateService.translateFunc(comp["header.i18n_key"]) !==
              comp["header.i18n_key"]
            ) {
              comp.header = this.translateService.translateFunc(
                comp["header.i18n_key"]
              );
            }
            this.components.push({ title: comp.header, sections: sections });
            this.setDependencyFields();
          } else if (comp.type === "related_list") {
            let show_when = comp.show_when;
            if (comp.show_in_phone_detail) {
              this.modalFields.push(comp);
            } else {
              this.addSubMenu(comp, describe);
            }
            if (show_when !== undefined) {
              show_when.forEach(item => {
                if (item === "edit") {
                }
              });
            }
          }
        });
      }

      if (this.subMenu.length > 0 || this.relatedActions.length > 0) {
        this.events.publish(
          "menu:change",
          this.subMenu,
          "sub",
          this.header,
          this.navParams.data
        );
      }

      if (this.modalFields.length > 0) {
        this.generatorModalList();
      }

      this.dataService.validComponent = this.components;
    });
  }

  setDependencyFields() {
    this.components.forEach(comps => {
      comps.sections.forEach(section => {
        section.formItems.forEach(item => {
          if (item.type == "select_one") {
            this.describe.fields.forEach(des => {
              if (des.api_name == item.key && des.dependency) {
                const dependency = des.dependency;
                const on = dependency.on;
                const rules = dependency.rules;
                const optionValues = this.setItemOptions(on, rules);
                const options = [];
                optionValues.forEach(value => {
                  des.options.forEach(opt => {
                    if (opt.value == value) {
                      options.push(opt);
                    }
                  });
                });
                item.options = options;
              }
            });
          }
        });
      });
    });
  }
  setItemOptions(on, rules) {
    let then = [];
    this.components.forEach(comps => {
      comps.sections.forEach(section => {
        section.formItems.forEach(item => {
          if (item.type == "select_one") {
            this.describe.fields.forEach(des => {
              if (des.api_name == item.key && des.api_name == on) {
                const value = item.value;
                rules.forEach(rule => {
                  if (rule.when && rule.when.length > 0) {
                    const whens = rule.when;
                    whens.forEach(wh => {
                      if (wh == value) {
                        then = rule.then;
                      }
                    });
                  }
                });
              }
            });
          }
        });
      });
    });
    return then;
  }

  selectOneChange(item) {
    this.getDependencyAndSetOptions(item.key, item.value);
  }

  getDependencyAndSetOptions(relaykey, value) {
    this.components.forEach(comps => {
      comps.sections.forEach(section => {
        section.formItems.forEach(item => {
          if (item.type == "select_one") {
            this.describe.fields.forEach(des => {
              if (des.api_name == item.key && des.dependency) {
                const dependency = des.dependency;
                const on = dependency.on;
                const rules = dependency.rules;
                if (on == relaykey) {
                  item.value = "";
                  const itemOptions = [];
                  rules.forEach(rule => {
                    if (rule.when[0] == value) {
                      rule.then.forEach(rule_key => {
                        des.options.forEach(op => {
                          if (op.value == rule_key) {
                            itemOptions.push(op);
                          }
                        });
                      });
                    }
                  });
                  item.options = itemOptions;
                  this.getDependencyAndSetOptions(item.key, item.value);
                }
              }
            });
          }
        });
      });
    });
  }

  dataChange(item, pickItems?: any) {
    if (item.type == "select_one") {
      this.selectOneChange(item);
    }
    if (item.type == "date_time" || item.type === "date") {
      if (moment(item.value).format("x") == this.dataService.data[item.key]) {
      } else {
        this.dataService.data[item.key] = moment(item.value).format("x");
        this.dataService.data[item.key] = this.dataService.data[item.key] * 1;
      }
      if (item.field.onDatePickerChange) {
        this.dateChange(item);
      }
    } else if (pickItems) {
      const value = [];
      pickItems.forEach(item => {
        value.push(item.id);
      });
      if (!this.dataService.data) {
        this.dataService.data = {};
      }
      this.dataService.data[item.key] = value;
    } else {
      if (!this.dataService.data) {
        this.dataService.data = {};
      }
      this.dataService.data[item.key] = item.value;
    }
  }
  subscribeMenuActions() {
    let _cascade = this.getCallDataOfRecord();
    this.data._cascade = _cascade;
    this.events.subscribe("menuAction:click", () => {
      if (this.recordType === "report") {
        let _cascade = this.getCallDataOfRecord();
        this.data._cascade = _cascade;
        if (this.dataService.data) {
          this.dataService.data._cascade = _cascade;
        }
      }
    });
  }

  // relatedActionHandler(action) {

  // }

  /**这个方法暂时没有用到，因为时间编辑在edit页面没有多大的意义 */
  dateChange(item) {
    let change = this.dataService.data[item.key] == this.initData[item.key];
    if (item.field.onDatePickerChange && !change) {
      const setFields = item.field.onDatePickerChange.setFields;
      setFields.forEach(fields => {
        if (!fields.source) {
          fields.source = item.key;
        }
        this.setFieldValue(
          fields.source,
          fields.target,
          fields.val,
          fields.operator
        );
      });
    }
  }

  /**这个方法暂时没有用到，因为时间编辑在edit页面没有多大的意义 */
  setFieldValue(source, target, value, operator) {
    if (source !== undefined && target !== undefined) {
      let finalValue;
      this.components.forEach(comps => {
        comps.sections.forEach(section => {
          section.formItems.forEach(item => {
            if (item.key == source) {
              let valueSource = item.value;
              if (
                item.key.indexOf("time") > -1 ||
                item.key.indexOf("date") > -1
              ) {
                valueSource = moment(valueSource).valueOf();
              }
              finalValue = valueSource;
            }
          });
        });
      });
      if (source.indexOf("time") > -1 || source.indexOf("date") > -1) {
        if (operator === "add") {
          finalValue = finalValue + value * 1000;
        } else if (operator === "subtract") {
          finalValue = finalValue - value * 1000;
        } else if (operator === "divide") {
          finalValue = (finalValue / value) * 1000;
        } else if (operator === "multiply") {
          finalValue = finalValue * value * 1000;
        }
      } else {
        if (operator === "add") {
          finalValue = finalValue + value;
        } else if (operator === "subtract") {
          finalValue = finalValue - value;
        } else if (operator === "divide") {
          finalValue = finalValue / value;
        } else if (operator === "multiply") {
          finalValue = finalValue * value;
        }
      }

      this.components.forEach(comps => {
        comps.sections.forEach(section => {
          section.formItems.forEach(item => {
            if (item.key == target) {
              let valueTarget = finalValue;
              if (
                item.key.indexOf("time") > -1 ||
                item.key.indexOf("date") > -1
              ) {
                valueTarget = moment(valueTarget).format();
              }
              item.value = valueTarget;
            }
          });
        });
      });
    }
  }

  getValueSelectOne(item) {
    let manyValue = "";
    if (_.isArray(item.value)) {
      _.each(item.value, val => {
        if (item.options) {
          _.each(item.options, (option, index) => {
            if (option.value == val) {
              manyValue += option.label;
              if (_.toNumber(index) < item.value.length - 1) {
                manyValue += ",";
              }
            }
          });
        }
      });
    }
    if (item.options) {
      _.each(item.options, option => {
        if (option.value === item.value) {
          item.label = option.label;
        }
      });
    }
    if (manyValue) {
      return manyValue;
    }
    if (item.label) {
      return item.label;
    }
    return item.value;
  }

  getSelectOptionsAndValue(item, field, data) {
    const fieldValue = data[field.field];
    let fieldHasValue = false;
    //兼容多选字段给的值不是数组的情况
    if (Array.isArray(fieldValue)) {
      fieldHasValue = fieldValue.length > 0;
    } else {
      fieldHasValue = !isNullOrUndefined(fieldValue);
    }

    if (fieldHasValue) {
      let dataSource = field.data_source;
      if (dataSource.criterias) {
        if (dataSource.criterias.length > 0) {
          dataSource.criterias.forEach(ds => {
            if (ds.value.expression) {
              if (ds.value.expression == "FC_CRM_USERID") {
                ds.value = [];
                ds.value.push(this.userInfo.userid);
              }
            } else if (ds.value[0]) {
              ds.value.forEach(val => {
                if (val == "$$CurrentUserId$$") {
                  ds.value.splice(ds.value.indexOf(val), 1);
                  ds.value.push(this.userInfo.userid);
                }
              });
            }
          });
        }
      }
      let body = {
        criterias: dataSource.criterias,
        joiner: "and",
        objectApiName: dataSource.object_api_name,
        order: "desc"
      };
      this.mService.getSearchData(body).then((res: any) => {
        item.options = [];
        res.body.result.forEach(rst => {
          item.options.push({
            id: rst.id,
            label: rst.name,
            value: rst.id
          });
        });
        item.options.forEach(option => {
          let key =
            "options." + this.apiName + "." + field.field + "." + option.value;
          if (this.translateService.translateFunc(key) !== key) {
            option.label = this.translateService.translateFunc(key);
          }
        });
        item.pickValue = item.options;
      });
    }
  }

  getMultipleOptionsAndValue(item, field, data) {
    let fieldValue = data[field.field];
    let fieldHasValue = false;
    //兼容多选字段给的值不是数组的情况
    if (Array.isArray(fieldValue)) {
      fieldHasValue = fieldValue.length > 0;
    } else {
      fieldValue = [fieldValue];
      fieldHasValue = !isNullOrUndefined(fieldValue);
    }

    if (fieldHasValue) {
      let dataSource = field.data_source;
      if (dataSource.criterias) {
        if (dataSource.criterias.length > 0) {
          dataSource.criterias.forEach(ds => {
            if (ds.value.expression) {
              if (ds.value.expression == "FC_CRM_USERID") {
                ds.value = [];
                ds.value.push(this.userInfo.userid);
              }
            } else if (ds.value[0]) {
              ds.value.forEach(val => {
                if (val == "$$CurrentUserId$$") {
                  ds.value.splice(ds.value.indexOf(val), 1);
                  ds.value.push(this.userInfo.userid);
                }
              });
            }
          });
        }
      }
      let body = {
        criterias: dataSource.criterias,
        joiner: "and",
        objectApiName: dataSource.object_api_name,
        order: "desc"
      };

      const crit = {
        field: "id",
        operator: "in",
        value: [].concat(fieldValue)
      };
      body.criterias.push(crit);

      this.mService.getSearchData(body).then((res: any) => {
        item.options = res.body.result;
        if (item.options) {
          item.options.forEach(option => {
            let key =
              "options." +
              this.apiName +
              "." +
              field.field +
              "." +
              option.value;
            if (this.translateService.translateFunc(key) !== key) {
              option.label = this.translateService.translateFunc(key);
            }
          });
        }

        let value = "";
        let pickValue = [];
        item.options.forEach(option => {
          fieldValue.forEach(fv => {
            let name = option.name;
            if (item.data_source.target_field) {
              name = option[item.data_source.target_field].name;
              if (fv == option[item.data_source.target_field].id) {
                value += name + ",";
                pickValue.push(option);
              }
            } else {
              if (fv == option.id) {
                value += name + ",";
                pickValue.push(option);
              }
            }
          });
        });
        item.value = value.substring(0, value.length - 1);
        item.pickValue = pickValue;
      });
    } else {
      item.options = [];
      item.value = "";
      item.pickValue = [];
    }
  }

  getRelatedFields(onLookupChangeFields, formItems) {
    onLookupChangeFields.forEach(lookField => {
      formItems.forEach(item => {
        if (lookField.field.target == item.key) {
          item.value = lookField.data.name;
          item.id = lookField.data.id;
          item.pickValue = [];
          item.pickValue[0] = lookField.data;
        }
      });
    });
  }

  getCols(section, field) {
    if (field.type === "long_text") {
      return undefined;
    }
    if (section.columns > 1) {
      return true;
    } else {
      return undefined;
    }
  }

  getCols12(section, field) {
    if (field.type === "long_text") {
      return true;
    }
    if (section.columns === "1" || section.columns === 1) {
      return true;
    } else {
      return undefined;
    }
  }

  getProductList(id) {
    let prods = this.cfr.resolveComponentFactory(ProductEdit);
    this.compRef = this.prod.createComponent(prods, id);
    if (this.surveyFeedback) {
      this.surveyFeedback.callId = id;
      this.surveyFeedback.init();
    }
    this.subscribeMenuActions();
  }

  getSelectMultiple(item) {
    if (item.type === "select_multiple") {
      const itemApiName = item.data_source.object_api_name;
      const itemRecordType = "";
      const target_filter_criterias = {
        criterias: [],
        objectApiName: itemApiName
      };
      if (item.data_source.criterias) {
        let criterias = item.data_source.criterias;
        criterias.forEach(cri => {
          if (cri.value.expression) {
            cri.value = evalStr(cri.value.expression);
          }
        });
      }
      target_filter_criterias.criterias = item.data_source.criterias;
      this.events.subscribe("form-comp:pickList", (pickItems: any) => {
        let value = "";
        if (pickItems.length > 0) {
          pickItems.forEach(pickItem => {
            let name = pickItem.name;
            if (item.data_source.target_field) {
              name = pickItem[item.data_source.target_field].name;
            }
            value += name + ",";
          });
        }
        item.value = value.substring(0, value.length - 1);
        item.pickValue = pickItems;
        this.dataChange(item, pickItems);
        this.events.unsubscribe("form-comp:pickList");
      });
      if (target_filter_criterias.criterias.length > 0) {
        target_filter_criterias.criterias.forEach(cri => {
          if (cri.value[0]) {
            cri.value.forEach(val => {
              if (val == "$$CurrentUserId$$") {
                cri.value.splice(cri.value.indexOf(val), 1);
                cri.value.push(this.userInfo.userid);
              }
            });
          }
        });
      }
      this.navCtrl.push(PickList, [
        itemApiName,
        itemRecordType,
        item,
        target_filter_criterias
      ]);
    }
  }

  pageAction(action) {
    switch (action.action.toLowerCase()) {
      case "save":
        this.onEditSave(action);

        break;
      case "callback":
        this.turnType = "callback";
        this.backToUp();
        break;
      case "edit":
        if (action.target_layout_record_type) {
          this.navCtrl.push(EditPage, [
            action.object_describe_api_name,
            action,
            action.data,
            action.target_layout_record_type
          ]);
        } else {
          this.navCtrl.push(EditPage, [
            action.object_describe_api_name,
            action,
            action.data,
            action.data.record_type
          ]);
        }
        break;
      case "detail":
        break;
      case "add":
        break;
      default:
        break;
    }
  }

  onEditSave(action) {
    let default_field_val;
    if (action.default_field_val) {
      default_field_val = action.default_field_val;
    }
    let alert = this.alertCtrl.create({
      title: this.translateService.translateFunc("pad.alert_remind_title"),
      subTitle: this.translateService.translateFunc(
        "pad.alert_remind_save_data"
      ),
      buttons: [
        {
          text: this.translateService.translateFunc("pad.action_no"),
          handler: data => {}
        },
        {
          text: this.translateService.translateFunc("pad.action_yes"),
          handler: data => {
            this.onSubmit(default_field_val);
          }
        }
      ]
    });
    alert.present();
  }

  getActions(comp) {
    const layoutActions = comp.actions;
    this.initRelatedActions(comp.actions);
    layoutActions.forEach(action => {
      //暂时在右上角只显示save按钮
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
      if (action.action.toLowerCase() === "save") {
        if (action.show_when !== undefined) {
          action.show_when.forEach(show => {
            if (
              show === "edit" &&
              action.action.toLowerCase() !== "callback" &&
              action.action.toLowerCase() !== "update"
            ) {
              this.actions.push(action);
            }
          });
        } else {
          this.actions.push(action);
        }
      }
    });
  }

  initRelatedActions(actions) {
    let flag = false;
    let collect;
    if (actions !== undefined) {
      actions.forEach(action => {
        //if (action.action.toLowerCase().indexOf('related') > -1) {
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
        if (action.show_when) {
          action.show_when.forEach(item => {
            if (
              item === "edit" &&
              action.action.toLowerCase() !== "callback" &&
              action.action.toLowerCase() !== "save"
            ) {
              if (action.action.toLowerCase() === "relatedcollect") {
                action.options.forEach(option => {
                  if (option.value === flag) {
                    action.label = option.label;
                  }
                });
                action.collect = collect;
                let hidden_flag = false;
                let disabled_flag = false;
                let show_when_flag = false;
                if (action.show_when) {
                  action.show_when.forEach(item => {
                    if (item === "edit") {
                      show_when_flag = true;
                    }
                  });
                }
                if (action.disabled_expression) {
                  disabled_flag = this.callAnotherFunc(
                    new Function("t", action.disabled_expression),
                    this.data
                  );
                }
                if (action.hidden_expression) {
                  hidden_flag = this.callAnotherFunc(
                    new Function("t", action.hidden_expression),
                    this.data
                  );
                }
                if (!show_when_flag || disabled_flag || hidden_flag) {
                } else {
                  if (this.isHavePermission(action)) {
                    this.relatedActions.push(action);
                  }
                }
              } /*else if (action.action.toLowerCase() === 'relatedupdate') { ///暂时没用的代码，因为没有relatedupdate按钮
                  action.options.forEach(opt => {
                    if (data.status == opt.value) {
                      action.label = opt.label;
                      if(opt.update_val){
                        action.update_val = opt.update_val;
                      }
                    }
                  })
                  action.data = data;
                  if(!action.label){
                    action.label = "undefiend";
                  }
                  //this.relatedActions.push(action);
                }*/ else if (
                action.action.toLowerCase() === "update"
              ) {
                let hidden_flag = false;
                let disabled_flag = false;
                let show_when_flag = false;
                if (action.show_when) {
                  action.show_when.forEach(item => {
                    if (item === "edit") {
                      show_when_flag = true;
                    }
                  });
                }
                if (action.disabled_expression) {
                  disabled_flag = this.callAnotherFunc(
                    new Function("t", action.disabled_expression),
                    this.data
                  );
                }
                if (action.hidden_expression) {
                  hidden_flag = this.callAnotherFunc(
                    new Function("t", action.hidden_expression),
                    this.data
                  );
                }
                if (!show_when_flag || disabled_flag || hidden_flag) {
                } else {
                  action.data = this.data;
                  action.object_describe_api_name = this.apiName;
                  action.actions = actions;
                  //this.relatedActions.push(action);
                  if (this.isHavePermission(action)) {
                    this.relatedActions.push(action);
                  }
                }
              } else {
                action.data = this.data;
                action.object_describe_api_name = this.apiName;
                action.actions = actions;
                if (this.isHavePermission(action)) {
                  this.relatedActions.push(action);
                }
                //this.relatedActions.push(action);
              }
            }
          });
        }

        //}
      });
    }

    this.events.publish("related:actions", this.relatedActions);
    // if (this.relatedActions.length > 0) {
    //   this.events.publish('related:actions', this.relatedActions);
    // }else{

    // }
  }

  isHavePermission(action) {
    return this.permissionHelper.judgeFcObjectPrivilvege(action, this.apiName);
  }

  callAnotherFunc(fnFunction: Function, vArgument) {
    if (_.isFunction(fnFunction)) {
      return (<Function>fnFunction)(vArgument);
    } else {
      return true;
    }
  }

  tapAction(e, item) {
    if (item.type === "select_one" && item.need_show_search) {
      if (item.is_extender) {
        this.events.subscribe("form-comp:signSearch", (pickValue: any) => {
          item.value = pickValue.value;
          this.events.unsubscribe("form-comp:signSearch");
        });
        this.navCtrl.push(SignInPage, item);
      } else {
        this.events.subscribe("form-comp:optionsSearch", (pickValue: any) => {
          item.value = pickValue.label;
          item.pickValue = pickValue;
          this.events.unsubscribe("form-comp:optionsSearch");
        });
        this.navCtrl.push(SearchOptions, item);
      }
    } else if (item.type == "image_upload") {
      this.events.subscribe("form-comp:pickValue", (pickValue: any) => {
        item.value = pickValue[0].name;
        item.pickValue = pickValue;
        item.number = pickValue[0].number;
        this.events.unsubscribe("form-comp:pickValue");
      });
      this.navCtrl.push(CameraPicker, item);
    } else {
      let itemApiName = "",
        itemRecordType = "";
      if (item.type === "relation") {
        itemApiName = item.des.target_object_api_name;
        itemRecordType =
          item.field.target_data_record_type || item.field.target_record_type;
      }
      this.events.subscribe("form-comp:pickList", (pickValue: any) => {
        item.value = pickValue[0].name;
        item.pickValue = pickValue;
        if (item.field.onLookupChange) {
          let fields = item.field.onLookupChange.setFields;
          fields.forEach(field => {
            this.initLookupFields(field, pickValue[0]);
          });
          this.selectOneChange(item);
        }
        this.events.unsubscribe("form-comp:pickList");
      });
      this.navCtrl.push(PickList, [
        itemApiName,
        itemRecordType,
        item,
        item.field.target_filter_criterias
      ]);
    }
  }

  initLookupFields(field, data) {
    this.components.forEach(comps => {
      comps.sections.forEach(section => {
        section.formItems.forEach(item => {
          if (item.key == field.target) {
            item.value = data[field.source];
            if (data[field.source + "__r"]) {
              item.pickValue = [];
              item.pickValue.push(data[field.source + "__r"]);
              item.value = data[field.source + "__r"].name;
            }
            this.selectOneChange(item);
          }
        });
      });
    });
  }

  addSubMenu(comp, describe) {
    if (
      this.translateService.translateFunc(comp["header.i18n_key"]) !==
      comp["header.i18n_key"]
    ) {
      comp.header = this.translateService.translateFunc(
        comp["header.i18n_key"]
      );
    }
    this.subMenu.push({
      title: comp.header,
      data: [comp, describe, this.data]
    });
  }

  getCallDataOfRecord(childDataList = []) {
    let products = this.compRef && this.compRef.instance.getValuesOfProducts();
    let createList = JSON.parse("{}");
    let updateList = JSON.parse("{}");
    let deleteList = JSON.parse("{}");
    let _cascade = JSON.parse("{}");
    if (products) {
      const createProList = products[0] ? products[0] : [];
      const deleteProList = products[1] ? products[1] : [];
      const updateProList = products[2] ? products[2] : [];

      const createMessList = products[3] ? products[3] : [];
      const deleteMessList = products[4] ? products[4] : [];
      const updateMessList = products[5] ? products[5] : [];

      if (createMessList.length > 0) {
        createList.call_call_key_message_list = createMessList;
      }
      if (createProList.length > 0) {
        createList.call_call_product_list = createProList;
      }

      if (deleteProList.length > 0) {
        deleteList.call_call_product_list = deleteProList;
      }
      if (deleteMessList.length > 0) {
        deleteList.call_call_key_message_list = deleteMessList;
      }

      if (updateMessList.length > 0) {
        updateList.call_call_key_message_list = updateMessList;
      }
      if (updateProList.length > 0) {
        updateList.call_call_product_list = updateProList;
      }
    }

    if (this.surveyFeedback) {
      let surveyitem = this.surveyFeedback.exportSurveyData();
      const createSurveyList = surveyitem[0];
      const updateSurveyList = surveyitem[1];
      const deleteSurveyList = surveyitem[2];
      if (createSurveyList.length > 0) {
        createList.call_survey_feedback_list = createSurveyList;
      }
      if (deleteSurveyList.length > 0) {
        deleteList.call_survey_feedback_list = deleteSurveyList;
      }
      if (updateSurveyList.length > 0) {
        updateList.call_survey_feedback_list = updateSurveyList;
      }
    }

    if (
      createList.call_call_key_message_list ||
      createList.call_call_product_list ||
      createList.call_survey_feedback_list
    ) {
      _cascade.create = createList;
    }
    if (
      updateList.call_call_product_list ||
      updateList.call_call_key_message_list ||
      updateList.call_survey_feedback_list
    ) {
      _cascade.update = updateList;
    }
    if (
      deleteList.call_call_product_list ||
      deleteList.call_call_key_message_list ||
      deleteList.call_survey_feedback_list
    ) {
      _cascade.delete = deleteList;
    }

    if (childDataList.length > 0) {
      _.each(childDataList, child => {
        const relateName = child.related_list_name;
        if (child.id && !child["is_fake_deleted"]) {
          if (!updateList[relateName]) {
            updateList[relateName] = [];
          }
          updateList[relateName].push(child);
        } else if (!child.id && !child["is_fake_deleted"]) {
          if (!createList[relateName]) {
            createList[relateName] = [];
          }
          createList[relateName].push(child);
        } else if (!child["is_fake_deleted"] && child.id) {
          if (!deleteList[relateName]) {
            deleteList[relateName] = [];
          }
          if (child._cascade) {
            delete child._cascade;
          }
          deleteList[relateName].push(child);
        }
      });
      if (!_.isEmpty(createList)) {
        _cascade.create = createList;
      }
      if (!_.isEmpty(updateList)) {
        _cascade.update = updateList;
      }
      if (!_.isEmpty(deleteList)) {
        _cascade.delete = deleteList;
      }
    }

    if (_cascade) {
      if (!_cascade.create) {
        _cascade.create = {};
      }
      if (!_cascade.update) {
        _cascade.update = {};
      }
      if (!_cascade.delete) {
        _cascade.delete = {};
      }
    }

    return _cascade;
  }

  getAllValues(default_field_val?: any) {
    const values = JSON.parse("{}");
    values["record_type"] = this.recordType;
    values["version"] = this.version;
    const childDataList = [];
    if (this.compRefEdits.length > 0) {
      const modalValuesList = this.getModalValues();
      _.each(modalValuesList, modal => {
        if (modal.data && modal.data["fake_parent"] === this.initData.id) {
          childDataList.push(modal.data);
        }
      });
    }
    this.components.forEach(comps => {
      comps.sections.forEach(section => {
        section.formItems.forEach(item => {
          if (
            item.type.indexOf("time") > -1 ||
            item.type.indexOf("date") > -1
          ) {
            if (item.value !== undefined && item.value !== "") {
              values[item.key] = moment(item.value).format("x");
            } else {
            }
          } else {
            if (item.type === "select_one" && item.need_show_search) {
              if (item.is_extender) {
                if (item.signValue) {
                  values["sign_in_location"] = item.signValue.sign_in_location;
                  values["latitude"] = item.signValue.latitude;
                  values["longitude"] = item.signValue.longitude;
                  values["mapType"] = item.signValue.mapType;
                  values["sign_in_time"] = item.signValue.sign_in_time;
                }
              }
            }
            if (item.des) {
              if (item.type === "relation") {
                if (!item.pickValue) {
                  values[item.key] = item.data[item.key];
                } else {
                  values[item.key] = item.pickValue[0].id;
                }
              } else {
                values[item.key] = item.value;
              }

              if (item.type === "select_multiple" && item.data_source) {
                const itemSelectValues = [];
                item.pickValue.forEach(pickItem => {
                  let id = pickItem.id;
                  if (item.data_source.target_field) {
                    id = pickItem[item.data_source.target_field].id;
                  }
                  itemSelectValues.push(JSON.stringify(id));
                });
                values[item.key] = itemSelectValues;
              }

              if (item.type === "select_one" && item.need_show_search) {
                if (item.pickValue) {
                  values[item.key] = item.pickValue.value;
                }
              }
              if (item.key === "hco_id") {
                values[item.key] = item.id;
              }
            }
            if (item.field) {
              if (item.field.is_dcr) {
                this.dcrItems.forEach(dcrItem => {
                  if (
                    dcrItem.key == item.des.api_name &&
                    dcrItem.value != item.value
                  ) {
                    if (item.data[dcrItem.key + "__r"]) {
                      if (item.data[dcrItem.key + "__r"].id !== dcrItem.key) {
                        if (item.pickValue) {
                          this.dcrDetail.push({
                            field_api_name: item.key,
                            field_name: item.name,
                            old_value: dcrItem.value,
                            new_value: item.value,
                            old_data: item.data[item.key],
                            new_data: item.pickValue[0].id
                          });
                        } else {
                          this.dcrDetail.push({
                            field_api_name: item.key,
                            field_name: item.name,
                            old_value: dcrItem.value,
                            new_value: item.value,
                            old_data: dcrItem.data,
                            new_data: item.value
                          });
                        }
                      }
                    } else if (item.des.type == "select_one") {
                      let newVal = item.value;
                      _.isArray(item.des.options) &&
                        item.des.options.forEach(option => {
                          if (option.value == newVal) {
                            newVal = option.label;
                          }
                        });
                      if (newVal != dcrItem.value) {
                        if (item.pickValue) {
                          this.dcrDetail.push({
                            field_api_name: item.key,
                            field_name: item.name,
                            old_value: dcrItem.value,
                            new_value: item.value,
                            old_data: item.data[item.key],
                            new_data: item.pickValue.value
                          });
                        } else {
                          this.dcrDetail.push({
                            field_api_name: item.key,
                            field_name: item.name,
                            old_value: dcrItem.value,
                            new_value: newVal,
                            old_data: dcrItem.data,
                            new_data: item.value
                          });
                        }
                      }
                    } else {
                      if (item.pickValue) {
                        this.dcrDetail.push({
                          field_api_name: item.key,
                          field_name: item.name,
                          old_value: dcrItem.value,
                          new_value: item.value,
                          old_data: item.data[item.key],
                          new_data: item.pickValue[0].id
                        });
                      } else {
                        this.dcrDetail.push({
                          field_api_name: item.key,
                          field_name: item.name,
                          old_value: dcrItem.value,
                          new_value: item.value,
                          old_data: dcrItem.data,
                          new_data: item.value
                        });
                      }
                    }
                  }
                });
              }
            }
          }
          if (this.apiName == "coach_feedback") {
            if (item.key == "employee") {
              if (item.need_show_search) {
                values["employee__r"] = {
                  id: item.data["employee__r"].id,
                  name: item.data["employee__r"].name
                };
              }
              values["manager__r"] = {
                name: this.userInfo.user["name"],
                id: this.userInfo.user["id"]
              };
            }
          }
        });
      });
    });

    if (this.recordType === "report") {
      const _cascade = this.getCallDataOfRecord();
      values._cascade = _cascade;
      //status
      //name
    }

    if (childDataList.length > 0) {
      const _cascade = this.getCallDataOfRecord(childDataList);
      values._cascade = _cascade;
    }

    let expData = this.data;
    for (let i in values) {
      expData[i] = values[i];
    }

    if (default_field_val) {
      default_field_val.forEach(item => {
        values[item.field] = item.val;
        if (item.field_type) {
          if (item.field_type === "js") {
            values[item.field] = this.callAnotherFunc(
              new Function("t", item.val),
              expData
            );
          }
        }
      });
    }

    if (this.apiName == "call") {
      let endTime = values["end_time"];
      let startTime = values["start_time"];
      if (endTime && startTime) {
        let entDay = moment(endTime / 1).dayOfYear();
        let startDay = moment(startTime / 1).dayOfYear();
        if (entDay == startDay) {
        } else {
          let msg = this.translateService.translateFunc(
            "pad.valid_cannot_across_day"
          );
          if (this.apiName == "call" && this.recordType == "plan") {
            msg = this.translateService.translateFunc(
              "pad.valid_call_plan_cannot_across_day"
            );
          } else if (this.apiName == "call" && this.recordType == "report") {
            msg = this.translateService.translateFunc(
              "pad.valid_call_report_cannot_across_day"
            );
          }
          let alert = this.alertCtrl.create({
            title: this.translateService.translateFunc(
              "pad.alert_remind_title"
            ),
            subTitle: msg,
            buttons: [
              {
                text: this.translateService.translateFunc("pad.action_ok")
              }
            ]
          });
          alert.present();
          return;
        }
      }
    }

    for (let x in values) {
      if (x.indexOf("time") > -1 || x.indexOf("date") > -1) {
        values[x] = parseInt(values[x]);
      }
    }

    return values;
  }

  onSubmit(default_field_val) {
    let flag = this.dataService.validFieldWithMustWriteAndType(this.components);
    if (!flag) {
      return;
    }

    const values = this.getAllValues(default_field_val);

    if (this.expression) {
      let expFlag = this.callAnotherFunc(
        new Function("t", this.expression),
        values
      );
      if (expFlag === true) {
        //this.createNewData(this.apiName, values, action);
        this.editData(values);
      } else {
        let showMsg = expFlag;
        if (
          window[config.default_language][expFlag] &&
          window[config.default_language][expFlag] !== expFlag
        ) {
          showMsg = window[config.default_language][expFlag];
        }
        let alert = this.alertCtrl.create({
          title: this.translateService.translateFunc("pad.alert_failed_title"),
          subTitle: showMsg,
          buttons: [
            {
              text: this.translateService.translateFunc("pad.action_ok")
            }
          ]
        });
        alert.present();
      }
    } else {
      this.editData(values);
    }
  }

  editData(values) {
    if (
      this.initData["fakeId"] &&
      this.initData["vpageType"] != "detail" &&
      this.initData["fakeFlag"] !== "main"
    ) {
      Object.assign(this.initData, values);
      this.events.publish("form-comp:modalChildrenChange", this.initData);
      if (this.navCtrl.indexOf(this.navCtrl.last()) > 0) {
        this.navCtrl.pop();
      } else {
        this.gotoAnother();
      }
    } else {
      const DCR_EDIT_CUSTOMER_RULE = window["DCR_EDIT_CUSTOMER_RULE"];
      if (DCR_EDIT_CUSTOMER_RULE == 0) {
        if (this.dcrDetail.length > 0) {
          this.dcrDetail.forEach(dcr => {
            for (let x in values) {
              if (x == dcr.field_api_name) {
                values[dcr.field_api_name] = dcr.old_data;
              }
            }
          });
        }
      }
      this.mService
        .putDataByApiNameAndId(this.apiName, values, this.id)
        .then((res: any) => {
          this.pageParams = res.body;
          if (this.layout.is_dcr && this.initData.verification !== "2") {
            const dcrData = {
              customer: res.body.id,
              parent_customer: res.body.parent_id,
              type: 2
            };

            this.dcrHandler.dcrObject.push(dcrData);
            const dcrBody = {
              customer: res.body.id,
              parent_customer: res.body.parent_id,
              status: 1,
              type: 2,
              _cascade: {
                create: {
                  dcr_dcr_detail_list: this.dcrDetail
                }
              }
            };

            if (dcrBody && this.dcrDetail.length > 0) {
              this.createDcr(dcrBody);
            }
          }
          this.events.publish("add:pageParams", this.pageParams);
          if (res.head.code === 200) {
            let toast = this.toastCtrl.create({
              message: this.translateService.translateFunc(
                "pad.alert_save_success"
              ),
              duration: 2000,
              position: "top",
              cssClass: "toast_success"
            });
            this.turnType = "save";
            toast.present();
            this.backToUp();
            // let alert = this.alertCtrl.create({
            //   title: '保存成功！',
            //   buttons: [
            //     {
            //       text: '确定',
            //       handler: data => {
            //         this.turnType = 'save';
            //         this.backToUp();
            //       }
            //     }
            //   ]
            // })
            // alert.present();
            this.version++;
          } else {
            let alert = this.alertCtrl.create({
              title: this.translateService.translateFunc(
                "pad.alert_failed_title"
              ),
              subTitle: res.head.msg,
              buttons: [
                {
                  text: this.translateService.translateFunc(
                    "pad.action_callback"
                  ),
                  handler: data => {
                    this.turnType = "saveFaild";
                    this.backToUp();
                  }
                },
                {
                  text: this.translateService.translateFunc(
                    "pad.action_edit_continue"
                  ),
                  handler: data => {}
                }
              ]
            });
            alert.present();
          }
        });
    }
  }

  createDcr(dcrBody) {
    this.mService.pushDataByApiNameAndId("dcr", dcrBody).then((res: any) => {});
  }

  getCompValues() {
    return this.getAllValues();
  }

  //modal
  generatorModalList() {
    if (this.relatedListFields) {
      const values = _.cloneDeep(this.getCompValues());
      //this.relatedListFields.clear();
      if (this.modalFields.length > 0 && this.relatedListFields.length === 0) {
        this.modalFields.forEach((modalComp, index) => {
          let cpnt = this.cfr.resolveComponentFactory(ModalComponent);
          const compRef = this.relatedListFields.createComponent(cpnt);
          const data = _.merge(this.initData, values);
          compRef.instance.params = {
            layout: this.layout,
            describe: this.describe,
            modalComp: modalComp,
            data: data
          };
          compRef.instance.pageType = "edit";
          this.compRefEdits.push(compRef);
        });
      } else {
        this.compRefEdits.forEach(compRef => {
          const initData = compRef.instance.params.data;
          compRef.instance.pageType = "edit";
          compRef.instance.params.data = _.merge(initData, values);
          compRef.instance.parentDataChange();
          compRef.instance.getListData(_.merge(initData, values));
        });
      }
    }
  }

  getModalValues() {
    let modalValues = [];
    this.compRefEdits.forEach(compRef => {
      modalValues = _.concat(modalValues, compRef.instance.newListData);
    });
    return modalValues;
  }

  ionViewDidLeave() {
    //this.events.unsubscribe('left:menu-actions');
  }
}
