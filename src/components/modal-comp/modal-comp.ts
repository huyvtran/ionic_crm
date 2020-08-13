import { Component } from "@angular/core";
import {
  NavParams,
  ViewController,
  NavController,
  Events,
  ItemSliding
} from "ionic-angular";
import { Storage } from "@ionic/storage";
import _ from "lodash";
import { PickList, DetailPage, EditPage } from "../../pages/index";
import {
  MainService,
  HttpService,
  TranslateService,
  IdGeneratorService
} from "../../providers/index";
import * as listHelper from "../../utils/list-helper";
import {
  callAnotherFunc,
  callMultiAnotherFunc,
  evalStr
} from "../../utils/index";

@Component({
  selector: "comp-modal-comp",
  templateUrl: "modal-comp.html"
})
export class ModalComponent {
  constructor(
    public navParams: NavParams,
    public viewCtrl: ViewController,
    public navCtrl: NavController,
    public mService: MainService,
    public httpService: HttpService,
    public events: Events,
    public translateService: TranslateService,
    public idGenerator: IdGeneratorService,
    public storage: Storage
  ) {}

  params: any;
  describe: any;
  parentLayout: any;
  parentData: any = {};
  modalComp: any;
  actions: any = [];
  newListData: any = [];
  padLayout: any = {};
  activeAction: any = {};
  is_render: boolean = false;
  storageDataList: any = [];
  recentItems: any = [];
  realDataList: any = [];
  pageType: any = '';

  ngOnInit() {
    //this.storage.set('modal-comp:modalStorage', [])
    this.is_render = true;
    this.describe = this.params.describe;
    this.parentLayout = this.params.layout;
    this.modalComp = this.params.modalComp;
    this.parentData = this.params.data;
    if (!_.isEmpty(this.parentData) && this.parentData.id) {
      this.getListData(this.parentData);
    }
    if (this.modalComp) {
      this.getActions();
      this.generatorTemplate(this.modalComp);
    }
    if(this.parentData.id){
      this.queryListData();
    }
    this.events.subscribe("form-comp:modalPickList", async (pickItems: any) => {
      //item.value = '';
      if (pickItems.length > 0) {
        const dataList = await this.generatorVirtualDataList(pickItems);
        const arrayBeforeList = await this.storage.get('modal-comp:modalStorage');
        let lastStorageList = [];
        if(arrayBeforeList && arrayBeforeList.length > 0){
          lastStorageList = this.concatDataList(arrayBeforeList, dataList);
          await this.storage.set('modal-comp:modalStorage', lastStorageList)
        }else{
          lastStorageList = dataList;
          await this.storage.set('modal-comp:modalStorage', dataList)
        }
        this.generatorModalList(lastStorageList);
      }
    });
    this.events.subscribe('form-comp:modalChildrenChange', async (childData: any) => {
      const changeList = [];
      changeList.push(childData);
      const arrayBeforeList = await this.storage.get('modal-comp:modalStorage');
        let lastStorageList = [];
        if(arrayBeforeList && arrayBeforeList.length > 0){
          lastStorageList = this.concatDataList(arrayBeforeList, changeList);
          await this.storage.set('modal-comp:modalStorage', lastStorageList)
        }else{
          lastStorageList = changeList;
          await this.storage.set('modal-comp:modalStorage', changeList)
        }
        this.generatorModalList(lastStorageList);
    })
  }

  concatDataList(desList: any = [], sourceList:any = []){
    _.each(sourceList, (l2) => {
      let is_have = false;
      _.each(desList, (l1, index) => {
        if(l1.fakeId === l2.fakeId){
          l1['is_fake_deleted'] = false;
          l2['is_fake_deleted'] = false;
          is_have = true;
          desList.splice(index, 1, l2);
        }
      })
      if(!is_have){
        desList.push(l2);
      }
    })
    return desList;
  }

  parentDataChange() {
    this.parentData = this.params.data;
    this.getActions();
  }

  queryListData(){
    const objectApiName = _.get(this.modalComp, 'ref_obj_describe', '');
    const recordType = _.get(this.modalComp, 'record_type', ['master']);
    const parentId = this.parentData.id;
    if(objectApiName && recordType && parentId){
      this.mService.getDescribeByApiName(objectApiName).then((res: any) => {
        const desFields = res.body.fields;
        const criterias = [];
        _.each(desFields, des => {
          if(des.related_list_api_name && des.related_list_api_name === this.modalComp.related_list_name){
            criterias.push({
              field: des.api_name,
              operator: '==',
              value: [parentId]
            });
          }
        })
        criterias.push({
          field: 'record_type',
          operator: 'in',
          value: recordType
        });
        
        const queryCondition = {
          objectApiName,
          joiner: "and",
          order: this.modalComp.default_sort_order ? this.modalComp.default_sort_order : 'desc',
          orderBy: this.modalComp.default_sort_by ? this.modalComp.default_sort_by : 'create_time',
          pageSize: 100,
          pageNo: 1,
          criterias
        }
        this.mService.getSearchData(queryCondition).then( async (res2: any) => {
          const listData = res2.body.result;
          const dataList = await this.generatorVirtualChildrenList(this.parentData, listData);
          const arrayBeforeList = await this.storage.get('modal-comp:modalStorage');
          let lastStorageList = [];
          if(arrayBeforeList && arrayBeforeList.length > 0){
            lastStorageList = this.concatDataList(arrayBeforeList, dataList);
            await this.storage.set('modal-comp:modalStorage', lastStorageList)
          }else{
            lastStorageList = dataList;
            await this.storage.set('modal-comp:modalStorage', dataList)
          }
          console.log(lastStorageList);
          this.generatorModalList(lastStorageList);
          })
      })
    }
  }

  async generatorVirtualChildrenList(pData: any, childDataList: any = []){
    const dataList = [];
    if(childDataList.length > 0){
      _.each(childDataList, data => {
        data["fakeFlag"] = "sub";
        data["fake_parent"] = this.parentData["fakeId"];
        data["related_list_name"] = this.modalComp.related_list_name;
        data["fakeId"] = pData.id;
        dataList.push(data);
      })
    }
    return dataList;
  }

  async generatorVirtualDataList(items: any = []) {
    const { record_fields } = this.activeAction;
    const dataList = [];
    if (record_fields && record_fields.length > 0) {
      _.each(items, item => {
        let data = {};
        _.each(record_fields, fields => {
          const { field, default_value } = fields;
          let value = default_value;
          if (_.isObject(default_value) && value.expression) {
            value = callMultiAnotherFunc(
              new Function("r", "p", value.expression),
              item,
              this.parentData
            );
          }
          data[field] = value;
        });
        const finalField = `${item["object_describe_name"]}__r`;
        data["owner"] = `${window["FC_CRM_USERID"]}`;
        data["fakeFlag"] = "sub";
        data["fake_parent"] = this.parentData["fakeId"];
        data["related_list_name"] = this.modalComp.related_list_name;
        data["fakeId"] = item.id;
        data['object_describe_name'] = this.modalComp.ref_obj_describe;
        data[finalField] = item;
        dataList.push(data);
      });
    }
    return dataList;
  }

  generatorTemplate(modalComp: any = {}) {
    this.padLayout = listHelper.layoutHandler(modalComp, this.describe);
    //console.log(this.padLayout);
  }

  generatorModalList(dataItems: any) {
    this.realDataList = dataItems;
    if (this.modalComp.padlayout) {
      //console.log(this.padLayout);
      this.newListData = listHelper.insertPadLayoutData(
        dataItems,
        this.padLayout,
        this.describe,
        this.parentData
      );
    } else {
      this.newListData = listHelper.insertData(
        dataItems,
        this.padLayout,
        this.parentData
      );
    }
    console.log('this.newListData======>', this.newListData);
    //return (this.newListData);
  }

  getRowActionLabel(action: any) {
    if (action.action) {
      return this.translateService.translateFunc(
        `action.${_.toLower(action.action)}`
      );
    } else {
      return action.label;
    }
  }

  async getActions() {
    this.actions = [];
    if (!this.parentData["fakeFlag"]) {
      this.parentData["fakeFlag"] = "main";
      this.parentData["fakeId"] = this.parentData.id
        ? this.parentData.id
        : this.idGenerator.gen();
      this.parentData["related_list_name"] = this.modalComp.related_list_name;
    }
    _.each(this.modalComp.actions, action => {
      const { hidden_expression, disabled_expression, show_when = [] } = action;
      const newData = this.parentData.id ? {} : { owner: evalStr("FC_CRM_USERID") };
      let is_hidden = callAnotherFunc(
        new Function("p", hidden_expression),
        Object.assign(this.parentData, newData)
      );
      if(this.pageType === 'detail'){
        _.each(show_when, page => {
          is_hidden = true;
          if(page === 'detail'){
            is_hidden = false;
          }
        })
      }
      const is_disabled = callAnotherFunc(
        new Function("p", disabled_expression),
        Object.assign(this.parentData, newData)
      );
      if (!is_hidden && !is_disabled) {
        action["disabled"] = is_disabled;
        this.actions.push(action);
      }
    });

    // localStorage Data
    this.storageDataList = await this.storage.get('modal-comp:modalStorage');
    if (!this.storageDataList || this.storageDataList.length === 0) {
      this.storageDataList = [];
      this.storageDataList.push(this.parentData);
    }
    let is_hava = false;
    _.each(this.storageDataList, (data, index) => {
      if (
        data.fakeId === this.parentData.fakeId &&
        data.related_list_name === this.parentData.related_list_name
      ) {
        is_hava = true;
        this.storageDataList.splice(index, 1, this.parentData);
      }
    });
    if(!is_hava){
      this.storageDataList.push(this.parentData);
    }
    this.storageDataList = this.clearInValidData(this.storageDataList);
    await this.storage.set('modal-comp:modalStorage', this.storageDataList);
  }

  async clearStorage(relateName: any){
    let storageDataList = await this.storage.get('modal-comp:modalStorage');
    if (!storageDataList || storageDataList.length === 0) {
      storageDataList = [];
    }
    const pureSet = new Set([...storageDataList].filter(x => x['related_list_name'] !== relateName));
    await this.storage.set('modal-comp:modalStorage', Array.from(pureSet));
    this.getListData(this.parentData);
  }

  clearInValidData(items: any = []){
    const initArray = new Set();
    const fakeParentIds = new Set();
    const fakeIds = new Set();
    const lists = _.cloneDeep(items);
    _.each(lists, list => {
      initArray.add(list);
      fakeIds.add(list['fakeId']);
      if(list['fakeFlag'] === 'sub' && list['fake_parent']){
        fakeParentIds.add(list['fake_parent']);
      }
    })
    const parentArray = Array.from(fakeParentIds);
    const deleteArray = new Set();
    _.each(parentArray, pId => {
      if(!fakeIds.has(pId)){
        _.each(lists, (list, index) => {
          if(list['fakeFlag'] === 'sub' && list['fake_parent'] === pId){
            deleteArray.add(list);
          }
        })
      }
    })
    let defferentSet = new Set([...Array.from(initArray)].filter(x => !deleteArray.has(x)));
    return Array.from(defferentSet);
  }

  async handlerActions(option: any, newListItems: any) {
    const datassss = _.cloneDeep(newListItems);
    const data = datassss.data;
    switch(_.toLower(option.action)){
      case 'delete':
      data['is_fake_deleted'] = true;
      let arrayBeforeList = await this.storage.get('modal-comp:modalStorage');
      if(arrayBeforeList && arrayBeforeList.length > 0){
        _.each(arrayBeforeList, (storageData, index) => {
            if(!_.isEmpty(data) && data.fakeId === storageData.fakeId){
              arrayBeforeList.splice(index, 1, data);
            }
        })
      }
      await this.storage.set('modal-comp:modalStorage', arrayBeforeList);
      await this.getListData(this.parentData);
      break;
      case 'edit':
      data['vpageType'] = this.pageType;
      const newData = _.cloneDeep(data);
      this.navCtrl.push(EditPage, [data['object_describe_name'], option, newData, data['record_type']]);
      break;
      default:
      break;
    }
  }

  async getListData(pData: any) {
    //console.log(pData);
    let arrayBeforeList = await this.storage.get('modal-comp:modalStorage');
    const realDataList = [];
    if(arrayBeforeList && arrayBeforeList.length > 0){
      _.each(arrayBeforeList, storageData => {
        if(storageData && storageData.fake_parent === pData.fakeId && !storageData.is_fake_deleted){
          realDataList.push(storageData);
        }
      })
    }
    this.generatorModalList(realDataList);
  }

  closeSlide(slide: ItemSliding) {
    slide.close();
  }

  addData(action: any) {
    const {
      ref_obj_describe,
      multiple_select,
      target_layout_record_type,
      target_data_record_type,
      target_filter_criterias,
      show_render_mode
    } = action;
    const recordType = target_layout_record_type || target_data_record_type;
    const type = multiple_select ? "select_multiple" : "";
    const newData = { owner: evalStr("FC_CRM_USERID") };
    this.activeAction = action;
    if (ref_obj_describe && show_render_mode) {
      this.navCtrl.push(PickList, [
        ref_obj_describe,
        recordType,
        { type },
        target_filter_criterias,
        Object.assign({}, this.parentData, newData),
        "modal"
      ]);
    }
  }

  newPickValue(newListItems: any){
    this.navCtrl.push(DetailPage, [newListItems.data, '', 'fakeDetail', this.parentData]);
  }

  ngOnDestroy() {
    this.events.unsubscribe("form-comp:modalPickList");
  }
}
