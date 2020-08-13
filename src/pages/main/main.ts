import { Component } from "@angular/core";
import { App, NavController, Events, NavParams } from "ionic-angular";
import { InAppBrowser } from "@ionic-native/in-app-browser";
import { Title } from "@angular/platform-browser";
import { DomSanitizer } from "@angular/platform-browser";
import { Storage } from "@ionic/storage";
import moment from "moment";
import $ from "jquery";
import _ from "lodash";
import {
  LoginService,
  MainService,
  DataService,
  TranslateService,
  HttpService
} from "../../providers/index";
import { UserInfo, config } from "../../utils/index";
import {
  HomePage,
  LoginHaoSenPage,
  NoticePage,
  CalendarPage,
  DetailPage,
  ExternalPage,
  TodoPage
} from "../index";

@Component({
  selector: "page-main",
  templateUrl: "main.html"
})
export class MainPage {
  constructor(
    app: App,
    public navController: NavController,
    public events: Events,
    public userInfo: UserInfo,
    public loginService: LoginService,
    public mainService: MainService,
    public dataService: DataService,
    public translateService: TranslateService,
    public titleService: Title,
    public httpService: HttpService,
    public storage: Storage,
    public navParams: NavParams,
    public inAppBrowser: InAppBrowser,
    public sanitizer: DomSanitizer
  ) {}

  flag = true;
  token: string;
  data: any;
  notice = {};
  eventList = [];
  displayList = [];
  bodys = [];
  kpiResult = [];
  apiNameList = ["call", "event", "time_off_territory"];
  yesterday = moment()
    .subtract(1, "days")
    .format("YYYY-MM-DD 23:59:59");
  tomorrow = moment()
    .add(1, "days")
    .format("YYYY-MM-DD 00:00:00");
  layoutList = [];

  //new home
  homeConfig: any = {};
  isConfigHome = false;
  titleName: any;
  extendersConfig = [];
  activeExtenders = []; //新homeconfig的前端数据
  itemCount: number = 0;
  objectsExtender = [];
  displayObjectSections = []; //新homeconfig里面object类型的总数据
  newEventList: any = [];
  newDisplayList: any = [];
  newLayoutList: any = [];
  newDescribeList: any = [];
  watermark: any;
  main_reports: any;

  hidemenu() {
    this.flag = this.flag ? false : true;
    this.events.publish("menu:control", this.flag);
  }

  logout() {
    this.loginService.logout().then(() => {
      this.events.publish("menu:control", false);
      this.navController.setRoot(LoginHaoSenPage);
    });
  }
  getTitleName() {
    let oldTitleName = this.translateService.translateFunc(
      "pad.main_page_title"
    );
    if (this.isConfigHome && !!this.activeExtenders && this.titleName) {
      return this.titleName;
    }
    return oldTitleName;
  }
  ionViewWillEnter() {
    // if (window["homeConfig"]) {
    //   this.homeConfig = JSON.parse(window["homeConfig"]);
    // } else {
    //   this.homeConfig = this.navParams.data;
    // }
    // this.httpService.reqEnd();
    // this.dataService.init();
    // this.token = this.userInfo.token;
    // this.events.subscribe("main:pageJump", (page, params) => {
    //   this.navController.push(page, params);
    // });
    // if (_.isEmpty(this.homeConfig)) {
    //   this.storage.get("subList").then(res => {
    //       if(res){
    //         const result = JSON.parse(res);
    //         if (result && result[5] && result[5].body && result[5].body.value) {
    //           this.homeConfig = JSON.parse(result[5].body.value);
    //           this.isConfigHome = true;
    //           // 解析homeConfig
    //           this.renderNewHome(this.homeConfig);
    //         }else {
    //           this.queryForHome();
    //         }
    //       }else if(res == null){
    //         if(window["homeConfig"]){
    //           let config = JSON.parse(window["homeConfig"])
    //           this.isConfigHome = true;
    //           this.renderNewHome(config);
    //         }
    //       }
    //   });
    // } else {
    //   this.isConfigHome = true;
    //   //解析homeConfig
    //   this.renderNewHome(this.homeConfig);
    // }
    let winHomeConfig = window["homeConfig"];
    let navParmHomeConfig = this.navParams.data || "";
    this.homeConfig = winHomeConfig
      ? JSON.parse(winHomeConfig)
      : navParmHomeConfig;

    this.httpService.reqEnd();
    this.dataService.init();
    this.token = this.userInfo.token;
    this.events.subscribe("main:pageJump", (page, params) => {
      this.navController.push(page, params);
    });
    if (!_.isEmpty(this.homeConfig)) {
      this.isConfigHome = true;
      //解析homeConfig
      this.renderNewHome(this.homeConfig);
    } else {
      this.queryForHome();
    }

    this.mainService.getMenus().then((res: any) => {
      const array = _.sortBy(res.body.items, "display_order");
      const tabs = [];
      for (let x in array) {
        if (array[x].api_name !== "alert") {
          tabs.push(array[x]);
        }
      }
      this.events.publish("menu:change", tabs, "main");
    });
  }

  queryForHome() {
    //获取今日待办事项，并按时间排序 & 获取最新公告
    this.bodys = [];
    let body = {
      objectApiName: "notice",
      criterias: [
        {
          field: "profiles",
          operator: "contains",
          value: ["$$CurrentProfileId$$"]
        },
        { field: "expire_date", operator: ">", value: [new Date().getTime()] }
      ],
      pageSize: 1,
      pageNo: 1,
      orderBy: "publish_date",
      order: "desc",
      joiner: "and"
    };
    this.bodys.push(body);
    this.apiNameList.forEach(apiName => {
      let fie;
      if (apiName == "call" || apiName == "event") {
        fie = "start_time";
      } else {
        fie = "start_date";
      }
      if (apiName == "call") {
        let body = {
          objectApiName: apiName,
          criterias: [
            {
              field: fie,
              operator: ">",
              value: [moment(this.yesterday).format("x")]
            },
            {
              field: fie,
              operator: "<",
              value: [moment(this.tomorrow).format("x")]
            },
            { field: "status", operator: "in", value: ["1", "2", "3"] },
            {
              field: "create_by",
              operator: "in",
              value: [this.userInfo.userid]
            }
          ],
          order: "desc",
          orderBy: "start_time",
          joiner: "and"
        };
        this.bodys.push(body);
      }
      if (apiName == "event") {
        let body = {
          objectApiName: apiName,
          criterias: [
            { field: "status", operator: "in", value: ["1", "2"] },
            {
              field: fie,
              operator: ">",
              value: [moment(this.yesterday).format("x")]
            },
            {
              field: fie,
              operator: "<",
              value: [moment(this.tomorrow).format("x")]
            },
            {
              field: "create_by",
              operator: "in",
              value: [this.userInfo.userid]
            }
          ],
          orderBy: "start_time",
          order: "desc",
          joiner: "and"
        };
        this.bodys.push(body);
      }
      if (apiName == "time_off_territory") {
        let body = {
          objectApiName: apiName,
          criterias: [
            {
              field: fie,
              operator: ">",
              value: [moment(this.yesterday).format("x")]
            },
            {
              field: fie,
              operator: "<",
              value: [moment(this.tomorrow).format("x")]
            },
            { field: "status", operator: "==", value: [1] },
            {
              field: "create_by",
              operator: "in",
              value: [this.userInfo.userid]
            }
          ],
          order: "desc",
          orderBy: "",
          joiner: "and"
        };
        this.bodys.push(body);
      }
    });

    this.displayHome(this.bodys);

    //解决报未知错误的问题 豪森没有kpi功能
    // this.mainService.getMyKpi(this.userInfo.userid).then((res: any) => {
    //   this.httpService.reqEnd();
    //   //console.log(res);
    //   const myKpis = res.body;
    //   this.kpiResult = myKpis.kpi_result;
    // });
  }

  displayHome(bodys) {
    Promise.all([
      this.mainService.getDescribeByApiName("time_off_territory"),
      this.mainService.getBatchSearchData(bodys)
    ]).then((res: any) => {
      let tot_fields = res[0].body.fields;
      let tot_options = [];
      tot_fields.forEach(field => {
        if (field.api_name === "type") {
          tot_options = field.options;
        }
      });

      this.eventList = [];
      this.displayList = [];
      res[1].body.batch_result.forEach(item => {
        item.result.forEach(data => {
          if (data.object_describe_name === "notice") {
            this.notice = data;
          } else {
            this.eventList.push(data);
          }
        });
      });
      let PromiseList = [];
      this.apiNameList.forEach(apiName => {
        const promise = this.mainService.getLayoutByApiNameAndPageType(
          apiName,
          "index_page",
          "master"
        );
        PromiseList.push(promise);
      });
      Promise.all(PromiseList).then((res: any) => {
        this.httpService.reqEnd();
        this.layoutList = [];
        res.forEach(item => {
          let body: any;
          if (item.body["containers"]) {
            body = item.body["containers"][0].components[0];
          }
          this.layoutList.push({
            key: item.body["object_describe_api_name"],
            value: body
          });
        });
        this.getDisplay(this.eventList, tot_options);
      });
    });
  }

  ionViewDidEnter() {
    this.titleService.setTitle("SFE");
  }

  ionViewDidLoad() {
    //const time = moment().format('YYYY-MM-DD') + ' ' + moment().hour() + ':00';
    const crmpowerSetting = window["crmpowerSetting"];
    if (crmpowerSetting.show_watermak) {
      let waterText = "";
      const waterMarkConfig = window["waterMarkConfig"];
      const watermarkTxt = waterMarkConfig.watermark_txt;
      watermarkTxt &&
        _.each(watermarkTxt, wT => {
          if (wT.data_type === "system") {
            if (wT.object_describe_name === "user_info") {
              waterText += this.userInfo.user[wT.field];
              waterText += "  ";
            }
          } else if (wT.data_type === "custom") {
            if (wT.expression) {
              let value = this.callAnotherFunc(
                new Function("t", wT.expression),
                {}
              );
              if (wT.expression_type === "data_time") {
                const formatStr = wT.format ? wT.format : "YYYY-MM-DD HH:mm:ss";
                value = moment(value).format(formatStr);
              }
              waterText += value;
              waterText += "  ";
            }
          }
        });
      // window['watermark']({preventTamper:true ,text:waterText})
      const defaultWaterSettings = {
        watermark_txt: waterText,
        watermark_x: waterMarkConfig.watermark_x, //水印起始位置x轴坐标
        watermark_y: waterMarkConfig.watermark_y, //水印起始位置Y轴坐标
        watermark_rows: waterMarkConfig.watermark_rows, //水印行数
        watermark_cols: waterMarkConfig.watermark_cols, //水印列数
        watermark_x_space: waterMarkConfig.watermark_x_space, //水印x轴间隔
        watermark_y_space: waterMarkConfig.watermark_y_space, //水印y轴间隔
        watermark_color: waterMarkConfig.watermark_color, //水印字体颜色
        watermark_alpha: waterMarkConfig.watermark_alpha, //水印透明度
        watermark_fontsize: waterMarkConfig.watermark_fontsize, //水印字体大小
        watermark_font: waterMarkConfig.watermark_font, //水印字体
        watermark_width: waterMarkConfig.watermark_width, //水印宽度
        watermark_height: waterMarkConfig.watermark_height, //水印长度
        watermark_angle: waterMarkConfig.watermark_angle //水印倾斜度数
      };
      window["watermark"](defaultWaterSettings);
    }
  }

  gotoDetail(disp) {
    let record_type = disp.data.record_type || "master";
    let api_name = disp.data.object_describe_name;
    if (api_name === "alert") {
      const { data } = disp;
      const { id } = data;
      data["status"] = "1";
      this.mainService.putDataByApiNameAndId(api_name, data, id);
    }
    this.mainService
      .getLayoutByApiNameAndPageType(api_name, "detail_page", record_type)
      .then((res: any) => {
        const detail_layout = res.body;
        let flag = "false";
        if (detail_layout.containers != undefined) {
          const components = detail_layout.containers[0].components;
          components.forEach(component => {
            if (component.type == "related_list") {
              flag = "true";
            }
          });
        }
        if (flag == "true") {
        }
        //this.events.publish('menu:relatePageType', 'main');
        this.events.publish("main:pageJump", DetailPage, [
          disp.data,
          "",
          "detail"
        ]);
      });
  }

  gotoNoticePage() {
    this.navController.setRoot(NoticePage);
  }

  gotoCalendar() {
    this.mainService.getCalendarLayout().then((res: any) => {
      const calendarLayout = JSON.parse(res.body.value);
      let params = [];
      params.push(calendarLayout);
      params.push("basicDay");
      this.navController.setRoot(CalendarPage, params);
    });
  }

  getMaindata() {
    this.mainService.getMainpage(this.userInfo.userid).then((res: any) => {
      const data = res;
      return data;
    });
  }

  getDisplay(eventList, tot_options) {
    for (let eve of eventList) {
      let layout = undefined;
      this.layoutList.forEach(item => {
        if (item.key == eve.object_describe_name) {
          layout = item.value;
        }
      });
      if (eve.object_describe_name === "call") {
        let color: any;
        if (eve.status === "1") {
          color = "#40d1a9";
        }
        if (eve.status === "2") {
          color = "#45b9e9";
        }
        if (eve.status === "3") {
          color = "#368fe9";
        }
        if (layout !== undefined) {
          let fields = layout.fields;
          if (fields) {
            fields.forEach(field => {
              if (field.tag_color) {
                color = field.tag_color[eve.status];
              }
            });
          }
        }
        this.displayList.push({
          label: this.translateService.translateFunc("pad.object_name_call"),
          start_time: eve.start_time,
          content: eve.customer__r.name,
          start: moment(eve.start_time).format("HH:mm"),
          color: color,
          data: eve
        });
      }
      if (eve.object_describe_name === "event") {
        let color: any;
        if (eve.status === "1") {
          color = "#ff967d";
        }
        if (eve.status === "2") {
          color = "#fc636b";
        }
        if (layout !== undefined) {
          let fields = layout.fields;
          if (fields) {
            fields.forEach(field => {
              if (field.tag_color) {
                color = field.tag_color[eve.status];
              }
            });
          }
        }
        this.displayList.push({
          label: this.translateService.translateFunc(
            "pad.main_condition_event"
          ),
          start_time: eve.start_time,
          content: eve.name,
          start: moment(eve.start_time).format("HH:mm"),
          color: color,
          data: eve
        });
      }
      if (eve.object_describe_name === "time_off_territory") {
        let content: any;
        let color: any;
        tot_options.forEach(option => {
          if (option.value === eve.type) {
            content = option.label;
            let key = "options.time_off_territory.type." + eve.type;
            if (this.translateService.translateFunc(key) !== key) {
              content = this.translateService.translateFunc(key);
            }
          }
        });
        color = "#ccd7dd";
        if (layout !== undefined) {
          let fields = layout.fields;
          if (fields) {
            fields.forEach(field => {
              if (field.tag_color) {
                color = field.tag_color[eve.status];
              }
            });
          }
        }
        this.displayList.push({
          label: this.translateService.translateFunc("pad.main_condition_TOT"),
          start_time: eve.start_date,
          content: content,
          start: moment(eve.start_date).format("HH:mm"),
          color: color,
          data: eve
        });
      }
    }
    let element = {};
    for (var i = 0; i < this.displayList.length; i++) {
      for (var j = i + 1; j < this.displayList.length; j++) {
        if (
          moment(this.displayList[j].start_time).format("x") <
          moment(this.displayList[i].start_time).format("x")
        ) {
          element["label"] = this.displayList[i].label;
          element["start_time"] = this.displayList[i].start_time;
          element["content"] = this.displayList[i].content;
          element["start"] = this.displayList[i].start;
          element["data"] = this.displayList[i].data;
          element["color"] = this.displayList[i].color;
          this.displayList[i].label = this.displayList[j].label;
          this.displayList[i].start_time = this.displayList[j].start_time;
          this.displayList[i].content = this.displayList[j].content;
          this.displayList[i].start = this.displayList[j].start;
          this.displayList[i].data = this.displayList[j].data;
          this.displayList[i].color = this.displayList[j].color;
          this.displayList[j].label = element["label"];
          this.displayList[j].start_time = element["start_time"];
          this.displayList[j].content = element["content"];
          this.displayList[j].start = element["start"];
          this.displayList[j].data = element["data"];
          this.displayList[j].color = element["color"];
        }
      }
    }
  }

  getIconFromApiName(item) {
    this.itemCount++;
    const pngs = ["b0", "b1", "b2", "b3"];
    const index = this.itemCount % 4;
    const url = `assets/home/${pngs[index]}.png`;
    return url;
  }

  //根据传进来的数据来构建extendersConfig
  getExtenders(extendersConfig) {
    this.objectsExtender = [];
    const items = [];
    _.each(extendersConfig, item => {
      const hidden_expression = item.hidden_expression;
      if (hidden_expression) {
        const isHidden = this.callAnotherFunc(
          new Function("t", hidden_expression),
          {}
        );
        if (!isHidden) {
          const { content } = item;
          if (content && item.extender_type === "web") {
            const url = content.ref_url;
            const params = content.params;
            if (params && params.length > 0 && !item["url"]) {
              const finalUrl = this.generateUrl(url, params);
              //console.log(finalUrl);
              item["url"] = this.sanitizer.bypassSecurityTrustResourceUrl(
                finalUrl
              );
            }
          }
          if (item.extender_type === "objects") {
            this.objectsExtender.push(item);
          }
          items.push(item);
        }
      } else {
        const { content } = item;
        if (content && item.extender_type === "web") {
          let hidden_expression = content.hidden_expression;
          const isHidden = this.callAnotherFunc(
            new Function("t", hidden_expression),
            {}
          );

          if (!isHidden) {
            const url = content.ref_url;
            const params = content.params;
            if (params && params.length > 0 && !item["url"]) {
              let finalUrl = this.generateUrl(url, params);
              finalUrl = this.sanitizer.bypassSecurityTrustResourceUrl(
                finalUrl
              );
              finalUrl && this.setReportUrl(item, finalUrl);
            }
          } else {
            return;
          }
        }
        if (item.extender_type === "objects") {
          this.objectsExtender.push(item);
        }
        items.push(item);
      }
    });
    this.getDataFromObjects(this.objectsExtender);
    return items;
  }

  //jsonp设置报告地址
  setReportUrl(item, finalUrl) {
    let username = "SERVICE04"; //获取输入的用户名
    let password = "Sfe_fr@123"; //获取输入的参数
    $.ajax({
      url: config.api.report, //单点登录的管理平台报表服务器
      dataType: "jsonp", //跨域采用jsonp方式
      data: { fr_username: username, fr_password: password }, //获取用户名密码
      jsonp: "callback",
      timeout: 5000, //超时时间（单位：毫秒）

      success: function(data) {
        if (data.status === "success") {
          item["url"] = finalUrl;
          //登录成功
        } else if (data.status === "fail") {
          //登录失败（用户名或密码错误）
        }
      },
      error: function() {
        // 登录失败（超时或服务器其他错误）
      }
    });
  }

  //构建类型是objetcs的前端展示的数据 show_in_devices是构建提条件
  getDataFromObjects(objExtenders) {
    this.displayObjectSections = [];
    _.each(objExtenders, extender => {
      const { content } = extender;
      const { display_items } = content;
      if (display_items && display_items.length > 0) {
        _.each(display_items, item => {
          const { show_in_devices } = item;
          if (
            (show_in_devices && show_in_devices.length < 1) ||
            !show_in_devices
          ) {
            this.displayObjectSections.push(item);
          }
        });
      }
    });
    this.fetchDataFromServer(this.displayObjectSections);
  }

  fetchDataFromServer(objectSections) {
    //console.log('this.displayObjectSections ====>', this.displayObjectSections)
    const queryCondition = [];
    const apiNameList: any = [];
    const renderStyleList: any = [];

    _.each(objectSections, section => {
      const { ref_objects } = section;
      _.each(ref_objects, ref_object => {
        const {
          api_name,
          criterias,
          joiner,
          order,
          order_by,
          render_style
        } = ref_object;
        const criteria = [];

        //apiList
        if (!apiNameList.includes(api_name)) {
          apiNameList.push(api_name);
        }
        //renderStyleList
        renderStyleList.push({
          apiName: api_name,
          render_style: render_style
        });
        let is_have = false;
        renderStyleList.forEach(renderItem => {
          if (renderItem.apiName === api_name) {
            is_have = true;
          }
        });
        if (!is_have) {
          //配置两个的时候报错 getNewDisplay 取不到newRenderList
          // if (renderStyleList.length < 1) {
          //   renderStyleList.push({
          //     apiName: api_name,
          //     render_style: render_style
          //   });
          // }
          //解除长度限制，不报错了。
          renderStyleList.push({
            apiName: api_name,
            render_style: render_style
          });
        }

        //queryCondition
        _.each(criterias, cri => {
          if (cri.value && cri.value["type"] === "js") {
            const value = this.callAnotherFunc(
              new Function("t", cri.value["expression"]),
              {}
            );
            criteria.push({
              field: cri.field,
              operator: cri.operator,
              value: [value]
            });
          } else {
            criteria.push(cri);
          }
        });
        queryCondition.push({
          objectApiName: api_name,
          joiner: joiner ? joiner : "and",
          order: order ? order : "desc",
          order_by: order_by ? order_by : "update_time",
          criterias: criteria
        });
      });
    });
    this.displayNewHome(queryCondition, apiNameList, renderStyleList);
  }
  //批量调用接口 batchQueryResult 并且 获取layout describe
  displayNewHome(bodys, apiNameList, renderStyleList) {
    Promise.all([this.mainService.getBatchSearchData(bodys)]).then(
      (res: any) => {
        this.newEventList = [];
        res[0].body.batch_result.forEach(item => {
          // if(item.result.length === 0){
          //   this.newEventList.push({api_name:'no_data',data:[]});
          // }else{
          // }
          item.result.forEach(data => {
            this.newEventList.push(data);
          });
        });
        const PromiseList = [];
        const describeList = [];
        apiNameList.forEach(apiName => {
          //layout
          const promise = this.mainService.getLayoutByApiNameAndPageType(
            apiName,
            "index_page",
            "master"
          );
          PromiseList.push(promise);

          //describe
          const desPromise = this.mainService.getDescribeByApiName(apiName);
          describeList.push(desPromise);
        });
        Promise.all(describeList).then((res1: any) => {
          if (res1 && res1.length > 0) {
            res1.forEach(result => {
              const { body } = result;
              this.newDescribeList.push(body);
            });
          }
          Promise.all(PromiseList).then((res: any) => {
            this.newLayoutList = [];
            res.forEach(item => {
              //layout
              let body: any;
              if (item.body["containers"]) {
                body = item.body["containers"][0].components[0];
              }

              //describe
              let describe: any;
              this.newDescribeList.forEach(desc => {
                if (desc.api_name === item.body["object_describe_api_name"]) {
                  describe = desc;
                }
              });

              //style
              let renderStyle: any;
              renderStyleList.forEach(renderItem => {
                if (
                  renderItem.apiName === item.body["object_describe_api_name"]
                ) {
                  renderStyle = renderItem.render_style;
                }
              });
              this.newLayoutList.push({
                key: item.body["object_describe_api_name"],
                layout: body,
                describe: describe,
                renderStyle: renderStyle
              });
            });
            this.getNewDisplay(this.newLayoutList, this.newEventList);
          });
        });
      }
    );
  }

  getFilter(newDisplayList, displayItem) {
    const filterApiNameList: any = [];
    if (displayItem) {
      const { ref_objects = [] } = displayItem;
      _.each(ref_objects, obj => {
        if (obj && obj.api_name) {
          filterApiNameList.push(obj.api_name);
        }
      });
    }

    // const finalDisplayList: any = [];
    // _.each(newDisplayList, data => {
    //   if (data && filterApiNameList.includes(data.object_describe_name)) {
    //     finalDisplayList.push(data);
    //   }
    // })
    // return finalDisplayList;
    const finalDisplayList: any = [];
    const readlist: any = [];
    const unreadlist: any = [];
    _.each(newDisplayList, data => {
      if (data && filterApiNameList.includes(data.object_describe_name)) {
        if (data.object_describe_name == "alert" && data.data.status == "0") {
          unreadlist.push(data);
        } else if (
          data.object_describe_name == "alert" &&
          data.data.status == "1"
        ) {
          readlist.push(data);
        }
        if (data.object_describe_name == "notice") {
          unreadlist.push(data);
          readlist.push(data);
        }
      }
    });
    if (unreadlist.length == 0) {
      return readlist;
    } else {
      return unreadlist;
    }
  }

  //根据newlayoutlist 和batchQueryResult 判断object_describe_name === key（上面的item.body["object_describe_api_name"]）符合条件以后 构建object类型 前端需要展示的数据源 this.newDisplayList
  /* 
  this.newDisplayList.push({
              renderTag,
              renderContents,
              endContents
            })
  */
  getNewDisplay(newRenderList, newEventList) {
    this.newDisplayList = [];
    _.each(newEventList, event => {
      _.each(newRenderList, renderOption => {
        if (event && event.object_describe_name === renderOption.key) {
          const { renderStyle, describe, layout } = renderOption;
          const { tag, content, end } = renderStyle;
          //tag
          const renderTag = {};
          if (tag) {
            renderTag["background_color"] = tag.background_color
              ? tag.background_color
              : "#45b9e9";
            renderTag["font_size"] = tag.font_size ? tag.font_size : "14px";
            renderTag["color"] = tag.color ? tag.color : "#000";
            if (tag.field_type === "custom") {
              renderTag["value"] = tag.name;
            } else if (tag.field_type === "system") {
              renderTag["value"] = this.getValueFromData(
                tag.field,
                describe,
                layout,
                event
              );
            }
          }

          //content
          const renderContents = [];
          if (content && content.length) {
            _.each(content, cnt => {
              let renderContent = [];
              renderContent["background_color"] = cnt.background_color
                ? cnt.background_color
                : "#45b9e9";
              renderContent["font_size"] = cnt.font_size
                ? cnt.font_size
                : "14px";
              renderContent["color"] = cnt.color ? cnt.color : "#000";
              if (cnt.field_type === "custom") {
                renderContent["value"] = cnt.name;
              } else if (cnt.field_type === "system") {
                renderContent["value"] = this.getValueFromData(
                  cnt.field,
                  describe,
                  layout,
                  event
                );
              }
              renderContents.push(renderContent);
            });
          }

          //end
          const endContents = [];
          if (end && end.length) {
            _.each(end, cnt => {
              let endContent = {};
              endContent["background_color"] = cnt.background_color
                ? cnt.background_color
                : "#45b9e9";
              endContent["font_size"] = cnt.font_size ? cnt.font_size : "14px";
              endContent["color"] = cnt.color ? cnt.color : "#000";
              if (cnt.field_type === "custom") {
                endContent["value"] = cnt.name;
              } else if (cnt.field_type === "system") {
                endContent["value"] = this.getValueFromData(
                  cnt.field,
                  describe,
                  layout,
                  event
                );
              }
              endContents.push(endContent);
            });
          }

          //构造点击具体一项的时候用的数据 data :event
          this.newDisplayList.push({
            object_describe_name: event.object_describe_name,
            renderTag,
            renderContents,
            endContents,
            data: event
          });
        }
      });
    });
  }

  gotoNewMore(displayItem) {
    const { ref_objects, item_api } = displayItem;
    if (item_api === "my_schedule") {
      this.gotoCalendarPage();
    } else if (item_api === "todo") {
      //
      this.navController.push(TodoPage, this.newDisplayList);
    } else {
      const objects = ref_objects[0];
      const objectApiName = objects.api_name;
      const recordType = objects.record_type ? objects.record_type : "master";
      const tab = {
        object_describe_api_name: objectApiName,
        record_type: recordType
      };
      this.navController.setRoot(HomePage, tab);
    }
  }

  getContent(renderContents) {
    //console.log(renderContents);
    let value = "";
    _.each(renderContents, render => {
      value += render.value;
    });
    return value;
  }

  getValueFromData(field, describe, layout, event) {
    const describeFields = describe.fields;
    let des: any;
    describeFields.forEach(desc => {
      if (desc.api_name === field) {
        des = desc;
      }
    });
    if (des.options && des.options.length > 0) {
      let value = "";
      _.each(des.options, option => {
        if (option.value === event[field]) {
          value = option.label;
        }
      });
      return value;
    } else {
      return event[field];
    }
  }

  getItems(displayItems, type) {
    const items = [];
    _.each(displayItems, item => {
      const hidden_expression = item.hidden_expression;
      const isHidden = this.callAnotherFunc(
        new Function("t", hidden_expression),
        {}
      );
      if (!isHidden) {
        if (type === "belt") {
          if (!item["iconUrl"]) {
            item["iconUrl"] = this.getIconFromApiName(item);
          }
        }
        items.push(item);
      }
    });
    return items;
  }

  beltItemClick(item) {
    switch (item.api_name) {
      case "webview":
        const type = item.type;
        const url = item.src;
        const params = item.params;
        const finalUrl = this.generateUrl(url, params);
        if (type === "internal") {
          const tab = {
            external_page_src: finalUrl
          };
          this.navController.setRoot(ExternalPage, tab);
        } else {
          let browser = this.inAppBrowser.create(finalUrl, "_system");
          browser.on("loadstart").subscribe(res => {
            if (res.url.indexOf("success") > -1) {
              console.log("success");
              browser.close();
            }
          });
        }
        break;
      case "schedule":
        this.gotoCalendarPage();
        break;
      default:
        const critirias = item.critirias;
        let record_type = "master";
        if (critirias && critirias.length > 0) {
          _.each(critirias, cri => {
            if (cri.field === "record_type") {
              record_type = cri.value;
            }
          });
        }
        const tab = {
          object_describe_api_name: item.api_name,
          record_type: record_type,
          criterias: critirias
        };
        console.log("after click beltItem de tab is ==>", tab);
        this.navController.setRoot(HomePage, tab);
        break;
    }
  }

  gotoCalendarPage() {
    this.httpService.reqStart();
    this.mainService.getCalendarLayout().then((res: any) => {
      this.httpService.reqEnd();
      if (res.body.value) {
        const calendarLayout = JSON.parse(res.body.value);
        this.navController.setRoot(CalendarPage, calendarLayout);
      } else {
        console.error("calendar layout missing");
      }
    });
  }

  generateUrl(url, params) {
    if (!params || params.length === 0) {
      return url;
    } else {
      let paramUrl = "";
      _.each(params, param => {
        if (param.type === "js") {
          paramUrl +=
            param.name +
            "=" +
            this.callAnotherFunc(new Function("t", param.value), {});
          paramUrl += "&";
        } else {
          paramUrl += param.name + "=" + param.value;
          paramUrl += "&";
        }
      });
      if (url.indexOf("?") > -1) {
        return url + "&" + paramUrl;
      } else {
        return url + "?" + paramUrl;
      }
    }
  }

  // new home functions
  renderNewHome(homeConfig) {
    if (!_.isEmpty(homeConfig)) {
      const { extenders_config, title_config } = homeConfig;
      if (!_.isEmpty(title_config)) {
        const { name, value } = title_config;
        this.titleName = name || value;
      }
      if (extenders_config.length > 0) {
        this.extendersConfig = extenders_config;
        this.activeExtenders = this.getExtenders(this.extendersConfig);
        let body = {};
        this.mainService.getreports(body).then(res => {
          this.main_reports = res.body.value;
          if (!_.isEmpty(this.main_reports)) {
            let reports = {
              extender_type: "reports",
              value: this.main_reports
            };
            this.activeExtenders.push(reports);
          }
        });
      }
    } else {
      this.isConfigHome = false;
      this.queryForHome();
    }
  }

  callAnotherFunc(fnFunction: Function, vArgument) {
    if (_.isFunction(fnFunction)) {
      return (<Function>fnFunction)(vArgument);
    } else {
      return true;
    }
  }

  ionViewDidLeave() {
    this.events.unsubscribe("main:pageJump");
  }
}
