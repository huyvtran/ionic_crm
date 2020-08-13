import { Injectable } from "@angular/core";
import { Events } from "ionic-angular";
import { Storage } from "@ionic/storage";
import { config, UserInfo } from "../utils/index";
import { HttpService } from "./http-service";
import _ from "lodash";
@Injectable()
export class MainService {
  constructor(
    public storage: Storage,
    public httpService: HttpService,
    public userInfo: UserInfo,
    public events: Events
  ) {}

  /**
   * 获取菜单
   */
  getMenus() {
    return this.httpService.get(config.api.index_menu);
  }
  getreports(body) {
    return this.httpService.post(config.api.main_reports, body);
  }
  /**
   * 提交新增
   * @param apiName 提交数据接口的api_name
   * @param id 提交数据的数据id,当没有id的时候，为新增数据，有id的时候为编辑数据
   * @param body 提交数据的 数据集合
   */
  pushDataByApiNameAndId(apiName, body) {
    const url = config.api.record
      .replace("{api_name}", apiName)
      .replace("{id}", "");
    return this.httpService.post(url, body);
  }

  /**
   *
   * @param apiName 编辑数据的接口api_name
   * @param body 编辑的数据体
   * @param id 编辑的这条数据的id
   */
  putDataByApiNameAndId(apiName, body, id) {
    const url = config.api.record
      .replace("{api_name}", apiName)
      .replace("{id}", id);
    return this.httpService.put(url, body);
  }

  /**
   * 删除数据接口
   * @param apiName 要删除的apiName
   * @param id 要删除的一条数据的主id
   */
  deleteDataByApiNameAndId(apiName, id) {
    const url = config.api.record
      .replace("{api_name}", apiName)
      .replace("{id}", id);
    return this.httpService.delete(url);
  }

  /**
   * 获取单条数据
   * @param apiName 获取数据接口的api_name
   * @param id 获取数据接口的id
   */
  getDataByApiNameAndId(apiName, id, isOnline?: boolean) {
    if (isOnline == undefined) {
      isOnline = true;
    }
    const url = config.api.record
      .replace("{api_name}", apiName)
      .replace("{id}", id);
    return this.httpService.get(url);
  }

  /**
   * 搜索/查询 数据接口
   * @param body 搜索数据的搜索条件
   */
  getSearchData(body) {
    const url = config.api.search_url;
    if (body["criterias"] && body["criterias"].length > 0) {
      let criterias = body["criterias"];
      criterias.forEach(element => {
        if (
          element.field == "employee" ||
          element.field == "manager" ||
          element.field == "event" ||
          element.field == "customer"
        ) {
          element.value.forEach(val => {
            element.value.splice(element.value.indexOf(val), 1);
            element.value.push(parseInt(val));
          });
        }
        if (!_.isEmpty(_.get(element.value, "params", ""))) {
          element.actionName = element.value.action;
          element.params = element.value.params;
          delete element.value;
        }
      });
    }
    return this.httpService.post(url, body);
  }
  /**
   * 批量搜索/查询 数据接口
   *  @param body 搜索数据的搜索条件
   */
  getBatchSearchData(body) {
    const url = config.api.batch_search_url;
    return this.httpService.post(url, body);
  }

  /**
   * 获取某种layout_type的布局文件
   * @param apiName 获取layout所需要的api_name
   * @param pageType 获取数据的layout_type
   */
  getLayoutByApiNameAndPageType(apiName, pageType, recordType = "") {
    let url = config.api.layout
      .replace("{api_name}", apiName)
      .replace("{layout_type}", pageType);
    if (recordType && recordType !== "no_record") {
      let param = [["recordType", recordType]];
      return this.httpService.get(url, param);
    } else {
      return this.httpService.get(url);
    }
  }

  /**
   * 获取某条数据的详情布局信息
   * @param apiName 获取详情布局的api_name
   * @param id 对应详情数据的id
   */
  // getDetailLayout(apiName, id) {
  //   const url = config.api.record.replace('{api_name}', apiName).replace('{id}', id);
  //   return this.httpService.get(url, [['includeFields', 'true']]);
  // }

  //describeHandler

  /**
   * 根据api_name获取布局的描述文件
   * @param apiName 获取描述文件的api_name
   */
  getDescribeByApiName(apiName) {
    return this.httpService.get(
      config.api.describe.replace("{api_name}", apiName),
      [["includeFields", "true"]]
    );
  }

  /**
   * 获取主页数据
   *
   */
  getMainpage(id) {
    const url = config.api.user_data.replace("{id}", id);
    return this.httpService.get(url);
  }

  /**
   * 批量提交接口
   */

  batchCreate(apiName, body) {
    const url = config.api.batchCreate.replace("{api_name}", apiName);
    return this.httpService.post(url, body);
  }
  /**
   * 目标医生批量提交接口
   */

  batch_addition(apiName, body) {
    const url = config.api.batch_addition.replace("{api_name}", apiName);
    return this.httpService.post(url, body);
  }

  /**
   * 批量更新接口
   */
  batchUpdate(apiName, body) {
    const url = config.api.batchUpdate.replace("{api_name}", apiName);
    return this.httpService.put(url, body);
  }

  /**
   * 从服务端获取jwt数据
   * @param body 要转换为jwt的数据集合
   */
  getJwtDataFromServer(body) {
    const url = config.api.jwtData;
    return this.httpService.post(url, body);
  }

  /**
   * 获取日历布局
   */
  getCalendarLayout() {
    const url = config.api.calendar;
    return this.httpService.get(url);
  }

  /**首页我的kpi报告 */
  getMyKpi(userId) {
    const url = config.api.myKpi.replace("{user_id}", userId);
    return this.httpService.get(url);
  }

  /**获取所有下级 */
  getSubordinate(userId) {
    const url = config.api.listSubordinate.replace("{user_id}", userId);
    return this.httpService.get(url);
  }

  /**获取直接下属 */
  getlistTutorial(userId) {
    const url = config.api.listTutorial.replace("{user_id}", userId);
    return this.httpService.get(url);
  }

  /* 手动同步 */
  doSync() {
    // 在线版本专用的虚拟同步
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        resolve();
      }, 3000);
    });
  }

  /**获取布局分配对象
   * 现在还没用到
   */
  getLayoutAssignObject() {
    const url = config.api.layout_assign;
    return this.httpService.get(url).then((res: any) => {});
  }

  //jsop
  // jsopMethod(finalUrl:any){
  //     let  username = 'SERVICE04'//获取输入的用户名
  //     let  password = 'Sfe_fr@123'//获取输入的参数
  //     let url =  config.api.report;
  //     let dataObj = {
  //       data: { "fr_username": username, "fr_password": password },//获取用户名密码
  //       jsonp: "callback",
  //       timeout: 5000
  //     }
  //     return this.httpService.jsonpGet(url,dataObj).then((res:any)=>{
  //           console.log(res)

  //     })
  // }

  //weixin
  getWxConfig(body) {
    const url = config.api.wx_config;
    return this.httpService.post(url, body);
  }

  //weixin2
  getWxData(body) {
    const url = window.location.href.split("#")[0];
    const queryUrl =
      config.weixin_server + "/rest/api/get_jsapi_ticket?url=" + url;
    return this.httpService.get(queryUrl, body, true);
  }

  /**获取全部布局并缓存 */
  getAllLayout() {
    this.getCalendarLayout();
    const url = config.api.layout_item;
    return this.httpService
      .get(url, [["profile", this.userInfo.profile["name"]]])
      .then((res: any) => {
        let layoutPromise: Promise<any>[] = [];
        for (let layoutItem of res.body.items) {
          if (layoutItem.object_describe_api_name && layoutItem.layout_type) {
            let itemurl = config.api.layout
              .replace("{api_name}", layoutItem.object_describe_api_name)
              .replace("{layout_type}", layoutItem.layout_type);
            let layoutSaveData = { head: res.head, body: layoutItem };
            if (
              layoutItem.record_type &&
              layoutItem.record_type !== "no_record"
            ) {
              let param = [["recordType", layoutItem.record_type]];
              layoutPromise.push(
                this.httpService.cachesave(itemurl, layoutSaveData, param)
              );
            } else {
              layoutPromise.push(
                this.httpService.cachesave(itemurl, layoutSaveData)
              );
            }
          }
        }
        return Promise.all(layoutPromise);
      });
  }
  /**获取全部字段描述并缓存 */
  getAllDescribe() {
    const url = config.api.describe_item.replace("{id}", "all");
    return this.httpService
      .get(url, [["includeFields", "true"]])
      .then((res: any) => {
        let desPromise: Promise<any>[] = [];
        for (let desItem of res.body.items) {
          if (desItem.api_name) {
            let itemurl = config.api.describe.replace(
              "{api_name}",
              desItem.api_name
            );
            let desSaveData = { head: res.head, body: desItem };
            desPromise.push(
              this.httpService.cachesave(itemurl, desSaveData, [
                ["includeFields", "true"]
              ])
            );
          }
        }
        return Promise.all(desPromise);
      });
  }
  refreshBasicData(force?: boolean) {
    if (!force) {
      force = false;
    }
    let versionUpdate = false;
    return new Promise((resolve, reject) => {
      this.storage
        .get("version")
        .then(res => {
          if (res) {
            if (res === config.version) {
              versionUpdate = false;
            } else {
              versionUpdate = true;
              this.storage.set("version", config.version);
              this.storage.set("lastLoginPerson", this.userInfo.token);
            }
          } else {
            versionUpdate = true;
            this.storage.set("version", config.version);
            this.storage.set("lastLoginPerson", this.userInfo.token);
          }
          if (versionUpdate || force) {
            Promise.all([this.getAllLayout(), this.getAllDescribe()]).then(
              () => {
                resolve(res);
              }
            );
          } else {
            resolve(res);
          }
        })
        .catch(() => {
          resolve(null);
        });
    });
  }
}
