import moment from 'moment';
import { config } from './config';
import _ from 'lodash';
import { callMultiAnotherFunc } from './helper';

export const layoutHandler = function (layout, describe) {
  let leftOptions, rightOptions;
  if (layout.row_actions) {
    if (layout.row_actions.length > 0) {
      leftOptions = getOptions(layout.row_actions, 'SWIPE_LEFT');
      rightOptions = getOptions(layout.row_actions, 'SWIPE_RIGHT');
    }
  }

  if (layout.padlayout) {
    //isPadLayout = true;
    let padlayout = {
      avatar: {
        exist: false,
        data: '',
        layout: ''
      },
      title: {
        exist: false,
        data: '',
        layout: ''
      },
      subTitle: {
        exist: false,
        data: '',
        layout: ''
      },
      contents: [],
      labels: []
    };
    if (layout.padlayout.avatar) {
      padlayout.avatar.exist = true;
      padlayout.avatar.data = 'assets/img/avatar.png';
      padlayout.avatar.layout = layout.padlayout.avatar;
    }
    if (layout.padlayout.title) {
      padlayout.title.exist = true;
      padlayout.title.layout = layout.padlayout.title;
    }
    if (layout.padlayout.sub_title) {
      padlayout.subTitle.exist = true;
      padlayout.subTitle.layout = layout.padlayout.sub_title;
    }
    if (layout.padlayout.contents) {
      for (let cont of layout.padlayout.contents) {
        let contentItem = {
          type: cont.type,
          data: '',
          layout: cont
        }
        padlayout.contents.push(contentItem);
      }
    }
    if (layout.padlayout.labels) {
      for (let label of layout.padlayout.labels) {
        let labelItem = {
          type: label.type,
          data: '',
          color: '',
          layout: label
        }
        padlayout.labels.push(labelItem);
      }
    }
    const padLayout = {
      padlayout: padlayout,
      rightOptions: rightOptions,
      leftOptions: leftOptions,
      data: '',
      isPadLayout: true
    };
    return padLayout;
    //insertPadLayoutData(newDataList, padLayout);
  } else {
    let theListItem = [];
    layout.fields.forEach(field => {
      describe.fields.forEach(desc => {
        if (field.field === desc.api_name) {
          theListItem.push({
            label: desc.label,
            key: field.field,
            value: '',
            field: field,
            desc: desc,
          })
        }
      })
    })
    const newListItem = {
      layout: theListItem,
      rightOptions: rightOptions,
      leftOptions: leftOptions,
      isPadLayout: false,
      data: ''
    };
    return newListItem;
    //insertData(newDataList, newListItem);
  }
}

export const getOptions = function (rowActions, actionCode) {
  let ops = [];
  let actions = JSON.parse(JSON.stringify(rowActions));
  actions.forEach(action => {
    // if(!action['action.i18n_key']){
    //   let key = 'action.' + action.action.toLowerCase();
    //   action.label = this.translateService.translateFunc(key);
    // }
    if (action['action.i18n_key']) {
      if (window[config.default_language][action['action.i18n_key']] !== action['action.i18n_key']) {
        action.label = window[config.default_language][action['action.i18n_key']];
      }
    }
    if (action.mobile_show === actionCode) {
      ops.push(action);
    }
  })
  return ops;
}

export const insertPadLayoutData = function (dataList, item, describe, pdata = {}) {
  let listItem = _.cloneDeep(item);
  const newListData = [];
  dataList.forEach(data => {
    const padlayout = listItem.padlayout;
    if (listItem.padlayout) {
      if (padlayout.avatar) {
        if (data[padlayout.avatar.layout.value]) {
          padlayout.avatar.data = data[padlayout.avatar.layout.value];
        }
      }
      if (padlayout.title) {
        padlayout.title.data = handlerPadLayoutData(data[padlayout.title.layout.value], padlayout.title, data, describe);
      }
      if (padlayout.subTitle) {
        padlayout.subTitle.data = handlerPadLayoutData(data[padlayout.subTitle.layout.value], padlayout.subTitle, data, describe);
      }
      if (padlayout.contents) {
        if (padlayout.contents.length > 0) {
          padlayout.contents.forEach(content => {
            content.data = handlerPadLayoutData(data[content.layout.value], content, data, describe);
          })
        }
      }
      if (padlayout.labels) {
        if (padlayout.labels.length > 0) {
          padlayout.labels.forEach(label => {
            label.data = handlerPadLayoutData(data[label.layout.value], label, data, describe);
          })
        }
      }
    }
    listItem.data = data;
    listItem.leftOptions = rowActionsHandler(listItem, data, 'left', pdata);
    listItem.rightOptions = rowActionsHandler(listItem, data, 'right', pdata);
    let listItems = JSON.parse(JSON.stringify(listItem));
    if(data['fakeFlag'] !== 'main'){
      newListData.push(listItems);
    }
  })
  //console.log('newListData ====> ', newListData);
  return newListData;
}

export const insertData = function (dataList, item, pdata = {}) {
  if (item) {
    const newListData = [];
    let listItem = JSON.parse(JSON.stringify(item));
    dataList.forEach(data => {
      listItem.layout.forEach(item => {
        if (item.desc.options) {
          item.value = '';
          if (data[item.key]) {
            item.desc.options.forEach(option => {
              if (option.value === data[item.key]) {
                item.value = option.label;
                const trans = 'field.' + data.object_describe_name + '.' + item.desc.api_name;
                if (window[config.default_language][trans] && window[config.default_language][trans] !== trans) {
                  item.value = window[config.default_language][trans];
                }
              }
            })
          }
        } else if (item.desc.type === 'boolean') {
          if (data[item.key]) {
            item.value = '是';
          } else {
            item.value = '否';
          }
        } else if (data[item.key + '__r']) {
          item.value = data[item.key + '__r'].name;
        } else if (item.key.indexOf('time') > -1 || item.key.indexOf('date') > -1) {
          if (data[item.key] !== undefined) {
            item.value = moment(data[item.key]).format(item.field.date_time_format);
          } else {
            item.value = '';
          }
        } else {
          item.value = data[item.key];
        }
      })
      listItem.data = data;
      listItem.leftOptions = rowActionsHandler(listItem, data, 'left', pdata);
      listItem.rightOptions = rowActionsHandler(listItem, data, 'right', pdata);
      let listItems = JSON.parse(JSON.stringify(listItem));
      newListData.push(listItems);
    })
    return newListData;
  }
}

export const rowActionsHandler = function (listItem, data, direction, pdata = {}) {
  const opts = [];
  if (direction === 'right' && listItem.rightOptions) {
    listItem.rightOptions.forEach(option => {
      let action = actionHandler(option, data, pdata);
      if (action) {
        opts.push(action);
      }
    })
  } else if (direction === 'left' && listItem.leftOptions) {
    listItem.leftOptions.forEach(option => {
      let action = actionHandler(option, data, pdata);
      if (action) {
        opts.push(action);
      }
    })
  }
  return opts;
}

export const actionHandler = function (option, data, pdata = {}) {
  //return undefined;
    let showExpFlag = false;
    if(option.show_expression){
      showExpFlag = callMultiAnotherFunc(new Function("t", 'p',  option.show_expression), data, pdata);
    }
    if(showExpFlag){
      return option;
    }else{
      return undefined;
    }
  
}

export const handlerPadLayoutData = function (data, padItem, datas, describe) {
  switch (padItem.layout.type) {
    case 'icon':
      return '';
    case 'expression':
      return padItem.layout.value.replace(/\{(.+?)\}/g, (match, re) => {
        let value = '';
        describe.fields.forEach(desc => {
          if (desc.api_name === re) {
            value = getListValue(datas, desc);
          }
        })
        return value;
      });
    default:
      describe.fields.forEach(desc => {
        if (desc.api_name === padItem.layout.value) {
          data = getListValue(datas, desc);
        }
      })
      return data;
  }
}

export const getListValue = function (data, des) {
  if (data && des) {
    const index = des.api_name;
    if (data[index]) {
      if (des.options) {
        let label = '';
        for (let x in des.options) {
          if (des.options[x].value === data[index]) {
            label = des.options[x].label;
            const trans = 'options.' + data.object_describe_name + '.' + des.api_name + '.' + des.options[x].value;
            if (window[config.default_language] && window[config.default_language][trans] && window[config.default_language][trans] !== trans) {
              label = window[config.default_language][trans];
            }
          }
        }
        return label;
      } else if (des.type === 'boolean') {
        if (data[index] === 'true') {
          return window[config.default_language]['pad.action_yes'] ? window[config.default_language]['pad.action_yes'] : '是';
        } else {
          return window[config.default_language]['pad.action_no'] ? window[config.default_language]['pad.action_no'] : '否';
        }
      } else if (data[index + '__r']) {
        return data[index + '__r'].name;
      } else if (index.indexOf('time') > -1 || index.indexOf('_date') > -1) {
        return moment(data[index]).format(des.date_format);
      } else {
        return data[index];
      }
    } else {
      return '';
    }
  }
}

export const ListHelper = {
  layoutHandler,
  getOptions,
  insertPadLayoutData,
  insertData,
  rowActionsHandler,
  actionHandler,
  handlerPadLayoutData,
  getListValue
}