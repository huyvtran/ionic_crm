import { Component } from "@angular/core";
import {
  NavController,
  PopoverController,
  Events,
  ModalController,
  NavParams
} from "ionic-angular";
import { Title } from "@angular/platform-browser";
import $ from "jquery";
import "fullcalendar";
import moment from "moment";
import _ from "lodash";
import {
  DropDownPage,
  AddPage,
  DetailPage,
  DetailInfoPage
} from "../../pages/index";
import {
  ListService,
  MainService,
  TranslateService,
  HttpService
} from "../../providers/index";
import { UserInfo } from "../../utils/index";
import { SelectTree } from "../../components/index";

@Component({
  selector: "page-calendar",
  templateUrl: "calendar.html"
})
export class CalendarPage {
  constructor(
    public nav: NavController,
    private popoverCtrl: PopoverController,
    public listService: ListService,
    public mainService: MainService,
    public events: Events,
    public modals: ModalController,
    public userInfo: UserInfo,
    private navParams: NavParams,
    public translateService: TranslateService,
    public titleService: Title,
    public httpService: HttpService
  ) {
    if (this.navParams.data[1] === undefined) {
      this.calendarLayout = this.navParams.data;
    } else {
      this.calendarLayout = this.navParams.data[0];
      this.defaultView = this.navParams.data[1];
    }
    this.calendarLayout.calendar_items.forEach(item => {
      const legend = item.legend;
      if (legend.length > 0) {
        legend.forEach(ld => {
          ld.fontStyle = this.defaultClass;
          ld.isClass1Visible = true;
          ld.isClass2Visible = false;
          this.legends.push(ld);
        });
      }
    });
  }
  actions = [];
  renderType: any;
  calendarOptions: any;
  calendarLayout: any;
  eventList = [];
  detail: any;
  tabs = [];
  calendarDiv: string = "";
  defaultView: any;
  bodys = [];
  quests = [];
  searchItem: any[];
  selectTree: any[];
  isSelectTree = false;
  selectExtender: any;
  defaultClass = "fc-calender-legend1";
  legends = [];
  dayEventLists = [];
  selectDay = "";
  catagorys = [];
  startLimit: string =
    moment()
      .startOf("month")
      .subtract(1, "month")
      .format("YYYY-MM-DD") + " 00:00:00";
  endLimit: string =
    moment()
      .endOf("month")
      .add(1, "month")
      .format("YYYY-MM-DD") + " 23:59:59";

  ngOnInit() {
    this.calendarDiv =
      "fc_cal_" +
      Math.random()
        .toString()
        .substr(2, 10);
  }

  ionViewDidEnter() {
    this.titleService.setTitle("SFE");
    this.eventList = [];
    this.selectTree = [];
    this.searchItem = [];
    this.isSelectTree = false;
    this.selectExtender = undefined;

    //日历初始化的设置，初始化的参数处理完毕，可以直接load一个没有事件的日历
    this.getCalendarOptions();
    $("#" + this.calendarDiv).fullCalendar("destroy");
    $("#" + this.calendarDiv).fullCalendar(this.calendarOptions);
    $("#" + this.calendarDiv).fullCalendar("removeEvents");
    //解析服务端获取的日历layout，查询事件，添加到日历上
    const extender = this.calendarLayout.selector_filter_extender[0];
    this.catagorys = this.generateCatagory(this.calendarLayout);
    if (extender) {
      let isHidden = false;
      if (extender.hidden_expression) {
        isHidden = this.callAnotherFunc(
          new Function("t", extender.hidden_expression),
          {}
        );
      }
      if (extender.show_filter && !isHidden) {
        if (
          extender.extender_item
            .toLowerCase()
            .indexOf("subordinateselectorfilter") > -1
        ) {
          this.isSelectTree = true;
          this.selectExtender = extender;
          this.mainService
            .getSubordinate(this.userInfo.userid)
            .then((res: any) => {
              if (res.body.result) {
                this.selectTree = res.body.result;
                $("#" + this.calendarDiv).fullCalendar("removeEvents");
                this.getEventsWithSelectBody(this.selectTree);
              }
            });
        } else {
          $("#" + this.calendarDiv).fullCalendar("removeEvents");
          this.getEvents();
        }
      } else {
        $("#" + this.calendarDiv).fullCalendar("removeEvents");
        this.getEvents();
      }
    } else {
      $("#" + this.calendarDiv).fullCalendar("removeEvents");
      this.getEvents();
    }

    //日历模块所具备的操作
    this.actions = this.getActionsWithAutority(
      this.calendarLayout.calendar_actions
    );

    // 刷新左侧菜单
    this.mainService.getMenus().then((res: any) => {
      const array = _.sortBy(res.body.items, "display_order");
      let tabs = [];
      for (let x in array) {
        if (array[x].api_name !== "alert") {
          tabs.push(array[x]);
        }
      }
      this.events.publish("menu:change", tabs, "main");
    });
    this.httpService.reqEnd();
    $("#" + this.calendarDiv)
      .find(".fc-prev-button,.fc-next-button")
      .click(() => {
        $("#" + this.calendarDiv).fullCalendar("removeEvents");
        this.getEvents();
      });
  }

  generateCatagory(calendarLayout) {
    const catagorys = [];
    if (calendarLayout.calendar_items.length > 0) {
      _.each(calendarLayout.calendar_items, item => {
        if (item.legend && item.legend.length > 0) {
          _.each(item.legend, (element, index) => {
            catagorys.push(element);
          });
        }
      });
    }
    return catagorys;
  }

  getEventsWithSelectBody(selectTree) {
    let selectItem = [];
    selectTree.forEach(st => {
      selectItem.push(st.id);
    });
    selectItem.push(this.userInfo.userid);
    this.getEvents();
  }

  callAnotherFunc(fnFunction: Function, vArgument) {
    if (_.isFunction(fnFunction)) {
      return (<Function>fnFunction)(vArgument);
    } else {
      return true;
    }
  }

  getTranslateLabel(item) {
    if (item["label.i18n_key"]) {
      let trans = this.translateService.translateFunc(item["label.i18n_key"]);
      if (trans && trans !== item["label.i18n_key"]) {
        return trans;
      } else {
        return item.label;
      }
    } else {
      return item.label;
    }
  }

  getActionsWithAutority(actions) {
    const actionAutority = [];
    actions.forEach(action => {
      let hidden = false;
      let disabled = false;
      let deviceShow = false;
      if (!action["action.i18n_key"]) {
        let key = "action." + action.action.toLowerCase();
        action.label = this.translateService.translateFunc(key);
      }
      const trans = this.translateService.translateFunc(
        action["action.i18n_key"]
      );
      if (trans && trans !== action["action.i18n_key"]) {
        action.label = trans;
      }
      if (action.hidden_expression) {
        hidden = this.callAnotherFunc(
          new Function("t", action.hidden_expression),
          {}
        );
      }
      if (action.disabled_expression) {
        disabled = this.callAnotherFunc(
          new Function("t", action.disabled_expression),
          {}
        );
      }
      if (action.show_devices) {
        action.show_devices.forEach(device => {
          if (device == "index") {
            deviceShow = true;
          }
        });
      } else {
        deviceShow = true;
      }
      if (!hidden && !disabled && deviceShow) {
        actionAutority.push(action);
      }
    });
    return actionAutority;
  }

  openWindowWithActions(action, data?: any) {
    if (data !== undefined) {
      this.renderType = data.record_type;
    } else {
      this.renderType = this.listService.recordType;
    }
    this.events.publish("cachePage", AddPage, [
      action.object_describe_api_name,
      action,
      this.renderType
    ]);
    this.nav.push(AddPage, [
      action.object_describe_api_name,
      action,
      this.renderType
    ]);
  }

  presentPopover(ev) {
    let popover = this.popoverCtrl.create(DropDownPage, {
      actions: this.actions
    });
    popover.onDidDismiss(action => {
      if (action) {
        this.openWindowWithActions(action);
      }
    });
    popover.present({ ev: ev });
  }

  //不知道为什么报错。只能这样dirty hack了
  static fixTSError(x: moment.Moment | string | Date): moment.Moment {
    return x as moment.Moment;
  }

  getEvents(extender?: any) {
    this.eventList = [];
    this.quests = [];
    this.bodys = [];
    const limitStart = CalendarPage.fixTSError(
      $("#" + this.calendarDiv).fullCalendar("getView").start
    )
      .subtract(1, "month")
      .valueOf();
    const limitEnd = CalendarPage.fixTSError(
      $("#" + this.calendarDiv).fullCalendar("getView").end
    )
      .add(1, "month")
      .valueOf();
    this.calendarLayout.calendar_items.forEach(item => {
      // console.log(item,"========item=======")
      let itemApiName = item.ref_object;
      let legend = item.legend;
      legend.forEach(quest => {
        let queryCondition = quest;
        // console.log(this.catagorys,'=======this.catagorys======')
        _.each(this.catagorys, catagory => {
          if (catagory.id === quest.id) {
            queryCondition = catagory;
          }
        });
        // if(!queryCondition.isClass2Visible){
        //   let cri = _.get(queryCondition, "critiria");
        //   let criterias = [];
        //   cri.forEach(field => {
        //       if (field.value == "suborainate_selector_filter") {
        //         let expValue = field.default_value;
        //         if (expValue) {
        //           if (expValue.toString().indexOf("$$CurrentUserId$$") > -1) {
        //             if (expValue[0]) {
        //               expValue.forEach(ev => {
        //                 if (ev == "$$CurrentUserId$$") {
        //                   expValue.splice(expValue.indexOf(ev), 1);
        //                   expValue.push(this.userInfo.userid);
        //                 }
        //               });
        //             }
        //           }
        //           let value = expValue;
        //           criterias.push({
        //             field: field.field,
        //             operator: field.operator,
        //             value: value
        //           });
        //         }
        //       }
        //   });
        //   let record_type = _.get(queryCondition, "record_type");
        //   if (record_type !== undefined && record_type !== null) {
        //     criterias.push({
        //       field: "record_type",
        //       operator: "in",
        //       value: [record_type]
        //     });
        //   }
        //   let joiner = _.get(queryCondition, "joiner");
        //   let startField = "start_time";
        //   if (itemApiName === "time_off_territory") {
        //     startField = "start_date";
        //   } else if (itemApiName === "coach_feedback") {
        //     startField = "coach_date";
        //   }
        //   criterias.push({
        //     field: startField,
        //     operator: ">",
        //     value: [limitStart]
        //   });
        //   criterias.push({
        //     field: startField,
        //     operator: "<",
        //     value: [limitEnd]
        //   });
        //   let element_body = {
        //     objectApiName: itemApiName,
        //     criterias: criterias,
        //     joiner: joiner,
        //     pageSize: 1000,
        //     pageNo: 1
        //   };
        //   queryCondition["item_content"] = item.item_content;
        //   queryCondition["start_field"] = item.start_field;
        //   queryCondition["end_field"] = item.end_field;
        //   queryCondition["ref_object"] = item.ref_object;
        //   this.quests.push(queryCondition);
        //   this.bodys.push(element_body);
        // }
        if (!queryCondition.isClass2Visible) {
          let cri = _.get(queryCondition, "critiria");
          let criterias = [];
          cri.forEach(field => {
            if (field.field_type !== "selector_filter_extender") {
              criterias.push(field);
            } else if (this.searchItem.length > 0) {
              if (this.searchItem.length > 0) {
                if (field.value == "suborainate_selector_filter") {
                  criterias.push({
                    field: field.field,
                    operator: field.operator,
                    value: this.searchItem
                  });
                }
              }
            } else {
              if (field.value == "suborainate_selector_filter") {
                let expValue = field.default_value;
                if (expValue) {
                  if (expValue.toString().indexOf("$$CurrentUserId$$") > -1) {
                    if (expValue[0]) {
                      expValue.forEach(ev => {
                        if (ev == "$$CurrentUserId$$") {
                          expValue.splice(expValue.indexOf(ev), 1);
                          expValue.push(this.userInfo.userid);
                        }
                      });
                    }
                  }
                  let value = expValue;
                  criterias.push({
                    field: field.field,
                    operator: field.operator,
                    value: value
                  });
                }
              }
            }
          });
          let record_type = _.get(queryCondition, "record_type");
          if (record_type !== undefined && record_type !== null) {
            criterias.push({
              field: "record_type",
              operator: "in",
              value: [record_type]
            });
          }
          let joiner = _.get(queryCondition, "joiner");
          let startField = "start_time";
          if (itemApiName === "time_off_territory") {
            startField = "start_date";
          } else if (itemApiName === "coach_feedback") {
            startField = "coach_date";
          }
          criterias.push({
            field: startField,
            operator: ">",
            value: [limitStart]
          });
          criterias.push({
            field: startField,
            operator: "<",
            value: [limitEnd]
          });
          let element_body = {
            objectApiName: itemApiName,
            criterias: criterias,
            joiner: joiner,
            pageSize: 1000,
            pageNo: 1
          };
          queryCondition["item_content"] = item.item_content;
          queryCondition["start_field"] = item.start_field;
          queryCondition["end_field"] = item.end_field;
          queryCondition["ref_object"] = item.ref_object;
          this.quests.push(queryCondition);
          this.bodys.push(element_body);
        }
      });
    });
    this.mainService.getDescribeByApiName("time_off_territory").then(
      (res: any) => {
        let options = {};
        res.body.fields.forEach(field => {
          if (field.api_name === "type") {
            field.options.forEach(option => {
              options[option.value] = option;
            });
          }
        });
        this.mainService.getBatchSearchData(this.bodys).then(
          (res: any) => {
            let i = 0;
            res.body.batch_result &&
              res.body.batch_result.forEach(item => {
                if (item.pageCount !== undefined) {
                  if (item.pageCount > 0) {
                    item.result.forEach(data => {
                      let title = "";
                      let array = this.quests[i].item_content.match(
                        /\{\{(.+?)\}\}/g
                      );
                      this.quests[i].item_content.replace(
                        /\{\{(.+?)\}\}/g,
                        (match, re) => {
                          if (re.indexOf("__r") > -1) {
                            let reData = re.substring(0, re.indexOf("."));
                            let reValue = re.substring(re.indexOf(".") + 1);
                            title += data[reData][reValue];
                          } else {
                            if (array[array.length - 1] !== "{{" + re + "}}") {
                              title += "-";
                            } else {
                              if (re.indexOf("_") > -1) {
                                title +=
                                  data[re.substring(re.indexOf("_") + 1)];
                              } else {
                                if (re === "type") {
                                  if (options[data[re]]) {
                                    title += options[data[re]].label;
                                  }
                                  if (options[data[re]]) {
                                    let key =
                                      "options.time_off_territory.type." +
                                      options[data[re]].value;
                                    if (
                                      key &&
                                      this.translateService.translateFunc(
                                        key
                                      ) !== key
                                    ) {
                                      title = this.translateService.translateFunc(
                                        key
                                      );
                                    }
                                  }
                                } else {
                                  title += data[re];
                                }
                              }
                            }
                          }
                        }
                      );

                      if (data[this.quests[i].start_field] !== undefined) {
                        if (data[this.quests[i].end_field] == undefined) {
                          data[this.quests[i].end_field] =
                            data[this.quests[i].start_field];
                        }
                        if (
                          JSON.stringify(data[this.quests[i].start_field])
                            .length === 13
                        ) {
                          this.eventList.push({
                            title: title,
                            start: moment(
                              data[this.quests[i].start_field]
                            ).format("YYYY-MM-DDTHH:mm:ss"),
                            end: moment(data[this.quests[i].end_field]).format(
                              "YYYY-MM-DDTHH:mm:ss"
                            ),
                            textColor: _.get(this.quests[i], "text_color"),
                            color: _.get(this.quests[i], "bg_color"),
                            data: data,
                            time: moment(data[this.quests[i].start_field])
                          });
                        }
                      }
                    });
                  }
                }
                i = i + 1;
              });
            this.eventList = _.sortBy(this.eventList, "time");
            $("#" + this.calendarDiv).fullCalendar(
              "addEventSource",
              this.eventList
            );
            this.loadItemsCerternDay(moment());
          },
          err => {}
        );
      },
      err => {}
    );
  }

  //catagorys
  selectCatagory() {
    const catagorys = this.catagorys;
    const childTreeList = [];
    if (catagorys.length > 0) {
      _.each(catagorys, catagory => {
        //处理select选项中的label   this.getTranslateLabel(catagory);
        catagory["name"] = this.getTranslateLabel(catagory);
      });
    }
    _.each(catagorys, item => {
      if (!item.isClass2Visible) {
        childTreeList.push(item);
      }
    });
    let modal = this.modals.create(SelectTree, {
      title: "筛选",
      selectTree: catagorys,
      childTreeList: catagorys,
      isAllSelect: catagorys.length == childTreeList.length ? true : false
    });
    modal.present();
    modal.onDidDismiss(items => {
      _.each(this.catagorys, cat => {
        // console.log(this.catagorys, "=======this.catagorys======");
        let is_have = false;
        _.each(items, item => {
          // console.log(cat, "=======items34455======");
          if (item.id === cat.id) {
            is_have = true;
            if (cat.isClass2Visible) {
              cat.isClass2Visible = !cat.isClass2Visible;
            }
          }
        });

        if (!is_have) {
          cat.isClass2Visible = true;
        }
      });

      $("#" + this.calendarDiv).fullCalendar("removeEvents");
      this.getEvents();
    });
  }

  selectSubordinate() {
    const selector = this.calendarLayout.selector_filter_extender;
    if (selector) {
      selector.forEach(filter => {
        if (filter.show_filter) {
          if (filter.extender_item == "SubordinateSelectorFilter") {
            this.getSelectModel();
          }
        }
      });
    }
  }

  getSelectModel() {
    const realTree = [];
    this.searchItem = [];
    this.selectTree.forEach(select => {
      if (select.parent_id == this.userInfo.userid) {
        realTree.push(select);
      }
    });
    let option = this.calendarLayout.selector_filter_extender[0]
      .extender_option;
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
    let modal = this.modals.create(SelectTree, {
      title: title,
      selectTree: realTree,
      childTreeList: this.selectTree
    });
    modal.present();
    modal.onDidDismiss(res => {
      console.log(res, "========res======");
      if (res) {
        if (res.length > 0) {
          this.selectTree.forEach(filter => {
            res.forEach(item => {
              if (this.searchItem.indexOf(item.id) < 0) {
                this.searchItem.push(item.id);
              }
              if (item.id != undefined) {
                if (item.id == filter.id) {
                  filter.checked = true;
                }
              }
              if (item.id == undefined) {
                if (
                  item.parent_id == filter.parent_id &&
                  filter.id == undefined
                ) {
                  filter.checked = true;
                }
              }
            });
          });
          $("#" + this.calendarDiv).fullCalendar("removeEvents");
          console.log();
          this.getEvents(this.searchItem);
        } else {
          $("#" + this.calendarDiv).fullCalendar("removeEvents");
          this.getEvents();
        }
      } else {
        $("#" + this.calendarDiv).fullCalendar("removeEvents");
        this.getEvents();
      }
    });
  }

  getWorkTypeSelect(filter) {
    const searchItems = [];
    const items = filter.object_search_items;
    items.forEach(item => {
      const criterias = [];
      if (item.criteria) {
        item.criteria.forEach(field => {
          if (field.field_type !== "selector_filter_extender") {
            criterias.push(field);
          } else {
            if (field.value == "suborainate_selector_filter") {
              let expValue = field.default_value;
              if (expValue) {
                if (expValue.toString().indexOf("$$CurrentUserId$$") > -1) {
                  if (expValue[0]) {
                    expValue.forEach(ev => {
                      if (ev == "$$CurrentUserId$$") {
                        expValue.splice(expValue.indexOf(ev), 1);
                        expValue.push(this.userInfo.userid);
                      }
                    });
                  }
                }
                let value = expValue;
                criterias.push({
                  field: field.field,
                  operator: field.operator,
                  value: value
                });
              }
            }
          }
        });
      }
      const searchItem = {
        objectApiName: item.apiName,
        joiner: item.joiner ? item.joiner : "and",
        criterias
      };
      searchItems.push(searchItem);
    });
  }

  getCalendarOptions() {
    this.calendarOptions = {
      header: {
        left: "prev,next today",
        center: "title",
        right: "month,agendaWeek,agendaDay"
      },
      views: {
        month: {
          // name of view
          titleFormat: this.translateService.translateFunc(
            "pad.calender_title_format"
          )
          // other view-specific options here
        }
      },
      weekMode: "variable",
      allDayText: this.translateService.translateFunc(
        "pad.calender_alldaytext"
      ),
      monthNames: [
        "1",
        "2",
        "3",
        "4",
        "5",
        "6",
        "7",
        "8",
        "9",
        "10",
        "11",
        "12"
      ],
      dayNames: [
        this.translateService.translateFunc("pad.calender_sunday"),
        this.translateService.translateFunc("pad.calender_monday"),
        this.translateService.translateFunc("pad.calender_tuesday"),
        this.translateService.translateFunc("pad.calender_wednesday"),
        this.translateService.translateFunc("pad.calender_thursday"),
        this.translateService.translateFunc("pad.calender_friday"),
        this.translateService.translateFunc("pad.calender_saturday")
      ],
      dayNamesShort: [
        this.translateService.translateFunc("pad.calender_sunday"),
        this.translateService.translateFunc("pad.calender_monday"),
        this.translateService.translateFunc("pad.calender_tuesday"),
        this.translateService.translateFunc("pad.calender_wednesday"),
        this.translateService.translateFunc("pad.calender_thursday"),
        this.translateService.translateFunc("pad.calender_friday"),
        this.translateService.translateFunc("pad.calender_saturday")
      ],
      buttonText: {
        today: this.translateService.translateFunc("pad.calender_today"),
        month: this.translateService.translateFunc("pad.calender_month_view"),
        week: this.translateService.translateFunc("pad.calender_week_view"),
        day: this.translateService.translateFunc("pad.calender_day_view")
      },
      eventClick: (calEvent, jsEvent, view) => {
        //const data = calEvent.data;
        // const itemApiName = data.object_describe_name;
        // const itemRecordType = data.record_type;
        //this.openItemInfo(data);
      },
      dayClick: (date, jsEvent, view, objs) => {
        this.loadItemsCerternDay(date);
      },
      defaultDate: moment(),
      editable: true,
      eventLimit: true // allow "more" link when too many events
      // defaultView: this.defaultView
    };
  }

  loadItemsCerternDay(date) {
    this.dayEventLists = [];
    const day = date.format("YYYY-MM-DD");
    this.selectDay = day;
    const startTime = moment(day).valueOf();
    const endTime = moment(day)
      .add(1, "d")
      .valueOf();
    this.eventList.forEach(event => {
      let start = event.data.start_time;
      let end = event.data.end_time;
      if (event.data.start_date) {
        start = event.data.start_date;
        end = event.data.end_date;
      }
      if (
        (startTime < start && endTime > start) ||
        (startTime > start && end > startTime) ||
        (startTime > start && endTime < end) ||
        (start > startTime && end < endTime)
      ) {
        this.dayEventLists.push(event);
      }
    });
    if (this.dayEventLists.length === 0) {
      $("#eventList").css("display", "none");
    }
  }

  setDivDisapper() {
    const classes = $(".fc-state-active")[0].getAttribute("class");
    if (classes.indexOf("fc-month-button") < 0) {
      $("#eventList").css("display", "none");
    } else {
      $("#eventList").css("display", "block");
    }
  }

  getTime(time) {
    this.setDivDisapper();
    return moment(time).format("HH:mm");
  }

  compareToLegends(event) {
    let led = undefined;
    this.legends.forEach(legend => {
      if (
        event.color === legend.bg_color &&
        event.textColor === legend.text_color
      ) {
        led = legend;
      }
    });
    if (led !== undefined) {
      if (led["label.i18n_key"]) {
        const label = this.translateService.translateFunc(
          led["label.i18n_key"]
        );
        if (label !== led["label.i18n_key"]) {
          led.label = label;
        }
      }
    }
    return led.label;
  }

  clickTheCard(event) {
    this.openItemInfo(event.data);
  }

  openItemInfo(data) {
    this.detail = this.modals.create(DetailInfoPage, data);
    this.detail.onDidDismiss(res => {
      if (res) {
        this.events.publish("cachePage", DetailPage, [
          data,
          "",
          res[0].record_type
        ]);
        this.nav.push(DetailPage, res);
      }
    });
    this.detail.present();
  }

  ionViewDidLeave() {}
}
