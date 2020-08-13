import { Component, ViewChild } from '@angular/core';
import { NavParams, ViewController, Events, NavController, Navbar, ItemSliding, PopoverController, AlertController } from 'ionic-angular';
import _ from 'lodash';
import moment from 'moment';
import { NetworkService, MainService, ListService, LoginService, TranslateService } from '../../providers/index';
import { AddPage, DetailPage, EditPage, ParticipantsPage, Segmentation, DropDownPage } from '../index';
import { UserInfo, config } from '../../utils/index';
import { evalStr } from '../../utils/index';

@Component({
  selector: 'related-list',
  templateUrl: 'related-list.html'
})

export class RelatedList {
  @ViewChild(Navbar) navBar: Navbar;
  constructor(
    private popoverCtrl: PopoverController,
    public navParams: NavParams,
    public mainService: MainService,
    public viewCtrl: ViewController,
    public nav: NavController,
    public events: Events,
    public listService: ListService,
    public userInfo: UserInfo,
    public alertCtrl: AlertController,
    public network: NetworkService,
    public loginService: LoginService,
    public translateService: TranslateService
  ) {
    //this.layout = this.navParams.data.data[0];
  }

  layout = this.navParams.data.data[0];
  describe: any;
  metadata: any;
  listData = [];
  apiName: any;
  header: any;
  actions = [];
  layoutItems = [];
  relatedItems = [];
  pageNo: any;
  pageCount: any;
  pageSize: any;
  searchItem: any;
  oldSelector: any[];
  searchValue = '';

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
  parentData: any;
  pageType = 'relate';
  placeHolder = '';
  searchField: any;
  showFilter = false;
  searchBoxValue = "";

  ionViewDidEnter() {
    this.refreshView();
    this.listenRelatedPush();
  }

  listenRelatedPush() {
    this.events.subscribe('related:relatepush', (page: any, params: any, pageType: any) => {
      this.events.unsubscribe('related:relatepush');
      this.nav.setRoot(page, params);
    });
    this.events.publish('menu:pageRealType', 'relate');
  }

  init() {
    this.listData = [];
    this.apiName = undefined;
    this.header = undefined;
    this.actions = [];
    this.layoutItems = [];
    this.relatedItems = [];

    this.isPadLayout = false;
    this.padLayout = undefined;
    this.newLayout = undefined;
    this.newDescribe = undefined;
    this.newData = undefined;
    this.newListData = [];
    this.newApiName = undefined;
    this.newListItem = undefined;
    this.newDataList = [];
    this.total = undefined;
    this.pageType = 'relate';
  }

  refreshView() {
    this.init();
    this.viewInit();
  }

  backToUp() {
    if (this.nav.indexOf(this.nav.last()) === 1) {
      this.nav.pop();
    } else {
      this.events.publish('menu:back');
    }
    //返回的时候去掉多余的订阅
    this.events.unsubscribe('related:push');
    this.events.unsubscribe('related:relatepush');
  }

  viewInit() {
    this.showFilter = this.layout.show_filter;
    this.parentData = this.navParams.data.data[2];
    this.pageSize = 20;
    this.pageNo = 1;
    this.apiName = this.layout.ref_obj_describe;
    const relatedName = this.layout.related_list_name;
    let value = "";
    let field = "";
    if (this.layout.target_value_field !== undefined) {
      value = _.get(this.navParams.data.data[2], this.layout.target_value_field);
      this.navParams.data.data[1].fields.forEach(fd => {
        if (relatedName === fd.related_list_api_name) {
          field = fd.api_name;
        }
      })
    } else {
      value = this.navParams.data.data[2].id;
      field = this.navParams.data.data[2].object_describe_name;
    }
    this.header = this.navParams.data.title;
    if (this.layout['header.i18n_key'] && this.translateService.translateFunc(this.layout['header.i18n_key']) !== this.layout['header.i18n_key']) {
      this.header = this.translateService.translateFunc(this.layout['header.i18n_key']);
    }
    let queryField = { "field": "", "operator": "==", "value": [] };
    if(field){
      queryField.field = field;
      queryField.value.push(value);
    }
    let criterias = [];
    if (this.layout.default_filter_criterias) {
      let cris = this.layout.default_filter_criterias['criterias'];
      cris.forEach(cri => {
        if (cri.value['expression']) {
          let value = evalStr(cri.value['expression']);
          if (typeof value === 'string') {
            criterias.push({ field: cri.field, operator: cri.operator, value: [value] });
          } else {
            criterias.push({ field: cri.field, operator: cri.operator, value: value });
          }
        } else {
          if (cri.value[0]) {
            criterias.push({ field: cri.field, operator: cri.operator, value: cri.value });
            if (cri.value[0] !== '$$AreaCustomerIds$$') {
            }
          } else {
            criterias.push({ field: cri.field, operator: cri.operator, value: cri.value });

          }
        }
      })
    }
    if(queryField.field){
      criterias.push(queryField);
    }
    if (this.layout.record_type) {
      let value = [this.layout.record_type];
      if (typeof this.layout.record_type === 'object') {
        value = this.layout.record_type;
      }
      criterias.push({ "field": "record_type", "operator": "in", "value": value });
    }

    let body = {
      pageSize: this.apiName == 'event_attendee' ? 100 : 10,
      pageNo: 1,
      "joiner": "and",
      "criterias": criterias,
      "orderBy": this.layout.default_sort_by ? this.layout.default_sort_by : 'update_time',
      "order": this.layout.default_sort_order ? this.layout.default_sort_order : "asc",
      "objectApiName": this.apiName
    };
    this.searchItem = body;
    this.oldSelector = _.cloneDeep(this.searchItem.criterias);
    Promise.all([this.mainService.getSearchData(body), this.mainService.getDescribeByApiName(this.apiName)]).then((res: any) => {
      if (res[0].head.code === 200 && res[1].head.code === 200) {
        let data = res[0].body;
        this.pageCount = res[0].body.resultCount;
        this.total = res[0].body.resultCount;
        if (this.navParams.data.count !== undefined && this.apiName == "event_attendee") {
          if (this.total !== this.navParams.data.count) {
            this.navParams.data.count = this.total;
          }
        }
        let describe = res[1].body;
        this.describe = describe;
        this.metadata = data;
        //参会联系人相关列表不显示搜索
        if (this.showFilter && this.apiName !== 'event_attendee') {
          if (this.layout.filter_fields) {
            this.searchField = this.layout.filter_fields[0];
            this.placeHolder = this.getLabelofField(this.searchField, describe, this.layout);
          } else {
            this.showFilter = false;
          }

        }
        //处理一下newDataList
        this.newDataList = data.result;
        if (describe !== undefined) {
          this.layoutHandler(this.layout, describe);
          this.renderDom(this.layout, describe, data);
        }
      } else {
        let alert = this.alertCtrl.create({
          title: this.translateService.translateFunc('pad.relate_getdata_failed'),
          buttons: [
            {
              text: this.translateService.translateFunc('pad.action_ok'),
              handler: data => {
              }
            }
          ]
        })
        alert.present();
      }
    })
  }

  translateItemInternational(item) {
    let key = 'field.dcr.' + item.key;
    let label = item.label;
    let value = item.value;
    if (this.translateService.translateFunc(key) && this.translateService.translateFunc(key) !== key) {
      label = this.translateService.translateFunc(key);
    }
    if (item.desc['options'] !== undefined) {
      item.desc['options'].forEach(option => {
        if (option.label == item.value) {
          let optionKey = 'options.' + this.apiName + '.' + item.key + '.' + option.value;
          if (this.translateService.translateFunc(optionKey) && this.translateService.translateFunc(optionKey) !== optionKey) {
            value = this.translateService.translateFunc(optionKey);
          }
        }
      })
    }
    //let valueKey = 'options.'
    return label + ":" + value;
  }

  searchList() {
    this.newListData = [];
    this.listData = [];
    this.searchItem.criterias = [];
    this.searchItem.criterias = _.cloneDeep(this.oldSelector);
    this.pageNo = 1;
    this.searchItem.pageNo = this.pageNo;
    if (this.searchBoxValue !== '') {
      if (this.searchField.indexOf('create_by') > -1) {
        this.searchItem.criterias.push({
          field: 'create_by__r.name',
          operator: 'contains',
          value: [this.searchBoxValue]
        });
      } else if (this.searchField.indexOf('owner') > -1) {
        this.searchItem.criterias.push({
          field: 'owner__r.name',
          operator: 'contains',
          value: [this.searchBoxValue]
        });
      } else if (this.searchField.indexOf('update_by') > -1) {
        this.searchItem.criterias.push({
          field: 'update_by__r.name',
          operator: 'contains',
          value: [this.searchBoxValue]
        });
      } else {
        this.searchItem.criterias.push({ field: this.searchField, operator: 'contains', value: [this.searchBoxValue] });
      }
    }
    this.mainService.getSearchData(this.searchItem).then((res: any) => {
      if (res.body.result) {
        this.total = res.body.resultCount;
        if (this.apiName == 'event_attendee') {
          this.navParams.data.count = this.total;
        }
        if (res.body.result.length > 0) {
          this.listData = res.body.result;
          this.newDataList = res.body.result;
          if (this.padLayout) {
            this.insertPadLayoutData(this.newDataList, this.padLayout);
          } else {
            this.insertData(this.newDataList, this.newListItem);
          }
        }
      }
    })
  }

  layoutHandler(layout, describe) {
    let leftOptions, rightOptions;
    if (layout.row_actions) {
      if (layout.row_actions.length > 0) {
        leftOptions = this.getOptions(layout.row_actions, 'SWIPE_LEFT');
        rightOptions = this.getOptions(layout.row_actions, 'SWIPE_RIGHT');
      }
    }
    if (layout.padlayout) {
      this.isPadLayout = true;
      let padlayout = {
        avatar: {
          exist: false,
          data: '',
          layout: ''
        },
        title: {
          exist: false,
          data: '',
          layout: ''
        },
        subTitle: {
          exist: false,
          data: '',
          layout: ''
        },
        contents: [],
        labels: []
      };
      if (layout.padlayout.avatar) {
        padlayout.avatar.exist = true;
        padlayout.avatar.data = 'assets/img/avatar.png';
        padlayout.avatar.layout = layout.padlayout.avatar;
      }
      if (layout.padlayout.title) {
        padlayout.title.exist = true;
        padlayout.title.layout = layout.padlayout.title;
      }
      if (layout.padlayout.sub_title) {
        padlayout.subTitle.exist = true;
        padlayout.subTitle.layout = layout.padlayout.sub_title;
      }
      if (layout.padlayout.contents) {
        for (let cont of layout.padlayout.contents) {
          let contentItem = {
            type: cont.type,
            data: '',
            layout: cont
          }
          padlayout.contents.push(contentItem);
        }
      }
      if (layout.padlayout.labels) {
        for (let label of layout.padlayout.labels) {
          let labelItem = {
            type: label.type,
            data: '',
            color: label.color,
            layout: label,
            fields: layout.fields
          }
          padlayout.labels.push(labelItem);
        }
      }
      this.padLayout = {
        padlayout: padlayout,
        rightOptions: rightOptions,
        leftOptions: leftOptions,
        data: '',
        isPadLayout: true
      };
      this.insertPadLayoutData(this.newDataList, this.padLayout);

    } else {
      //this.isPadLayout = true;
      let theListItem = [];
      layout.fields.forEach(field => {
        describe.fields.forEach(desc => {
          if (field.field === desc.api_name) {
            theListItem.push({
              label: desc.label,
              key: field.field,
              value: '',
              field: field,
              desc: desc,
            })
          }
        })
      })
      this.newListItem = {
        layout: theListItem,
        rightOptions: rightOptions,
        leftOptions: leftOptions,
        isPadLayout: false,
        data: ''
      };
      this.insertData(this.newDataList, this.newListItem);
    }
  }

  insertPadLayoutData(dataList, items) {
    dataList.forEach(data => {
      this.dataToPadLayoutItem(data, items);
    })
  }

  insertData(dataList, items) {
    dataList.forEach(data => {
      this.dataToListItem(data, items);
    })
  }

  dataToPadLayoutItem(data, items) {
    let listItem = {
      padlayout: _.cloneDeep(items.padlayout),
      rightOptions: _.cloneDeep(items.rightOptions),
      leftOptions: _.cloneDeep(items.leftOptions),
      isPadLayout: _.cloneDeep(items.isPadLayout),
      data: _.cloneDeep(items.data)
    }
    let listItems = {
      padlayout: listItem.padlayout,
      rightOptions: undefined,
      leftOptions: undefined,
      isPadLayout: true,
      data: ''
    };
    const padlayout = listItem.padlayout;
    if (listItem.padlayout) {
      if (padlayout.avatar) {
        if (data[padlayout.avatar.layout.value]) {
          padlayout.avatar.data = data[padlayout.avatar.layout.value];
        }
      }
      if (padlayout.title) {
        padlayout.title.data = this.handlerPadLayoutData(data[padlayout.title.layout.value], padlayout.title, data);
      }
      if (padlayout.subTitle) {
        padlayout.subTitle.data = this.handlerPadLayoutData(data[padlayout.subTitle.layout.value], padlayout.subTitle, data);
      }
      if (padlayout.contents) {
        if (padlayout.contents.length > 0) {
          padlayout.contents.forEach(content => {
            content.data = this.handlerPadLayoutData(data[content.layout.value], content, data);
          })
        }
      }
      if (padlayout.labels) {
        if (padlayout.labels.length > 0) {
          padlayout.labels.forEach(label => {
            label.data = this.handlerPadLayoutData(data[label.layout.value], label, data);
            let fields = this.layout.fields;
            if (fields) {
              fields.forEach(field => {
                if (field.field == label.layout.value) {
                  let value = data[label.layout.value];
                  if (field.tag_color) {
                    label.color = field.tag_color[value] ? field.tag_color[value] : label.layout.color;
                  }
                }
              })
            } else {
              label.color = label.layout.color;
            }
          })
        }
      }
    }
    listItems.data = data;
    listItems.leftOptions = this.rowActionsHandler(listItem, data, 'right');
    listItems.rightOptions = this.rowActionsHandler(listItem, data, 'left');

    this.newListData.push(listItems);
  }

  dataToListItem(data, items) {
    let listItem = {
      layout: _.cloneDeep(items.layout),
      rightOptions: _.cloneDeep(items.rightOptions),
      leftOptions: _.cloneDeep(items.leftOptions),
      isPadLayout: _.cloneDeep(items.isPadLayout),
      data: _.cloneDeep(items.data)
    };
    let listItems = {
      layout: listItem.layout,
      rightOptions: undefined,
      leftOptions: undefined,
      isPadLayout: false,
      data: ''
    };
    listItem.layout.forEach(item => {
      if (item.desc.options) {
        item.value = '';
        if (data[item.key]) {
          item.desc.options.forEach(option => {
            if (option.value === data[item.key]) {
              item.value = option.label;
            }
          })
        }
      } else if (item.desc.type === 'boolean') {
        if (data[item.key]) {
          item.value = this.translateService.translateFunc('pad.action_yes');
        } else {
          item.value = this.translateService.translateFunc('pad.action_no');
        }
      } else if (data[item.key + '__r']) {
        item.value = data[item.key + '__r'].name;
      } else if (item.key.indexOf('time') > -1 || item.key.indexOf('date') > -1) {
        if (data[item.key] !== undefined) {
          item.value = moment(data[item.key]).format(item.field.date_time_format);
        } else {
          item.value = '';
        }
      } else {
        item.value = data[item.key];
      }
    })
    listItems.data = data;
    listItems.leftOptions = this.rowActionsHandler(listItem, data, 'right');
    listItems.rightOptions = this.rowActionsHandler(listItem, data, 'left');
    //let listItems = _.cloneDeep(listItem);
    this.newListData.push(listItems);
  }

  rowActionsHandler(listItem, data, direction) {
    const opts = [];
    if (direction === 'right' && listItem.rightOptions) {
      listItem.rightOptions.forEach(option => {
        let action = this.actionHandler(option, data);
        if (action) {
          opts.push(action);
        }
      })
    } else if (direction === 'left' && listItem.leftOptions) {
      listItem.leftOptions.forEach(option => {
        let action = this.actionHandler(option, data);
        if (action) {
          opts.push(action);
        }
      })
    }
    return opts;
  }

  actionHandler(option, data) {
    let showflag = false;
    let disbaleFlag = false;
    let showExpFlag = true;
    if (option.show_when) {
      option.show_when.forEach(show => {
        if (show === 'index') {
          showflag = true;
        }
      })
    } else {
      showflag = true;
    }
    if (option.disabled_expression) {
      disbaleFlag = this.callMultiAnotherFunc(new Function("p", "t", option.disabled_expression), this.parentData, data);
    }
    if (option.show_expression) {
      showExpFlag = this.callMultiAnotherFunc(new Function("p", "t", option.show_expression), this.parentData, data);
    }
    if (showExpFlag && !disbaleFlag && showflag) {
      return option;
    } else {
      return undefined;
    }
  }

  handlerPadLayoutData(data, padItem, datas) {
    switch (padItem.layout.type) {
      case 'icon':
        return '';
      case 'expression':
        return padItem.layout.value.replace(/\{(.+?)\}/g, (match, re) => {
          let value = '';
          this.describe.fields.forEach(desc => {
            if (desc.api_name === re) {
              value = this.getListValue(datas, desc);
            }
          })
          return value;
        });
      default:
        this.describe.fields.forEach(desc => {
          if (desc.api_name === padItem.layout.value) {
            data = this.getListValue(datas, desc);
          }
        })
        return data;
    }
  }

  getLabelofField(field, describe, layout) {
    let label = '';
    layout.fields.forEach(fld => {
      if (fld.field === field) {
        if (fld.label) {
          label = fld.label;
          if (field['field.i18n_key'] && this.translateService.translateFunc(field['field.i18n_key']) !== field['field.i18n_key']) {
            label = this.translateService.translateFunc(field['field.i18n_key']);
          }
          const trans = 'field.' + this.apiName + '.' + fld.field;
          if (this.translateService.translateFunc(trans) && this.translateService.translateFunc(trans) !== trans) {
            label = this.translateService.translateFunc(trans);
          }
        }
      }
    });
    if (label === '' || label === undefined) {
      describe.fields.forEach(desc => {
        if (desc.api_name === field) {
          label = desc.label;
          const trans = 'field.' + this.apiName + '.' + field;
          if (this.translateService.translateFunc(trans) && this.translateService.translateFunc(trans) !== trans) {
            label = this.translateService.translateFunc(trans);
          }
        }
      })
    }
    return this.translateService.translateFunc('pad.partici_search_text') + label;
  }

  getListValue(data, des) {
    if (data && des) {
      const index = des.api_name;
      if (data[index]) {
        if (des.options) {
          let label = '';
          for (let x in des.options) {
            if (des.options[x].value === data[index]) {
              label = des.options[x].label;
              const trans = 'options.' + this.apiName + '.' + des.api_name + '.' + des.options[x].value;
              if (this.translateService.translateFunc(trans) && this.translateService.translateFunc(trans) !== trans) {
                label = this.translateService.translateFunc(trans);
              }
            }
          }
          if (!label) {
            label = data[index];
          }
          return label;
        } else if (des.type === 'boolean') {
          if (data[index] === 'true') {
            return this.translateService.translateFunc('pad.action_yes');
          } else {
            return this.translateService.translateFunc('pad.action_no');
          }
        } else if (data[index + '__r']) {
          return data[index + '__r'].name;
        } else if (index.indexOf('time') > -1 || index.indexOf('_date') > -1) {
          let date_format = des.date_format;
          this.layout.fields.forEach(field => {
            if (des.api_name == field.field) {
              if (field.date_time_format) {
                date_format = field.date_time_format;
              }
            }
          })
          return moment(data[index]).format(date_format);
        } else {
          return data[index];
        }
      } else {
        return '';
      }
    }
  }

  getOptions(rowActions, actionCode) {
    let ops = [];
    let actions = _.cloneDeep(rowActions);
    actions.forEach(action => {
      if(!action['action.i18n_key']){
        let key = 'action.' + action.action.toLowerCase();
        action.label = this.translateService.translateFunc(key);
      }
      if (action['action.i18n_key'] && this.translateService.translateFunc(action['action.i18n_key']) !== action['action.i18n_key']) {
        action.label = this.translateService.translateFunc(action['action.i18n_key']);
      }
      if (action.mobile_show === actionCode) {
        if(!action['action.i18n_key']){
          let key = 'action.' + action.action.toLowerCase();
          action.label = this.translateService.translateFunc(key);
        }
        const trans = action['action.i18n_key'];
        if (trans && this.translateService.translateFunc(trans) !== trans) {
          action.label = this.translateService.translateFunc(trans);
        }
        ops.push(action);
      }
    })
    return ops;
  }

  callAnotherFunc(fnFunction: Function, vArgument) {
    if (_.isFunction(fnFunction)) {
      return (<Function>fnFunction)(vArgument);
    } else {
      return true;
    }
  }

  callMultiAnotherFunc(fnFunction, vArgument, pArgument) {
    if (_.isFunction(fnFunction)) {
      return (<Function>fnFunction)(vArgument, pArgument);
    } else {
      return true;
    }
  }


  getRelateValue(data, layoutItem) {
    let x = _.get(data, layoutItem.field.field);
    let y = _.get(data, layoutItem.field.field + '__r');
    if (y) {
      x = y.name;
    }

    if (layoutItem.field.render_type == "date_time" && x !== undefined) {
      x = moment(x).format(layoutItem.field.date_time_format);
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

  gotoDetail(listItem) {
    if (this.layout.row_actions) {
      this.layout.row_actions.forEach(action => {
        if(!action['action.i18n_key']){
          let key = 'action.' + action.action.toLowerCase();
          action.label = this.translateService.translateFunc(key);
        }
        if (action['action.i18n_key'] && this.translateService.translateFunc(action['action.i18n_key']) !== action['action.i18n_key']) {
          action.label = this.translateService.translateFunc(action['action.i18n_key']);
        }
        if (action.action.toLowerCase() === 'detail') {
          if (action.show_expression) {
            let flag = this.callAnotherFunc(new Function('t', action.show_expression), listItem.data);
            if (flag) {
              this.events.publish('menu:third');
              this.nav.push(DetailPage, [listItem.data, '', 'subDetail']);
            }
          } else {
            this.events.publish('menu:third');
            this.nav.push(DetailPage, [listItem.data, '', 'subDetail']);
          }

        } else if (action.action.toLowerCase() === 'parentdetail') {
          const detailId = listItem.data[action.target_value_field];
          //const detailRecordType = action.target_layout_record_type;
          const detailApiName = action.ref_obj_describe;
          this.mainService.getDataByApiNameAndId(detailApiName, detailId).then((res: any) => {
            if (res.body) {
              this.events.publish('menu:third');
              this.nav.push(DetailPage, [res.body, '', 'subDetail']);
            }
          })

        }
      })
    } else {
      this.events.publish('menu:third');
      this.nav.push(DetailPage, [listItem.data, '', 'subDetail']);
    }
  }

  openWindowWithActions(action, item) {
    console.log(action,'========action===')
    let recordType = item.data.record_type;
    let apiName = item.data.object_describe_name;
    switch (action.action.toLowerCase()) {
      case 'add':
        break;
      case 'edit':
        if (action.target_layout_record_type) {
          recordType = action.target_layout_record_type;
        }
        this.nav.push(EditPage, [apiName, action, item.data, recordType]);
        break;
      case 'delete':
        this.deleteThisData(action, item);
        break;
      case 'update':
        this.updateData(action, item);
        break;
      default:
        break;
    }
  }

  updateData(action, item) {
    if (action.need_confirm) {
      if (action['confirm_message.i18n_key'] && this.translateService.translateFunc(action['confirm_message.i18n_key']) !== action['confirm_message.i18n_key']) {
        action.confirm_message = this.translateService.translateFunc(action['confirm_message.i18n_key']);
      }
      let alert = this.alertCtrl.create({
        title: this.translateService.translateFunc('pad.alert_remind_title'),
        subTitle: action.confirm_message,
        buttons: [
          {
            text: this.translateService.translateFunc('pad.action_cancel'),
            handler: dt => {

            }
          },
          {
            text: this.translateService.translateFunc('pad.action_ok'),
            handler: dt => {
              this.updateHandler(action, item);
            }
          }
        ]
      })
      alert.present();
    } else {
      let valid_flag = true;
      if (action.valid_expression) {
        let msg;
        valid_flag = this.callAnotherFunc(new Function('t', action.valid_expression), item.data);
        if (valid_flag !== true) {
          msg = valid_flag;
          if (window[config.default_language][msg]) {
            msg = window[config.default_language][msg];
          }
        }
        if (valid_flag !== true) {
          let alert = this.alertCtrl.create({
            title: this.translateService.translateFunc('pad.alert_remind_title'),
            subTitle: msg,
            buttons: [
              {
                text: this.translateService.translateFunc('pad.action_ok'),
                handler: dt => {

                }
              }
            ]
          })
          alert.present();
        } else {
          this.updateHandler(action, item);
        }
      }
    }
  }

  updateHandler(action, item) {
    if (action.default_field_val) {
      if (action.default_field_val.length > 0) {
        let data = item.data;
        action.default_field_val.forEach(field => {
          if (item.field_type === 'js') {
            let value = this.callAnotherFunc(new Function('t', field.val), {});
            data[field.field] = value;
          } else {
            data[field.field] = item.val;
          }
        })
        this.mainService.putDataByApiNameAndId(data.object_describe_name, data, data.id).then((res: any) => {
          if (res.body.id !== undefined) {
            this.newListData.forEach(listItem => {
              if (listItem.data.id == res.body.id) {
                this.newListItem.data = res.body;
              }
            })
          }
        })
        //this.updateListitem(data, item);
      }
    }
  }

  deleteThisData(action, item) {
    const data = item.data;
    const api_name = data.object_describe_name;
    this.mainService.deleteDataByApiNameAndId(api_name, data.id).then((res: any) => {
      if (res.head.code === 200) {
        this.newListData.forEach(listItem => {
          if (listItem.data.id === data.id) {
            this.newListData.splice(this.newListData.indexOf(listItem), 1);
            this.total--;
            if (this.apiName == 'event_attendee') {
              this.navParams.data.count = this.total;
            }
          }
        })
      }
    })
  }

  renderDom(layout, describe, data) {
    this.listData = data.result;
    this.getActions(layout.actions, this.parentData, data);
    if (layout !== undefined && layout.fields !== undefined) {
      layout.fields.forEach(field => {
        describe.fields.forEach(des => {
          if (field.field === des.api_name) {
            this.layoutItems.push({ 'field': field, 'des': des });
          }
        });
      });
    }
    this.handlerListData(this.listData, this.layoutItems);
  }

  getActions(actions, pdata, dataItems) {
    if (actions !== undefined) {
      actions.forEach(action => {
        if(!action['action.i18n_key']){
          let key = 'action.' + action.action.toLowerCase();
          if(action.label){
            action.label = this.translateService.translateFunc(key) === key ? action.label : this.translateService.translateFunc(key) === key;
          }else{
            action.label = this.translateService.translateFunc(key);
          }
        }
        const trans = action['action.i18n_key'];
        if (trans && this.translateService.translateFunc(trans) !== trans) {
          if(action.label){
            action.label = this.translateService.translateFunc(trans) === trans ? action.label : this.translateService.translateFunc(trans);
          }else{
            action.label = this.translateService.translateFunc(trans);
          }
        }
        if (action.hidden_expression) {
          const fatherFlag = this.callAnotherFunc(new Function("p", action.hidden_expression), pdata);
          if (!fatherFlag) {
            this.updateActionWithExpression(action, pdata, dataItems);
          }
        } else {
          this.updateActionWithExpression(action, pdata, dataItems);
        }
      })
    }
  }

  updateActionWithExpression(action, pdata, dataItems) {
    if (action.pro_expression) {
      const expObj = action.pro_expression;
      const getApiName = expObj.pro_obj_api_name;
      const filters = expObj.pro_filter_criterias;
      const criterias = [];
      filters.forEach(filter => {
        if (filter.field_type) {
          if (filter.field_type === 'js') {
            const value = this.callAnotherFunc(new Function('p', filter.value), pdata);
            criterias.push({ field: filter.field, operator: filter.operator, value: [value] });
          }
        } else {
          criterias.push({ field: filter.field, operator: filter.operator, value: filter.value });
        }
      })

      let body = {
        objectApiName: getApiName,
        joiner: "and",
        criterias: criterias
      }

      this.mainService.getSearchData(body).then((res: any) => {
        const list = res.body.result;
        const expression_type = expObj.pro_expression_render.expression_type;
        //const exp_val = this.callAnotherFunc(new Function('list', 'p', expObj.pro_expression_render.expression), list);
        const exp_val = this.callMultiAnotherFunc(new Function("list", "p", expObj.pro_expression_render.expression), list, this.parentData);
        if (expression_type === 'alert' && exp_val !== true) {
          action.expression_type = 'alert';
          action.pro_title = exp_val;
          this.actions.push(action);
        } else if (expression_type === 'hidden') {
          if (!exp_val) {
            this.actions.push(action);
          }
        } else if (expression_type === 'disabled') {
          if (exp_val) {
            action.expression_type = "disabled";
            action.disabled = true;
            action.pro_title = exp_val;
            this.actions.push(action);
          }
        } else {
          this.actions.push(action);
        }
      })
    } else {
      this.actions.push(action);
    }
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

  closeSlide(slidingItem: ItemSliding) {
    slidingItem.close();
  }

  pageAction(action) {
    if (action.expression_type) {
      if (action.expression_type === 'alert' || action.expression_type == 'disabled') {
        if (window[config.default_language][action.pro_title]) {
          action.pro_title = window[config.default_language][action.pro_title];
        }
        let alert = this.alertCtrl.create({
          title: this.translateService.translateFunc('pad.alert_remind_title'),
          subTitle: action.pro_title,
          buttons: [
            {
              text: this.translateService.translateFunc('pad.action_ok'),
              handler: data => {
              }
            }
          ]
        })
        alert.present();
      }
    } else {
      const recordType = action.target_layout_record_type;
      if (action.target_layout_record_type === 'attendee') {
        //参会人定制页面
        this.nav.push(ParticipantsPage, [action, this.apiName, this.navParams.data.data, this.searchItem]);
      } else if (action.action.toLowerCase() === 'relatedadd') {
        this.events.publish('menu:third');
        let refApiName = action.ref_obj_describe;
        let refRecordType = action.target_layout_record_type;
        let next_action = action.next_action;
        if (this.apiName === "segmentation_history" && next_action == 'segmentation_survey') {
          if (!this.network.onlineStatus) {
            let alert = this.alertCtrl.create({
              title: this.translateService.translateFunc('pad.alert_confirm_title'),
              subTitle: this.translateService.translateFunc('pad.alert_remind_offline_segmentation'),
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
            let segmentation_history = window['SEGMENTATION_AUTHORITY'];
            let segmentation_prod_level = window['SEGMENTATION_PRODUCT_LEVEL'];
            this.loginService.getCRMPowerSetting(this.userInfo.profile['id'], this.userInfo.token).then((res: any) => {
              if (res.head.code === 200) {
                let newSegementation_history = res.body.result[0].segmentation_authority;
                let newSegmentation_prod_level = res.body.result[0].segmentation_product_level;
                if (segmentation_history == newSegementation_history && segmentation_prod_level == newSegmentation_prod_level) {
                  this.nav.push(Segmentation, [action, this.apiName, recordType, this.navParams.data.data]);
                } else {
                  let alert = this.alertCtrl.create({
                    title: this.translateService.translateFunc('pad.alert_remind_title'),
                    subTitle: this.translateService.translateFunc('pad.alert_subtitle_change_window'),
                    buttons: [
                      {
                        text: this.translateService.translateFunc('pad.action_ok'),
                        handler: data => {
                          window['SEGMENTATION_AUTHORITY'] = newSegementation_history;
                          window['SEGMENTATION_PRODUCT_LEVEL'] = newSegmentation_prod_level;
                        }
                      }
                    ]
                  })
                  alert.present();
                }
              }
            })
          }
        } else {
          this.nav.push(AddPage, [refApiName, 'relate', refRecordType, '', this.navParams.data.data]);
        }
      } else {
        let next_action = action.next_action;
        if (this.apiName === "segmentation_history" && next_action == 'segmentation_survey') {
          if (!this.network.onlineStatus) {
            let alert = this.alertCtrl.create({
              title: this.translateService.translateFunc('pad.alert_confirm_title'),
              subTitle: this.translateService.translateFunc('pad.alert_remind_offline_segmentation'),
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
            let segmentation_history = window['SEGMENTATION_AUTHORITY'];
            let segmentation_prod_level = window['SEGMENTATION_PRODUCT_LEVEL'];
            this.loginService.getCRMPowerSetting(this.userInfo.profile['id'], this.userInfo.token).then((res: any) => {
              if (res.head.code === 200) {
                let newSegementation_history = res.body.result[0].segmentation_authority;
                let newSegmentation_prod_level = res.body.result[0].segmentation_product_level;
                if (segmentation_history == newSegementation_history && segmentation_prod_level == newSegmentation_prod_level) {
                  this.nav.push(Segmentation, [action, this.apiName, recordType, this.navParams.data.data]);
                } else {
                  let alert = this.alertCtrl.create({
                    title: this.translateService.translateFunc('pad.alert_remind_title'),
                    subTitle: this.translateService.translateFunc('pad.alert_subtitle_change_window'),
                    buttons: [
                      {
                        text: this.translateService.translateFunc('pad.action_ok'),
                        handler: data => {
                          window['SEGMENTATION_AUTHORITY'] = newSegementation_history;
                          window['SEGMENTATION_PRODUCT_LEVEL'] = newSegmentation_prod_level;
                        }
                      }
                    ]
                  })
                  alert.present();
                }
              }
            })
          }

        } else {
          this.nav.push(AddPage, [this.apiName, '', recordType, '', this.navParams.data.data]);
        }
      }
    }
  }

  // 下拉刷新
  doRefresh(refresher) {
    this.newListData = [];
    this.listData = [];
    this.pageNo = 1;
    this.searchItem.pageNo = this.pageNo;
    this.mainService.getSearchData(this.searchItem).then((res: any) => {
      if (res.body.result) {
        this.total = res.body.resultCount;
        if (res.body.result.length > 0) {
          this.listData = res.body.result;
          this.newDataList = res.body.result;
          if (this.padLayout) {
            this.insertPadLayoutData(this.newDataList, this.padLayout);
          } else {
            this.insertData(this.newDataList, this.newListItem);
          }
        }
      }
      refresher.complete();
    })
  }

  // 上拉加载
  doInfinite(infiniteScroll) {
    this.pageNo += 1;
    this.searchItem.pageNo = this.pageNo;
    if (this.pageNo >= this.pageCount) {
      infiniteScroll.enable(false);
    } else {
      this.mainService.getSearchData(this.searchItem).then((res: any) => {
        this.total = res.body.resultCount;
        if (res.body.result) {
          if (res.body.result.length > 0) {
            //this.listData = this.listData.concat(res.body.result);
            //this.newDataList = this.newDataList.concat(res.body.result);
            if (this.padLayout) {
              this.insertPadLayoutData(res.body.result, this.padLayout);
            } else {
              this.insertData(res.body.result, this.newListItem);
            }
          }

        }
        infiniteScroll.complete();
      })
    }
  }

  presentPopover(ev) {
    let popover = this.popoverCtrl.create(DropDownPage, { actions: this.actions, pageType: 'relatedList' });
    popover.onDidDismiss(action => {
      if (action) {
        this.pageAction(action);
      }
    })
    popover.present({ ev: ev });
  }
}
