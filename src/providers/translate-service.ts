import { Injectable } from "@angular/core";
import { config } from "../utils/index";

@Injectable()
export class TranslateService {
  constructor() {
    this.localTranslateObject = defaultLocalTranslateObject_zh_CN;
  }
  localTranslateObject: any;

  judgeLanguage() {
    const lang = navigator.language;
    if (lang.toString().indexOf("en-US") > -1) {
      this.localTranslateObject = defaultLocalTranslateObject_en_US;
    } else if (lang.toString().indexOf("zh-CN") > -1) {
      this.localTranslateObject = defaultLocalTranslateObject_zh_CN;
    } else {
      this.localTranslateObject = defaultLocalTranslateObject_zh_TW;
    }
    if (config.default_language !== "zh_CN") {
      this.localTranslateObject = window[config.default_language];
    }
  }

  translateFunc(str) {
    if (!this.localTranslateObject) {
      this.localTranslateObject = defaultLocalTranslateObject_zh_CN;
    }
    if (this.localTranslateObject[str]) {
      return this.localTranslateObject[str];
    } else if (defaultLocalTranslateObject_zh_CN[str]) {
      return defaultLocalTranslateObject_zh_CN[str];
    } else {
      return str;
    }
  }
}

export const defaultLocalTranslateObject_zh_TW = {
  /**登錄頁面 */
  'pad.login_weixin_waiting':'請稍後...',
  'pad.weixin_login_header':'微信登錄',
  "pad.login_login_failed": "登錄失敗",
  "pad.action_cancel": "取消",
  "pad.login_password_not_correct": "密碼錯誤",
  "pad.login_send_mail": "發送成功",
  "pad.login_mail_remind":
    "壹封郵件已發送至您賬戶的綁定郵箱，請前往查看並按提示操作",
  "pad.login_mail_send_failed": "發送失敗",
  "pad.login_update_content": "正在更新……",
  "pad.login_update_done": "更新完成",
  "pad.login_account": "賬號",
  "pad.login_password": "密碼",
  "pad.login_action_login": "登錄",
  "pad.login_find_password": "找回密碼",
  "pad.login_forget_password": "忘記密碼？",
  "pad.login_request_failed": "請求失敗",
  "pad.login_wrong_password": "密碼錯誤",
  "pad.login_wrong_username": "用戶名錯誤",
  "pad.object_start_loading": "正在加載……",
  "pad.http_lang_headers": "zh-TW",
  "action.admin_login_as": "管理員登錄",
  "action.forget_password": "忘記密碼",
  "action.login": "登錄",
  "action.ok": "確定",
  "action.cancel": "取消",
  "action.close": "關閉",
  "action.add": "新增",
  "action.edit": "編輯",
  "action.detail": "查看",
  "action.delete": "刪除",
  "action.save": "保存",
  "action.callback": "返回",
  "action.submit": "提交",
  "action.next": "下一步",
  "action.done": "完成",
  "label.yes": "是",
  "label.no": "否",
  filter: "篩選",
  "filter.add.condition": "增加條件",
  "filter.condition.contains": "包含",
  "filter.condition.equal": "等於",
  "filter.condition.before": "在之前",
  "filter.condition.after": "在之後",
  "filter.condition.not_equal": "不等於",
  "placeholder.please_select_one_field": "請選擇一個字段",
  "placeholder.please_select_one_condition": "請選擇一個條件",
  "placeholder.please_enter_the_query_value": "請輸入查詢值",
  "placeholder.select_the_subordinate": "請選擇下屬",
  "placeholder.login_name": "賬號",
  "placeholder.login_password": "賬號密碼",
  "message.login_name is required": "賬號不能爲空",
  "message.login_password is required": "密碼不能爲空",
  "action.normal_login_as": "普通登錄",
  "placeholder.manager_login_name": "管理員賬號",
  "placeholder.manager_login_password": "管理員密碼",
  "placeholder.need_login_name": "下屬賬戶",
  "label.retrieve_password": "重置密碼",
  "label.account_name": "賬戶",
  "message.login success": "登錄成功",
  "message.logout success": "登出成功",
  "message.yes_or_no": "是否 ",
  "message.is_required": "不能爲空 ",
  "show total": "共 {total} 條",
  "label.filter": "篩選",
  "label.hello": ", 您好 ",
  "label.admin_logged": "管理員，您已經登錄",
  "label.'s_account": " 的賬號",
  Rendering: "佈局正在渲染中，請稍等。",
  "Not Found Render Object": "該佈局暫未分配給您，請聯繫系統管理員處理。",
  "The current user no access":
    "當前賬戶沒有訪問的權限，請聯繫系統管理員處理。.",
  "action.change_password": "修改密碼",
  "placeholder.old_password": "請輸入舊密碼",
  "placeholder.new_password": "請輸入新密碼",
  "placeholder.new_passwpord.again": "再次輸入新密碼",
  "label.old_password": "舊密碼",
  "label.new_password": "新密碼",
  "label.new_password.again": "重複新密碼",
  "message.password_is_not_consistent": "兩個新密碼輸入不一致，請重新輸入",
  "tab.report": "報告",
  "tab.report_me": "報告",
  "tab.report_me_country": "報告",
  "tab.report_hk": "報告",
  "tab.calendar": "日曆",
  "tab.notice": "公告",
  "tab.my_to_do": "我的待辦",
  "message.no_to_do_list": "沒有數據",
  "label.coach_feedback": "輔導",
  "label.segmentation": "定級",
  "tab.my_schedule": "我的日程",
  "message.no_arrangement_list": "沒有數據",
  "label.event": "活動",
  "label.call": "拜訪",
  "label.tot": "離崗",
  "message.no_notice": "沒有公告",
  "label.publish_date": "發佈時間",
  "tab.my_kpi": "我的KPI",
  "message.no_data": "沒有數據",
  "action.more": "更多",
  "month view": "月",
  "week view": "周",
  "day view": "日",
  "tab.related_list": "相關列表",
  "action.marked.read": "標記已讀",
  "action.view.whole.message": "查看全部信息",
  "action.maked.read.all": "標記全部爲已讀",
  "action.unread_notice": "Unread notice",
  "action.logout": "登出",
  "message.logout": "確認登出系統?",
  "action.view_only_collection": "僅顯示收藏",
  "message.is_give_up.edit": "是否放棄編輯",
  "label.country": "國家",
  "label.province": "省",
  "label.city": "市",
  "label.area": "區",
  "label.county": "縣",
  "label.detail_address": "詳細地址",
  "label.upload_image": "上傳圖片",
  "label.upload_image_rules": "(格式為jpg或png,最多可上傳${max_count}張.)",
  "field.operation": "操作",
  "message.Need the correct email address": "需要正確的電子郵件地址",
  "message.Need the correct phone number":
    "需要正確的手機號碼（(例如:+86-12345678910、12345678901、1234-12345678-1234)）",
  "message.please enter the correct integer format": "請輸入正確的整數格式",
  "message.please enter the correct number, if it is decimal, the decimal number is":
    "請輸入正確的數字，如果它是小數，小數位是",
  "message.image_upload_failed": "圖片上傳失敗",
  "header.upload_image_view": "圖片查看",
  "header.related_list": "相關列表",

  "header.notice": "公告",
  "header.my_announcement": "我發佈的公告 ",
  "action.me_publish_notice": "我發佈的",
  "action.publish_notice": "發佈公告",
  "action.me_received_notice": "我接收的",
  "field.title": "標題",
  "field.publish_date": "發佈時間",
  "field.expire_date": "過期時間",
  "field.priority": "級別",
  "label.major": "重要",
  "label.general": "一般",
  "field.description": "內容",
  "field.profiles": "發佈範圍",
  "alert.marked_as_read": "標為已讀",
  "alert.marked_all_as_read": "全部標為已讀",
  "alert.view_all_alert": "產看全部通知",
  "alert.unread": "未讀通知",
  "(alert.total": "(共:",
  "alert.count)": "條)",

  "header.product.select": "選擇產品",
  "header.product.list": "產品列表",
  "header.product.feedback": "產品反饋",
  "field.dependency_not_select": "選項與依賴的字段 {{field}} 不匹配",
  "label.TBC": "待確認",
  "field.common.yes": "是",
  "field.common.no": "否",
  "field.common.appraise": "評價",
  "field.common.score": "得分",
  "pad.image_size": "张"
};

export const defaultLocalTranslateObject_zh_HK = {
  /**登錄頁面 */
  'pad.login_weixin_waiting':'請稍後...',
  'pad.weixin_login_header':'微信登錄',
  "pad.login_login_failed": "登錄失敗",
  "pad.action_cancel": "取消",
  "pad.login_password_not_correct": "密碼錯誤",
  "pad.login_send_mail": "發送成功",
  "pad.login_mail_remind":
    "壹封郵件已發送至您賬戶的綁定郵箱，請前往查看並按提示操作",
  "pad.login_mail_send_failed": "發送失敗",
  "pad.login_update_content": "正在更新……",
  "pad.login_update_done": "更新完成",
  "pad.login_account": "賬號",
  "pad.login_password": "密碼",
  "pad.login_action_login": "登錄",
  "pad.login_find_password": "找回密碼",
  "pad.login_forget_password": "忘記密碼？",
  "pad.login_request_failed": "請求失敗",
  "pad.login_wrong_password": "密碼錯誤",
  "pad.login_wrong_username": "用戶名錯誤",
  "pad.object_start_loading": "正在加載……",
  "pad.http_lang_headers": "zh-HK",
  "action.admin_login_as": "管理員登錄",
  "action.forget_password": "忘記密碼",
  "action.login": "登錄",
  "action.ok": "確定",
  "action.cancel": "取消",
  "action.close": "關閉",
  "action.add": "新增",
  "action.edit": "編輯",
  "action.detail": "查看",
  "action.delete": "刪除",
  "action.save": "保存",
  "action.callback": "返回",
  "action.submit": "提交",
  "action.next": "下一步",
  "action.done": "完成",
  "label.yes": "是",
  "label.no": "否",
  filter: "篩選",
  "filter.add.condition": "增加條件",
  "filter.condition.contains": "包含",
  "filter.condition.equal": "等於",
  "filter.condition.before": "在之前",
  "filter.condition.after": "在之後",
  "filter.condition.not_equal": "不等於",
  "placeholder.please_select_one_field": "請選擇一個字段",
  "placeholder.please_select_one_condition": "請選擇一個條件",
  "placeholder.please_enter_the_query_value": "請輸入查詢值",
  "placeholder.select_the_subordinate": "請選擇下屬",
  "placeholder.login_name": "賬號",
  "placeholder.login_password": "賬號密碼",
  "message.login_name is required": "賬號不能爲空",
  "message.login_password is required": "密碼不能爲空",
  "action.normal_login_as": "普通登錄",
  "placeholder.manager_login_name": "管理員賬號",
  "placeholder.manager_login_password": "管理員密碼",
  "placeholder.need_login_name": "下屬賬戶",
  "label.retrieve_password": "重置密碼",
  "label.account_name": "賬戶",
  "message.login success": "登錄成功",
  "message.logout success": "登出成功",
  "message.yes_or_no": "是否 ",
  "message.is_required": "不能爲空 ",
  "show total": "共 {total} 條",
  "label.filter": "篩選",
  "label.hello": ", 您好 ",
  "label.admin_logged": "管理員，您已經登錄",
  "label.'s_account": " 的賬號",
  Rendering: "佈局正在渲染中，請稍等。",
  "Not Found Render Object": "該佈局暫未分配給您，請聯繫系統管理員處理。",
  "The current user no access":
    "當前賬戶沒有訪問的權限，請聯繫系統管理員處理。.",
  "action.change_password": "修改密碼",
  "placeholder.old_password": "請輸入舊密碼",
  "placeholder.new_password": "請輸入新密碼",
  "placeholder.new_passwpord.again": "再次輸入新密碼",
  "label.old_password": "舊密碼",
  "label.new_password": "新密碼",
  "label.new_password.again": "重複新密碼",
  "message.password_is_not_consistent": "兩個新密碼輸入不一致，請重新輸入",
  "tab.report": "報告",
  "tab.report_me": "報告",
  "tab.report_me_country": "報告",
  "tab.report_hk": "報告",
  "tab.calendar": "日曆",
  "tab.notice": "公告",
  "tab.my_to_do": "我的待辦",
  "message.no_to_do_list": "沒有數據",
  "label.coach_feedback": "輔導",
  "label.segmentation": "定級",
  "tab.my_schedule": "我的日程",
  "message.no_arrangement_list": "沒有數據",
  "label.event": "活動",
  "label.call": "拜訪",
  "label.tot": "離崗",
  "message.no_notice": "沒有公告",
  "label.publish_date": "發佈時間",
  "tab.my_kpi": "我的KPI",
  "message.no_data": "沒有數據",
  "action.more": "更多",
  "month view": "月",
  "week view": "周",
  "day view": "日",
  "tab.related_list": "相關列表",
  "action.marked.read": "標記已讀",
  "action.view.whole.message": "查看全部信息",
  "action.maked.read.all": "標記全部爲已讀",
  "action.unread_notice": "Unread notice",
  "action.logout": "登出",
  "message.logout": "確認登出系統?",
  "action.view_only_collection": "僅顯示收藏",
  "message.is_give_up.edit": "是否放棄編輯",
  "label.country": "國家",
  "label.province": "省",
  "label.city": "市",
  "label.area": "區",
  "label.county": "縣",
  "label.detail_address": "詳細地址",
  "label.upload_image": "上傳圖片",
  "label.upload_image_rules": "(格式為jpg或png,最多可上傳${max_count}張.)",
  "field.operation": "操作",
  "message.Need the correct email address": "需要正確的電子郵件地址",
  "message.Need the correct phone number":
    "需要正確的手機號碼（(例如:+86-12345678910、12345678901、1234-12345678-1234)）",
  "message.please enter the correct integer format": "請輸入正確的整數格式",
  "message.please enter the correct number, if it is decimal, the decimal number is":
    "請輸入正確的數字，如果它是小數，小數位是",
  "message.image_upload_failed": "圖片上傳失敗",
  "header.upload_image_view": "圖片查看",
  "header.related_list": "相關列表",

  "header.notice": "公告",
  "header.my_announcement": "我發佈的公告 ",
  "action.me_publish_notice": "我發佈的",
  "action.publish_notice": "發佈公告",
  "action.me_received_notice": "我接收的",
  "field.title": "標題",
  "field.publish_date": "發佈時間",
  "field.expire_date": "過期時間",
  "field.priority": "級別",
  "label.major": "重要",
  "label.general": "一般",
  "field.description": "內容",
  "field.profiles": "發佈範圍",
  "alert.marked_as_read": "標為已讀",
  "alert.marked_all_as_read": "全部標為已讀",
  "alert.view_all_alert": "產看全部通知",
  "alert.unread": "未讀通知",
  "(alert.total": "(共:",
  "alert.count)": "條)",

  "header.product.select": "選擇產品",
  "header.product.list": "產品列表",
  "header.product.feedback": "產品反饋",
  "field.dependency_not_select": "選項與依賴的字段 {{field}} 不匹配",
  "label.TBC": "待確認",
  "field.common.yes": "是",
  "field.common.no": "否",
  "field.common.appraise": "評價",
  "field.common.score": "得分",
  "pad.image_size": "张"
};

export const defaultLocalTranslateObject_en_US = {
  /**登录页面 */
  'pad.login_weixin_waiting':'Loading...',
  'pad.weixin_login_header':'Login by weChat',
  "pad.login_login_failed": "Login Failure",
  "pad.action_cancel": "Cancel",
  "pad.login_password_not_correct": "Password is wrong!",
  "pad.login_send_mail": "Send Successful",
  "pad.login_mail_remind":
    "An email has been sent to your accounts email address. Go to View and follow the prompts",
  "pad.login_mail_send_failed": "Send Failure",
  "pad.login_update_content": "Updating……",
  "pad.login_update_done": "Update completed!",
  "pad.login_account": "Account",
  "pad.login_password": "Password",
  "pad.login_action_login": "Login",
  "pad.login_find_password": "Find password",
  "pad.login_forget_password": "Forget password？",
  "pad.login_request_failed": "Request failed",
  "pad.login_wrong_password": "wrong password",
  "pad.login_wrong_username": "username error",
  "pad.object_start_loading": "loading...",
  "pad.http_lang_headers": "en-US",
  "action.admin_login_as": "admin login as",
  "action.forget_password": "forget password",
  "action.login": "Login",
  "action.ok": "OK",
  "action.close": "Close",
  "action.cancel": "Cancel",
  "action.add": "Add",
  "action.edit": "Edit",
  "action.detail": "Detail",
  "action.delete": "Delete",
  "action.save": "Save",
  "action.callback": "GoBack",
  "action.submit": "submit",
  "action.next": "Next",
  "action.done": "Done",

  "label.yes": "Yes",
  "label.no": "No",

  filter: "Filter",
  "filter.add.condition": "Add condition",
  "filter.condition.contains": "Contains",
  "filter.condition.equal": "Equal",
  "filter.condition.before": "Before",
  "filter.condition.after": "After",
  "filter.condition.not_equal": "Not equal",

  "placeholder.please_select_one_field": "Please select one field",
  "placeholder.please_select_one_condition": "Please select one condition",
  "placeholder.please_enter_the_query_value": "Please enter the query value",
  "placeholder.select_the_subordinate": "Select the subordinate",

  "placeholder.login_name": "account name",
  "placeholder.login_password": "account password",
  "message.login_name is required": "account name is required",
  "message.login_password is required": "account password is required",

  "action.normal_login_as": "normal login",
  "placeholder.manager_login_name": "manager account name",
  "placeholder.manager_login_password": "manager account password",
  "placeholder.need_login_name": "other account name",

  "label.retrieve_password": "retrieve password",
  "label.account_name": "Account",

  "message.login success": "Login success",
  "message.logout success": "Logout success",

  "message.yes_or_no": "Sure want to ",
  "message.is_required": "cannot be empty ",

  "show total": "Total {total}",
  "(共": "(Total: ",
  "条)": ")",

  "label.filter": "Filter",
  "label.hello": ", Hello ",
  "label.admin_logged": "Administrator, you have logged as ",
  "label.'s_account": " 's account",

  Rendering: "The layout is being rendered, please wait a moment.",
  "Not Found Render Object":
    "The layout is not assigned to you, please contact the system administrator for processing.",
  "The current user no access":
    "The current account has no access, please contact the system administrator..",

  "action.change_password": "Change Password",
  "placeholder.old_password": "Please input old password",
  "placeholder.new_password": "Please input new password",
  "placeholder.new_passwpord.again": "Please input same password again",
  "label.old_password": "Old Password",
  "label.new_password": "New Password",
  "label.new_password.again": "Repeat New Password",
  "message.password_is_not_consistent":
    "The two new password input is not consistent, please re-enter",

  "tab.report": "Report",
  "tab.report_me": "Report",
  "tab.report_me_country": "Report",
  "tab.report_hk": "Report",
  "tab.calendar": "Calendar",
  "tab.notice": "Notice",

  "tab.my_to_do": "My to-do",
  "message.no_to_do_list": "There is no to-do list",

  "label.TBC": "Unconfirmed",
  "label.coach_feedback": "Coach",
  "label.segmentation": "Rank",

  "tab.my_schedule": "My schedule",
  "message.no_arrangement_list": "There is no arrangement list",
  "label.event": "Activity",
  "label.call": "Visit",
  "label.tot": "TOT",

  "message.no_notice": "There is no notice",
  "label.publish_date": "Publish date",

  "tab.my_kpi": "My KPI",
  "message.no_data": "There is no data",

  "action.more": "More",

  "month view": "month",
  "week view": "week",
  "day view": "day",

  "tab.related_list": "Related List",

  "action.marked.read": "Marked as read",
  "action.view.whole.message": "View the whole message",
  "action.maked.read.all": "All marked as read",
  "action.unread_notice": "Unread notice",

  "action.logout": "Log out",
  "message.logout": "Sure you want to exit system?",

  "action.view_only_collection": "View only collection",

  "message.is_give_up.edit": "Are you going to give up editing",

  "label.country": "Country",
  "label.province": "province",
  "label.city": "city",
  "label.area": "area",
  "label.county": "county",
  "label.detail_address": "Detailed address",

  "label.upload_image": "upload image",
  "label.upload_image_rules":
    "(Format JPG or PNG, up to ${max_count} uploads.)",

  "field.operation": "operation",

  "message.Need the correct email address": "Need the correct email address",
  "message.Need the correct phone number":
    "Need the correct phone number（(For example:+86-12345678910、12345678901、1234-12345678-1234)）",
  "message.please enter the correct integer format":
    "please enter the correct integer format",
  "message.please enter the correct number, if it is decimal, the decimal number is":
    "Please enter the correct number, if it is decimal, the decimal number is",
  "message.image_upload_failed": "Upload failed.",
  "header.upload_image_view": "Picture view",
  "header.related_list": "Related List",

  "header.notice": "Notice",
  "header.my_announcement": "My announcement ",
  "action.me_publish_notice": "Publish By Me",
  "action.publish_notice": "Publish",
  "action.me_received_notice": "Received",
  "field.title": "Title",
  "field.publish_date": "Publish Date",
  "field.expire_date": "Expire Date",
  "field.priority": "Priority",
  "label.major": "major",
  "label.general": "general",
  "field.description": "Description",
  "field.profiles": "Profiles",
  "alert.marked_as_read": "Marked as read",
  "alert.marked_all_as_read": "All marked as read",
  "alert.view_all_alert": "View all notices",
  "alert.unread": "Unread notice",
  "(alert.total": "(total:",
  "alert.count)": ")",

  "header.product.select": "Choose Product",
  "header.product.list": "Product List",
  "header.product.feedback": "Product Feedback",
  "field.dependency_not_select": "Selected value not compatible with {{field}}",

  "field.common.yes": "yes",
  "field.common.no": "no",
  "field.common.appraise": "appraise",
  "field.common.score": "score",
  "pad.image_size": "images"
};

export const defaultLocalTranslateObject_zh_CN = {
  /**版本信息 */
  "pad.version_about_title": "关于",
  "pad.version_no": "版本号",
  "pad.http_lang_headers": "zh-CN",

  /**登录页面 */
  'pad.login_weixin_waiting':'请稍后...',
  'pad.weixin_login_header':'微信登录',
  "pad.login_login_failed": "登录失败",
  "pad.login_password_not_correct": "密码错误",
  "pad.login_send_mail": "发送成功",
  "pad.login_mail_remind":
    "一封邮件已发送至您账户的绑定邮箱，请前往查看并按提示操作",
  "pad.login_mail_send_failed": "发送失败",
  "pad.login_update_content": "正在更新……",
  "pad.login_update_done": "更新完成",
  "pad.login_account": "账号",
  "pad.login_password": "密码",
  "pad.login_action_login": "登录",
  "pad.login_find_password": "找回密码",
  "pad.login_forget_password": "忘记密码？",
  "pad.login_request_failed": "请求失败",
  "pad.login_wrong_password": "密码错误",
  "pad.login_wrong_username": "用户名错误",

  /**主菜单 主页 */
  "pad.main_menu_name": "主页",
  "pad.main_menu_calender": "日历",
  "pad.main_menu_notice": "公告",
  "pad.main_menu_user": "用户",

  /**主页 */
  "pad.main_condition_event": "活动",
  "pad.main_condition_TOT": "离岗",
  "pad.main_page_title": "我的主页",
  "pad.main_calender_activity": "我的日程",
  "pad.main_calender_noting_remind": "暂无待办事项",
  "pad.main_notice": "公告",
  "pad.main_no_notice": "暂无公告",
  "pad.main_more": "更多",
  "pad.main_my_kpi": "我的KPI",
  "pad.main_no_kpi": "暂无相关KPI数据",

  /**home页信息 */
  "pad.home_show_collect": "仅查看收藏",
  "pad.home_mark_readed": "本页全部标记已读",
  "pad.home_downloads": "批量下载",
  "pad.home_action_pull_refresh": "下拉刷新",
  "pad.home_action_push_refresh": "正在加载更多数据...",
  "pad.home_action_refreshing": "刷新中...",
  "pad.home_select_all": "全选",
  "pad.home_total_front": "共",
  "pad.home_total_unit": "条",

  /**related菜单和二级菜单 */
  "pad.related_action_attendee": "参会人",

  /**action操作文字 */
  "pad.action_delete": "删除",
  "pad.action_ok": "确定",
  "pad.action_no": "否",
  "pad.action_yes": "是",
  "pad.action_cancel": "取消",
  "pad.action_callback": "返回",
  "pad.action_edit_continue": "继续编辑",
  "pad.action_edit": "编辑",
  "pad.action_add": "新建",
  "pad.action_close": "关闭",
  "pad.action_exit": "退出",
  "pad.action_save": "保存",
  "pad.action_next_step": "下一步",
  "pad.action_clear": "清空",
  "pad.action_submit": "提交",

  /**弹出框文字和标题 */
  "pad.sync_first_data_title": "同步数据",
  "pad.sync_first_data_subtitle": "首次使用需要同步数据至本地，请耐心等待",
  "pad.sync_loading_data_subtitle": "加载过程涉及数据同步，请耐心等待",
  "pad.sync_last_sync_time": "上次同步时间",

  "pad.alert_remind_title": "提示",
  "pad.alert_confirm_title": "确认信息",
  "pad.alert_failed_title": "操作失败",
  "pad.alert_save_success": "保存成功",
  "pad.alert_operate_success": "操作成功",
  "pad.alert_remind_save_data": "是否保存编辑内容?",
  "pad.alert_remind_giveup_edit": "是否要放弃正在编辑的内容？",
  "pad.alert_remind_save_info": "请确认基本信息已经提交！",
  "pad.alert_remind_offline_survey":
    "您现在已处于离线状态，重填问卷是在线功能，请确认网络连接！",
  "pad.alert_remind_offline_coach_feedback":
    "您现在已处于离线状态，创建辅导是在线功能，请确认网络连接！",
  "pad.alert_remind_offline_segmentation":
    "您现在已处于离线状态，定级是在线功能，请确认网络连接！",
  "pad.alert_remind_cant_complete_call_without_product_reaction":
    "不允许完成未填写产品信息的拜访！",
  "pad.alert_remind_if_delete_data": "你确定要删除这条数据吗？",
  "pad.alert_subtitle_valid": "是必填字段",
  "pad.alert_subtitle_change_window":
    "您当前的定级窗口期已经发生变化，请重新进入该医生详情对其进行定级！",
  "pad.alert_gps_reminder":"定位失败，请确认打开GPS开关。",

  /**产品反馈 */
  "pad.product_reaction_doc_title": "产品反馈",
  "pad.product_reaction_remind_no_react":
    "抱歉，该产品暂时没有其他的反馈信息！",
  "pad.product_no_more_reaction": "该产品没有其他产品反馈信息",
  //clm_presentation
  "pad.clm_alert_cant_open_title": "无法播放",
  "pad.clm_reaction_title": "反馈信息",
  "pad.clm_alert_cant_subtitle": "资源文件无法正常加载",
  "pad.clm_alert_nodownload_subtitle":
    "您还没有下载这个媒体，请先到媒体详情页下载后播放",
  "pad.clm_doc_title": "媒体信息",
  "pad.clm_survey_title": "调查问卷",
  "pad.clm_writed": "已填写",
  "pad.clm_reactive": "积极",
  "pad.clm_nagtive": "消极",
  "pad.clm_neutral": "中立",
  "pad.clm_media_download_pakage": "批量下载媒体",
  "pad.clm_media_remind_status":
    "检查状态功能会对本地的媒体状态进行检查，并清除失效和过期的媒体。",
  "pad.clm_media_check": "正在检查...",
  "pad.clm_media_total": "总数",
  "pad.clm_media_avalable": "可用",
  "pad.clm_media_over_date": "过期",
  "pad.clm_media_other": "其他",
  "pad.clm_media_remind_download":
    "提示：点击开始下载后，请不要关闭屏幕或离开此应用",
  "pad.clm_media_remind_downloaded": "所有媒体均已下载",
  "pad.clm_media_remind_downloading": "正在下载，请勿离开...",
  "pad.clm_media_total_process": "总进度",
  "pad.clm_media_front_process": "当前进度",
  "pad.clm_media_exec_done": "执行完毕",
  "pad.clm_media_check_status": "检查状态",
  "pad.clm_media_start_download": "开始下载",
  "pad.clm_media_end_download": "停止下载",
  "pad.clm_media_detail_title": "媒体详情页",
  "pad.clm_media_action_download": "下载",
  "pad.clm_media_action_downloading": "下载中",
  "pad.clm_media_action_play": "播放",
  "pad.clm_media_action_restart_download": "重新下载",
  "pad.clm_media_download_process_remind": "下载进度",
  "pad.clm_media_zip_process_remind": "解压进度",
  "pad.clm_media_introduction": "简介",
  "pad.clm_media_select_one": "请选择一个媒体",
  "pad.clm_media_select": "选择媒体",
  "pad.clm_media_add_already": "已添加",
  "pad.clm_media_operations": "操作选项",
  "pad.clm_media_load_module": "正在加载媒体模块内容……",

  /**筛选下级 */
  "pad.select_comp_uplevel": "上级",
  "pad.select_comp_downlevel": "下级",
  "pad.select_comp_chioced": "已选择",
  "pad.select_comp_unit": "项",
  "pad.select_comp_chioce_downlevel": "选择下属",

  /**文字格式 */
  "pad.warning_type_number": "整数",
  "pad.warning_type": "格式",
  "pad.warning_subtitle": "请填写正确的",
  "pad.warning_subtitle_not_more": "请填写不超过",
  "pad.warning_langth": "位数的",
  "pad.warning_select": "请选择",

  /**valid msg */
  "pad.valid_cannot_across_day": "不可跨天",
  "pad.valid_call_plan_cannot_across_day": "拜访计划不可跨天",
  "pad.valid_call_report_cannot_across_day": "拜访记录不可跨天",

  /**calender */
  "pad.calender_page_title": "日程管理",

  /**拜访 */
  "pad.call_add_report": "新建拜访记录",

  /**coach_feedback */
  "pad.coach_feedback_page_title": "辅导问卷",
  "pad.coach_feedback_employee": "被辅导人",
  "pad.coach_feedback_coach_type": "辅导类型",
  "pad.coach_feedback_coach_remind":
    "提示：辅导问卷内容较多，建议您到Web端创建辅导",
  "pad.coach_feedback_coach_survey": "打开问卷窗口",
  "pad.coach_feedback_leave_survey": "您确认要离开此页，进入到辅导详情页面吗？",
  "pad.coach_feedback_leave_without_write": "您尚未填写问卷，是否要离开此页？",
  "pad.coach_feedback_wait_while": "稍等片刻",
  "pad.coach_feedback_see_now": "现在就看",

  /**日程信息 */
  "pad.date_info_title": "日程信息",
  "pad.date_load_more": "查看更多",

  /**公告页面 */
  "pad.notice_page_title": "公告详情",
  "pad.notice_title": "标题",
  "pad.notice_content": "内容",
  "pad.notice_name": "公告",
  "pad.notice_notice_lately": "最近的公告",
  "pad.notice_important": "重要",
  "pad.notice_normal": "一般",

  /**参会人 */
  "pad.partici_search_text": "请输入要查询的",
  "pad.partici_nothing": "暂无",
  "pad.partici_confilict": "参会人重复",
  "pad.partici_save_and_back": "保存并返回",
  "pad.partici_data": "数据",

  /**pickList */
  "pad.pick_done": "完成",
  "pad.have_no_layout": "缺少选择该对象的布局信息。",

  /**relatedList */
  "pad.relate_getdata_failed": "数据获取失败，请重新获取！",

  /**定级 */
  "pad.segmentation_remind_time":
    "计算级别需要一小段时间，您确定现在就要查看当前问卷计算出的级别吗？",
  "pad.segmentation_page_title": "医生定级",
  "pad.segmentation_doctor": "医生",
  "pad.segmentation_product": "产品",

  /**selector */
  "pad.selector_equal": "等于",
  "pad.selector_not_equal": "不等于",
  "pad.selector_contains": "包含",
  "pad.selector_before": "早于",
  "pad.selector_later": "晚于",
  "pad.selector_condition": "筛选条件",
  "pad.selector_add_condition": "添加筛选条件",

  /**下属选择问卷 */
  "pad.employee_selector_header": "选择下属",
  "pad.employee_selector_detail_value": "的评价详细",
  "pad.survey_total_title": "总结",
  "pad.survey_evaluation": "评分",

  /**查看页面 */
  "pad.view_page_title": "查看页面",
  "pad.view_wait_remind":
    "请稍后，正在计算客户级别,请返回之后，重新进入本页面进行查看。",
  "pad.view_overall_segmentation": "整体级别",
  "pad.view_adjust_segmentation": "调整级别",
  "pad.view_level_A": "A级",
  "pad.view_level_B": "B级",
  "pad.view_level_C": "C级",
  "pad.view_level_V": "V级",
  "pad.view_level_N": "无级别",
  "pad.view_level_refresh": "刷新页面",
  "pad.view_level_submit_segmentation": "提交定级",

  /**用户界面 */
  "pad.user_page_title": "用户页",
  "pad.user_failed_title": "失败",
  "pad.user_setting_update_subtitle": "配置数据已更新，请重新登录",
  "pad.user_setting_lang_title": "语言设置",
  "pad.user_setting_lang_zh_CN": "简体中文",
  "pad.user_setting_lang_zh_TW": "繁体中文",
  "pad.user_setting_lang_zh_HK": "中国香港",
  "pad.user_setting_lang_en_US": "英语",
  "pad.user_change_password_title": "修改密码",
  "pad.user_old_password": "旧密码",
  "pad.user_new_password": "新密码",
  "pad.user_confirm_password": "确认密码",
  "pad.user_input_old_password": "请输入旧密码",
  "pad.user_input_new_password": "请填写新密码",
  "pad.user_input_different": "两次新密码输入不同",
  "pad.user_change_success": "修改成功",
  "pad.user_menu_change_setting": "更新配置",
  "pad.user_menu_about_CRM": "关于CRMPower",
  "pad.user_menu_logout": "退出登录",

  /**拍照 */
  "pad.camera_picture": "拍照",
  "pad.camera_pick_photos": "从相册选择",

  /**网络监测 */
  "pad.network_offline": "未开启网络",
  "pad.network_online": "当前在线",
  "pad.network_server_failed": "服务器异常",
  "pad.network_connect_failed": "网络连接失败",

  /**日历的国际化 */
  "pad.calender_title_format": "YYYY年MM月",
  "pad.calender_monday": "一",
  "pad.calender_tuesday": "二",
  "pad.calender_wednesday": "三",
  "pad.calender_thursday": "四",
  "pad.calender_friday": "五",
  "pad.calender_saturday": "六",
  "pad.calender_sunday": "日",
  "pad.calender_alldaytext": "全天",
  "pad.calender_today": "今天",
  "pad.calender_month_view": "月视图",
  "pad.calender_week_view": "周视图",
  "pad.calender_day_view": "日视图",

  /**newTranslate */
  "pad.online_status_offline": "您当前已经处于离线状态",
  "pad.product_reactive": "积极",
  "pad.product_negative": "消极",
  "pad.product_neutral": "中立",
  "pad.product_all_select": "全选",
  "pad.object_name_call": "拜访",
  "pad.object_start_loading": "正在加载……",

  "action.admin_login_as": "管理员登录",
  "action.forget_password": "忘记密码",
  "action.login": "登录",
  "action.ok": "确定",
  "action.cancel": "取消",
  "action.close": "关闭",
  "action.add": "新增",
  "action.edit": "编辑",
  "action.detail": "查看",
  "action.delete": "删除",
  "action.save": "保存",
  "action.callback": "返回",
  "action.submit": "提交",
  "action.next": "下一步",
  "action.done": "完成",

  "label.yes": "是",
  "label.no": "否",

  filter: "筛选",
  "filter.add.condition": "增加条件",
  "filter.condition.contains": "包含",
  "filter.condition.equal": "等于",
  "filter.condition.before": "在之前",
  "filter.condition.after": "在之后",
  "filter.condition.not_equal": "不等于",

  "placeholder.please_select_one_field": "请选择一个字段",
  "placeholder.please_select_one_condition": "请选择一个条件",
  "placeholder.please_enter_the_query_value": "请输入查询值",
  "placeholder.select_the_subordinate": "请选择下属",

  "placeholder.login_name": "账号",
  "placeholder.login_password": "账号密码",
  "message.login_name is required": "账号不能为空",
  "message.login_password is required": "密码不能为空",

  "action.normal_login_as": "普通登录",
  "placeholder.manager_login_name": "管理员账号",
  "placeholder.manager_login_password": "管理员密码",
  "placeholder.need_login_name": "下属账户",

  "label.retrieve_password": "重置密码",
  "label.account_name": "账户",

  "message.login success": "登录成功",
  "message.logout success": "登出成功",

  "message.yes_or_no": "是否 ",
  "message.is_required": "不能为空 ",

  "show total": "共 {total} 条",

  "label.filter": "筛选",
  "label.hello": ", 您好 ",
  "label.admin_logged": "管理员，您已经登录",
  "label.'s_account": " 的账号",

  Rendering: "布局正在渲染中，请稍等。",
  "Not Found Render Object": "该布局暂未分配给您，请联系系统管理员处理。",
  "The current user no access":
    "当前账户没有访问的权限，请联系系统管理员处理。",

  "action.change_password": "修改密码",
  "placeholder.old_password": "请输入旧密码",
  "placeholder.new_password": "请输入新密码",
  "placeholder.new_passwpord.again": "再次输入新密码",
  "label.old_password": "旧密码",
  "label.new_password": "新密码",
  "label.new_password.again": "重复新密码",
  "message.password_is_not_consistent": "两个新密码输入不一致，请重新输入",

  "tab.report": "报告",
  "tab.report_me": "报告",
  "tab.report_me_country": "报告",
  "tab.report_hk": "报告",
  "tab.calendar": "日历",
  "tab.notice": "公告",

  "tab.my_to_do": "我的待办",
  "message.no_to_do_list": "没有数据",

  "label.TBC": "待确认",
  "label.coach_feedback": "辅导",
  "label.segmentation": "定级",

  "tab.my_schedule": "我的日程",
  "message.no_arrangement_list": "没有数据",
  "label.event": "活动",
  "label.call": "拜访",
  "label.tot": "离岗",

  "message.no_notice": "没有公告",
  "label.publish_date": "发布时间",

  "tab.my_kpi": "我的KPI",
  "message.no_data": "没有数据",

  "action.more": "更多",

  "month view": "月",
  "week view": "周",
  "day view": "日",

  "tab.related_list": "相关列表",

  "action.marked.read": "标记已读",
  "action.view.whole.message": "查看全部信息",
  "action.maked.read.all": "标记全部为已读",
  "action.unread_notice": "Unread notice",

  "action.logout": "登出",
  "message.logout": "确认登出系统?",

  "action.view_only_collection": "仅显示收藏",

  "message.is_give_up.edit": "是否放弃编辑",

  "label.country": "国家",
  "label.province": "省",
  "label.city": "市",
  "label.area": "区",
  "label.county": "县",
  "label.detail_address": "详细地址",

  "label.upload_image": "上传图片",
  "label.upload_image_rules": "(格式为jpg或png,最多可上传${max_count}张.)",

  "field.operation": "操作",

  "message.Need the correct email address": "需要正确的电子邮件地址",
  "message.Need the correct phone number":
    "需要正确的手机号码（(例如:+86-12345678910、12345678901、1234-12345678-1234)）",
  "message.please enter the correct integer format": "请输入正确的整数格式",
  "message.please enter the correct number, if it is decimal, the decimal number is":
    "请输入正确的数字，如果它是小数，小数位是",

  "message.image_upload_failed": "图片上传失败",

  "header.related_list": "相关列表",
  "header.notice": "公告",
  "header.my_announcement": "我发布的公告 ",

  "header.upload_image_view": "图片查看",

  "action.me_publish_notice": "我发布的",
  "action.publish_notice": "发布公告",
  "action.me_received_notice": "我接收的",
  "field.title": "标题",
  "field.publish_date": "发布时间",
  "field.expire_date": "过期时间",
  "field.priority": "级别",
  "label.major": "重要",
  "label.general": "一般",
  "field.description": "内容",
  "field.profiles": "发布范围",
  "alert.marked_as_read": "标为已读",
  "alert.marked_all_as_read": "全部标记为已读",
  "alert.view_all_alert": "查看全部通知",
  "alert.unread": "未读通知",
  "(alert.total": "(共:",
  "alert.count)": "条)",

  "header.product.select": "选择产品",
  "header.product.list": "产品列表",
  "header.product.feedback": "产品反馈",
  "field.dependency_not_select": "选项与依赖的字段 {{field}} 不匹配",

  "field.common.yes": "是",
  "field.common.no": "否",
  "field.common.appraise": "评价",
  "field.common.score": "得分",

  "pad.image_size": "张",
  "pad.select_image_operation": "选择操作",
  "pad.retake_images": "重新拍摄",
  "pad.big_size_image": "预览",
  "pad.alert_remind_if_delete_pic": "确认要删除图片吗？",
  "pad.upload_content": "正在上传"
};
