import { Component } from '@angular/core';
import { Events, NavParams, ViewController, AlertController, NavController } from 'ionic-angular';
import moment from 'moment';
import _ from 'lodash';
import { MainService, TranslateService } from '../../providers/index';
import * as listHelper from '../../utils/list-helper';
import { evalStr } from '../../utils/index';

@Component({
  selector: 'page-participants',
  templateUrl: 'participants.html'
})

export class ParticipantsPage {
  constructor(
    public events: Events,
    public mService: MainService,
    public navParams: NavParams,
    public view: ViewController,
    public alertCtrl: AlertController,
    public navCtrl: NavController,
    public translateService: TranslateService
  ) {
    this.event = this.navParams.data[2][2];
    this.initSearchBody = this.navParams.data[3];
    this.initSearchBody.pageSize = 100;
    this.initSearchBody.pageNo = 1;
    this.getEventType(this.navParams.data[2][1]);
    this.getInitItems(this.initSearchBody);
  }

  apiName = 'customer';
  recordType = 'hcp';
  refApiNAme: any;
  refData: any;
  refActions: any;
  pageCount: any;
  resultCount: any;
  listData = [];
  pageNo = 1;
  initSearchBody: any;
  searchBody = {
    pageSize: 100,
    pageNo: 1,
    joiner: 'and',
    objectApiName: 'customer',
    order: 'asc',
    orderBy: '',
    criterias: [
    ]
  };
  event: any;


  layout: any;
  describe: any;
  data: any;

  layoutItems = [];
  relatedItems = [];
  applyData = [];
  initItems = [];

  //newListData
  header: any;
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
  event_type: any;
  event_status:any;

  //search
  showFilter = false;
  filter_fields = [];
  default_sort_by = 'update_time';
  default_sort_order = 'desc';
  searchField: any;
  placeHolder = '';
  searchValue: any;

  searchBoxValue = '';
  searchItem = {
    pageSize: 100,
    pageNo: 1,
    joiner: "and",
    criterias: [],
    orderBy: this.default_sort_by ? this.default_sort_by : 'update_time',
    order: this.default_sort_order ? this.default_sort_order : "asc",
    objectApiName: this.apiName
  }


  ionViewDidLoad() {
    //this.view.setBackButtonText('保存并返回');
    this.refActions = this.navParams.data[0]
    this.refData = this.navParams.data[3];
    this.refApiNAme = this.navParams.data[1];
    this.events.publish('menu:activeList', true);
    this.getDataOfPage(this.apiName, this.recordType);
    this.events.subscribe('event:delete', (data: any) => {
      this.deleteEvent(data);
    })
  }

  getEventType(describe) {
    if (describe.fields) {
      describe.fields.forEach(des => {
        if (des.api_name == 'type') {
          des.options.forEach(option => {
            if (option.value == this.event.type) {
              this.event_type = option.label;
            }
          })
        }
        if(des.api_name == 'status'){
          des.options.forEach(option => {
            if(option.value == this.event.status){
              this.event_status = option.label;
            }
          })
        }
      })
    }
  }

  backAndSave() {
    const addPeople = [];
    this.applyData.forEach(appItem => {
      let flag = false;
      this.initItems.forEach(initItem => {
        if (appItem.customer == initItem.customer) {
          flag = true;
        }
      })
      if (!flag) {
        addPeople.push(appItem);
      }
    })
    if (addPeople.length > 0) {
      let body = {
        data: addPeople
      };
      this.mService.batchCreate('event_attendee', body).then((res: any) => {
        this.events.publish('menu:activeListData', ['save']);
        this.navCtrl.pop();
      })
    } else {
      this.events.publish('menu:activeListData', ['save']);
      this.navCtrl.pop();
    }
  }

  getInitItems(body) {
    this.mService.getSearchData(body).then((res: any) => {
      if (res.body.result) {
        let items = res.body.result;
        items.forEach(item => {
          let obj = {
            attendee_department: item.attendee_department,
            attendee_organization: item.attendee_organization,
            attendee_title: item.attendee_title,
            event: item.event,
            name: item.name,
            record_type: item.record_type,
            id: item.id,
            customer: item.customer,
            event_start_time: item.event.start_time,
            event_end_time: item.event.end_time,
            event_type: this.event_type,
            event_status:this.event_status,
            event__r: {
              id: this.event.id,
              name: this.event.name
            }
          }
          this.initItems.push(obj);
          this.applyData.push(obj);
        })
        this.events.publish('menu:activeListData', ['init', this.initItems]);
      }
    })
  }

  getDataOfPage(apiName, recordType) {
    if (this.refActions.target_filter_criterias) {
      const target_filter_criterias = this.refActions.target_filter_criterias;
      let criterias = target_filter_criterias.criterias;
      if (criterias.length > 0) {
        criterias.forEach(cri => {
          if (cri.value[0]) {
              this.searchBody.criterias.push({
                field: cri.field,
                operator: cri.operator,
                value: cri.value
              })
          } else {
            if (cri.value['expression']) {
              let value = evalStr(cri.value['expression']);
              cri.value = value;
            }
            this.searchBody.criterias.push({
              field: cri.field,
              operator: cri.operator,
              value: cri.value
            })
          }
        })
      }
    }
    Promise.all([
      this.mService.getLayoutByApiNameAndPageType(apiName, 'index_page', this.recordType),
      this.mService.getDescribeByApiName(apiName),
      this.mService.getSearchData(this.searchBody)
    ]).then((res: any) => {
      this.layout = res[0].body;
      this.describe = res[1].body;
      this.data = res[2].body;
      this.newDataList = this.data.result;
      this.total = res[2].body.resultCount;
      this.layout.containers[0].components.forEach(component => {
        this.header = component.header;
        this.showFilter = component.show_filter;
        this.filter_fields = component.filter_fields;
        this.default_sort_by = component.default_sort_by;
        this.default_sort_order = component.default_sort_order;

        if (this.showFilter) {
          if (this.filter_fields.length > 0) {
            this.searchField = this.filter_fields[0];
            this.placeHolder = this.getLabelofField(this.searchField, this.describe, component);
          } else {
            this.showFilter = false;
          }
        }

        //this.layoutHandler(component, this.describe);
        if (component.padlayout) {
          this.isPadLayout = true;
          this.padLayout = listHelper.layoutHandler(component, this.describe);
          this.newListData = listHelper.insertPadLayoutData(this.newDataList, this.padLayout, this.describe);
          this.total = this.total - this.applyData.length;
          this.applyData.forEach(item => {
            let i = 0;
            for (i; i < this.newListData.length; i++) {
              if (this.newListData[i].data.id == item.customer) {
                this.newListData.splice(i, 1);
              }
            }
          })
        } else {
          this.isPadLayout = false;
          this.newListItem = listHelper.layoutHandler(component, this.describe);
          this.newListData = listHelper.insertData(this.newDataList, this.newListItem);
          this.total = this.total - this.applyData.length;
          this.applyData.forEach(item => {
            let i = 0;
            for (i; i < this.newListData.length; i++) {
              if (this.newListData[i].data.id == item.customer) {
                this.newListData.splice(i, 1);
              }
            }
          })
        }
        this.renderDom(component, this.describe, this.data);
      });
    })
  }

  getLabelofField(field, describe, layout) {
    let label = '';
    layout.fields.forEach(fld => {
      if (fld.field === field) {
        if (fld.label) {
          label = fld.label;
        }
      }
    });
    if (label === '' || label === undefined) {
      describe.fields.forEach(desc => {
        if (desc.api_name === field) {
          label = desc.label;
        }
      })
    }
    return this.translateService.translateFunc('pad.partici_search_text') + label;
  }

  searchList() {
    this.newListData = [];
    this.listData = [];
    this.searchItem.criterias = _.cloneDeep(this.searchBody.criterias);
    //this.searchItem.criterias.push({ field: 'record_type', operator: 'in', value: ['hcp'] });
    this.searchItem.pageNo = 1;
    if (this.searchBoxValue !== '') {
      this.searchItem.criterias.push({ field: this.searchField, operator: 'contains', value: [this.searchBoxValue] });
    }
    this.mService.getSearchData(this.searchItem).then((res: any) => {
      if (res.body.result) {
        this.total = res.body.resultCount;
        if (res.body.result.length > 0) {
          this.listData = res.body.result;
          this.newDataList = res.body.result;
          this.newListData = listHelper.insertPadLayoutData(this.newDataList, this.padLayout, this.describe);
          if (this.searchItem.criterias.length <= 1) {
            this.total = this.total - this.applyData.length;
          }
          this.applyData.forEach(item => {
            let i = 0;
            for (i; i < this.newListData.length; i++) {
              if (this.newListData[i].data.id == item.customer) {
                this.newListData.splice(i, 1);
                if (this.searchItem.criterias.length > 1) {
                  this.total--;
                }
              }
            }
          })
        }
      }
    })
  }

  renderDom(layout, describe, data) {
    //this.listData = data.result;
    let str = JSON.stringify(data.result);
    this.listData = JSON.parse(str);
    layout.fields.forEach(field => {
      describe.fields.forEach(des => {
        if (field.field === des.api_name) {
          this.layoutItems.push({ 'field': field, 'des': des });
        }
      });
    });

    this.handlerListData(this.listData, this.layoutItems);
  }

  handlerListData(list, items) {
    if (list.length > 0) {
      list.forEach(data => {
        let theItems = [];
        items.forEach(item => {
          let value = this.getRelateValue(data, item);
          theItems.push({ 'key': item.des.api_name, 'value': value, 'type': item.des.type, 'item': item })

        })
        this.relatedItems.push(theItems);
      })
    }
  }

  getRelateValue(data, layoutItem) {
    let x = _.get(data, layoutItem.field.field);
    let y = _.get(data, layoutItem.field.field + '__r');
    if (y) {
      x = y.name;
    }

    if (layoutItem.field.render_type == "date_time" && x !== undefined) {
      x = moment(x).format("YYYY-MM-DD HH:mm:ss");
      //return x;
    }

    if (layoutItem.des.type === 'select_one') {
      layoutItem.des.options.forEach(option => {
        if (option.value === x) {
          x = option.label;
        }
      })
    }

    if (x == undefined) {
      x = this.translateService.translateFunc('pad.partici_nothing');
    }

    return x;
  }

  addDataToList(data) {
    this.changeAndPutData(data);
  }

  changeAndPutData(data) {
    let obj = {
      attendee_department: '',
      attendee_organization: '',
      attendee_title: '',
      event: '',
      name: '',
      record_type: '',
      customer: '',
      event_type: '',
      event_status:'',
      event_start_time: '',
      event_end_time: '',
      event__r: {
        id: this.event.id,
        name: this.event.name
      }
    }
    let flag = false;
    this.applyData.forEach(item => {
      if (item.customer == data.id) {
        flag = true;
      }
    })
    if (flag) {
      let alert = this.alertCtrl.create({
        title: this.translateService.translateFunc('pad.partici_confilict'),
        buttons: [
          {
            text: this.translateService.translateFunc('pad.action_ok'),
            handler: data => {
            }
          }
        ]
      })
      alert.present();
    } else {
      obj.name = data.name;
      obj.event = this.event.id;
      obj.record_type = this.refActions.target_layout_record_type;
      obj.attendee_department = this.getOptionsLabel('department', data.department);
      if (data.parent_id__r) {
        obj.attendee_organization = data.parent_id__r.name;
      }
      obj.attendee_title = this.getOptionsLabel('major_title', data.major_title);
      obj.customer = data.id;
      obj.event_start_time = this.event.start_time;
      obj.event_end_time = this.event.end_time;
      obj.event_type = this.event_type;
      obj.event_status = this.event_status;
      obj.event__r = {
        id: this.event.id,
        name: this.event.name
      }
      let i = 0;
      for (i; i < this.newListData.length; i++) {
        if (this.newListData[i].data.id == data.id) {
          this.newListData.splice(i, 1);
        }
      }
      this.listData.splice(this.listData.indexOf(data), 1);
      this.applyData.push(obj);
      this.total--;
      this.events.publish('menu:activeListData', ['add', obj]);
    }
  }

  getOptionsLabel(apiName, value) {
    let label = "";
    this.describe.fields.forEach(field => {
      if (field.api_name === apiName) {
        let options = field.options;
        options.forEach(option => {
          if (option.value === value) {
            label = option.label;
          }
        })
      }
    })

    return label;
  }

  deleteEvent(item) {
    let flag = false;
    this.initItems.forEach(initItem => {
      if (initItem.customer == item.customer) {
        flag = true;
        this.initItems.splice(this.initItems.indexOf(initItem), 1);
      }
    })
    this.applyData.forEach(appItem => {
      if (appItem.customer == item.customer) {
        this.applyData.splice(this.applyData.indexOf(appItem), 1);
        this.newListData = listHelper.insertPadLayoutData(this.newDataList, this.padLayout, this.describe);
        this.applyData.forEach(element => {
          let i = 0;
          for (i; i < this.newListData.length; i++) {
            if (this.newListData[i].data.id == element.customer) {
              this.newListData.splice(i, 1);
            }
          }
        })
        if (item.record_type == 'attendee') {
          this.total++;
        }
      }
    })
  }

  // 下拉刷新
  doRefresh(refresher) {
    this.pageNo = 1;
    this.newListData = [];
    this.searchBody.pageNo = this.pageNo;
    this.searchItem.pageNo = this.pageNo;
    if (this.searchItem.criterias.length <= 1) {
      this.mService.getSearchData(this.searchBody).then((res: any) => {
        if (res.body.result) {
          this.listData = res.body.result;
          this.newDataList = res.body.result;
          this.total = res.body.resultCount;
          if (this.padLayout) {
            this.newListData = listHelper.insertPadLayoutData(this.newDataList, this.padLayout, this.describe);
          } else {
            this.newListData = listHelper.insertData(this.newDataList, this.newListItem);
          }
          //this.renderDom(this.layout, this.describe, res.body);
          this.total = this.total - this.applyData.length;
          this.applyData.forEach(item => {
            let i = 0;
            for (i; i < this.newListData.length; i++) {
              if (this.newListData[i].data.id == item.customer) {
                this.newListData.splice(i, 1);
              }
            }
          })
        }
        refresher.complete();
      })
    } else {
      this.mService.getSearchData(this.searchItem).then((res: any) => {
        if (res.body.result) {
          this.listData = res.body.result;
          this.newDataList = res.body.result;
          this.total = res.body.resultCount;
          if (this.padLayout) {
            this.newListData = listHelper.insertPadLayoutData(this.newDataList, this.padLayout, this.describe);
          } else {
            this.newListData = listHelper.insertData(this.newDataList, this.newListItem);
          }
          //this.renderDom(this.layout, this.describe, res.body);this.total = this.total - this.applyData.length;
          this.applyData.forEach(item => {
            let i = 0;
            for (i; i < this.newListData.length; i++) {
              if (this.newListData[i].data.id == item.customer) {
                this.newListData.splice(i, 1);
                this.total--;
              }
            }
          })
        }
        refresher.complete();
      })
    }
  }

  combineAddList(addList) {
    addList.forEach(item => {
      this.newListData.push(item);
    })
  }

  // 上拉加载
  doInfinite(infiniteScroll) {
    this.pageNo += 1;
    this.searchBody.pageNo = this.pageNo;
    this.searchItem.pageNo = this.pageNo;
    if (this.pageNo >= this.pageCount) {
      infiniteScroll.enable(false);
    } else {
      if (this.searchItem.criterias.length <= 1) {
        this.mService.getSearchData(this.searchBody).then((res: any) => {
          if (res.body.result) {
            this.listData = this.listData.concat(res.body.result);
            if (this.padLayout) {
              let addList = listHelper.insertPadLayoutData(res.body.result, this.padLayout, this.describe);
              this.combineAddList(addList);
            } else {
              let addList = listHelper.insertData(res.body.result, this.newListItem);
              this.combineAddList(addList);
            }
          }
          infiniteScroll.complete();
        })
      } else {
        this.mService.getSearchData(this.searchItem).then((res: any) => {
          if (res.body.result) {
            this.listData = this.listData.concat(res.body.result);
            if (this.padLayout) {
              let addList = listHelper.insertPadLayoutData(res.body.result, this.padLayout, this.describe);
              this.combineAddList(addList);
            } else {
              let addList = listHelper.insertData(res.body.result, this.newListItem);
              this.combineAddList(addList);
            }
          }
          infiniteScroll.complete();
        })
      }
    }
  }

  ionViewDidLeave() {
    this.events.publish('menu:activeList', false);
  }
}
