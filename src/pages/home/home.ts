import {
  OnInit,
  Component,
  ComponentRef,
  ComponentFactoryResolver,
  ViewChild,
  ViewContainerRef
} from "@angular/core";
import {
  NavParams,
  Events,
  ModalController,
  NavController,
  PopoverController
} from "ionic-angular";
import { Title } from "@angular/platform-browser";
import _ from "lodash";
import {
  MainService,
  LoginService,
  ListService,
  DataService,
  TranslateService,
  HttpService
} from "../../providers/index";
import { List, SelectTree, HomePopover } from "../../components/index";
import { SelectPage, DropDownPage } from "../../pages/index";
import { UserInfo, PermissionHelper } from "../../utils/index";
import moment from "moment";

@Component({ selector: "page-home", templateUrl: "home.html" })
export class HomePage implements OnInit {
  ngOnInit(): void {
    this.pageSize = 10;
    this.pageNo = 1;
    this.pageCount = 4;
  }
  @ViewChild("insertDiv", { read: ViewContainerRef })
  insertDiv: ViewContainerRef;
  @ViewChild("selectTree", { read: ViewContainerRef })
  selectTree: ViewContainerRef;
  constructor(
    public navParams: NavParams,
    private modalCtrl: ModalController,
    public cfr: ComponentFactoryResolver,
    public mainService: MainService,
    public loginService: LoginService,
    public listService: ListService,
    public events: Events,
    public navCtrl: NavController,
    private popoverCtrl: PopoverController,
    public userInfo: UserInfo,
    public permissionHelper: PermissionHelper,
    public dataService: DataService,
    public translateService: TranslateService,
    public httpService: HttpService,
    public titleService: Title
  ) {}
  width = 0;
  colStyle: {};
  apiName = this.navParams.data.object_describe_api_name;
  recordType = this.navParams.data.record_type;
  metadata: any;
  header: string;
  actions = [];
  filter: any;
  componentType: any;
  pageSize: any;
  pageNo: any;
  pageCount: any;
  data: any;
  compRef: ComponentRef<List>;
  body = [];
  views = [];
  describe: any;
  listData: any[];
  notend: boolean;
  show_filter = false;
  newData = [];
  oldListData = [];
  isChecked = false;
  footerDisplay = this.listService.footerDisplay;
  filterConditions = [];
  otherConditions = [];
  is_show_modal = false;
  selectFilters: any;
  is_ViewsShow: boolean = false;
  pageViews: any = [];
  selectView: any = {};
  filterDisplay = "none";

  // new selector
  filterIndex = 0;
  rightSelector = {};
  newOptions = [];

  is_show_paixu = false;
  is_select_sub = false;
  is_show_arrow = false;
  is_territory = true;

  newSelectTree = [];
  rootSelect: any = {};
  lastSelectTreeRoot = [];

  ionViewDidEnter() {
    this.titleService.setTitle("SFE");
    // this.filterConditions = this.otherConditions = [];
    this.isChecked = false;
    this.listener();
    this.listService.init();
    this.dataService.init();
    this.listService.apiName = this.apiName;
    this.listService.recordType = this.recordType;
    if (_.isArray(this.recordType)) {
      this.listService.recordType = this.recordType[0];
    }
    this.listService.load().then(
      res => {
        this.notend = true;
        this.listData = res;
        this.header = this.listService.displayName;
        this.views = this.listService.views;
        if (this.listService.layout.type !== undefined) {
          this.componentType = this.listService.layout.type;
          this.show_filter = this.listService.layout.show_filter;
        }
        //console.log(this.listService.layout);
        if (this.listService.layout) {
          const views = _.get(this.listService.layout, "views", []);
          if (views.length > 1) {
            this.is_ViewsShow = true;
            this.pageViews = views;
          }
        }
        if (this.listService.layout.filter_fields !== undefined) {
          this.handleFilterFields();
        }
        if (this.listService.layout.actions !== undefined) {
          this.handleActions();
        }
        this.renderDom();
      },
      err => {
        this.httpService.reqEnd();
        this.notend = false;
      }
    );
  }
  //重置条件清空数据
  cleardata() {
    for (let i = 0; i < this.filterConditions.length; i++) {
      for (let key in this.filterConditions[i]) {
        if (
          key === "filter_value" ||
          key === "filter_end_time" ||
          key === "filter_start_time"
        ) {
          this.filterConditions[i][key] = "";
        }
      }
    }
    // for(let j =0;j<this.rootSelect.children.length;j++){
    //   for(let item in this.rootSelect.children[j]){
    //     if(item === 'isChecked'){
    //       this.rootSelect.children[j][item]=false
    //     }

    //   }
    // }
  }
  //构造前端过滤条件需要的数据
  handleFilterFields() {
    const filter_fields = _.get(this.listService.layout, "filter_fields", []);
    const desFields = _.get(this.listService.describe, "fields", []);
    const otherConditions = [];
    _.each(filter_fields, filter => {
      _.each(desFields, des => {
        if (des.api_name === filter) {
          const filterCondition = {
            filter_name: des.label,
            filter_des: des,
            filter_api: filter,
            filter_type: des.type
          };
          otherConditions.push(filterCondition);
        }
      });
    });
    this.filterConditions = this.otherConditions = otherConditions;
    if (otherConditions.length > 0) {
      this.filterDisplay = "flex";
    } else {
      this.filterDisplay = "none";
    }
  }
  //处理顶部右侧按钮的数组actions
  handleActions() {
    this.actions = [];
    this.listService.layout.actions.forEach(action => {
      if (!action["action.i18n_key"] && !action.label) {
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
      let hidden_flag = false;
      let hidden_devices_flag = false;

      if (action.hidden_expression) {
        hidden_flag = this.callAnotherFunc(
          new Function("t", action.hidden_expression),
          ""
        );
      }
      if (action.hidden_devices) {
        action.hidden_devices.forEach(device => {
          if (device === "ipad" || device === "phone") {
            hidden_devices_flag = true;
          }
        });
      }
      if (!hidden_flag && !hidden_devices_flag) {
        if (action.action.toLowerCase().indexOf("add") > -1) {
          let isHavePermission = this.permissionHelper.fc_hasObjectPrivilege(
            this.apiName,
            1
          );
          if (isHavePermission) {
            let record = this.recordType;
            if (action.target_layout_record_type) {
              record = action.target_layout_record_type;
            }
            const trans = "action.add." + this.apiName + "." + record;
            if (
              this.translateService.translateFunc(trans) !== trans &&
              !action.label
            ) {
              action.label = this.translateService.translateFunc(trans);
            }
            this.actions.push(action);
          }
        }
      }
    });
  }

  listener() {
    this.events.subscribe("listDataChange", listData => {
      this.compRef.instance.listData = listData;
      this.compRef.instance.total = this.listService.total;
    });
  }

  presentViews(ev) {
    const popover = this.popoverCtrl.create(HomePopover, {
      views: this.pageViews
    });
    popover.present({ ev: ev });

    popover.onDidDismiss(item => {
      if (item) {
        const selectView = [];
        selectView.push(item);
        this.selectView = item;
        this.listener();
        this.listService.init();
        this.dataService.init();
        this.listService.dataRtype = this.navParams.data["data_recod_type"];
        this.listService.apiName = this.apiName;
        this.listService.recordType = this.recordType;
        this.listService.freshFlag = 0;
        this.listService.listParam.pageNo = 1;
        this.listService.pageCount = 1;
        this.listService.selectView = selectView;
        this.listService.load().then(
          res => {
            this.compRef.instance.listData = res;
            this.compRef.instance.total = this.listService.total;
          },
          err => {
            this.notend = false;
          }
        );
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

  clickSelectItems(filter) {
    _.each(this.selectFilters, selFilter => {
      delete selFilter.filter_value;
    });
    this.selectFilters = [];
    this.selectFilters.push(filter);
    this.is_show_modal = !this.is_show_modal;
    filter["active"] = !filter["active"];
  }

  clickOtherFilter() {
    this.selectFilters = this.otherConditions;
    _.each(this.selectFilters, selFilter => {
      delete selFilter.filter_value;
    });
    this.is_show_modal = !this.is_show_modal;
    if (this.is_show_modal) {
      this.is_select_sub = false;
    }
  }

  clickConfimSelect(filter) {
    const exreaCris = [];
    if (filter.filter_value !== undefined) {
      let value = filter.filter_value;
      exreaCris.push({
        field:
          filter.filter_type === "relation"
            ? `${filter.filter_api}__r.name`
            : filter.filter_api,
        operator:
          filter.filter_api.indexOf("_time") > -1 ||
          filter.filter_api.indexOf("_date") > -1
            ? ">"
            : filter.filter_type === "text" ||
              filter.filter_type === "long_text" ||
              filter.filter_type === "relation"
            ? "contains"
            : "in",
        value: [value]
      });
    } else {
      if (
        filter.filter_api.indexOf("_time") > -1 ||
        filter.filter_api.indexOf("_date") > -1
      ) {
        const startValue = moment(filter.filter_start_time)
          .subtract(moment().utcOffset(), "minutes")
          .valueOf();
        const endValue = moment(filter.filter_end_time)
          .subtract(moment().utcOffset(), "minutes")
          .valueOf();
        exreaCris.push({
          field:
            filter.filter_type === "relation"
              ? `${filter.filter_api}__r.name`
              : filter.filter_api,
          operator:
            filter.filter_api.indexOf("_time") > -1 ||
            filter.filter_api.indexOf("_date") > -1
              ? ">"
              : filter.filter_type === "text" ||
                filter.filter_type === "long_text" ||
                filter.filter_type === "relation"
              ? "contains"
              : "in",
          value: [startValue]
        });
        exreaCris.push({
          field:
            filter.filter_type === "relation"
              ? `${filter.filter_api}__r.name`
              : filter.filter_api,
          operator:
            filter.filter_api.indexOf("_time") > -1 ||
            filter.filter_api.indexOf("_date") > -1
              ? "<"
              : filter.filter_type === "text" ||
                filter.filter_type === "long_text" ||
                filter.filter_type === "relation"
              ? "contains"
              : "in",
          value: [endValue]
        });
      }
    }
    this.is_show_modal = !this.is_show_modal;
    const initPrams = _.cloneDeep(this.listService.listParam);
    _.each(exreaCris, cri => {
      this.listService.listParam.criterias.push(cri);
    });
    this.mainService.getSearchData(this.listService.listParam).then(
      (res: any) => {
        if (res.head.code === 200) {
          this.newData = res.body.result;
        }
        this.listService.dataAfter = this.newData;
        this.listService.pageCount = 1;
        this.listService.total = res.body.resultCount;
        this.listData = this.listService.listGenerator();
        this.compRef.instance.listData = this.listData;
        this.listService.listParam = initPrams;
      },
      err => {
        this.listService.listParam = initPrams;
      }
    );
    //this.selectFilters = [];
    this.cleardata();
  }

  ionViewWillEnter() {
    this.width = 1;
  }

  changeCheckStatus(comp) {}

  checkFavorite(e) {
    this.notend = true;
    this.newData = [];
    let obj = {
      field: "is_favorite",
      operator: "==",
      value: [true]
    };
    if (e.checked) {
      this.isChecked = true;
      this.oldListData = _.cloneDeep(this.listData);
      this.listService.listParam.pageSize = 1000;
      this.listService.listParam.pageNo = 1;
      this.listService.listParam.criterias.push(obj);
      this.mainService
        .getSearchData(this.listService.listParam)
        .then((res: any) => {
          if (res.head.code === 200) {
            this.newData = res.body.result;
          }
          this.listService.dataAfter = this.newData;
          this.listService.pageCount = 1;
          this.listService.total = this.newData.length;
          this.listService.isFavorite = true;
          this.listData = this.listService.listGenerator();
          this.compRef.instance.listData = this.listData;
        });
    } else {
      this.isChecked = false;
      this.listService.listParam.pageSize = 10;
      this.listService.listParam.pageNo = 1;
      this.listService.listParam.criterias.splice(
        this.listService.listParam.criterias.indexOf(obj),
        1
      );
      this.mainService
        .getSearchData(this.listService.listParam)
        .then((res: any) => {
          if (res.head.code === 200) {
            const data = res.body.result;
            this.listService.total = res.body.resultCount;
            this.listService.dataAfter = data;
            this.listService.pageCount = res.body.pageCount;
            this.listService.listParam.pageNo = 1;
            this.listData = this.listService.listGenerator();
            this.listService.isFavorite = false;
            this.compRef.instance.listData = this.listData;
          }
        });
    }
  }

  batchUpdateData(dataList) {
    const batchUpdateList = dataList;
    if (batchUpdateList.length > 0) {
      const body = {
        data: batchUpdateList
      };
      this.mainService.batchUpdate(this.apiName, body).then((res: any) => {
        if (res.head.code == 200) {
          this.listService.listParam.pageSize = this.listData.length;
          this.listService.listParam.pageNo = 1;
          this.mainService
            .getSearchData(this.listService.listParam)
            .then((res: any) => {
              if (res.head.code === 200) {
                this.events.publish("menu:changeAlertCont");
                const data = res.body.result;
                this.listService.total = res.body.resultCount;
                this.listService.dataAfter = data;
                this.listService.pageCount = res.body.pageCount;
                this.listService.listParam.pageNo = 1;
                this.listData = this.listService.listGenerator();
                this.listService.isFavorite = false;
                this.listService.selectAllFlag = false;
                this.listService.footerDisplay = "none";
                this.listService.footerAction = [];
                this.compRef.instance.isPress = false;
                this.compRef.instance.canGoToDetail = true;
                this.compRef.instance.listData = this.listData;
              }
            });
        }
      });
    }
  }

  batchChangeStatus() {
    const batchUpdateList = [];
    for (let list of this.listData) {
      const data = list.data;
      const id = data.id;
      const version = data.version;
      const status = "1";
      if (data.status != "1") {
        batchUpdateList.push({ id: id, version: version, status: status });
      }
    }
    this.batchUpdateData(batchUpdateList);
  }

  // 下拉刷新
  doRefresh(refresher) {
    console.log("0000000");
    if (!this.listService.isFavorite) {
      this.notend = true;
      this.listService.freshFlag = 0;
      this.listService.listParam.pageNo = 1;
      this.listService.pageCount = 1;
      this.listService.load().then(
        res => {
          this.compRef.instance.listData = res;
          this.compRef.instance.total = this.listService.total;
          refresher.complete();
        },
        err => {
          this.notend = false;
          refresher.complete();
        }
      );
    } else {
      //this.notend = false;
      refresher.complete();
    }
  }

  // 上拉加载
  doInfinite(infiniteScroll) {
    if (!this.listService.isFavorite) {
      this.listService.freshFlag = 1;
      this.listService.listParam.pageNo++;
      this.listService.load().then(
        res => {
          for (let re of res) {
            this.compRef.instance.listData.push(re);
          }
          infiniteScroll.complete();
        },
        err => {
          this.notend = false;
          infiniteScroll.complete();
        }
      );
    } else {
      infiniteScroll.complete();
    }
  }

  getBackColor(flag) {
    //this.width=flag;
  }

  selectAll() {
    this.listService.selectAllFlag = true;
    this.listData = this.listService.listGenerator();
    this.compRef.instance.listData = this.listData;
  }

  cancelFooterSelect() {
    this.listService.footerDisplay = "none";
    this.listService.selectAllFlag = false;
    this.listData = this.listService.listGenerator();
    this.compRef.instance.isPress = false;
    this.compRef.instance.canGoToDetail = true;
    this.compRef.instance.listData = this.listData;
  }

  operateFooterAction(action) {
    const operateData = [];
    this.compRef.instance.listData.forEach(listItem => {
      if (listItem.select) {
        const default_field_val = action.default_field_val;
        let obj = {
          id: listItem.data["id"],
          version: listItem.data["version"]
        };
        default_field_val.forEach(key_value => {
          if (key_value.field_type == "js") {
            obj[key_value.field] = this.callAnotherFunc(
              new Function("t", key_value.val),
              listItem.data
            );
          } else {
            obj[key_value.field] = key_value.val;
          }
        });
        operateData.push(obj);
      }
    });
    this.batchUpdateData(operateData);
  }

  presentPopover(ev, flag) {
    if (flag === "select") {
      let selectModal = this.modalCtrl.create(SelectPage);
      selectModal.onDidDismiss(() => {
        this.notend = true;
        this.listService.listParam.pageNo = 1;
        this.listService.pageCount = 1;
        if (this.isChecked) {
          this.listService.listParam.pageSize = 1000;
        }
        this.listService.load().then(
          (res: any) => {
            if (this.isChecked) {
              const newDatas = [];
              this.listService.dataAfter.forEach(data => {
                this.newData.forEach(newd => {
                  if (data.id == newd.id) {
                    res.forEach(rs => {
                      if (rs.data.id == data.id) {
                        newDatas.push(rs);
                      }
                    });
                  }
                });
              });
              //this.newData = newDatas;

              this.compRef.instance.listData = newDatas;
              this.listService.total = newDatas.length;
              this.compRef.instance.total = newDatas.length;
            } else {
              this.compRef.instance.listData = res;
              this.compRef.instance.total = this.listService.total;
            }
          },
          err => {
            this.notend = false;
          }
        );
      });
      selectModal.present();
    } else if (flag === "action") {
      if (this.actions.length > 0) {
        let popover = this.popoverCtrl.create(DropDownPage, {
          actions: this.actions
        });
        this.events.publish("clear:data", "mainList");
        popover.onDidDismiss(action => {
          if (action) {
            this.compRef.instance.listAction(action);
          }
        });
        popover.present({ ev: ev });
      }
    }
  }

  getTitleOfExtender(option) {
    let title = option["placeholder"];
    if (
      option["placeholder.i18n_key"] &&
      this.translateService.translateFunc(option["placeholder.i18n_key"]) !==
        option["placeholder.i18n_key"]
    ) {
      title = this.translateService.translateFunc(
        option["placeholder.i18n_key"]
      );
    }
    return title;
  }

  getSelectModel() {
    const realTree = [];
    // this.rootSelect = this.generatorSelectTree(this.listService.selectTree, this.userInfo.userid);
    // console.log('this.listService.selectTree ====>', this.listService.selectTree, this.rootSelect);
    // this.is_select_sub = !this.is_select_sub;
    // if(this.is_select_sub){

    // }
    this.is_show_modal = false;
    // this.listService.selectTree.forEach(select => {
    //   if (select.parent_id == this.userInfo.userid) {
    //     realTree.push(select);
    //   }
    //   if (select.id == this.userInfo.userid) {
    //     this.rootSelect.children.push(select);
    //   }
    // })
    this.listService.selectTree.forEach(select => {
      if (select.parent_id == this.userInfo.userid) {
        realTree.push(select);
      }
    });

    // 老筛选下属逻辑
    let option = this.listService.selectExtender.extender_option;
    let title = option["placeholder"];
    if (
      option["placeholder.i18n_key"] &&
      this.translateService.translateFunc(option["placeholder.i18n_key"]) !==
        option["placeholder.i18n_key"]
    ) {
      title = this.translateService.translateFunc(
        option["placeholder.i18n_key"]
      );
    }
    let modal = this.modalCtrl.create(SelectTree, {
      title: title,
      selectTree: realTree,
      childTreeList: this.listService.selectTree
    });
    modal.present();
    modal.onDidDismiss(res => {
      if (res) {
        if (res.length > 0) {
          if (this.listService.layout.default_filter_criterias) {
          }
          let obj;
          const value = [];
          res.forEach(rs => {
            value.push(JSON.stringify(rs.id));
          });
          const extender = this.listService.selectExtender;
          if (extender.filter_criterias) {
            obj = {
              field: extender.filter_criterias.field,
              operator: extender.filter_criterias.operator,
              value: value
            };
            if (this.listService.listParam.criterias.length > 0) {
              this.listService.listParam.criterias.forEach(cri => {
                if (cri.field == obj.field) {
                  let index = this.listService.listParam.criterias.indexOf(cri);
                  this.listService.listParam.criterias.splice(index, 1);
                }
              });
            }
            this.listService.listParam.criterias.push(obj);
            this.listService.listParam.pageNo = 1;
          }
          this.mainService
            .getSearchData(this.listService.listParam)
            .then((res: any) => {
              if (res.head.code === 200) {
                const data = res.body.result;
                this.listService.total = res.body.resultCount;
                this.listService.dataAfter = data;
                this.listService.pageCount = res.body.pageCount;
                this.listService.listParam.pageNo = 1;
                let listData = this.listService.listGenerator();
                this.listService.isFavorite = false;
                if (res.body.resultCount > res.body.pageSize) {
                  this.notend = true;
                }
                this.events.publish("listDataChange", listData);
              }
            });
        }
      }
    });
  }

  // new selector

  changeIndex(filter, i) {
    console.log("filter, i ==========>", filter, i);
    this.filterIndex = i;
    if (!this.filterConditions[this.filterIndex].filter_value) {
      this.filterConditions[this.filterIndex].filter_value = "";
    }
  }

  getNewOptions(options, filterValue) {
    if (filterValue) {
      this.newOptions = options.filter(
        option => option.label.indexOf(filterValue) > -1
      );
    } else {
      this.newOptions = options;
    }
  }

  searchSelectItems(e, filter) {
    console.log(e, filter);
    const searchValue = e.target.value;
    const searchOptions = filter.filter_des.options;
    this.getNewOptions(searchOptions, searchValue);
  }

  clickPaixu() {
    this.is_show_paixu = !this.is_show_paixu;
  }

  // 排序
  paixuClick(index) {
    this.is_show_paixu = !this.is_show_paixu;
    const condition = [];
    const initPrams = _.cloneDeep(this.listService.listParam);
    if (index === 1) {
      this.listService.listParam.orderBy = "create_time";
      this.listService.listParam.order = "asc";
    } else if (index === 2) {
      this.listService.listParam.orderBy = "create_time";
      this.listService.listParam.order = "desc";
    } else if (index === 3) {
      this.listService.listParam.orderBy = "update_time";
      this.listService.listParam.order = "asc";
    } else if (index === 4) {
      this.listService.listParam.orderBy = "update_time";
      this.listService.listParam.order = "desc";
    } else if (index === 5) {
      this.listService.listParam.orderBy = "create_by";
      this.listService.listParam.order = "desc";
    }
    this.mainService.getSearchData(this.listService.listParam).then(
      (res: any) => {
        if (res.head.code === 200) {
          this.newData = res.body.result;
        }
        this.listService.dataAfter = this.newData;
        this.listService.pageCount = 1;
        this.listService.total = res.body.resultCount;
        this.listData = this.listService.listGenerator();
        this.compRef.instance.listData = this.listData;
        this.listService.listParam = initPrams;
      },
      err => {
        this.listService.listParam = initPrams;
      }
    );
  }

  // 新的筛选下属
  print(sub) {
    console.log(sub);
  }

  checkTerritory(e) {
    this.is_territory = e.value;
  }

  generatorSelectTree(selectTree, compId, subRoot?: any) {
    let rootSelect: any = {};
    let rootChildren = [];
    selectTree.forEach(select => {
      const newSelect = _.cloneDeep(select);
      if (select.id == compId) {
        newSelect.isCurrent = true;
        rootSelect = newSelect;
      }
      if (select.parent_id === rootSelect.id) {
        rootChildren.push(select);
      }
    });
    rootSelect.children = rootChildren;
    if (rootChildren.length > 0) {
      rootSelect.isShow = true;
      rootChildren.forEach(child => {
        this.generatorSelectTree(rootChildren, child.id);
      });
    }
    // rootSelect.children.push(rootSelect);
    return rootSelect;
  }

  changRootSelect(sub, root) {
    if (sub.children && sub.children.length < 0) {
      return;
    } else {
      this.lastSelectTreeRoot.push(_.cloneDeep(root));
      this.rootSelect = sub;
    }
  }

  backToUpper() {
    // console.log('click 上一级');
    const currentRoot = _.cloneDeep(this.rootSelect);
    const root = this.lastSelectTreeRoot.pop();
    root.children.forEach((child, index) => {
      if (child.id == currentRoot.id) {
        root.children.splice(index, 1, currentRoot);
      }
    });
    this.rootSelect = _.cloneDeep(root);
  }

  confirmSelect() {
    const subIds = [];
    while (this.lastSelectTreeRoot.length > 0) {
      const newData = this.lastSelectTreeRoot.pop();
      newData.children.forEach(child => {
        if (child.isChecked) {
          subIds.push(child.id);
        }
      });
    }
    if (this.rootSelect.children && this.rootSelect.children.length > 0) {
      this.rootSelect.children.forEach(child => {
        if (child.isChecked) {
          subIds.push(child.id);
        }
      });
    }

    // 查询
    if (subIds.length > 0) {
      let obj;
      const extender = this.listService.selectExtender;
      if (extender.filter_criterias) {
        obj = {
          field: extender.filter_criterias.field,
          operator: extender.filter_criterias.operator,
          value: subIds
        };
        if (this.listService.listParam.criterias.length > 0) {
          this.listService.listParam.criterias.forEach(cri => {
            if (cri.field == obj.field) {
              let index = this.listService.listParam.criterias.indexOf(cri);
              this.listService.listParam.criterias.splice(index, 1);
            }
          });
        }
        this.listService.listParam.criterias.push(obj);
        this.listService.listParam.pageNo = 1;
      }

      this.mainService
        .getSearchData(this.listService.listParam)
        .then((res: any) => {
          if (res.head.code === 200) {
            const data = res.body.result;
            this.listService.total = res.body.resultCount;
            this.listService.dataAfter = data;
            this.listService.pageCount = res.body.pageCount;
            this.listService.listParam.pageNo = 1;
            let listData = this.listService.listGenerator();
            this.listService.isFavorite = false;
            if (res.body.resultCount > res.body.pageSize) {
              this.notend = true;
            }
            this.events.publish("listDataChange", listData);
          }
          //this.listService.listParam.criterias.splice(this.listService.listParam.criterias.indexOf(obj), 1);
        });
    }
    this.is_select_sub = !this.is_select_sub;
  }

  renderDom() {
    this.httpService.reqEnd();
    if (this.insertDiv) {
      this.insertDiv.clear();
    }
    if (this.selectTree) {
      this.selectTree.clear();
    }

    if (
      this.listService.isSelectTree &&
      this.listService.selectTree.length > 0
    ) {
    }

    let cpnt = this.cfr.resolveComponentFactory(List);
    this.compRef = this.insertDiv.createComponent(cpnt);
    this.compRef.instance.listData = this.listData;
  }

  ionViewDidLeave() {
    this.isChecked = false;
  }
}
