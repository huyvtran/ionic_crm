/**
 * 判断是否闰年
 * **/
export const isLeapYear = function (year) {
  if (+year < 1970) {
    throw new Error('年份不低于1970年！');
  }
  return (year % 4 === 0 && year % 100 !== 0) || (year % 400 === 0);
}
/**
 * 返回月份中的第一天是星期几
 * @returns {number}
 * 1 星期一
 * 2 星期二
 * 3 星期三
 * 4 星期四
 * 5 星期五
 * 6 星期六
 * 0 星期天
 */
export const weekOfMonth = function (date) {
  if (!date) date = new Date();
  return new Date(getFullYear(date), getMonth(date), 1).getDay();
};
/**
 * 获取月份
 * @param date
 * @returns {*|number}
 */
export const getMonth = function (date) {
  if (!date) date = new Date();
  return date.getMonth();
};
/**
 * 获取年份
 * @param date
 * @returns {number}
 */
export const getFullYear = function (date) {
  if (!date) date = new Date();
  return date.getFullYear();
};
/**
 * 获取一月中的某一天
 * @param date
 * @returns {number}
 */
export const getDate = function (date) {
  if (!date) date = new Date();
  return date.getDate();
};
/**
 * 格式化日期格式为YYYY-MM-DD格式
 * @param date 日期的时间戳格式
 * @returns format时间
 * */
export const formatTime = function (date, format?: any) {
  let time = new Date();
  time.setTime(date);
  let year = time.getFullYear();
  let month: any = time.getMonth() + 1;
  if (month < 10) {
    month = "0" + month;
  }
  let day: any = time.getDate();
  if (day < 10) {
    day = "0" + day;
  }
  return year + '-' + month + '-' + day;
}
export const timeToLong = function (date) {
  var timeStamp = Date.parse(date).valueOf();
  timeStamp = timeStamp;
  return timeStamp;
}
export const DateHelper = {
  isLeapYear,
  weekOfMonth,
  getMonth,
  getFullYear,
  getDate,
  formatTime,
  timeToLong
};
