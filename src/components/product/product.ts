import { Component } from '@angular/core';
import { AlertController, NavController } from 'ionic-angular';
import _ from 'lodash';
import { MainService, TranslateService } from '../../providers/index';
import { UserInfo } from '../../utils/index';
import { KeyMessageView } from '../key-message/key-message'

const filter_criterias = [
  {
    "field": "level",
    "value": ["2"],
    "operator": "=="
  }
]

@Component({
  selector: 'comp-product',
  templateUrl: 'product.html'
})
export class Product {
  products: any[];
  userProducts = [];
  productList = [];
  productName: any;
  keyMessageDescribe: any;
  productDisp = false;
  productLevelKeyValue: any;
  keyMetadata: any;
  keyResult: any;
  productsAtts: any;
  preProId: any;
  productValue = [];
  keyMessageValue = [];
  middleProductData = [];
  middleKeyMessageData = [];
  constructor(
    public mainService: MainService,
    public alertCtrl: AlertController,
    public translateService: TranslateService,
    public userInfo: UserInfo,
    public navCtrl: NavController
  ) {
    this.init();
    this.getUserProduct();
  }

  init() {
    this.products = [];
    this.productList = [];
    this.productName = undefined;
    this.keyMessageDescribe = undefined;
    this.productDisp = false;
    this.productLevelKeyValue = undefined;
    this.keyMetadata = undefined;
    this.keyResult = undefined;
    this.productsAtts = undefined;
    this.preProId = undefined;
    this.productValue = [];
    this.keyMessageValue = [];
    this.middleProductData = [];
    this.middleKeyMessageData = [];
  }

  getUserProduct() {
    let body = {
      "joiner": "and",
      "criterias": [{
        field: 'user_info',
        operator: 'in',
        value: [this.userInfo.userid]
      }],
      "orderBy": "update_time",
      "order": "asc",
      "objectApiName": 'user_product',
      "pageNo": 1,
      "pageSize": 1000
    };
    this.mainService.getSearchData(body).then((res: any) => {
      this.userProducts = res.body.result;
      this.getProducts('product');

    })
  }

  getProducts(apiName) {
    let body = {
      "joiner": "and",
      "criterias": filter_criterias,
      "orderBy": "update_time",
      "order": "asc",
      "objectApiName": apiName,
      "pageNo": 1,
      "pageSize": 1000
    };

    this.mainService.getSearchData(body).then((res: any) => {
      if (res.body.result) {
        res.body.result.forEach(rest => {
          for (let i = 0; i < this.userProducts.length; i++) {
            if (rest.id == this.userProducts[i].product) {
              this.products.push(
                rest
              );
            }
          }
        })
      }
    })
  }

  updateProductList(e, product) {
    this.middleKeyMessageData = [];
    if (e.value === true) {
      product.message = [];
      this.productList.push(product);
      this.getProductKeys(product);
    } else {
      if (this.productList !== undefined) {
        this.productList.forEach(prod => {
          if (prod == product) {
            prod.message = [];
            for (let i in this.keyMessageValue) {
              if (i.substring(0, i.indexOf('/')) == prod.id) {
                this.keyMessageValue[i] = '';
              }
            }
            for (let j in this.productValue) {
              if (j == prod.id) {
                this.productValue[j] = '';
              }
            }
            this.productList.splice(this.productList.indexOf(prod), 1);
          }
        });
      }
    }

    for (let y in this.productValue) {
      if (this.productValue[y] === '') {
      } else {
        this.middleProductData[y] = this.productValue[y];
      }
    }
    this.productValue = this.middleProductData;
  }

  getProductKeys(product: any) {
    this.preProId = product.id;
    const field = product.object_describe_name;
    const objectApiName = 'key_message';
    this.productName = product.name;
    const id = product.id;
    let body = {
      "joiner": "and",
      "criterias": [
        {
          "field": field,
          "operator": "==",
          "value": [
            id
          ]
        },
        {
          field:'is_active',
          operator:'==',
          value:[true]
        }
      ],
      "orderBy": "display_order",
      "order": "asc",
      "objectApiName": objectApiName,
      "pageSize": 10000,
      "pageNo": 1
    };

    Promise.all([this.mainService.getSearchData(body), this.mainService.getDescribeByApiName(objectApiName)]).then((res: any) => {
      this.keyMetadata = res[0].body;
      this.keyResult = res[0].body.result;
      this.keyMessageDescribe = res[1].body;
      this.keyMessageDescribe.fields.map(field => {
        if (field.api_name === 'reaction_options') {
          let value;
          let options = [];
          field.options.forEach(react => {
            if (react.value.indexOf('positive') > -1) {
              react.label = this.translateService.translateFunc('pad.product_reactive');
            } else if (react.value.indexOf('neutral') > -1) {
              react.label = this.translateService.translateFunc('pad.product_neutral');
            } else if (react.value.indexOf('negative') > -1) {
              react.label = this.translateService.translateFunc('pad.product_negative');
            }
            value = react;
            options.push(value);
          })
          field.options = options;
          this.productLevelKeyValue = field;
        }
      })
    })
  }

  alertPop(metadata, product, result) {
    if(!product.result){
      product.result = [];
    }
    if (product.id !== this.preProId) {
      const field = product.object_describe_name;
      const objectApiName = 'key_message';
      this.productName = product.name;
      const id = product.id;
      let body = {
        "joiner": "and",
        "criterias": [
          {
            "field": field,
            "operator": "==",
            "value": [
              id
            ]
          },
          {
            field:'is_active',
            operator:'==',
            value:[true]
          }
        ],
        "orderBy": "display_order",
        "order": "asc",
        "objectApiName": objectApiName,
        "pageSize": 10000,
        "pageNo": 1
      };
      this.mainService.getSearchData(body).then((res: any) => {
        metadata = res.body;
        result = metadata.result;
        this.alertWindow(metadata, product, result);
      })
    } else {
      this.alertWindow(metadata, product, result);
    }
  }

  alertWindow(metadata, product, result) {
    const template = _.cloneDeep(result);
    if (metadata.result !== undefined) {
      if (product.message != undefined) {
        product.message.forEach(msg => {
          result.forEach(rst => {
            if (rst.id == msg.id) {
              template.forEach(tem => {
                if(tem.id == msg.id){
                  template.splice(template.indexOf(tem), 1);
                }
              })
            }
          });
        });
      }

      this.navCtrl.push(KeyMessageView, {
        name: this.productName,
        result,
        template,
        product
      })
    }
  }

  removeItem(product, item) {
    let message = product.message;
    let index = message.indexOf(item);
    product.message.splice(index, 1);
  }

  //helper

  getObj(str) {
    return JSON.parse(str);
  }

  changeKeyToMessage(key) {
    if (!key) {
      key = JSON.stringify(['positive', 'neutral', 'negative']);
    }
    let options = [];
    let keys = JSON.parse(key);
    let reactions;
    this.keyMessageDescribe.fields.map(field => {
      if (field.api_name === 'reaction_options') {
        reactions = field;
      }
    })

    keys.forEach(k => {
      let value;
      reactions.options.forEach(react => {
        if (k === react.value) {
          if (react.value.indexOf('positive') > -1) {
            react.label = this.translateService.translateFunc('pad.product_reactive');
          } else if (react.value.indexOf('neutral') > -1) {
            react.label = this.translateService.translateFunc('pad.product_neutral');
          } else if (react.value.indexOf('negative') > -1) {
            react.label = this.translateService.translateFunc('pad.product_negative');
          }
          value = react;
        }
      })
      options.push(value);
    });
    return options;
  }

  getValuesOfProducts() {
    return [this.productList, this.productValue, this.keyMessageValue];
  }
}
