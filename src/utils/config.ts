//const hsoStgUrl = 'http://stg.hspharm.com:8003/'
//const hsoStgIp = '222.189.41.230:8003'
export const config = {
  /**
   * 基础请求服务器
   */
  // baseURL: ["https://stg-tm.crmpower.cn"],
  // login_server: ["https://stg-sso.crmpower.cn"],
  //  weixin_server: 'http://192.168.188.158:8091',
  // baseURL: ["http://222.189.41.230:8003/fc-crm-tenant-management-application"],
  // login_server: ["http://222.189.41.230:8003/sso-web"],
  // weixin_server:'http://52.81.24.249:8091', //dev 环境部署的中间件的地址
  // weixin_server: 'http://222.189.41.230:8003/wechat-interaction',
  baseURL: ["http://stg.hspharm.com:8003/fc-crm-tenant-management-application"],
  login_server: ["http://stg.hspharm.com:8003/sso-web"],
  weixin_server: "http://stg.hspharm.com:8003/wechat-interaction",
  // weixin_server: 'http://192.168.188.158:8091', //上传到阿里云用这个地址
  // baseURL: ["http://192.168.188.158:8098"],
  //豪森
  // baseURL: ["http://222.189.41.230:8000/fc-crm-tenant-management-application"],
  // login_server: ["http://222.189.41.230:8000/sso-web"],
  /**
   * file server
   */
  file_server: "http://stg.hspharm.com:8003/fc-crm-file-service",
  // file_server: "http://222.189.41.230:8003/fc-crm-file-service",
  // clm config server
  clm_server: "https://eda.crmpower.cn/static/",
  //weixin_server: 'http://stg.hspharm.com:8003/wechat-interaction',
  api: {
    /**
     * 获取菜单接口
     */
    layout_menu: "/rest/metadata/layout/tab",
    /**
     * 获取通用布局layout接口,
     * @params {api_name}:布局的api_name,
     * @params {layout_type}:布局的类型 ,index_page, detail_page, detail_form, record_list, relate_list
     */
    layout: "/rest/metadata/layout/{api_name}/{layout_type}",
    /**
     * 获取描述文件describe的接口
     * @params {api_name}:布局的api_name,
     */
    describe: "/rest/metadata/object_describe/{api_name}", //includeFields=false
    /**
     * 获取布局真实data所需要的接口 metadata
     */
    data: "/rest/data_record/{api_name}/{page_size}/{page_no}",
    /**
     * 获取描述文件describe的接口 describe_item
     * @params {id}:某条数据的id
     */
    describe_item: "/rest/metadata/object_describe/{id}",

    /**login with token */
    login_with_token: "/loginWithToken",

    /**layout all */
    layout_item: "/rest/metadata/layout/list/all",

    /**layout 布局分配 */
    layout_assign: "/rest/metadata/layout_assign/list/all",

    /**经理获取下属 */
    listSubordinate: "/rest/user_info/listSubordinate/{user_id}",

    /**获取管理的客户的id */
    listCustomerId: "/rest/data_record/listCustomerId/{user_id}",

    /**获取直接下属 */
    listTutorial: "/rest/user_info//listTutorial/{user_id}",

    /**
     * 查询接口 search_url
     * @params Query对象数组
     */
    search_url: "/rest/data_record/query",
    /**
     * 批量查询接口
     */
    batch_search_url: "/rest/data_record/batch_query",
    /**
     * 一条数据的增删改查接口
     */
    record: "/rest/data_record/{api_name}/{id}",
    /**
     * 获取data接口（Product）
     */
    dataAll: "/rest/data_record/{api_name}",

    /**
     * 批量提交接口
     */
    batchCreate: "/rest/data_record/batchCreate/{api_name}",
    /**批量更新 */
    batchUpdate: "/rest/data_record/ubatch/{api_name}",
    /**目标医生批量更新 */
    batch_addition: "/rest/action/customer_territory/{api_name}",
    custom_field: "/rest/data_record/{apiName}",
    user_data: "/rest/data_record/user_info/:id",
    index_menu: "/rest/metadata/tab/",
    login_url: "/login",
    logout_url: "/logout",
    resetPwd: "/resetMyPwd",
    updatePwd: "/updateMyPwd",
    jwtData: "/rest/encrypt/jwt",
    /**
     * 获取日历配置接口
     */
    calendar: "/rest/metadata/setting/calendar_setting",
    /**我的kpi */
    myKpi: "/rest/kpi/{user_id}",
    translates: "/rest/metadata/translation/language/all",
    default_lang: "/rest/metadata/setting/default_language",

    /**管理员登录 */
    loginAs: "/loginAs",

    /**get Logo */
    get_logo: "/rest/metadata/setting/logo_setting",

    /**操作image */
    upload_image: "/rest/images/{key}",
    /**files */
    upload_files: "/rest/files/{key}",
    //home_config
    home_config: "/rest/metadata/setting/home_config",
    //wxconfig
    wx_config: "/rest/encrypt/wx/config",
    //wxconfig
    wx_sign: "/rest/api/get_jsapi_ticket?url={{url}}",
    //传递给服务端的微信文件id
    server_ids: "/rest/api/uploadFile",
    //水印配置
    water_config: "/rest/metadata/setting/watermark_config",
    //报表
    report: "https://report.hspharm.com/web/ReportServer?op=fs_load&cmd=sso",
    main_reports: "/rest/action/user_info/report_visit_activity_total"
  },
  id_suffix: "",
  version: "wx1.2",
  default_language: "zh_CN"
};

/**
 * 实时使用的用户信息
 */
export class UserInfo {
  /**token */
  token: string;
  /**token供第三方系统用的token */
  fc_token: string;
  /**用户ID */
  userid: string;
  /**用户权限 */
  permission: {};
  /**基础请求服务器 */
  baseURL: string;

  /**简档的id */
  profileId: string;

  /**简档对象 */
  profile: {};

  /**user_info对象 */
  user: {};

  /**上次同步时间 */
  lastSyncTime: string;

  /**豪森 的key */
  loginhaosen: string;
}

export class DcrHandler {
  /**dcr objects */
  dcrObject = [];
  /**dcr details of every object */
  dcrDetail = [];
}

/**运行时的基本接口 */
export interface UserStorage {
  token: string;
  userid: string;
  user: any;
  permission: any;
  profile: any;
  serverid: any;
  loginhaosen?: any;
}

export const constApiName = {
  ADD: "add",
  EDIT: "edit",
  DETAIL: "detail",
  DELETE: "delete"
};
