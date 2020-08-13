import { Injectable } from '@angular/core';
import _ from 'lodash';
import moment from 'moment';

@Injectable()
export class CRMUtils {
  constructor(
  ) { }

  isTimeRange = function (beginTime, endTime, compareTime) {
    const strb = beginTime.split(':');
    if (strb.length !== 2) {
      return false;
    }

    const stre = endTime.split(':');
    if (stre.length !== 2) {
      return false;
    }

    const strn = compareTime.split(':');
    if (stre.length !== 2) {
      return false;
    }
    const b = new Date();
    const e = new Date();
    const n = new Date();

    b.setHours(strb[0]);
    b.setMinutes(strb[1]);
    e.setHours(stre[0]);
    e.setMinutes(stre[1]);
    n.setHours(strn[0]);
    n.setMinutes(strn[1]);

    if (n.getTime() - b.getTime() > 0 && n.getTime() - e.getTime() < 0) {
      return true;
    } else {
      console.error(`当前时间是：${n.getHours()}:${n.getMinutes()}，不在该时间范围内！`);
      return false;
    }
  }

  isDateBetween = function (dateString, startDateString, endDateString) {
    if (_.isEmpty(dateString)) {
      alert('dateString不能为空');
      return;
    }
    if (_.isEmpty(startDateString)) {
      alert('startDateString不能为空');
      return;
    }
    if (_.isEmpty(endDateString)) {
      alert('endDateString不能为空');
      return;
    }
    let flag = false;
    const startFlag = (this.dateCompare(dateString, startDateString) < 1);
    const endFlag = (this.dateCompare(dateString, endDateString) > -1);
    if (startFlag && endFlag) {
      flag = true;
    }
    return flag;

  }

  isDatesBetween = function (startDateString, endDateString,
    startDateCompareString, endDateCompareString,
  ) {
    if (_.isEmpty(startDateString)) {
      alert('startDateString不能为空');
      return;
    }
    if (_.isEmpty(endDateString)) {
      alert('endDateString不能为空');
      return;
    }
    if (_.isEmpty(startDateCompareString)) {
      alert('startDateCompareString不能为空');
      return;
    }
    if (_.isEmpty(endDateCompareString)) {
      alert('endDateCompareString不能为空');
      return;
    }
    let flag = false;
    const startFlag = (this.dateCompare(startDateCompareString, startDateString) < 1);
    const endFlag = (this.dateCompare(endDateCompareString, endDateString) > -1);
    if (startFlag && endFlag) {
      flag = true;
    }
    return flag;

  }

  dateCompare(dateString, compareDateString) {
    if (_.isEmpty(dateString)) {
      alert('dateString不能为空');
      return;
    }
    if (_.isEmpty(compareDateString)) {
      alert('compareDateString不能为空');
      return;
    }
    const dateTime = this.dateParse(dateString).getTime();
    const compareDateTime = this.dateParse(compareDateString).getTime();
    if (compareDateTime > dateTime) {
      return 1;
    } else if (compareDateTime == dateTime) {
      return 0;
    } else {
      return -1;
    }
  }

  dateParse(dateString) {
    const SEPARATOR_BAR = '-';
    const SEPARATOR_SLASH = '/';
    const SEPARATOR_DOT = '.';
    let dateArray;
    if (dateString.indexOf(SEPARATOR_BAR) > -1) {
      dateArray = dateString.split(SEPARATOR_BAR);
    } else if (dateString.indexOf(SEPARATOR_SLASH) > -1) {
      dateArray = dateString.split(SEPARATOR_SLASH);
    } else {
      dateArray = dateString.split(SEPARATOR_DOT);
    }
    return new Date(dateArray[0], dateArray[1] - 1, dateArray[2]);
  }

  fc_combineTime(time, defaultDate?: any) {
    let dDate = moment(new Date().setHours(0, 0, 0, 0)).format("YYYY-MM-DD");
    let convertTime = dDate + "T" + time;
    if (defaultDate !== undefined) {
      let handlerTime = moment(moment.unix(defaultDate / 1000)).format('YYYY-MM-DD');
      convertTime = handlerTime + "T" + time;
    }
    let timestemp = moment(convertTime).format("x");
    return parseInt(timestemp);
  }

}
