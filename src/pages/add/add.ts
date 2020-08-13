import {
  Component,
  ViewChild,
  ViewContainerRef,
  ComponentFactoryResolver,
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
import _ from "lodash";
import { Storage } from "@ionic/storage";
import {
  NetworkService,
  MainService,
  DataService,
  TranslateService,
  HttpService
} from "../../providers/index";
import {
  PickList,
  SubordinatePage,
  CoachFeedback,
  SearchOptions,
  SignInPage,
  CameraPicker
} from "../../pages/index";
import {
  DcrHandler,
  config,
  UserInfo,
  PermissionHelper,
  evalStr
} from "../../utils/index";
import {
  Product,
  SurveyFeedbackAddComp,
  SurveyDataItem,
  ModalComponent,
  StarRating
} from "../../components/index";

@Component({
  selector: "page-add",
  templateUrl: "add.html"
})
export class AddPage {
  subMenu = [];
  mainData = [];

  params: any;
  layout: any;
  describe: any;
  apiName: any;
  recordType: any;
  actions = [];
  relatedActions = [];
  header: any;
  components = [];
  version = undefined;
  pageParams = [];
  dcrDetail = [];
  parent: any;
  initData: any;
  defaultValues = [];
  onLookupChangeFields = [];
  url: any;
  preActionCode = "";
  expression: any;
  isCreateClm = true;
  // half_star:[boolean,boolean];
  pageFlag = "add";
  max = 5;
  rating = 0;
  readonly = false;
  default_bar = 0;
  primary_bar = 0;
  success_bar = 0;
  info_bar = 0;
  warning_bar = 0;
  danger_bar = 0;
  link_bar = 0;
  ishalf_star = false;
  //modal fields
  modalFields = [];
  compRef: ComponentRef<ModalComponent>;
  compRefs = [];
  @ViewChild("product") product: Product;
  @ViewChild("StarRating") StarRating: StarRating;
  @ViewChild(SurveyFeedbackAddComp) surveyFeedback: SurveyFeedbackAddComp;
  @ViewChild("relatedListFields", { read: ViewContainerRef })
  relatedListFields: ViewContainerRef;
  constructor(
    public navCtrl: NavController,
    public navParams: NavParams,
    public events: Events,
    public mService: MainService,
    public alertCtrl: AlertController,
    public dcrHandler: DcrHandler,
    public userInfo: UserInfo,
    public permissionHelper: PermissionHelper,
    public toastCtrl: ToastController,
    public network: NetworkService,
    public dataService: DataService,
    public translateService: TranslateService,
    public httpService: HttpService,
    public cfr: ComponentFactoryResolver,
    public storage: Storage
  ) {
    this.pageFlag = this.navParams.data[1];
  }
  backToUp() {
    if (this.navCtrl.indexOf(this.navCtrl.last()) === 1) {
      if (this.pageFlag == "relate") {
        if (this.recordType == "walkin_attendee") {
          this.events.publish("menu:back", "walkin_attendee");
        } else {
          this.events.publish("menu:back", "third");
        }
        this.pageFlag = "add";
      }
      this.navCtrl.pop();
    } else {
      this.events.publish("clear:data");
      this.events.publish("menu:back");
    }

    //返回的时候去掉多余的订阅
    this.events.unsubscribe("related:push");
  }

  ionViewWillEnter() {
    this.dataService.init();
    this.events.subscribe("related:push", (page: any, params: any) => {
      this.events.unsubscribe("related:push");
      this.navCtrl.setRoot(page, params);
    });
    this.events.publish("menu:pageRealType", "add");
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
    if (section.columns === "1") {
      return true;
    } else {
      return undefined;
    }
  }

  ionViewDidLoad() {
    this.httpService.reqEnd();
    this.preActionCode = this.navParams.data[1].action_code;
    if (this.navParams.data[3] && this.navParams.data[3] !== "") {
      this.parent = this.navParams.data[3];
    }
    if (this.navParams.data[4]) {
      this.initData = this.navParams.data[4];
    }
    this.params = this.navParams.data;
    this.apiName = this.params[0];
    this.recordType = this.params[2];
    if (this.params[1].record_type !== undefined) {
      this.recordType = this.params[1].record_type;
    } else if (this.params[1].target_layout_record_type !== undefined) {
      this.recordType = this.params[1].target_layout_record_type;
    }
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
      if (res[0].head.code === 200 && res[1].head.code === 200) {
        const layout = res[0].body;
        this.layout = res[0].body;
        const describe = res[1].body;
        this.describe = res[1].body;
        //add the layout.i18nkey
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
                    if (page.toLowerCase() == "add") {
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
                      if (page === "add") {
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
                    item["origin"] = section;
                    formItems.push(item);
                    sections.push({
                      title: section.header,
                      columns: section.columns,
                      formItems: formItems
                    });
                  }
                } else if (section.fields && isShow) {
                  let flag = true;
                  if (section.hidden_when) {
                    section.hidden_when.forEach(item => {
                      if (item === "add") {
                        flag = false;
                      }
                    });
                  }
                  if (flag) {
                    section.fields.forEach(field => {
                      let havePermission = this.permissionHelper.fc_hasFieldPrivilege(
                        this.apiName,
                        field.field
                      );
                      if (havePermission !== "hidden") {
                        let item = JSON.parse("{}");
                        //item.need_show_search = false;
                        item.need_show_search = true; //手机微信端改造成跳转页面选择
                        if (!field.field) {
                          let hidden = false;
                          if (field.hidden_when) {
                            field.hidden_when.forEach(item => {
                              if (item === "add") {
                                hidden = true;
                              }
                            });
                          }
                          if (hidden) {
                          } else {
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
                              if (des.default_value) {
                                item.value = des.default_value;
                                // item.value = this.rating
                                // this.changgestarnum(des.api_name,item.value)
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
                              if (field.render_type) {
                                item.type = field.render_type;
                              } else {
                                item.type = des.type;
                              }
                              item.key = des.api_name;

                              if (field.is_required) {
                                item.is_required = field.is_required;
                              } else {
                                item.is_required = des.is_required;
                              }
                              //item.value = '';
                              item.field = field;
                              item.disabled = false;
                              item.des = des;
                              if (field.is_dcr !== undefined) {
                                item.is_dcr = field.is_dcr;
                              }
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
                                    new Function(
                                      "t",
                                      field.disabled_expression
                                    ),
                                    {}
                                  );
                                }
                                if (
                                  field.disabled_when &&
                                  field.disabled_when.length > 0
                                ) {
                                  field.disabled_when.forEach(when => {
                                    if (when == "add") {
                                      disabled_expression_flag = true;
                                    }
                                  });
                                }
                                if (!disabled_expression_flag) {
                                  item.value = moment().format();
                                } else {
                                }
                              } else if (
                                item.type === "select_one" ||
                                (item.type === "select_multiple" &&
                                  !field.data_source)
                              ) {
                                if (
                                  item.type === "select_one" &&
                                  field.data_source
                                ) {
                                  if (field.data_source["object_api_name"]) {
                                    let field_obj =
                                      field.data_source["object_api_name"];
                                    let criterias =
                                      field.data_source["criterias"];
                                    let target_field =
                                      field.data_source["target_field"];
                                    criterias.forEach(cri => {
                                      if (cri.value["expression"]) {
                                        let value = evalStr(
                                          cri.value["expression"]
                                        );
                                        cri.value = [value];
                                      }
                                    });
                                    this.getAndSetFieldValues(
                                      item,
                                      criterias,
                                      field_obj,
                                      target_field
                                    );
                                  }
                                } else {
                                  item.options = des.options;
                                  if (item.options) {
                                    item.options.forEach(option => {
                                      let key =
                                        "options." +
                                        this.apiName +
                                        "." +
                                        field.field +
                                        "." +
                                        option.value;
                                      if (
                                        this.translateService.translateFunc(
                                          key
                                        ) !== key
                                      ) {
                                        option.label = this.translateService.translateFunc(
                                          key
                                        );
                                      }
                                    });
                                  }
                                  if (field.need_show_search) {
                                    item.need_show_search = true;
                                  }
                                  if (field.need_default_checked) {
                                    let field_need = field.need_default_checked;
                                    if (field_need.need_checked) {
                                      if (item.type === "select_one") {
                                        let value = field_need.checked_value;
                                        item.value = value;
                                        item.need_default_checked = true;
                                      }
                                      // 暂时不支持多选默认值
                                      // else if(item.type === 'select_multiple'){

                                      // }
                                    }
                                  }
                                }
                              } else if (
                                item.type === "select_multiple" &&
                                field.data_source
                              ) {
                                item.options = des.options;
                                if (item.options) {
                                  item.options.forEach(option => {
                                    let key =
                                      "options." +
                                      this.apiName +
                                      "." +
                                      field.field +
                                      "." +
                                      option.value;
                                    if (
                                      this.translateService.translateFunc(
                                        key
                                      ) !== key
                                    ) {
                                      option.label = this.translateService.translateFunc(
                                        key
                                      );
                                    }
                                  });
                                }
                                item.data_source = _.cloneDeep(
                                  field.data_source
                                );
                                //this.getMultipleOptions(item, field);
                              }
                              if (
                                this.params[1].related_list_name !== undefined
                              ) {
                                if (
                                  this.params[1].related_list_name ==
                                  des.related_list_api_name
                                ) {
                                  item.pickValue = [];
                                  item.pickValue[0] = this.parent;
                                  item.value = this.parent.name;
                                }
                                if (field.onLookupChange) {
                                  let fields =
                                    item.field.onLookupChange.setFields;
                                  fields.forEach(fld => {
                                    let datas = this.parent;

                                    if (datas[fld.source + "__r"]) {
                                      this.onLookupChangeFields.push({
                                        field: fld,
                                        data: datas[fld.source + "__r"]
                                      });
                                    }
                                  });
                                }
                              }
                              if (this.navParams.data[4]) {
                                if (
                                  field.field ===
                                  this.params[4][0].target_value_field
                                ) {
                                  item.pickValue = [];
                                  if (
                                    this.params[4][0].target_value_field ===
                                    "id"
                                  ) {
                                    item.pickValue[0] = this.navParams.data[4][2];
                                  } else {
                                    item.pickValue[0] = this.navParams.data[4][2][
                                      this.params[4][0].target_value_field +
                                        "__r"
                                    ];
                                  }
                                  item.value = item.pickValue[0].name;
                                } else if (
                                  this.params[4][0].related_list_name ==
                                  des.related_list_api_name
                                ) {
                                  item.pickValue = [];
                                  item.pickValue[0] = this.params[4][2];
                                  item.value = item.pickValue[0].name;
                                }

                                if (field.onLookupChange) {
                                  let fields =
                                    item.field.onLookupChange.setFields;
                                  fields.forEach(fld => {
                                    let datas = this.navParams.data[4][2];
                                    if (datas[fld.source + "__r"]) {
                                      this.onLookupChangeFields.push({
                                        field: fld,
                                        data: datas[fld.source + "__r"]
                                      });
                                    }
                                    if (fld.source == "real_name") {
                                      this.onLookupChangeFields.push({
                                        field: fld,
                                        data: datas
                                      });
                                    }
                                  });
                                }

                                //field 隐藏和禁用，梳理一下
                                let disabled = false;
                                let disabled_expression_flag = false;
                                if (field.disabled_when) {
                                  field.disabled_when.forEach(item => {
                                    if (item.toLowerCase() === "add") {
                                      disabled = true;
                                    }
                                  });
                                }
                                if (field.disabled_expression) {
                                  disabled_expression_flag = this.callAnotherFunc(
                                    new Function(
                                      "t",
                                      field.disabled_expression
                                    ),
                                    {}
                                  );
                                }
                                item.disabled =
                                  disabled || disabled_expression_flag;
                              } else {
                                if (this.navParams.data[5]) {
                                  if (item.key === "start_time") {
                                    item.value = moment(
                                      this.navParams.data[5].start
                                    ).format();
                                  }
                                  if (item.key === "end_time") {
                                    item.value = moment(
                                      this.navParams.data[5].end
                                    ).format();
                                  }
                                }
                                let disable_flag = false;
                                let disable_exp_flag = false;
                                if (field.disabled_when) {
                                  field.disabled_when.forEach(type => {
                                    if (type === "add") {
                                      disable_flag = true;
                                    }
                                  });
                                }
                                if (field.disabled_expression) {
                                  disable_exp_flag = this.callAnotherFunc(
                                    new Function(
                                      "t",
                                      field.disabled_expression
                                    ),
                                    ""
                                  );
                                }
                                item.disabled =
                                  disable_flag || disable_exp_flag;
                              }
                              if (field.target_filter_criterias) {
                                if (field.target_filter_criterias.criterias) {
                                  let criterias =
                                    field.target_filter_criterias.criterias;
                                  criterias.forEach(cri => {
                                    if (cri.value.expression) {
                                      cri.value = evalStr(cri.value.expression);
                                    }
                                  });
                                }
                                item.target_filter_criterias =
                                  field.target_filter_criterias;
                              }

                              if (havePermission == "disabled") {
                                item.disabled = true;
                              }

                              if (des.dependency) {
                                item.disabled = true;
                              }

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
                                item.pattern = "\\d+";
                              }
                              if (item.type === "real_number") {
                                const des = item.des;
                                let x = des.decimal_places;
                                item.pattern =
                                  "(-?\\d+)(\\.)?(\\d){0," + x + "}";
                              }

                              if (field.hidden_when) {
                                let hidden = false;
                                field.hidden_when.forEach(item => {
                                  if (item === "add") {
                                    hidden = true;
                                  }
                                });
                                if (!hidden) {
                                  if (item.pattern !== undefined) {
                                    //item.pattern.replaceAll("\\", "\\\\")
                                  }
                                  formItems.push(item);
                                }
                              } else {
                                if (item.pattern !== undefined) {
                                  //item.pattern.replaceAll("\\", "\\\\")
                                }
                                formItems.push(item);
                              }
                            }
                          });
                        }
                      }
                    });
                    if (this.onLookupChangeFields.length > 0) {
                      this.getRelatedFields(
                        this.onLookupChangeFields,
                        formItems
                      );
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
            } else if (comp.type === "related_list") {
              let show_when = comp.show_when;
              if (show_when !== undefined) {
                show_when.forEach(item => {
                  if (item === "add") {
                    if (comp.show_in_phone_detail) {
                      this.modalFields.push(comp);
                    } else {
                      this.addSubMenu(comp, describe);
                    }
                  }
                });
              }
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
          }
        }
      }
    });
  }

  ionViewDidEnter() {
    if (this.modalFields.length > 0 && this.relatedListFields) {
      this.generatorModalList();
    }
  }

  getAndSetFieldValues(item, criterias, apiName, target_field) {
    let body = {
      joiner: "and",
      objectApiName: apiName,
      order: "asc",
      orderBy: "create_time",
      pageNo: 1,
      pageSize: 1000,
      criterias: criterias
    };
    this.mService.getSearchData(body).then((res: any) => {
      if (res.body) {
        let result = res.body["result"];
        item.pickValue = [];
        let options = [];
        result.forEach(rst => {
          if (rst[target_field]) {
            let option = {
              label: rst[target_field].name,
              value: rst[target_field].id
            };
            options.push(option);
            item.pickValue.push(rst[target_field]);
          } else {
            let option = {
              label: rst.name,
              value: rst.id
            };
            options.push(option);
            item.pickValue.push(rst);
          }
        });
        item.options = options;
      }
    });
  }

  selectOneChange(item) {
    if (item.key != "coach_date") {
      this.getDependencyAndSetOptions(item.key, item.value);
    }
  }

  getselectItemValue(item) {
    // if(item.value && !item.dependency){
    //   this.selectOneChange(item);
    // }
    return item.value;
  }

  getDependencyAndSetOptions(relaykey, value) {
    console.log("relaykey, value ===>", relaykey, value);
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
                  item.disabled = false;
                  if (value == "") {
                    item.disabled = true;
                  }
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

  isHavePermission(action: any) {
    return this.permissionHelper.judgeFcObjectPrivilvege(
      action.action,
      this.apiName
    );
  }

  getMultipleOptions(item, field) {
    let dataSource = field.data_source;
    let body = {
      criterias: [],
      joiner: "and",
      objectApiName: "event",
      order: "desc"
    };
    body.criterias = dataSource.criterias;
    body.objectApiName = dataSource.object_api_name;

    this.mService.getSearchData(body).then((res: any) => {
      item.options = res.body.result;
      if (item.options) {
        item.options.forEach(option => {
          let key =
            "options." + this.apiName + "." + field.field + "." + option.value;
          if (this.translateService.translateFunc(key) !== key) {
            option.label = this.translateService.translateFunc(key);
          }
        });
      }
    });
  }

  callAnotherFunc(fnFunction: Function, vArgument) {
    if (_.isFunction(fnFunction)) {
      return (<Function>fnFunction)(vArgument);
    } else {
      return true;
    }
  }

  dateChange(item) {
    if (item.field.onChange) {
      if (item.field.onChange.clear) {
        _.each(item.field.onChange.clear, item => {
          this.clearRelatedList(item);
        });
      }
    }
    if (item.field.onDatePickerChange) {
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

  setFieldValue(source, target, value, operator) {
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

  getRelatedFields(onLookupChangeFields, formItems) {
    onLookupChangeFields.forEach(lookField => {
      formItems.forEach(item => {
        if (lookField.field.target == item.key) {
          if (item.key == "real_name") {
            item.value = lookField.data.real_name;
          } else {
            item.value = lookField.data.name;
            item.pickValue = [];
            item.pickValue[0] = lookField.data;
          }
        }
      });
    });
  }

  getSelectMultiple(item) {
    if (item.type === "select_multiple") {
      const itemApiName = item.data_source.object_api_name;
      const itemRecordType = "";
      const target_filter_criterias = {
        criterias: [],
        objectApiName: itemApiName
      };
      target_filter_criterias.criterias = item.data_source.criterias;
      this.events.subscribe("form-comp:pickList", (pickItems: any) => {
        if (pickItems.length > 0) {
          item.value = ""; //修改选完重复的问题
          pickItems.forEach(pickItem => {
            if (pickItem) {
              let name = pickItem.name;
              if (item.data_source.target_field) {
                name = pickItem[item.data_source.target_field].name;
              }
              if (!item.value) {
                item.value = "";
              }
              item.value += name + ",";
            }
          });
        }
        if (item.value) {
          item.value = item.value.substring(0, item.value.length - 1);
        }
        item.pickValue = pickItems;
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

  ngAfterViewInit() {
    if (this.navParams.data[5]) {
      console.log(
        "this.navParams.data[5].product__r.name ====>",
        this.navParams.data[5]
      );
      setTimeout(() => {
        let surveyItem: SurveyDataItem = {
          id: this.navParams.data[5].id,
          name: this.navParams.data[5].name,
          isDownloaded: true,
          reaction: undefined,
          product: this.navParams.data[5].product,
          url: this.navParams.data[5].url
        };
        if (this.navParams.data[5].survey) {
          surveyItem["survey"] = this.navParams.data[5].survey;
        }
        this.surveyFeedback.surveyData.push(surveyItem);
      }, 0);
    }
  }

  pageAction(action) {
    switch (action.action.toLowerCase()) {
      case "save":
        this.gotoSaveAction(action);
        break;
      case "callback":
        this.backToUp();
        break;
      case "edit":
        break;
      case "detail":
        break;
      case "add":
        break;
      default:
        break;
    }
  }

  gotoSaveAction(action) {
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
            this.onSubmit(action);
          }
        }
      ]
    });
    alert.present();
  }

  getActions(comp) {
    const layoutActions = comp.actions;
    layoutActions.forEach(action => {
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
      let show_when_flag = true;
      let hidden_expression_flag = false;
      let hidden_divice_flag = false;
      if (action.show_when) {
        action.show_when.forEach(item => {
          if (item === "add" && action.action.toLowerCase() !== "callback") {
            show_when_flag = false;
          }
        });
      }
      if (action.hidden_expression) {
        hidden_expression_flag = this.callAnotherFunc(
          new Function("t", action.hidden_expression),
          ""
        );
      }
      if (action.hidden_divices) {
        action.hidden_divices.forEach(item => {
          if (item.toLowerCase() === "ipad" || item.toLowerCase() === "phone") {
            hidden_divice_flag = true;
          }
        });
      }
      if (hidden_expression_flag || show_when_flag || hidden_divice_flag) {
      } else {
        let isDisabled = false;
        if (action.disabled_expression) {
          isDisabled = this.callAnotherFunc(
            new Function("t", action.disabled_expression),
            ""
          );
        }
        action.isDisabled = isDisabled;
        action.object_describe_api_name = this.apiName;
        action.actions = layoutActions;
        if (this.isHavePermission(action)) {
          this.actions.push(action);
        }
        if (action.action.toLowerCase() !== "save") {
          if (!isDisabled) {
            if (this.isHavePermission(action)) {
              this.relatedActions.push(action);
            }
          }
        }
      }
    });
    if (this.relatedActions.length > 0) {
      this.events.publish("related:actions", this.relatedActions);
    }
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
    this.subMenu.push({ title: comp.header, data: [comp, describe, ""] });
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
          if (_.isArray(item.options)) {
            let ishaslabel =
              JSON.stringify(item.options).indexOf(pickValue.label) > -1;
            if (ishaslabel) {
              item.value = pickValue.label;
              item.pickValue = pickValue;
            }
          }
          this.selectOneChange(item);
          this.events.unsubscribe("form-comp:optionsSearch");
        });
        this.navCtrl.push(SearchOptions, item);
      }
    } else if (item.type === "subordinate") {
      this.events.subscribe("form-comp:pickValue", (pickValue: any) => {
        item.value = pickValue[0].name;
        item.pickValue = pickValue;
        this.events.unsubscribe("form-comp:pickValue");
      });
      this.navCtrl.push(SubordinatePage);
    } else if (item.type == "image_upload") {
      this.events.subscribe("form-comp:pickValue", (pickValue: any) => {
        console.log("form-comp:pickValue =====>", pickValue);
        item.value = pickValue[0].name;
        item.pickValue = pickValue;
        item.number = pickValue[0].number;
        this.events.unsubscribe("form-comp:pickValue");
      });
      this.navCtrl.push(CameraPicker, item);
    } else {
      let itemApiName = "",
        itemRecordType = "",
        target_filter_criterias = [];
      if (item.type === "relation") {
        itemApiName = item.des.target_object_api_name;
        itemRecordType = item.field.target_layout_record_type;
      }
      if (item.target_filter_criterias) {
        let criterias = item.target_filter_criterias.criterias;
        let haveRecordType = false;
        criterias.forEach(cri => {
          if (cri.field == "record_type") {
            haveRecordType = true;
          }
        });
        if (!haveRecordType && item.field.target_data_record_type) {
          criterias.push({
            field: "record_type",
            operator: "in",
            value: item.field.target_data_record_type
          });
        }
        target_filter_criterias = item.target_filter_criterias;
      }
      this.events.subscribe("form-comp:pickList", (pickItems: any) => {
        const pickValue = _.cloneDeep(pickItems);
        if (!item["pickValue"]) {
          item["pickValue"] = pickValue;
          item.value = pickValue[0].name;
        } else {
          item["pickValue"] = [];
          item["pickValue"] = pickValue;
          item.value = pickValue[0].name;
        }
        if (item.field.onLookupChange) {
          let fields = item.field.onLookupChange.setFields;
          this.selectOneChange(item);
          fields.forEach(field => {
            this.initLookupFields(field, pickValue[0]);
          });
        }
        this.dateChange(item);
        this.events.unsubscribe("form-comp:pickList");
      });
      if (target_filter_criterias["criterias"]) {
        if (target_filter_criterias["criterias"].length > 0) {
          target_filter_criterias["criterias"].forEach(cri => {
            if (cri.value[0]) {
              console.log("cri.value ====>", cri.value);
              _.isArray(cri.value) &&
                cri.value.forEach(val => {
                  if (val == "$$CurrentUserId$$") {
                    cri.value.splice(cri.value.indexOf(val), 1);
                    cri.value.push(this.userInfo.userid);
                  }
                });
            }
            if (!_.isArray(cri.value)) {
              const value = [];
              value.push(cri.value);
              cri.value = value;
            }
          });
        }
      }
      console.log(itemApiName, itemRecordType, item, target_filter_criterias);
      this.navCtrl.push(PickList, [
        itemApiName,
        itemRecordType,
        item,
        target_filter_criterias
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

  getAllValues(action?: any) {
    //验证必填字段是否为空，为空出具体提示
    for (let section of this.components[0].sections) {
      for (let formItem of section.formItems) {
        if (formItem.is_required === true) {
          if (
            (formItem.value &&
              this.dataService.isString(formItem.value) &&
              formItem.value.trim() == "") ||
            !formItem.value
          ) {
            let alert = this.alertCtrl.create({
              title: "提示",
              subTitle: formItem.name + "为空",
              buttons: ["确定"]
            });
            alert.present();
            return undefined;
          }
        }
        if (formItem.pattern !== undefined) {
          if (formItem.value) {
            let patt = "^" + formItem.pattern.replace("\\\\", "\\") + "$";
            let x = new RegExp(patt);
            let val = formItem.value;
            if (this.dataService.isString(val)) {
              val = val.trim();
            }
            let flag = x.test(val);
            if (!flag) {
              let warning = formItem.name;
              if (formItem.type == "big_int") {
                warning +
                  "（" +
                  this.translateService.translateFunc(
                    "pad.warning_type_number"
                  ) +
                  "）";
              }
              let alert = this.alertCtrl.create({
                title: this.translateService.translateFunc(
                  "pad.alert_failed_title"
                ),
                subTitle:
                  this.translateService.translateFunc("pad.warning_subtitle") +
                  warning +
                  this.translateService.translateFunc("pad.warning_type"),
                buttons: [
                  {
                    text: this.translateService.translateFunc(
                      "pad.action_callback"
                    ),
                    handler: data => {}
                  },
                  {
                    text: this.translateService.translateFunc("pad.action_ok"),
                    handler: data => {}
                  }
                ]
              });
              alert.present();
              return;
            }
          }
        }
        if (formItem.des) {
          if (formItem.des.max_length) {
            if (formItem.value) {
              let x = JSON.stringify(formItem.value);
              if (x.length > formItem.des.max_length) {
                let alert = this.alertCtrl.create({
                  title: this.translateService.translateFunc(
                    "pad.alert_failed_title"
                  ),
                  subTitle:
                    this.translateService.translateFunc(
                      "pad.warning_subtitle_not_more"
                    ) +
                    formItem.des.max_length +
                    this.translateService.translateFunc("pad.warning_langth") +
                    formItem.name +
                    "！",
                  buttons: [
                    {
                      text: this.translateService.translateFunc(
                        "pad.action_callback"
                      ),
                      handler: data => {}
                    },
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
        }
      }
    }
    if (action && action.default_field_val) {
      this.defaultValues = action.default_field_val;
    }

    //构建 符合后端需要格式的数据
    let values: any = {};
    values["record_type"] = this.recordType;
    if (this.version) {
      values["version"] = this.version;
    }

    this.components.forEach(comps => {
      comps.sections.forEach(section => {
        section.formItems.forEach(item => {
          if (item.is_extender) {
            if (item.signValue) {
              for (let x in item.signValue) {
                values[x] = item.signValue[x];
              }
            }
          }
          if (
            item.type.indexOf("time") > -1 ||
            item.type.indexOf("date") > -1
          ) {
            if (item.value) {
              values[item.key] = moment(item.value).format("x");
            }
          } else if (item.pickValue !== undefined) {
            //values[item.key + '_name'] = item.pickValue[0].name;
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
            } else if (item.type === "select_one" && item.need_show_search) {
              // if(item.field.data_source && item.field.data_source.criterias){
              //   values[item.key] = [item.pickValue.value];
              // }else{
              //   values[item.key] = item.pickValue.value;
              // }
              values[item.key] = item.pickValue.value;
            } else if (item.type == "image_upload") {
              if (item.pickValue[0].name) {
                values[item.key] = item.pickValue[0].name;
              } else {
                values[item.key] = [];
              }
            } else {
              values[item.key] = item.pickValue[0].id;
              values[item.key + "__r"] = item.pickValue[0];
            }
          } else {
            values[item.key] = item.value;
            if (item.type == "image_upload") {
              if (!item.pickValue) {
                values[item.key] = [];
              }
            }
          }

          if (item.field) {
            if (item.field.is_dcr) {
              let drcValue = item.value;
              if (item.des.options) {
                item.des.options.forEach(option => {
                  if (option.value == item.value) {
                    drcValue = option.label;
                    this.dcrDetail.push({
                      field_api_name: item.key,
                      field_name: item.name,
                      old_value: "",
                      new_value: drcValue,
                      old_data: "",
                      new_data: item.value
                    });
                  }
                });
              } else {
                if (item.pickValue) {
                  this.dcrDetail.push({
                    field_api_name: item.key,
                    field_name: item.name,
                    old_value: "",
                    new_value: drcValue,
                    old_data: "",
                    new_data: item.pickValue[0].id
                  });
                } else {
                  this.dcrDetail.push({
                    field_api_name: item.key,
                    field_name: item.name,
                    old_value: "",
                    new_value: drcValue,
                    old_data: "",
                    new_data: item.value
                  });
                }
              }
            }
          }

          if (this.apiName == "coach_feedback") {
            if (item.key == "employee") {
              values["employee__r"] = {
                id: item.pickValue[0].id,
                name: item.pickValue[0].name
              };
              values["manager__r"] = {
                name: this.userInfo.user["name"],
                id: this.userInfo.user["id"]
              };
            }
          }

          if (this.apiName == "event_attendee") {
            if (item.key == "event") {
              values["event__r"] = {
                id: item.pickValue[0].id,
                name: item.pickValue[0].name
              };
            }
          }
        });
      });
    });
    if (this.recordType === "report") {
      const product_call_list = [];
      const key_message_call_list = [];
      let products = this.product.getValuesOfProducts();
      const createProdList = products[0];
      const product = products[1];
      const keyMessage = products[2];
      const prodValue = [];
      let productMap = {};
      let keyMessageMap = {};
      if (products[0].length > 0) {
        const productInit = products[0];
        for (let prod of productInit) {
          productMap[prod.id] = prod;
          if (prod.message && prod.message.length > 0) {
            for (let pr of prod.message) {
              keyMessageMap[pr.id] = pr.name;
            }
          }
        }
      }
      for (let i in product) {
        prodValue.push(i);
        product_call_list.push({
          product: i,
          product__r: { id: i, name: productMap[i].name },
          reaction: product[i]
        });
      }
      if (products[0].length > 0) {
        const productInit = products[0];
        productInit.forEach(prod => {
          let flag = true;
          if (prodValue.length > 0) {
            prodValue.forEach(item => {
              if (item == prod.id) {
                flag = false;
              }
            });
          }
          if (flag) {
            product_call_list.push({
              product: prod.id,
              product__r: { id: prod.id, name: prod.name },
              reaction: ""
            });
          }
        });
      }

      createProdList.forEach(prod => {
        if (prod.message) {
          const keyMesses = prod.message;
          if (keyMesses.length > 0) {
            keyMesses.forEach(ms => {
              let isHave = false;
              for (let j in keyMessage) {
                if (j == prod.id + "/" + ms.id) {
                  isHave = true;
                }
              }
              if (!isHave) {
                key_message_call_list.push({
                  product: prod.id,
                  key_message: ms.id,
                  key_message__r: { id: ms.id, name: keyMessageMap[ms.id] },
                  reaction: ""
                });
              }
            });
          }
        }
      });

      for (let j in keyMessage) {
        if (
          j.substring(j.indexOf("/") + 1, j.length) !== "id" ||
          j.substring(j.indexOf("/") + 1, j.length) !== "version"
        ) {
          key_message_call_list.push({
            product: j.substring(0, j.indexOf("/")),
            key_message: j.substring(j.indexOf("/") + 1, j.length),
            key_message__r: {
              id: j.substring(j.indexOf("/") + 1, j.length),
              name: keyMessageMap[j.substring(j.indexOf("/") + 1, j.length)]
            },
            reaction: keyMessage[j]
          });
        }
      }

      let create = JSON.parse("{}"),
        _cascade = JSON.parse("{}");
      if (this.surveyFeedback && this.surveyFeedback.surveyData) {
        let surveyFeedbackLists = [];
        for (let sda of this.surveyFeedback.surveyData) {
          let survey_feedback_list: {
            clm_presentation: string;
            clm_presentation__r: {
              id: string;
              name: string;
            };
            survey_answer?: string;
            reaction: string;
          };
          survey_feedback_list = {
            clm_presentation: sda.id,
            clm_presentation__r: {
              id: sda.id,
              name: sda.name
            },
            reaction: sda.reaction
          };
          if (sda.survey) {
            survey_feedback_list["survey_answer"] = sda.survey;
          }
          surveyFeedbackLists.push(survey_feedback_list);
        }
        create.call_survey_feedback_list = surveyFeedbackLists;
      }
      create.call_call_key_message_list = key_message_call_list;
      create.call_call_product_list = product_call_list;
      _cascade.create = create;
      values._cascade = _cascade;
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
    if (this.defaultValues.length > 0) {
      this.defaultValues.forEach(item => {
        if (item.field_type == "js") {
          let value = this.callAnotherFunc(new Function("t", item.val), values);
          values[item.field] = value;
        } else {
          values[item.field] = item.val;
        }
      });
    }
    if (this.modalFields.length > 0) {
      this.compRefs.forEach(compRef => {
        const modalComp = compRef.instance.params.modalComp;
        const modalName = _.get(modalComp, "related_list_name", "");
        const realListData = compRef.instance.realDataList;
        const modalCompList = this.getModalDataList(modalName, realListData);
        if (values._cascade) {
          values._cascade[modalName] = modalCompList;
        } else {
          values["_cascade"] = {};
          const create = {};
          create[modalName] = modalCompList;
          values._cascade["create"] = create;
        }
      });
    }
    return values;
  }

  getModalDataList(modalName, realListData) {
    return realListData ? realListData : [];
  }

  async onSubmit(action) {
    console.log(action, "=========action");
    this.dcrDetail = [];
    const values = this.getAllValues(action);
    if (values) {
      if (this.expression) {
        let expFlag = this.callAnotherFunc(
          new Function("t", this.expression),
          values
        );
        if (expFlag === true) {
          this.createNewData(this.apiName, values, action);
        } else {
          let showMsg = expFlag;
          if (
            window[config.default_language][expFlag] &&
            window[config.default_language][expFlag] !== expFlag
          ) {
            showMsg = window[config.default_language][expFlag];
          }
          let alert = this.alertCtrl.create({
            title: this.translateService.translateFunc(
              "pad.alert_failed_title"
            ),
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
        if (this.dcrDetail.length > 0) {
          if (window["DCR_CREATE_CUSTOMER_RULE"] == 0) {
            values["is_active"] = false;
          }
        }
        this.createNewData(this.apiName, values, action);
      }
    }
  }

  createNewData(apiName, values, action) {
    values.record_type = this.recordType;
    this.mService.pushDataByApiNameAndId(apiName, values).then((res: any) => {
      this.pageParams = res.body;
      if (res.body !== undefined) {
        if (this.layout.is_dcr) {
          const dcrData = {
            customer: res.body.id,
            parent_customer: res.body.parent_id,
            status: 1,
            type: 1
          };
          this.dcrHandler.dcrObject.push(dcrData);
          const dcrBody = {
            customer: res.body.id,
            parent_customer: res.body.parent_id,
            status: 1,
            type: 1,
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
        if (
          action.next_action !== undefined &&
          this.apiName == "coach_feedback"
        ) {
          if (!this.network.onlineStatus) {
            if (action.next_action.toLowerCase().indexOf("coach") > -1) {
              let alert = this.alertCtrl.create({
                title: this.translateService.translateFunc(
                  "pad.alert_remind_title"
                ),
                subTitle: this.translateService.translateFunc(
                  "pad.alert_remind_offline_coach_feedback"
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
          } else {
            this.navCtrl.push(CoachFeedback, [
              res.body,
              this.apiName,
              this.recordType,
              action
            ]);
          }
        } else {
          if (res.head.code === 200) {
            let toast = this.toastCtrl.create({
              message: this.translateService.translateFunc(
                "pad.alert_save_success"
              ),
              duration: 2000,
              position: "top",
              cssClass: "toast_success"
            });
            toast.present();
            this.backToUp();
            // let alert = this.alertCtrl.create({
            //   title: '保存成功！',
            //   buttons: [
            //     {
            //       text: '返回',
            //       handler: data => {
            //         this.backToUp();
            //       }
            //     }, {
            //       text: '继续编辑',
            //       handler: data => {
            //         this.navCtrl.setRoot(EditPage, [this.apiName, this.actions, res.body, this.recordType]);
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
        }
      }
    });
  }

  createDcr(dcrBody) {
    this.mService.pushDataByApiNameAndId("dcr", dcrBody).then((res: any) => {});
  }

  getCompValues() {
    let values: any = {};
    values["record_type"] = this.recordType;
    if (this.version) {
      values["version"] = this.version;
    }

    this.components.forEach(comps => {
      comps.sections.forEach(section => {
        section.formItems.forEach(item => {
          if (item.is_extender) {
            if (item.signValue) {
              values = _.concat(values, item.signValue);
            }
          }
          if (item.key.indexOf("time") > -1 || item.key.indexOf("date") > -1) {
            if (item.value) {
              values[item.key] = moment(item.value).format("x");
            }
          } else if (item.pickValue !== undefined) {
            //values[item.key + '_name'] = item.pickValue[0].name;
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
            } else if (item.type === "select_one" && item.need_show_search) {
              values[item.key] = item.pickValue.value;
            } else if (item.type == "image_upload") {
              if (item.pickValue[0].name) {
                values[item.key] = item.pickValue[0].name;
              } else {
                values[item.key] = [];
              }
            } else {
              values[item.key] = item.pickValue[0].id;
              values[item.key + "__r"] = item.pickValue[0];
            }
          } else {
            values[item.key] = item.value;
            if (item.type == "image_upload") {
              if (!item.pickValue) {
                values[item.key] = [];
              }
            }
          }

          if (item.field) {
            if (item.field.is_dcr) {
              let drcValue = item.value;
              if (item.des.options) {
                item.des.options.forEach(option => {
                  if (option.value == item.value) {
                    drcValue = option.label;
                    this.dcrDetail.push({
                      field_api_name: item.key,
                      field_name: item.name,
                      old_value: "",
                      new_value: drcValue,
                      old_data: "",
                      new_data: item.value
                    });
                  }
                });
              } else {
                if (item.pickValue) {
                  this.dcrDetail.push({
                    field_api_name: item.key,
                    field_name: item.name,
                    old_value: "",
                    new_value: drcValue,
                    old_data: "",
                    new_data: item.pickValue[0].id
                  });
                } else {
                  this.dcrDetail.push({
                    field_api_name: item.key,
                    field_name: item.name,
                    old_value: "",
                    new_value: drcValue,
                    old_data: "",
                    new_data: item.value
                  });
                }
              }
            }
          }

          if (this.apiName == "coach_feedback") {
            if (item.key == "employee") {
              values["employee__r"] = {
                id: item.pickValue[0].id,
                name: item.pickValue[0].name
              };
              values["manager__r"] = {
                name: this.userInfo.user["name"],
                id: this.userInfo.user["id"]
              };
            }
          }

          if (this.apiName == "event_attendee") {
            if (item.key == "event") {
              values["event__r"] = {
                id: item.pickValue[0].id,
                name: item.pickValue[0].name
              };
            }
          }
        });
      });
    });
    if (this.recordType === "report") {
      const product_call_list = [];
      const key_message_call_list = [];
      let products = this.product.getValuesOfProducts();
      const createProdList = products[0];
      const product = products[1];
      const keyMessage = products[2];
      const prodValue = [];
      let productMap = {};
      let keyMessageMap = {};
      if (products[0].length > 0) {
        const productInit = products[0];
        for (let prod of productInit) {
          productMap[prod.id] = prod;
          if (prod.message && prod.message.length > 0) {
            for (let pr of prod.message) {
              keyMessageMap[pr.id] = pr.name;
            }
          }
        }
      }
      for (let i in product) {
        prodValue.push(i);
        product_call_list.push({
          product: i,
          product__r: { id: i, name: productMap[i].name },
          reaction: product[i]
        });
      }
      if (products[0].length > 0) {
        const productInit = products[0];
        productInit.forEach(prod => {
          let flag = true;
          if (prodValue.length > 0) {
            prodValue.forEach(item => {
              if (item == prod.id) {
                flag = false;
              }
            });
          }
          if (flag) {
            product_call_list.push({
              product: prod.id,
              product__r: { id: prod.id, name: prod.name },
              reaction: ""
            });
          }
        });
      }

      createProdList.forEach(prod => {
        if (prod.message) {
          const keyMesses = prod.message;
          if (keyMesses.length > 0) {
            keyMesses.forEach(ms => {
              let isHave = false;
              for (let j in keyMessage) {
                if (j == prod.id + "/" + ms.id) {
                  isHave = true;
                }
              }
              if (!isHave) {
                key_message_call_list.push({
                  product: prod.id,
                  key_message: ms.id,
                  key_message__r: { id: ms.id, name: keyMessageMap[ms.id] },
                  reaction: ""
                });
              }
            });
          }
        }
      });

      for (let j in keyMessage) {
        if (
          j.substring(j.indexOf("/") + 1, j.length) !== "id" ||
          j.substring(j.indexOf("/") + 1, j.length) !== "version"
        ) {
          key_message_call_list.push({
            product: j.substring(0, j.indexOf("/")),
            key_message: j.substring(j.indexOf("/") + 1, j.length),
            key_message__r: {
              id: j.substring(j.indexOf("/") + 1, j.length),
              name: keyMessageMap[j.substring(j.indexOf("/") + 1, j.length)]
            },
            reaction: keyMessage[j]
          });
        }
      }

      let create = JSON.parse("{}"),
        _cascade = JSON.parse("{}");
      if (this.surveyFeedback && this.surveyFeedback.surveyData) {
        let surveyFeedbackLists = [];
        for (let sda of this.surveyFeedback.surveyData) {
          let survey_feedback_list: {
            clm_presentation: string;
            clm_presentation__r: {
              id: string;
              name: string;
            };
            survey_answer?: string;
            reaction: string;
          };
          survey_feedback_list = {
            clm_presentation: sda.id,
            clm_presentation__r: {
              id: sda.id,
              name: sda.name
            },
            reaction: sda.reaction
          };
          if (sda.survey) {
            survey_feedback_list["survey_answer"] = sda.survey;
          }
          surveyFeedbackLists.push(survey_feedback_list);
        }
        create.call_survey_feedback_list = surveyFeedbackLists;
      }
      create.call_call_key_message_list = key_message_call_list;
      create.call_call_product_list = product_call_list;
      _cascade.create = create;
      values._cascade = _cascade;
    }
    for (let x in values) {
      if (x.indexOf("time") > -1 || x.indexOf("date") > -1) {
        values[x] = parseInt(values[x]);
      }
    }
    if (this.defaultValues.length > 0) {
      this.defaultValues.forEach(item => {
        if (item.field_type == "js") {
          let value = this.callAnotherFunc(new Function("t", item.val), values);
          values[item.field] = value;
        } else {
          values[item.field] = item.val;
        }
      });
    }
    return values;
  }

  clearRelatedList(relateName) {
    if (this.compRefs.length > 0) {
      this.compRefs.forEach(compRef => {
        if (
          compRef.instance.params.modalComp.related_list_name === relateName
        ) {
          compRef.instance.clearStorage(relateName);
        }
      });
    }
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
          compRef.instance.params = {
            layout: this.layout,
            describe: this.describe,
            modalComp: modalComp,
            data: values
          };
          compRef.instance.pageType = "add";
          this.compRefs.push(compRef);
        });
      } else {
        this.compRefs.forEach(compRef => {
          const initData = compRef.instance.params.data;
          compRef.instance.pageType = "add";
          compRef.instance.params.data = _.merge(initData, values);
          compRef.instance.parentDataChange();
          compRef.instance.getListData(_.merge(initData, values));
        });
      }
    }
  }

  ionViewDidLeave() {
    this.events.unsubscribe("relatedAdd:push");
  }
}
