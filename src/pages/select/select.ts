import { Component, ComponentFactoryResolver, ViewChild, ViewContainerRef } from '@angular/core';
import { Events, ViewController, NavController } from 'ionic-angular';
import { MainService, ListCriterias, ListService, TranslateService } from '../../providers/index';
import moment from 'moment';
import _ from 'lodash';

@Component({
  selector: 'page-select',
  templateUrl: 'select.html'
})
export class SelectPage {
  apiName: any;
  layout: any;
  describe: any;
  metadata: any;
  /**过滤器可以过滤的字段列表 */
  filterFieldList = [];
  criterias = [];
  selectedFieldList = [];
  fieldList: any[];
  fieldDesList: any;
  /**过滤器表单对外展示的数据 */
  filter: FilterParam[] = [];
  operatorOptions = {
    text: [
      { label: this.translateService.translateFunc('pad.selector_contains'), value: 'contains' },
      { label: this.translateService.translateFunc('pad.selector_equal'), value: '==' },
    ],
    date: [
      { label: this.translateService.translateFunc('pad.selector_before'), value: '<' },
      { label: this.translateService.translateFunc('pad.selector_later'), value: '>' },
    ],
    select_one: [
      { label: this.translateService.translateFunc('pad.selector_equal'), value: '==' },
      { label: this.translateService.translateFunc('pad.selector_not_equal'), value: '<>' },
    ],
    select_many: [
      { label: this.translateService.translateFunc('pad.selector_contains'), value: 'in' },
      { label: this.translateService.translateFunc('pad.selector_equal'), value: '==' },
    ],
    boolean: [
      { label: this.translateService.translateFunc('pad.selector_equal'), value: '==' },
    ],
    relation: [
      { label: this.translateService.translateFunc('pad.selector_contains'), value: 'contains' },
      { label: this.translateService.translateFunc('pad.selector_equal'), value: '==' },
    ],
    default: [
      { label: this.translateService.translateFunc('pad.selector_equal'), value: '==' },
    ]
  };

  @ViewChild('components', { read: ViewContainerRef }) components: ViewContainerRef;
  constructor(
    public events: Events,
    public viewCtrl: ViewController,
    public mainService: MainService,
    public listService: ListService,
    public navCtrl: NavController,
    public cfr: ComponentFactoryResolver,
    public translateService: TranslateService
  ) { }

  ngOnInit() {
    this.apiName = this.listService.apiName;
    this.describe = this.listService.describe;
    this.layout = this.listService.layout;
    this.getFields(this.layout, this.describe);
    let filter = JSON.stringify(this.listService.filterParam);
    this.filter = JSON.parse(filter);
  }

  getFields(layout, describe) {
    this.fieldList = [];
    this.fieldDesList = {};
    if (layout.filter_fields !== undefined) {
      describe.fields.forEach(des => {
        layout.filter_fields.forEach(layItem => {
          if (layItem === des.api_name) {
            let label = des.label;
            const trans = 'field.' + this.apiName + '.' + des.api_name;
            if (this.translateService.translateFunc(trans) !== trans) {
              label = this.translateService.translateFunc(trans);
            }
            this.fieldList.push({
              label: label,
              name: des.api_name,
              type: des.type
            });
            this.fieldDesList[des.api_name] = des;
          }
        })
      });
    } else {
      describe.fields.forEach(des => {
        let label = des.label;
        const trans = 'field.' + this.apiName + '.' + des.api_name;
        if (this.translateService.translateFunc(trans) !== trans) {
          label = this.translateService.translateFunc(trans);
        }
        this.fieldList.push({
          label: des.label,
          name: des.api_name,
          type: des.type
        });
        this.fieldDesList[des.api_name] = des;
      });
    }
  }

  addSelect() {
    let keynum: number = 0;
    if (this.filter.length > 0) {
      keynum = parseInt(this.filter[this.filter.length - 1].field.key) + 1;
    } else {
      keynum = 1;
    }
    let filterCriteria: FilterParam = {
      field: {
        key: keynum.toString(),
        type: 'select',
        value: ''
      },
      operator: {
        key: keynum.toString() + 'operator',
        type: 'none',
        value: ''
      },
      value: []
    };
    this.filter.push(filterCriteria);
  }
  changeField(i) {
    let opt = '';
    let value = '';
    switch (this.fieldDesList[this.filter[i].field.value].type) {
      case 'text':
      case 'long_text':
        opt = 'text';
        break;
      case 'relation':
        opt = 'relation';
        break;
      case 'date':
      case 'date_time':
        opt = 'date';
        value = moment().format();
        break;
      case 'select_one':
        opt = 'select_one';
        break;
      case 'select_many':
        opt = 'select_many';
        break;
      case 'boolean':
        opt = "boolean";
        break;
      default:
        opt = 'default';
    }
    this.filter[i].operator.type = opt;
    this.filter[i].operator.value = this.operatorOptions[opt][0].value;
    let val: FilterParamItem = {
      key: this.filter[i].field.key + 'value',
      type: opt,
      value: value
    };
    if (this.fieldDesList[this.filter[i].field.value].date_format) {
      val['format'] = this.fieldDesList[this.filter[i].field.value].date_format;
    }
    this.filter[i].value = [val];
  }
  translateLabel(item, lab) {
    let label = lab.label;
    const trans = 'options.' + this.apiName + '.' + item.api_name + '.' + lab.value;
    if (this.translateService.translateFunc(trans) !== trans) {
      label = this.translateService.translateFunc(trans);
    }
    return label;
  }
  delFilter(i) {
    if (this.filter[i] !== undefined) {
      this.filter.splice(i, 1);
    }
  }
  clear() {
    this.filter = [];
  }
  onsubmit() {
    if(this.listService.apiName == 'clm_presentation'){
      this.listService.clmQueryInit().then(() => {
        this.submit();
      })
    }else{
      this.listService.criteriasInit();      
      this.submit();
    }
  }

  submit(){
    this.listService.filterParam = this.filter;
    for (let element of this.filter) {
      if (element.operator.value && element.value.length > 0) {
        let elem: ListCriterias = {
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
        if (this.listService.layout.default_filter_criterias) {
          let criterias = this.listService.layout.default_filter_criterias.criterias;
          if (_.isArray(criterias) && criterias.length > 0) {
            criterias.forEach(crt => {
              let index = this.listService.listParam.criterias.indexOf(crt);
              if (index > -1) {
                this.listService.listParam.criterias.splice(index, 1);
              }
            })
          }
        }
        if (elem.field.indexOf('create_by') > -1) {
          this.listService.listParam.criterias.push({
            field: 'create_by__r.name',
            operator: elem.operator,
            value: elem.value
          });
        } else if (elem.field.indexOf('owner') > -1) {
          this.listService.listParam.criterias.push({
            field: 'owner__r.name',
            operator: elem.operator,
            value: elem.value
          });
        } else if (elem.field.indexOf('update_by') > -1) {
          this.listService.listParam.criterias.push({
            field: 'update_by__r.name',
            operator: elem.operator,
            value: elem.value
          });
        } else {
          this.listService.listParam.criterias.push(elem);
        }
      }
    }
    this.viewCtrl.dismiss();
  }
}
interface FilterParam {
  field: FilterParamItem;
  operator: FilterParamItem;
  value: FilterParamItem[];
}
interface FilterParamItem {
  key: string;
  type: string;
  value: string;
  format?: string;
}
