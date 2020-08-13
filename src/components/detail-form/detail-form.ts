import { Component, enableProdMode, ViewChild } from "@angular/core";
import {
  NavParams,
  ViewController,
  NavController,
  Events,
  ModalController
} from "ionic-angular";
import moment from "moment";
import _ from "lodash";
import { MainService, TranslateService } from "../../providers/index";
import {
  DateHelper,
  PermissionHelper,
  evalStr,
  UserInfo
} from "../../utils/index";
import { EditPage, AddPage, SignInPage } from "../../pages/index";
import { ImageViewer } from "../index";
import { StarRating } from "../../components/index";
enableProdMode();
@Component({
  selector: "comp-detail-form",
  templateUrl: "detail-form.html"
})
export class DetailForm {
  constructor(
    public navParams: NavParams,
    public mainService: MainService,
    public viewCtrl: ViewController,
    public navCtrl: NavController,
    public events: Events,
    public permissionHelper: PermissionHelper,
    public translateService: TranslateService,
    public userInfo: UserInfo,
    public modalController: ModalController
  ) {}

  layout: any;
  describe: any;
  metadata: any;
  sections = [];
  actions: any;
  apiName: any;
  data: any;
  value: any;
  relatedActions = [];
  showResult = false;
  insertSections = [];
  imageSlides = [];
  max = 5;
  readonly = true;
  rating: number;
  @ViewChild("StarRating") StarRating: StarRating;
  ngOnInit() {
    this.renderDom(this.layout, this.describe, this.metadata);
    this.apiName = this.metadata.object_describe_name;
  }

  init() {
    this.layout = undefined;
    this.describe = undefined;
    this.metadata = undefined;
    this.sections = [];
    this.actions = undefined;
    this.apiName = undefined;
    this.data = undefined;
    this.value = undefined;
    this.relatedActions = [];
    this.showResult = false;
    this.insertSections = [];
  }
  getDetailValue(data, des) {
    const index = des.api_name;
    if (des.options != undefined) {
      for (let x in des.options) {
        if (des.options[x].value === data[index]) {
          return des.options[x].label;
        }
      }
    }
    if (data[index + "__r"] !== undefined) {
      return data[index + "__r"].name;
    } else if (index.indexOf("time") > -1 || index.indexOf("date") > -1) {
      if (
        data[index] !== undefined &&
        data[index] !== "" &&
        data[index] !== 0
      ) {
        return DateHelper.formatTime(data[index]);
      } else {
        return "";
      }
    } else {
      return data[index];
    }
  }

  getCols(section, field) {
    if (field.render_type === "long_text") {
      return false;
    }
    if (section.columns > 1) {
      return true;
    } else {
      return undefined;
    }
  }

  getCols12(section, field) {
    if (field.render_type === "long_text") {
      return true;
    }
    if (section.columns === "1") {
      return true;
    } else {
      return undefined;
    }
  }

  showInDevice(fieldSection, isShow) {
    if (fieldSection.show_in_device) {
      let phone = fieldSection.show_in_device.phone;
      if (_.isArray(phone)) {
        let isNeedShow = phone.indexOf("detail") > -1;
        if (isNeedShow) {
          isShow = true;
        } else {
          isShow = false;
        }
      } else {
        console.warn(`${phone} must be array`);
      }
    }
    return isShow;
  }

  renderDom(layout, describe, metadata) {
    const fieldSections = layout.field_sections;
    this.actions = layout.actions;
    fieldSections.forEach(fieldSection => {
      let isShow = true;
      if (fieldSection.hidden_when) {
        fieldSection.hidden_when.forEach(page => {
          if (page.toLowerCase() == "detail") {
            isShow = false;
          }
        });
      }
      //支持filedSection show_in_devices
      isShow = this.showInDevice(fieldSection, isShow);
      if (fieldSection.is_extender && isShow) {
        if (fieldSection.form_item_extender === "SignInLiteFormItem") {
          if (
            fieldSection["header.i18n_key"] &&
            this.translateService.translateFunc(
              fieldSection["header.i18n_key"]
            ) !== fieldSection["header.i18n_key"]
          ) {
            fieldSection.header = this.translateService.translateFunc(
              fieldSection["header.i18n_key"]
            );
          }
          const field = {
            label: fieldSection.header,
            value: metadata["sign_in_location"],
            showFlag: true,
            field: fieldSection.header
          };
          const fields = [];
          fields.push(field);
          fieldSection["fields"] = fields;
          this.sections.push({ type: "insert", section: fieldSection });
          console.log(this.sections, "==============this.sections");
        } else if (fieldSection.form_item_extender_filter) {
          let filter = fieldSection.form_item_extender_filter;
          if (filter.ref_obj_describe) {
            const theApi = filter.ref_obj_describe;
            const related_list_name = filter.related_list_name;
            const filterSection = [];
            filter.default_filter_criterias.forEach(flt => {
              if (flt.field_type === "js") {
                const value = evalStr(flt.value);
                filterSection.push({
                  field: flt.field,
                  operator: flt.operator,
                  value: value
                });
              } else if (flt.value["expression"]) {
                const value = evalStr(flt.value["expression"]);
                //const value = eval(flt.value['expression']);
                filterSection.push({
                  field: flt.field,
                  operator: flt.operator,
                  value: value
                });
              } else {
                filterSection.push(flt);
              }
            });
            this.mainService.getDescribeByApiName(theApi).then((res: any) => {
              if (res.head.code === 200) {
                const refDescribe = res.body.fields;
                let field = undefined;
                refDescribe.forEach(res => {
                  if (res.related_list_api_name == related_list_name) {
                    field = res.api_name;
                  }
                });
                filterSection.push({
                  field: field,
                  operator: "==",
                  value: [this.metadata.id]
                });
                const body = {
                  objectApiName: theApi,
                  joiner: "and",
                  criterias: filterSection,
                  orderBy: "update_time"
                };
                this.mainService.getSearchData(body).then((res: any) => {
                  if (res.head.code === 200) {
                    let results = res.body.result;
                    if (
                      (results.length == 0 && theApi == "customer_product") ||
                      (results.length == 0 && theApi == "product")
                    ) {
                      results.push({
                        overall_segmentation: "0",
                        owner__r: {
                          owner: this.userInfo.userid,
                          name: this.userInfo.user["name"]
                        }
                      });
                    }
                    results.forEach(rst => {
                      if (fieldSection.fields) {
                        fieldSection.fields.forEach(field => {
                          let isHaveRight = this.permissionHelper.fc_hasFieldPrivilege(
                            theApi,
                            field.field
                          );
                          if (isHaveRight !== "hidden") {
                            refDescribe.forEach(res => {
                              if (res.api_name == field.field) {
                                if (
                                  !field.render_type ||
                                  field.render_type == "radio"
                                ) {
                                  field.render_type = res.type;
                                }
                                field.label = res.label;
                                const trans =
                                  "field." + theApi + "." + field.field;
                                if (
                                  this.translateService.translateFunc(trans) !==
                                  trans
                                ) {
                                  field.label = this.translateService.translateFunc(
                                    trans
                                  );
                                }
                                field.value = rst[field.field];
                                const flag = this.getFieldVisble(field);
                                field.showFlag = flag;
                                field.widecol = false;
                                if (
                                  fieldSection.columns === "1" ||
                                  field.render_type === "long_text"
                                ) {
                                  field.widecol = true;
                                }
                                if (res.options) {
                                  field.options = res.options;
                                  res.options.forEach(option => {
                                    if (option.value == field.value) {
                                      field.value = option.label;
                                      const trans =
                                        "options." +
                                        theApi +
                                        "." +
                                        field.field +
                                        "." +
                                        option.value;
                                      if (
                                        this.translateService.translateFunc(
                                          trans
                                        ) !== trans
                                      ) {
                                        field.value = this.translateService.translateFunc(
                                          trans
                                        );
                                      }
                                    }
                                  });
                                }
                                if (field.render_type == "boolean") {
                                  if (rst[field.field]) {
                                    field.value = this.translateService.translateFunc(
                                      "pad.action_yes"
                                    );
                                  } else {
                                    field.value = this.translateService.translateFunc(
                                      "pad.action_no"
                                    );
                                  }
                                }
                                if (
                                  field.render_type.indexOf("time") > -1 ||
                                  field.render_type.indexOf("date") > -1
                                ) {
                                  let dateFormat = "";
                                  if (field.date_time_format) {
                                    dateFormat = field.date_time_format;
                                  } else if (res.date_format) {
                                    dateFormat = res.date_format;
                                  } else {
                                    dateFormat = "YYYY-MM-DD HH:mm";
                                  }
                                  if (
                                    rst[field.field] !== undefined &&
                                    rst[field.field] !== ""
                                  ) {
                                    field.value = moment(
                                      rst[field.field]
                                    ).format(dateFormat);
                                  } else {
                                    field.value = "";
                                  }
                                }
                                if (rst[field.field + "__r"] != undefined) {
                                  field.value = rst[field.field + "__r"].name;
                                }
                              }
                            });
                          }
                        });
                      }
                    });

                    if (
                      fieldSection["header.i18n_key"] &&
                      this.translateService.translateFunc(
                        fieldSection["header.i18n_key"]
                      ) !== fieldSection["header.i18n_key"]
                    ) {
                      fieldSection.header = this.translateService.translateFunc(
                        fieldSection["header.i18n_key"]
                      );
                    }
                    this.sections.push({
                      type: "insert",
                      section: fieldSection
                    });
                  }
                });
              }
            });
          }
        }
      } else if (fieldSection.fields) {
        fieldSection.fields.forEach(field => {
          let isPermission = this.permissionHelper.fc_hasFieldPrivilege(
            this.apiName,
            field.field
          );
          if (isPermission !== "hidden") {
            const flag = this.getFieldVisble(field);
            field.showFlag = flag;
            field.widecol = false;
            if (field.render_type == "json_table" && this.metadata.result) {
              field.showFlag = false;
              field.json_table = true;
            } else {
              field.json_table = false;
            }
            if (
              fieldSection.columns === "1" ||
              field.render_type === "long_text"
            ) {
              field.widecol = true;
            }
            if (field.render_type === "select_multiple") {
              this.renderMultipleField(field, this.metadata);
              console.log("00000000000000", field);
            }
            if (field.render_type === "select_one" && field.data_source) {
              //第三个参数是true 代表单选
              this.renderMultipleField(field, this.metadata, true);
            }
          }
        });
        if (
          fieldSection["header.i18n_key"] &&
          this.translateService.translateFunc(
            fieldSection["header.i18n_key"]
          ) !== fieldSection["header.i18n_key"]
        ) {
          fieldSection.header = this.translateService.translateFunc(
            fieldSection["header.i18n_key"]
          );
        }
        this.sections.push({ type: "normal", section: fieldSection });
      }
    });
  }

  getFieldVisble(field) {
    let flag = true;
    if (field.render_type === "json_table" && this.metadata.result) {
      flag = false;
      this.showResult = true;
    }
    if (field.hidden_when) {
      if (field.hidden_when.length > 0) {
        field.hidden_when.forEach(item => {
          if (item.toLowerCase() === "detail") {
            flag = false;
          }
        });
      }
    }
    return flag;
  }
  tapAction(e, item) {
    if (!item.data) {
      item.data = this.metadata;
    }
    this.events.subscribe("form-comp:signSearch", (pickValue: any) => {
      item.value = pickValue.value;
      this.events.unsubscribe("form-comp:signSearch");
    });
    this.navCtrl.push(SignInPage, item);
  }
  renderMultipleField(field: any, metadata: any, isSingle = false): void {
    const fieldApiName = field.field;
    const dataSource = _.get(field, "data_source");
    let finalValue = ""; //多或者单选类型的最后的值

    if (_.isEmpty(dataSource)) {
      //TODO  普通的多选或者单选的回显
    } else {
      //dataSource有值 定义data_source 的基本信息
      const objectApiName = dataSource.object_api_name;
      const fieldValues = _.get(metadata, fieldApiName);
      const criterias = _.get(dataSource, "criterias");

      // 构建查询条件
      let body = {
        criterias,
        objectApiName,
        joiner: "and",
        order: "desc"
      };
      //保证query 回全部的数据
      if (!_.isEmpty(fieldValues)) {
        let cri = {
          field: "id",
          operator: "in",
          value: [].concat(fieldValues)
        };
        body.criterias.push(cri);
      }

      //处理criterias
      this.handleDataSourceCirterias(body.criterias);

      this.mainService.getSearchData(body).then((res: any) => {
        let options = res.body.result;

        //构建optionsMap
        let optionsMap = {};
        if (_.isArray(options)) {
          _.each(options, option => {
            //有 target_field
            if (dataSource.target_field) {
              option.name = option[dataSource.target_field].name;
              option.id = option[dataSource.target_field].id;
            }
            //没有 target_field
            if (dataSource && !dataSource.target_field) {
              option.name = option.name;
              option.id = option.id;
            }
            // 构建 optionsMap ={option.id : option}
            if (!optionsMap[option.id]) {
              optionsMap[option.id] = option;
            }
          });
        }

        //匹配fieldValues 和optionsMap   拼接 name
        let tempValueArr = [];
        if (_.isArray(fieldValues) && !_.isEmpty(optionsMap)) {
          _.each(fieldValues, fieldValue => {
            let nowDataObj = optionsMap[fieldValue];
            if (nowDataObj) {
              //有dataSource 配置了render_label_expression
              if (field.render_label_expression) {
                let render_label_expression_value = this.callAnotherFunc(
                  new Function("t", field.render_label_expression),
                  nowDataObj
                );
                if (render_label_expression_value) {
                  nowDataObj.name = render_label_expression_value;
                }
                tempValueArr.push(nowDataObj.name);
              } else {
                //有dataSource 没有配置render_label_expression
                tempValueArr.push(nowDataObj.name);
              }
            }
          });
        }

        if (!_.isEmpty(tempValueArr)) {
          finalValue = isSingle ? tempValueArr[0] : _.join(tempValueArr, ",");
        }
        //最后赋值
        field.value = finalValue;
      });
    }
  }

  handleDataSourceCirterias(dataSourceCriterias: any): void {
    _.each(dataSourceCriterias, crit => {
      if (crit.value) {
        //crit.value 不是数组 且存在 crit.value.expression
        if (crit.value.expression) {
          crit.value = [];
          crit.value.push(this.userInfo.userid);
        } else if (crit.value[0]) {
          //crit.value 是数组情况 但是每一项里面有$$CurrentUserId$$  的情况
          _.each(crit.value, val => {
            if (val === "$$CurrentUserId$$") {
              //替换成userid
              crit.value.splice(
                crit.value.indexOf(val),
                1,
                this.userInfo.userid
              );
            }
          });
        }
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

  renderChildDom(section, describe, metadata) {}

  matchFieldToDescribe(field, filedObj) {
    const describeFields = this.describe.fields;
    let label = "";
    describeFields.forEach(des => {
      if (des.api_name === field) {
        label = des.label;
        let translateKey = "field." + this.apiName + "." + field;
        if (
          this.translateService.translateFunc(translateKey) !== translateKey
        ) {
          label = this.translateService.translateFunc(translateKey);
        }
      }
    });
    if (filedObj.label) {
      label = filedObj.label;
    }
    return label;
  }

  openImgViewer(field) {
    let values = [];
    values = this.metadata[field.field];
    if (values.length > 0) {
      let modal = this.modalController.create(ImageViewer, {
        field: field,
        data: this.metadata
      });
      modal.present();
      modal.onDidDismiss(res => {});
    }
  }
  matchFieldToMetadata(field, fields) {
    const describeFields = this.describe.fields;
    if (this.metadata[field] !== undefined) {
      this.value = this.metadata[field];
      describeFields.forEach(des => {
        if (fields.render_type === "star") {
          this.value = this.metadata[field];
          // this.rating = 1*this.value;
          var reg = new RegExp("分");
          let str = this.value.toString().replace(reg, "");
          this.value = Math.floor(str);
          return this.value;
          // console.log(this.value,'122333')
        }
        if (fields.render_type === "select_multiple") {
          this.value = this.metadata[field];
        } else if (field == des.api_name) {
          if (
            fields.render_type === "select_one" ||
            des.type === "select_one"
          ) {
            let options = des.options;
            if (options) {
              options.forEach(option => {
                if (option.value === this.metadata[field]) {
                  let key =
                    "options." +
                    this.metadata.object_describe_name +
                    "." +
                    des.api_name +
                    "." +
                    option.value;
                  this.value = option.label;
                  if (this.translateService.translateFunc(key) !== key) {
                    this.value = this.translateService.translateFunc(key);
                  }
                }
              });
            } else {
              this.value = fields.value;
            }
          } else if (des.type === "boolean") {
            this.value = this.judgeBool(this.metadata[field]);
          } else if (
            des.type.indexOf("time") > -1 ||
            des.type.indexOf("date") > -1
          ) {
            let dateFormat = "";
            if (fields.date_time_format) {
              dateFormat = fields.date_time_format;
            } else if (des.date_format) {
              dateFormat = des.date_format;
            } else {
              dateFormat = "YYYY-MM-DD HH:mm";
            }
            if (
              this.metadata[field] !== 0 &&
              this.metadata[field] !== undefined &&
              this.metadata[field] !== ""
            ) {
              this.value = moment(this.metadata[field]).format(dateFormat);
            } else {
              this.value = "";
            }
          } else if (fields.render_type == "image_upload") {
            //let value = this.metadata[field].length;
            this.value =
              this.metadata[field].length +
              this.translateService.translateFunc("pad.image_size") +
              "（" +
              this.translateService.translateFunc("action.detail") +
              "）";
          }
        }
      });
      if (this.metadata[field + "__r"] != undefined) {
        this.value = this.metadata[field + "__r"].name;
      }
      if (fields.render_type === "select_multiple" && fields.data_source) {
        this.value = fields.value;
      }
      return this.value;
    } else if (!field) {
      if (
        fields["label.i18n_key"] &&
        this.translateService.translateFunc(fields["label.i18n_key"]) !==
          fields["label.i18n_key"]
      ) {
        return this.translateService.translateFunc(fields["label.i18n_key"]);
      }
      return fields.label;
    } else {
      return "";
    }
  }

  getMultipleOptionsAndValue(field, data, isSelectOne?: any) {
    let dataSource = field.data_source;
    if (dataSource.criterias) {
      if (dataSource.criterias.length > 0) {
        dataSource.criterias.forEach(ds => {
          if (ds.value[0]) {
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
      criterias: [],
      joiner: "and",
      objectApiName: "event",
      order: "desc"
    };
    body.criterias = dataSource.criterias;
    body.objectApiName = dataSource.object_api_name;

    let value = "";

    const filedData = _.get(data, field.field);
    if (filedData !== undefined) {
      const crit = {
        field: "id",
        operator: "in",
        value: [].concat(filedData)
      };
      body.criterias.push(crit);
    }
    this.mainService.getSearchData(body).then((res: any) => {
      const options = res.body.result;
      if (filedData != undefined && options.length > 0) {
        [].concat(filedData).forEach(item => {
          options.forEach(option => {
            let name = option.name;
            let id = option.id;
            if (field.data_source && field.data_source.target_field) {
              name = option[field.data_source.target_field].name;
              id = option[field.data_source.target_field].id;
            }
            if (field.data_source && !field.data_source.target_field) {
              name = option.name;
              id = option.id;
            }
            if (item == id) {
              console.log("item == id", item, id);
              if (!isSelectOne) {
                value += name + ",";
              } else {
                //selec_one && data_source
                value = name;
              }
            }
          });
        });
        if (!isSelectOne) {
          field.value = value.substring(0, value.length - 1);
          // field.value = 'muliti value'
        } else {
          field.value = value;
        }
      } else {
        field.value = "";
      }
    });
  }

  judgeBool(data) {
    if (data === "true" || data === true) {
      return this.translateService.translateFunc("pad.action_yes");
    } else {
      return this.translateService.translateFunc("pad.action_no");
    }
  }

  actionHandle(action: string[]) {
    if (action.indexOf("detail") != -1) {
      return true;
    } else {
      return false;
    }
  }

  Handle(action) {
    switch (action.action.toLowerCase()) {
      case "callback":
        this.navCtrl.pop();
        break;
      case "save":
        break;
      case "edit":
        this.navCtrl.push(EditPage, [this.apiName, action, this.metadata]);
        break;
      case "add":
        this.navCtrl.push(AddPage, [this.apiName, action]);
        break;
      case "custom_update":
        this.navCtrl.push(EditPage, [this.apiName, action, this.metadata]);
        break;
      case "relatedadd":
        break;
      default:
        return;
    }
  }
}
