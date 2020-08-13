import { Injectable } from '@angular/core';
import { UserInfo, PermissionHelper } from '../utils/index';
import { MainService } from './main-service';
import { HttpService } from './http-service';
import moment from 'moment';
import _ from 'lodash';
import { TranslateService } from './translate-service';
import { DataService } from './index';

@Injectable()
export class ListService {
  apiName: string;
  recordType: string;
  listRecordType: string[];
  tab: any;
  layout: any;
  /**按条目列出的布局和描述信息 */
  layoutItem: any[];
  /**按条目列出并设置为key的布局和描述信息 */
  layoutKeyItem: any = {};
  /**选项信息 */
  options: any;
  describe: any;
  /**原始数据 */
  data: any[];
  /**上下拉之后的数据 */
  dataAfter: any[];
  /**请求列表数据的查询参数 */
  listParam: ListParam;
  /**请求列表界面数据的缓存 */
  filterParam: any[];
  /**最大页数 */
  pageCount: number;
  /**显示名称 */
  displayName: string;
  /**视图 */
  views = [];
  /**可供模板渲染的列表数据 */
  listData: any[];
  /**是否加载到最后一页标志位 */
  loadFlag = false;
  //**总数 */
  total: any;
  /**上拉加载标志 */
  freshFlag: any;
  /**是否有收藏 */
  isFavorite = false;

  /**是否渲染selectTree */
  isSelectTree = false;

  /**要渲染的selectTree */
  selectTree: any[];

  /**辅导下级的列表 */
  coachCompData: any[];

  /**selectTree扩展器代码 */
  selectExtender: any;

  /**是否显示下方footer操作栏 */
  footerDisplay = 'none';

  /**footer上面的action集合 */
  footerAction: any[];

  /**如果foot全选标志 */
  selectAllFlag = false;

  /**data_record_type */
  dataRtype: any;

  /**产品信息（CLM专用） */
  productList: any[] = [];

  // selectViews
  selectView: any[] = [];

  //extra cris
  extraCrites = [];
  constructor(public httpService: HttpService,
    public mainService: MainService,
    public userInfo: UserInfo,
    public permissionHelper: PermissionHelper,
    public translateService: TranslateService,
    public dataService: DataService
  ) {
    this.init();
  }
  init() {
    this.listParam = {
      pageSize: 10,
      pageNo: 1,
      joiner: 'and',
      objectApiName: 'call',
      order: 'asc',
      orderBy: '',
      criterias: []
    };
    this.loadFlag = false;
    this.isFavorite = false;
    this.apiName = undefined;
    this.recordType = undefined;
    this.listRecordType = undefined;
    this.tab = undefined;
    this.layout = undefined;
    this.layoutItem = [];
    this.layoutKeyItem = {};
    this.options = undefined;
    this.describe = undefined;
    this.data = [];
    this.filterParam = [];
    this.pageCount = 1;
    this.displayName = undefined;
    this.views = [];
    this.listData = [];
    this.total = 0;
    this.freshFlag = 0;
    this.footerDisplay = 'none';
    this.selectAllFlag = false;
    this.isSelectTree = false;
    this.selectTree = [];
    this.coachCompData = [];
    this.selectExtender = undefined;
    this.dataRtype = undefined;
    this.footerAction = [];
    this.selectView = [];
    this.extraCrites = [];
  }
  layoutParser() {
    this.layoutItem = [];
    //let header = layout.containers[0].components[0].header;
    let layoutFields = this.layout.fields;
    if (this.layout.page_size) {
      this.listParam.pageSize = this.layout.page_size;
    }
    this.options = this.layout.row_actions;
    for (let i in layoutFields) {
      if (layoutFields.hasOwnProperty(i)) {
        let field = layoutFields[i];
        for (let j in this.describe.fields) {
          if (this.describe.fields.hasOwnProperty(j)) {
            let des = this.describe.fields[j];
            if (des.api_name === field.field) {
              this.layoutItem.push({ 'field': field, 'des': des });
              this.layoutKeyItem[field.field] = { 'field': field, 'des': des };
            }
          }
        }
      }
    }
  }
  listGenerator() {
    let returnData = [];
    for (let x in this.dataAfter) {
      let y = parseInt(x);
      let listItem = this.listItemUpdate(this.dataAfter[y], y);
      returnData.push(listItem);
    }
    return returnData;
  }

  isHavePermission(action) {
    return this.permissionHelper.judgeFcObjectPrivilvege(action.action, this.apiName)
  }

  listItemUpdate(data, index, isSelect?: boolean) {
    let listStr: any;
    let isListHTML = false;
    let padlayout = this.layout ? this.layout.padlayout : undefined;
    if (padlayout !== undefined) {
      let listStructure: ListStructure = {
        avatar: {
          exist: false,
          data: ''
        },
        title: {
          exist: false,
          data: ''
        },
        subTitle: {
          exist: false,
          data: ''
        },
        contents: [],
        labels: [],
      };
      if (padlayout.avatar) {
        listStructure.avatar.exist = true;
        listStructure.avatar.data = 'assets/img/avatar.png';
      }
      if (padlayout.title) {
        listStructure.title.exist = true;
        listStructure.title.data = this.parseListValue(padlayout.title.type, data, padlayout.title.value);
        if (padlayout.title.icon) {
          let iconparam = this.parseIcon(padlayout.title.icon);
          listStructure.title.icon = iconparam.icon;
          listStructure.title.icontype = iconparam.icontype;
        }
      }
      if (padlayout.sub_title) {
        listStructure.subTitle.exist = true;
        listStructure.subTitle.data = this.parseListValue(padlayout.sub_title.type, data, padlayout.sub_title.value);
        if (padlayout.sub_title.icon) {
          let iconparam = this.parseIcon(padlayout.sub_title.icon);
          listStructure.subTitle.icon = iconparam.icon;
          listStructure.subTitle.icontype = iconparam.icontype;
        }
      }
      if (padlayout.contents) {
        for (let cont of padlayout.contents) {
          let returncont: ListStructureItem = {
            type: cont.type,
            data: '',
            exist: false,
          };
          returncont.data = this.parseListValue(cont.type, data, cont.value);
          returncont.exist = this.callAnotherFunc(new Function("t", cont.hidden_expression), data);
          if (cont.icon) {
            let iconparam = this.parseIcon(cont.icon);
            returncont.icon = iconparam.icon;
            returncont.icontype = iconparam.icontype;
          }
          if (!returncont.exist) {
            listStructure.contents.push(returncont);
          }
        }
      }
      if (padlayout.labels) {
        for (let cont of padlayout.labels) {
          let returncont: ListStructureItem = {
            type: cont.type,
            data: '',
            exist: false,
          };
          returncont.data = this.parseListValue(cont.type, data, cont.value);
          returncont.exist = this.callAnotherFunc(new Function("t", cont.hidden_expression), data);
          if (cont.color) {
            let defaultColor = cont.color;
            if (this.layoutKeyItem[cont.value].field.tag_color[data[cont.value]] !== undefined) {
              returncont.color = this.layoutKeyItem[cont.value].field.tag_color[data[cont.value]];
            } else {
              returncont.color = defaultColor;
            }
          }
          if (cont.icon) {
            let iconparam = this.parseIcon(cont.icon);
            returncont.icon = iconparam.icon;
            returncont.icontype = iconparam.icontype;
          }
          if (returncont.data && !returncont.exist) {
            listStructure.labels.push(returncont);
          }
        }
      }
      let isCollect = data.is_favorite;
      if (isCollect) {
        let returncont: ListStructureItem = {
          type: 'icon',
          data: '',
        };
        let iconparam = this.parseIcon('fa-star');
        returncont.icon = iconparam.icon;
        returncont.icontype = iconparam.icontype;
        listStructure.labels.push(returncont);
      }
      listStr = listStructure;
    } else {
      isListHTML = true;
      let listStructure = '';
      for (let lay of this.layoutItem) {
        listStructure += '<h3>' + lay.des.label + '：' + this.getListValue(data, lay.des) + '</h3></br>';
      }
      listStr = listStructure;
    }
    let leftOptions = this.getOptions(data, this.options, 'SWIPE_LEFT');
    let rightOptions = this.getOptions(data, this.options, 'SWIPE_RIGHT');
    let disabled = true;
    if (this.layout && this.layout.default_filter_criterias) {
      const crits = _.cloneDeep(this.layout.default_filter_criterias['criterias']);
      if (crits) {
        crits.forEach(ct => {
          if (ct.operator == '==') {
            ct.value.forEach(val => {
              if (data[ct.field] == val) {
                disabled = false;
              }
            })
          }
        })
      }
    }
    return {
      key: index + (this.listParam.pageNo - 1) * 10,
      type: 0,
      leftOptions: leftOptions.length ? leftOptions : undefined,
      rightOptions: rightOptions.length ? rightOptions : undefined,
      list: listStr,
      listHTML: isListHTML,
      data: data,
      select: this.selectAllFlag || isSelect,
      disabled: disabled
    };
  }

  parseListValue(type, data, res) {
    switch (type) {
      case 'icon':
        return '';
      case 'expression':
        return res.replace(/\{(.+?)\}/g, (match, re) => {
          if (this.layoutKeyItem[re]) {
            return this.getListValue(data, this.layoutKeyItem[re].des);
          } else {
            return '';
          }
        });
      default:
        if (this.layoutKeyItem[res] !== undefined && this.layoutKeyItem[res].des !== undefined) {
          return this.getListValue(data, this.layoutKeyItem[res].des);
        } else {
          return '';
        }
    }
  }
  getListValue(data, des) {
    // const padlayout = this.layout.padlayout;
    const padlayout = _.get(this.layout,'padlayout');
    if(_.isEmpty(padlayout)){
      console.warn('padlayout is empty');
      return 'padlayout is needed!';
    }
    let needLabels = [];
    if (padlayout.needLabels) {
      needLabels = padlayout.needLabels;
    }
    if (data && des) {
      const index = des.api_name;
      const field = this.layoutKeyItem[index].field;
      if (data[index] !== undefined) {
        if (des.options) {
          let label = '';
          for (let x in des.options) {
            if (des.options[x].value === data[index]) {
              label = des.options[x].label;
              const trans = 'options.' + this.apiName + '.' + des.api_name + '.' + data[index];
              if (this.translateService.translateFunc(trans) !== trans) {
                label = this.translateService.translateFunc(trans);
              }
            }
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
          let format = '';
          if (field.date_time_format) {
            format = field.date_time_format;
          } else if (des.date_format) {
            format = des.date_format;
          } else {
            format = 'YYYY-MM-DD HH:mm';
          }
          return moment(data[index]).format(format);
        } else {
          let is_needLabel = false;
          needLabels.forEach(value => {
            if (value == field.field) {
              is_needLabel = true;
            }
          })
          if (is_needLabel)
            return des.label + ': ' + data[index];
          else
            return data[index];
        }
      } else {
        return '';
      }
    }
  }
  parseIcon(name: string) {
    //let namePrefix = name.substr(0, 3);
    let nameBody = name.substr(3);
    switch (name.substr(0, 3)) {
      case ('io-'):
        return { icon: nameBody, icontype: false };
      case ('fa-'):
        return { icon: nameBody, icontype: true };
      default:
        return { icon: name, icontype: false };
    }
  }
  getOptions(data, rowActions, direction) {
    let ops = [];
    if (rowActions !== undefined) {
      let actions = JSON.parse(JSON.stringify(rowActions));

      actions.forEach(action => {
        if (!action['action.i18n_key'] && !action.label) {
          let key = 'action.' + action.action.toLowerCase();
          action.label = this.translateService.translateFunc(key);
        }
        if (action['action.i18n_key'] && this.translateService.translateFunc(action['action.i18n_key']) !== action['action.i18n_key']) {
          action.label = this.translateService.translateFunc(action['action.i18n_key']);
        }
        if (this.isHavePermission(action)) {
          if (action.mobile_show == direction) {
            if (action.show_expression) {
              try {
                const validResult = this.callAnotherFunc(new Function("t", action.show_expression), data);
                if (validResult === true) {
                  ops.push(action);
                }
              } catch (err) {
                //this.mainService.log('list-service 360 :' + JSON.stringify(err) + action.show_expression);
              }
            } else {
              if (action.action.toLowerCase() === 'relatedcollect') {
                // action.action = action.action;
                // action.options = action.options;
                // action.mobile_show = action.mobile_show;
                // action.label = action.label;
                // action.collect = collect;
                // ops.push(action);
              } else {
                ops.push(action);
              }
            }
          }
        }
      });
    }
    return ops;
  }
  callAnotherFunc(fnFunction: Function, vArgument) {
    if (_.isFunction(fnFunction)) {
      return (<Function>fnFunction)(vArgument);
    } else {
      return true;
    }
  }

  /**扩展器处理程序 */
  extenderHandler(extenders) {
    extenders.forEach(extender => {
      if (extender.extender_item.toLowerCase().indexOf('subordinateselectorfilter') > -1) {
        if (extender.show_filter) {
          this.isSelectTree = true;
          this.selectExtender = extender;
          this.getSelectTree();
        }
      } else if (extender.extender_item.toLowerCase().indexOf('coachfeedbackselectorfilter') > -1) {
        if (extender.show_filter) {
          this.isSelectTree = true;
          this.selectExtender = extender;
          this.getCoachCompData();
        }
      }
    })
  }

  getSelectTree() {
    this.mainService.getSubordinate(this.userInfo.userid).then((res: any) => {
      if (res.body.result) {
        this.selectTree = res.body.result;
      }
    })
  }

  getCoachCompData() {
    this.mainService.getlistTutorial(this.userInfo.userid).then((res: any) => {
      if (res.body.result) {
        this.selectTree = res.body.result;
      }
    })
  }

  criteriasInit() {
    this.listParam.criterias = [];
    if (this.layout.default_filter_criterias) {
      if (this.layout.default_filter_criterias.criterias) {
        this.layout.default_filter_criterias.criterias.forEach(crt => {
          this.listParam.criterias.push(crt);
        })
      }
    }
    if (this.listRecordType !== undefined) {
      let criOperator = 'in';
      let recordTypeParam: ListCriterias = {
        field: 'record_type',
        operator: criOperator,
        value: this.listRecordType
      };
      this.listParam.criterias.push(recordTypeParam);
    }
    if (this.apiName === 'clm_presentation' && this.productList.length) {
      // let productParam: ListCriterias = {
      //   field: 'product',
      //   operator: 'in',
      //   value: this.productList
      // };
      // let productParamStatus: ListCriterias = {
      //   field: 'status',
      //   operator: '==',
      //   value: ['1']
      // };
      // this.listParam.criterias.push(productParam);
      // this.listParam.criterias.push(productParamStatus);
    }
    if (this.apiName == 'alert') {
      let productParam: ListCriterias = {
        field: 'owner',
        operator: '==',
        value: [this.userInfo.userid]
      };
      this.listParam.criterias.push(productParam);
    }

    if (this.extraCrites.length) {
      _.each(this.extraCrites, extra => {
        this.listParam.criterias.push(extra);
      })
    }
  }
  clmQueryInit() {
    this.listParam.criterias = [];
    this.productList = [];
    if (this.apiName === 'clm_presentation') {
      let availableProductParam: ListParam = {
        pageSize: 1000,
        pageNo: 1,
        joiner: 'and',
        objectApiName: 'product',
        order: 'asc',
        orderBy: 'update_time',
        criterias: [{
          field: 'level',
          value: ['2'],
          operator: '=='
        }]
      };
      let userProduct = {
        pageSize: 1000,
        pageNo: 1,
        joiner: 'and',
        objectApiName: 'user_product',
        order: 'asc',
        orderBy: 'update_time',
        criterias: [
          {
            field: "user_info",
            value: [this.userInfo.userid],
            operator: "=="
          }
        ],
      }
      return this.mainService.getSearchData(availableProductParam).then((res: any) => {
        const allProducts = [];
        for (let rdata of res.body.result) {
          allProducts.push(rdata.id);
        }
        return this.mainService.getSearchData(userProduct).then((res: any) => {
          const userProductList = res.body.result;
          allProducts.forEach(pro => {
            let flag = false;
            if (userProductList.length > 0) {
              userProductList.forEach(usrP => {
                if (usrP.product == pro) {
                  flag = true;
                }
              })
            }
            if (flag) {
              this.productList.push(pro);
            }

          })
          let productParam: ListCriterias = {
            field: 'product',
            operator: 'in',
            value: this.productList
          };
          let productParamStatus: ListCriterias = {
            field: 'status',
            operator: '==',
            value: ['1']
          };
          this.listParam.criterias.push(productParam);
          this.listParam.criterias.push(productParamStatus);
          return Promise.resolve();
        })

      });
    } else {
      return Promise.resolve();
    }
  }

  addViewsToListParams() {
    /**如果有views选择第一个views的第一个查询条件 */
    if (this.layout.views && this.views.length > 0) {
      const views = this.selectView.length > 0 ? this.selectView : this.layout.views;
      if (views[0] && views[0].criterias && this.listParam.pageNo == 1) {
        const viewCrits = views[0].criterias;
        viewCrits.forEach(cri => {
          let value = cri.value;
          if (cri.value['expression']) {
            value = [];
            try {
              let val = eval(cri.value['expression']);
              if (typeof val !== 'string') {
                value = val;
              } else {
                value.push(val);
              }
              value.forEach((v, index) => {
                if (typeof v === 'string') {
                  const number = parseInt(v);
                  value[index] = number;
                }
              })
            } catch (e) {
              let val = this.callAnotherFunc(new Function("t", cri.value['expression']), {});
              if (typeof val !== 'string') {
                value = val;
              } else {
                value.push(val);
              }
              value.forEach((v, index) => {
                if (typeof v === 'string') {
                  const number = parseInt(v);
                  value[index] = number;
                }
              })
            }
          }
          let haveField = false;
          this.listParam.criterias.forEach(cris => {
            if (cris.field == cri.field && cris.operator == cri.operator) {
              haveField = true;
            }
          })
          if (haveField) {
            this.listParam.criterias.forEach(cris => {
              if (cris.field == cri.field) {
                cris.value = value;
                cris.operator = cri.operator;
              }
            })
          } else {
            this.listParam.criterias.push({ field: cri.field, operator: cri.operator, value: value });
          }
        })
      }
    }
  }

  criHandler(filter) {
    for (let element of filter) {
      if (element.operator.value && element.value.length > 0) {
        let elem = {
          field: element.field.value,
          operator: element.operator.value,
          value: [element.value[0].value]
        }
        switch (element.operator.type) {
          case 'date':
            elem.value = [moment(element.value[0].value).format("x")];
            break;
          case 'select_many':
            elem.value = element.value[0].value;
            break;
          case 'relation':
            elem.field = elem.field + '__r.name';
            break;
        }
        if (this.layout.default_filter_criterias) {
          let criterias = this.layout.default_filter_criterias.criterias;
          if (criterias.length > 0) {
            criterias.forEach(crt => {
              if (elem.field === crt.field) {
                let index = this.listParam.criterias.indexOf(crt);
                if (index > -1) {
                  this.listParam.criterias.splice(index, 1);
                }
              }
            })
          }
        }

        if (elem.field.indexOf('create_by') > -1) {
          const element = {
            field: 'create_by__r.name',
            operator: elem.operator,
            value: elem.value
          };
          this.exceptTheSame(element);
        } else if (elem.field.indexOf('owner') > -1) {
          const element = {
            field: 'owner__r.name',
            operator: elem.operator,
            value: elem.value
          }
          this.exceptTheSame(element);
        } else if (elem.field.indexOf('update_by') > -1) {
          const element = {
            field: 'update_by__r.name',
            operator: elem.operator,
            value: elem.value
          }
          this.exceptTheSame(element);
        } else {
          this.exceptTheSame(elem);
        }
      }
    }
  }

  exceptTheSame(elm) {
    let is_have = false;
    this.listParam.criterias.forEach(cri => {
      if (cri.field == elm.field) {
        is_have = true;
        cri.operator = elm.operator;
        cri.value = elm.value;
      }
    })
    if (!is_have) {
      this.listParam.criterias.push(elm);
    }
  }

  req() {
    let searchreq = () => {
      this.addViewsToListParams();
      const recordListFilter = this.dataService.recordListFilter;
      if (recordListFilter) {
        if (recordListFilter.apiName == this.apiName && recordListFilter.record_type == this.recordType) {
          const filter = recordListFilter.filter;
          if (filter.length > 0) {
            this.criHandler(filter);
          }
        }
      }
      const favoriteStatus = this.dataService.favoriteStatus;
      if (favoriteStatus) {
        if (favoriteStatus.apiName == this.apiName && favoriteStatus.record_type == this.recordType) {
          const is_favorite = favoriteStatus.is_favorite;
          if (is_favorite) {
            const param = {
              field: 'is_favorite',
              operator: '==',
              value: [true]
            }
            this.exceptTheSame(param);
          }
        } else {
          this.dataService.favoriteStatus = undefined;
        }
      }
      if (this.dataRtype) {
        this.listParam.criterias.push({ field: 'record_type', operator: 'in', value: [this.dataRtype] });
      }
      const paramActive = {
        field: 'is_active',
        operator: '==',
        value: [true]
      }
      this.criHandler(paramActive);
      return this.mainService.getSearchData(this.listParam).then((res: any) => {
        if (this.freshFlag === 0) {
          this.data = res.body.result;
        } else {
          res.body.result.forEach(dataItem => {
            this.data.push(dataItem);
          })
        }
        this.dataAfter = res.body.result;
        this.total = res.body.resultCount;
        this.pageCount = res.body.pageCount;
        return Promise.resolve();
      });
    };
    let searchclmreq = () => {
      return this.clmQueryInit().then(() => {
        const recordListFilter = this.dataService.recordListFilter;
        if (recordListFilter) {
          if (recordListFilter.apiName == this.apiName && recordListFilter.record_type == this.recordType) {
            const filter = recordListFilter.filter;
            if (filter.length > 0) {
              this.criHandler(filter);
            }
          }
        }
        if (this.dataRtype) {
          this.listParam.criterias.push({ field: 'record_type', operator: 'in', value: [this.dataRtype] });
        }
        return this.mainService.getSearchData(this.listParam)
      }).then((res: any) => {
        if (this.freshFlag === 0) {
          this.data = res.body.result;
        } else {
          res.body.result.forEach(dataItem => {
            this.data.push(dataItem);
          })
        }
        this.dataAfter = res.body.result;
        this.total = res.body.resultCount;
        this.pageCount = res.body.pageCount;
        return Promise.resolve();
      });
    };
    if (this.layout === undefined || this.describe === undefined) {
      this.listParam.objectApiName = this.apiName;
      let getLayout = this.mainService.getLayoutByApiNameAndPageType(this.apiName, 'index_page', this.recordType);
      let getDescribe = this.mainService.getDescribeByApiName(this.apiName);
      getLayout.then((res: any) => {
        if (res.body.containers) {
          this.layout = res.body.containers[0].components[0];
          this.displayName = this.layout.header;
          if (this.layout['header.i18n_key']) {
            const key = this.layout['header.i18n_key'];
            if (this.translateService.translateFunc(key) !== key) {
              this.displayName = this.translateService.translateFunc(key);
            }
          }
          if (this.layout.views) {
            this.views = this.layout.views;
          }
          this.addViewsToListParams();

          /**是否有扩展组件 */
          if (this.layout.selector_filter_extender) {
            this.extenderHandler(this.layout.selector_filter_extender);
          }

          if (this.layout.default_filter_criterias) {
            let criterias = this.layout.default_filter_criterias.criterias;
            if (criterias) {
              criterias.forEach(item => {
                this.listParam.criterias.push(item);
              })
            }
          }
          if (this.layout.default_sort_order !== undefined) {
            this.listParam.order = this.layout.default_sort_order;
          }
          if (this.layout.default_sort_by !== undefined) {
            this.listParam.orderBy = this.layout.default_sort_by;
          }
          if (this.layout.record_type !== undefined || this.apiName == 'alert') {
            this.listRecordType = this.layout.record_type;
            this.criteriasInit();
          }
        } else {
        }

      });
      getDescribe.then((res: any) => {
        this.describe = res.body;
      });
      return Promise.all([getLayout, getDescribe]).then(() => {
        this.layoutParser();
        if (this.apiName === 'clm_presentation') {
          return searchclmreq();
        } else {
          return searchreq();
        }
      });
    } else {
      if (this.layoutItem.length <= 0) {
        this.layoutParser();
      }
      return searchreq();
    }
  }
  load() {
    if (this.pageCount < this.listParam.pageNo) {
      return Promise.reject([]);
    } else {
      return this.req().then(() => {
        let returnData = this.listGenerator();
        return Promise.resolve(returnData);
      });
    }
  }
}
/**列表查询参数 */
export interface ListParam {
  /**查询条件 */
  criterias: ListCriterias[];
  /**查询条件之间的关系 */
  joiner: string;
  objectApiName: string;
  /**排序规则(asc/desc) */
  order: string;
  orderBy: string;
  /**页码 */
  pageNo: number;
  /**每页个数 */
  pageSize: number;
}
/**列表查询筛选规则 */
export interface ListCriterias {
  /**字段 */
  field: string;
  /**操作符 */
  operator: string;
  /**值 */
  value: any;
}
export interface ListStructure {
  avatar: ListStructureItem;
  title: ListStructureItem;
  subTitle: ListStructureItem;
  contents: ListStructureItem[];
  labels: ListStructureItem[];
  select?: boolean;
}
export interface ListStructureItem {
  exist?: boolean;
  type?: string;
  data: string;
  icon?: string;
  icontype?: boolean;
  color?: string;
}
