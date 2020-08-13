import { Component } from "@angular/core";
import {
  NavParams,
  NavController,
  Events,
  AlertController
} from "ionic-angular";
import moment from "moment";
import _ from "lodash";
import { MainService, TranslateService } from "../../providers/index";
import * as listHelper from "../../utils/list-helper";
import { callAnotherFunc, evalStr } from "../../utils/index";

const body = {
  pageSize: 10,
  pageNo: 1,
  joiner: "and",
  objectApiName: "call",
  order: "asc",
  orderBy: "",
  criterias: []
};

@Component({
  selector: "page-pick-list",
  templateUrl: "pick-list.html"
})
export class PickList {
  apiName: any;
  recordType: any;
  layout: any;
  describe: any;
  metadata: any;
  pickList: any;
  pageSize: any;
  pageNo: any;
  pageCount: any;
  compRef: any;
  dataRecordType: any;
  target_filter_criterias: any;
  header: any;
  isMultiple = false;

  //newListData
  isPadLayout = false;
  padLayout: any;
  newLayout: any;
  newDescribe: any;
  newData: any;
  newListData = [];
  newApiName: any;
  newListItem: any;
  newDataList = [];
  total: any;
  customSelect = []; //checked 几个的数组

  oldSelector: any[];
  searchValue = "";
  placeHolder = "";
  searchField: any;
  showFilter = false;

  searchBoxValue = "";
  parentData: any = {};

  originLayout: any;

  constructor(
    public navParams: NavParams,
    public mainService: MainService,
    public nav: NavController,
    public events: Events,
    public alertCtrl: AlertController,
    public translateService: TranslateService
  ) {
    if (this.navParams.data[2].type) {
      let type = this.navParams.data[2].type;
      if (type === "select_multiple") {
        this.isMultiple = true;
      }
    }
    if (this.navParams.data[3]) {
      this.target_filter_criterias = this.navParams.data[3];
    }
    if (this.navParams.data[4]) {
      this.parentData = this.navParams.data[4];
    }

    this.customSelect = this.navParams.data[2].pickValue
      ? this.navParams.data[2].pickValue
      : [];
  }

  ngOnInit(): void {
    body.pageSize = 10;
    body.pageNo = this.pageNo = 1;
    this.pageCount = 5;
  }

  backToUp() {
    this.nav.pop();
  }

  ionViewDidEnter() {
    this.apiName = this.navParams.data[0];
    let flag = !this.navParams.data[1];
    let data2 = this.navParams.data[2];
    if (flag && data2.field.target_layout_record_type) {
      this.recordType = data2.field.target_layout_record_type;
      this.dataRecordType = data2.field.target_data_record_type;
    } else if (flag && data2.field.target_data_record_type) {
      this.recordType = data2.field.target_layout_record_type;
      this.dataRecordType = data2.field.target_data_record_type;
    } else {
      this.recordType = this.dataRecordType = this.navParams.data[1];
    }
    if (this.recordType) {
      this.getDom(this.apiName, this.recordType);
    } else {
      this.searchDataWithoutLayout(this.apiName);
    }
  }

  searchDataWithoutLayout(apiName) {
    if (this.navParams.data[3] && this.navParams.data[3].objectApiName) {
      body.objectApiName = this.navParams.data[3].objectApiName;
      body.criterias = this.navParams.data[3].criterias
        ? this.navParams.data[3].criterias
        : [];
      body.order = this.navParams.data[3].order
        ? this.navParams.data[3].order
        : "asc";
      body.orderBy = this.navParams.data[3].orderBy
        ? this.navParams.data[3].orderBy
        : "update_time";
      body.pageSize = 100;
      this.mainService.getSearchData(body).then((res: any) => {
        const result = res.body.result;
        this.total = res.body.resultCount;
        this.pageCount = res.body.pageCount;
        this.fillData(result);
      });
    } else if (this.navParams.data[2].field) {
      body.objectApiName = this.navParams.data[2].key;
      body.criterias = this.navParams.data[2].criterias
        ? this.navParams.data[2].criterias
        : this.navParams.data[2].target_filter_criterias &&
          this.navParams.data[2].target_filter_criterias.criterias
        ? this.navParams.data[2].target_filter_criterias.criterias
        : [];
      body.order = this.navParams.data[2].order
        ? this.navParams.data[2].order
        : "asc";
      body.orderBy = this.navParams.data[2].orderBy
        ? this.navParams.data[2].orderBy
        : "update_time";
      body.pageSize = 100;
      if (this.dataRecordType) {
        body.criterias.push({
          field: "record_type",
          operator: "in",
          value: this.dataRecordType
        });
      }
      this.mainService.getSearchData(body).then((res: any) => {
        const result = res.body.result;
        this.total = res.body.resultCount;
        this.pageCount = res.body.pageCount;
        this.fillData(result);
      });
    }
  }

  fillData(result) {
    if (result) {
      this.newListData = [];
      result.forEach(rst => {
        let isChecked = false;
        const picks = this.customSelect;
        if (picks) {
          picks.forEach(pick => {
            if (pick && pick.id == rst.id) {
              isChecked = true;
              if (this.isMultiple) {
                this.customSelect.push(rst);
              }
            }
          });
        }

        let label = rst.name;

        if (this.navParams.data[2].data_source) {
          let data_source = this.navParams.data[2].data_source;
          if (data_source.target_field) {
            label = rst[data_source.target_field].name;
          }
        }

        const item = {
          isPadLayout: false,
          layout: [
            {
              label: "",
              value: label
            }
          ],
          value: isChecked,
          data: rst
        };
        this.newListData.push(item);
      });
      return this.newListData;
    }
  }

  getDom(apiName, recordType) {
    body.criterias = [];
    body.objectApiName = apiName;
    if (this.recordType == this.dataRecordType && this.recordType) {
      body.criterias.push({
        field: "record_type",
        operator: "in",
        value: [recordType]
      });
    } else if (this.dataRecordType) {
      body.criterias.push({
        field: "record_type",
        operator: "in",
        value: this.dataRecordType
      });
    }
    if (this.target_filter_criterias) {
      if (this.target_filter_criterias.criterias) {
        if (this.target_filter_criterias.criterias.length > 0) {
          let criterias = this.target_filter_criterias.criterias;
          criterias.forEach(cri => {
            if (cri.value.expression) {
              // cri.value = [
              //   callAnotherFunc(
              //     new Function("p", cri.value.expression),
              //     this.parentData
              //   )
              // ];
              if (cri.value.constructor != Array) {
                cri.value = [evalStr(cri.value.expression)];
              } else {
                cri.value = evalStr(cri.value.expression);
              }
            }
            // if (cri.value[0]) {
            //   if (cri.value[0] == '$$AreaCustomerIds$$') {
            //     criterias.splice(criterias.indexOf(cri), 1);
            //   }
            // }
          });
          body.criterias = this.target_filter_criterias.criterias;
        }
      }
    }
    Promise.all([
      this.mainService.getLayoutByApiNameAndPageType(
        apiName,
        "relation_lookup_page",
        this.recordType
      ),
      this.mainService.getDescribeByApiName(apiName),
      this.mainService.getLayoutByApiNameAndPageType(
        apiName,
        "index_page",
        "master"
      )
    ]).then((res: any) => {
      this.layout = res[0].body;
      this.describe = res[1].body;
      this.originLayout = res[2].body;
      let views = [];
      if (
        this.originLayout &&
        this.originLayout.containers &&
        this.originLayout.containers[0]
      ) {
        views = this.originLayout.containers[0].components[0].views;
      }
      if (!_.isEmpty(this.layout)) {
        const orderBy = this.layout.containers[0].components[0].default_sort_by;
        if (orderBy instanceof Array) {
          body.orderBy = this.layout.containers[0].components[0].default_sort_by.join(
            ""
          );
        } else {
          body.orderBy = this.layout.containers[0].components[0].default_sort_by;
        }
      } else {
        body.orderBy = "update_time";
      }

      _.isArray(views) &&
        views.forEach(view => {
          const criterias = view.criterias;
          criterias.forEach(cri => {
            let flag = false;
            body.criterias.forEach(br => {
              if (br.field === cri.field) {
                flag = true;
              }
            });
            if (!flag) {
              body.criterias.push(cri);
            }
          });
        });
      this.oldSelector = _.cloneDeep(body.criterias);
      this.mainService.getSearchData(body).then((res: any) => {
        this.metadata = res.body.result;
        this.newDataList = _.cloneDeep(this.metadata);
        this.pageCount = res.body.pageCount;
        this.total = res.body.resultCount;
        if (this.layout !== undefined && this.layout.containers !== undefined) {
          this.showFilter = this.layout.containers[0].components[0].show_filter;
          if (this.showFilter) {
            if (this.layout.containers[0].components[0].filter_fields) {
              this.searchField = this.layout.containers[0].components[0].filter_fields[0];
              this.placeHolder = this.getLabelofField(
                this.searchField,
                this.describe,
                this.layout.containers[0].components[0]
              );
            } else {
              this.searchField = "name";
              this.placeHolder = this.getLabelofField(
                this.searchField,
                this.describe,
                this.layout.containers[0].components[0]
              );
            }
          }
          const comp = this.layout.containers[0].components[0];
          if (comp) {
            this.header = comp.header;
            if (
              comp["header.i18n_key"] &&
              this.translateService.translateFunc(comp["header.i18n_key"]) !==
                comp["header.i18n_key"]
            ) {
              this.header = this.translateService.translateFunc(
                comp["header.i18n_key"]
              );
            }
          }
          //this.header = this.layout.containers[0].components[0].header;
          //this.layoutHandler(this.layout.containers[0].components[0], this.describe);
          if (this.layout.containers[0].components[0].padlayout) {
            this.isPadLayout = true;
            this.padLayout = listHelper.layoutHandler(
              this.layout.containers[0].components[0],
              this.describe
            );
            this.newListData = listHelper.insertPadLayoutData(
              this.newDataList,
              this.padLayout,
              this.describe
            );
          } else {
            this.isPadLayout = false;
            this.newListItem = listHelper.layoutHandler(
              this.layout.containers[0].components[0],
              this.describe
            );
            this.newListData = listHelper.insertData(
              this.newDataList,
              this.newListItem
            );
          }
          this.newListData.forEach(list => {
            list.value = false;
            if (this.navParams.data[2].pickValue) {
              if (this.navParams.data[2].pickValue.length > 0) {
                this.navParams.data[2].pickValue.forEach(pick => {
                  if (pick.id == list.data.id) {
                    list.value = true;

                    this.customSelect.push(list.data);
                  }
                });
              }
            }
          });
          this.renderDom(this.layout, this.describe, this.metadata);
        } else {
          let alert = this.alertCtrl.create({
            title: this.translateService.translateFunc("pad.have_no_layout"),
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
    });
  }

  getLabelofField(field, describe, layout) {
    let label = "";
    layout.fields.forEach(fld => {
      if (fld.field === field) {
        if (fld.label) {
          label = fld.label;
          if (
            fld["field.i18n_key"] &&
            this.translateService.translateFunc(fld["field.i18n_key"]) !==
              fld["field.i18n_key"]
          ) {
            label = this.translateService.translateFunc(fld["field.i18n_key"]);
          }
        }
      }
    });
    if (label === "" || label === undefined) {
      describe.fields.forEach(desc => {
        if (desc.api_name === field) {
          label = desc.label;
          const trans = "field." + this.apiName + "." + desc.api_name;
          if (
            this.translateService.translateFunc(trans) &&
            this.translateService.translateFunc(trans) !== trans
          ) {
            label = this.translateService.translateFunc(trans);
          }
        }
      });
    }
    return (
      this.translateService.translateFunc("pad.partici_search_text") + label
    );
  }

  searchList() {
    body.pageNo = this.pageNo = 1;
    body.criterias = [];
    body.criterias = _.cloneDeep(this.oldSelector);
    if (this.searchBoxValue !== "") {
      body.criterias.push({
        field: "name",
        operator: "contains",
        value: [this.searchBoxValue]
      });
    }
    this.newListData = [];
    this.mainService.getSearchData(body).then((res: any) => {
      const PickListData = res.body.result;
      this.newDataList = res.body.result;
      this.total = res.body.resultCount;
      if (this.padLayout) {
        this.newListData = listHelper.insertPadLayoutData(
          this.newDataList,
          this.padLayout,
          this.describe
        );
      } else {
        this.newListData = listHelper.insertData(
          this.newDataList,
          this.newListItem
        );
      }
      this.metadata = PickListData;
    });
  }

  renderDom(layout, describe, metadata) {
    this.pickList = [];
    let layField;
    let desField;
    layout.containers[0].components[0].fields.forEach(layItem => {
      describe.fields.forEach(des => {
        if (layItem.field === des.api_name) {
          layField = layItem;
          desField = des;
          this.pickList.push({ field: layField, des: desField });
        }
      });
    });
  }

  pickValue(data, lay) {
    if (this.navParams.data[5] && this.navParams.data[5] === "modal") {
      this.events.publish("form-comp:modalPickList", [data]);
    } else {
      this.events.publish("form-comp:pickList", [data, lay]);
    }
    this.nav.pop();
  }

  newPickValue(index, lay) {
    const dataItem = _.cloneDeep(this.newListData[index]);
    if (this.navParams.data[5] && this.navParams.data[5] === "modal") {
      this.events.publish("form-comp:modalPickList", [dataItem.data]);
    } else {
      this.events.publish("form-comp:pickList", [dataItem.data, lay]);
    }
    this.nav.pop();
  }
  getUniqueArr(arrs) {
    let uniqueArr = [],
      obj = {};
    arrs.forEach(arr => {
      if (!obj[arr.id]) {
        obj[arr.id] = arr;
      }
    });

    for (let key in obj) {
      uniqueArr.push(obj[key]);
    }

    return uniqueArr;
  }
  multiplePickValue() {
    this.customSelect = this.getUniqueArr(this.customSelect);
    if (this.navParams.data[5] && this.navParams.data[5] === "modal") {
      this.events.publish("form-comp:modalPickList", this.customSelect);
    } else {
      this.events.publish("form-comp:pickList", this.customSelect);
    }
    this.nav.pop();
  }
  //第二个参数 record 才是传进来的当前项
  updateCucumber(items, record) {
    if (record && record.value) {
      record.data && this.customSelect.push(record.data);
    } else {
      this.customSelect = this.getUniqueArr(this.customSelect);
      this.customSelect.splice(this.customSelect.indexOf(record.data), 1);
    }
  }

  getValue(data, des) {
    if (data !== undefined && des !== undefined) {
      const index = des.api_name;
      if (des.options != undefined) {
        for (let x in des.options) {
          if (des.options[x].value === data[index]) {
            let label = des.options[x].label;
            const trans =
              "options." +
              this.apiName +
              "." +
              des.api_name +
              "." +
              des.options[x].value;
            if (
              this.translateService.translateFunc(trans) &&
              this.translateService.translateFunc(trans) !== trans
            ) {
              label = this.translateService.translateFunc(trans);
            }
            return label;
          }
        }
      }
      if (des.type === "boolean") {
        if (data[index] === "true") {
          return this.translateService.translateFunc("pad.action_yes");
        } else {
          return this.translateService.translateFunc("pad.action_no");
        }
      }
      if (data[index + "__r"] !== undefined) {
        return data[index + "__r"].name;
      } else if (index.indexOf("time") > -1) {
        return moment(data[index]).format("YYYY-MM-DD HH:mm");
      } else {
        return data[index];
      }
    }
  }

  combineAddList(addList) {
    addList.forEach(item => {
      let isPush = true;
      this.newListData.forEach(nld => {
        if (nld["data"].id == item["data"].id) {
          this.newListData.splice(this.newListData.indexOf(nld), 1, item);
          isPush = false;
        }
      });
      if (isPush) {
        this.newListData.push(item);
      }
    });
  }

  // 下拉刷新
  doRefresh(refresher) {
    body.pageNo = this.pageNo = 1;
    this.newListData = [];
    this.mainService.getSearchData(body).then((res: any) => {
      const PickListData = res.body.result;
      this.newDataList = res.body.result;
      this.total = res.body.resultCount;
      if (this.padLayout) {
        this.newListData = listHelper.insertPadLayoutData(
          this.newDataList,
          this.padLayout,
          this.describe
        );
      } else if (this.newListItem) {
        this.newListData = listHelper.insertData(
          this.newDataList,
          this.newListItem
        );
      } else {
        let addList = this.fillData(res.body.result);
        this.combineAddList(addList);
      }
      this.metadata = PickListData;
      //customSelect 存在 ，customSelect里面的状态更新到this.newListData的value里面
      if (_.isArray(this.customSelect) && !_.isEmpty(this.customSelect)) {
        this.customSelect = this.getUniqueArr(this.customSelect);
        this.newListData.forEach(list => {
          list.value = false;
          this.customSelect.forEach(pick => {
            if (pick.id == list.data.id) {
              list.value = true;
            }
          });
        });
      }
      refresher.complete();
    });
  }

  // 上拉加载
  doInfinite(infiniteScroll) {
    body.pageNo += 1;
    this.pageNo += 1;
    if (body.pageNo > this.pageCount) {
      infiniteScroll.enable(false);
    } else {
      this.mainService.getSearchData(body).then((res: any) => {
        const PickListData = res.body.result;
        this.total = res.body.resultCount;
        if (this.padLayout) {
          let addList = listHelper.insertPadLayoutData(
            res.body.result,
            this.padLayout,
            this.describe
          );
          this.combineAddList(addList);
        } else if (this.newListItem) {
          let addList = listHelper.insertData(
            res.body.result,
            this.newListItem
          );
          this.combineAddList(addList);
        } else {
          let addList = this.fillData(res.body.result);
          this.combineAddList(addList);
        }
        _.isArray(this.metadata) && this.metadata.push(...PickListData);
        infiniteScroll.complete();
      });
    }
  }
}
