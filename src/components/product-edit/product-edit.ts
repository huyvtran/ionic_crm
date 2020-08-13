import { Component } from "@angular/core";
import { AlertController, NavParams, Events, NavController } from "ionic-angular";
import _ from "lodash";
import { UserInfo } from "../../utils/index";
import {
  TranslateService,
  DataService,
  MainService
} from "../../providers/index";
import { KeyMessageView } from '../index'

const searchBody = {
  joiner: "and",
  criterias: [{ field: "call", operator: "==", value: [] }],
  orderBy: "create_time",
  order: "asc",
  objectApiName: "call_key_message",
  pageSize: 10000,
  pageNo: 1
};

const prodBody = {
  joiner: "and",
  criterias: [{ field: "call", operator: "==", value: [] }],
  orderBy: "create_time",
  order: "asc",
  objectApiName: "call_product",
  pageSize: 10000,
  pageNo: 1
};

const keyBody = {
  joiner: "and",
  criterias: [
    {
      field: "is_active",
      operator: "==",
      value: [true]
    }
  ],
  orderBy: "create_time",
  order: "asc",
  objectApiName: "key_message",
  pageSize: 10000,
  pageNo: 1
};

@Component({
  selector: "comp-product-edit",
  templateUrl: "product-edit.html"
})
export class ProductEdit {
  productList = [];
  products = [];

  initProducts = [];
  initCallKeyMessage = [];
  initKeyMessage = [];
  initCallProduct = [];

  options = [];
  results: any;
  recordId: any;
  initProdLists = [];

  keyMessageList = [];
  productValue = [];
  keyMessageValue = [];
  middleProductData = [];
  middleKeyMessageData = [];

  //
  createProList = [];
  updateProList = [];
  deleteProList = [];

  createMessList = [];
  updateMessList = [];
  deleteMessList = [];

  fakeId: any;
  initData: any;

  virCascade: any;
  reactionOptions: any = [];

  virMessage: any = [];
  virProducts: any = [];

  constructor(
    public mainService: MainService,
    public alertCtrl: AlertController,
    public userInfo: UserInfo,
    public navParams: NavParams,
    public events: Events,
    public dataService: DataService,
    public translateService: TranslateService,
    public navCtrl: NavController
  ) {
    this.init();
    console.log("this.navParams.data =======>", this.navParams.data);
    this.initData = this.navParams.data[2];
    this.fakeId = this.navParams.data[2]["fakeId"];
    this.recordId = this.navParams.data[2].id;
    if (searchBody.criterias[0]) {
      searchBody.criterias[0].value = [];
      searchBody.criterias[0].value.push(this.recordId);
    }
    if (prodBody.criterias[0]) {
      prodBody.criterias[0].value = [];
      prodBody.criterias[0].value.push(this.recordId);
    }
    const _cascade = this.initData["_cascade"];
    if (
      !this.recordId &&
      this.fakeId &&
      !_.isEmpty(_cascade)
    ) {
      this.getProducts(_cascade);
    } else {
      this.getProducts(_cascade);
    }
  }

  init() {
    this.productList = [];
    this.products = [];

    this.initProducts = [];
    this.initCallKeyMessage = [];
    this.initKeyMessage = [];
    this.initCallProduct = [];

    this.options = [];
    this.results = undefined;
    this.recordId = undefined;
    this.initProdLists = [];

    this.keyMessageList = [];
    this.productValue = [];
    this.keyMessageValue = [];
    this.middleProductData = [];
    this.middleKeyMessageData = [];

    //
    this.createProList = [];
    this.updateProList = [];
    this.deleteProList = [];

    this.createMessList = [];
    this.updateMessList = [];
    this.deleteMessList = [];

    this.dataService.reportList = [];
  }

  getProducts(_cascade?: any) {
    console.log('_cascade =====>', _cascade)
    //当是编辑的真实数据的时候，还需要增加编辑逻辑
    let body = {
      joiner: "and",
      criterias: [
        {
          field: "level",
          value: ["2"],
          operator: "=="
        }
      ],
      orderBy: "update_time",
      order: "asc",
      objectApiName: "product",
      pageSize: 10000,
      pageNo: 1
    };
    let user_productBody = {
      joiner: "and",
      criterias: [
        {
          field: "user_info",
          value: [this.userInfo.userid],
          operator: "=="
        }
      ],
      orderBy: "update_time",
      order: "asc",
      objectApiName: "user_product",
      pageSize: 10000,
      pageNo: 1
    };
    Promise.all([
      this.mainService.getSearchData(body),
      this.mainService.getSearchData(searchBody),
      this.mainService.getSearchData(keyBody),
      this.mainService.getSearchData(prodBody),
      this.mainService.getDescribeByApiName("key_message"),
      this.mainService.getSearchData(user_productBody)
    ]).then((res: any) => {
      let products = _.cloneDeep(res[0].body.result);
      products.forEach(prod => {
        if (res[5].body.result) {
          let user_product = res[5].body.result;
          for (let i = 0; i < user_product.length; i++) {
            if (user_product[i].product == prod.id) {
              this.products.push(prod);
            }
          }
        }
      });
      this.keyMessageList = res[2].body.result;
      if (res[3].body.result !== undefined) {
        this.initProducts = res[3].body.result;
        res[3].body.result.forEach(rst => {
          this.dataService.reportList.push({ id: rst.id });
        });
      }

      if (res[1].body.result !== undefined) {
        res[1].body.result.forEach(rst => {
          this.dataService.reportList.push({ id: rst.id });
        });
      }

      this.initKeyMessage = res[1].body.result;
      if (this.initProducts.length > 0) {
        this.initProducts.forEach(pro => {
          if (pro.owner == this.userInfo.userid) {
            this.products.forEach(product => {
              if (pro.product == product.id) {
                product.is_checked = "true";
                product.message = [];
                this.productList.push(product);
                const prod = _.cloneDeep(product);
                this.initProdLists.push(prod);
              }
            });
          }
        });
      }

      this.options = res[4].body.fields;
      if (this.options.length > 0) {
        this.options.forEach(option => {
          if (option.api_name === "reaction_options") {
            this.results = option.options;
            this.results.forEach(rst => {
              if (rst.value.indexOf("positive") > -1) {
                rst.label = this.translateService.translateFunc(
                  "pad.product_reactive"
                );
              } else if (rst.value.indexOf("neutral") > -1) {
                rst.label = this.translateService.translateFunc(
                  "pad.product_neutral"
                );
              } else if (rst.value.indexOf("negative") > -1) {
                rst.label = this.translateService.translateFunc(
                  "pad.product_negative"
                );
              }
            });
          }
        });
      }

      if (this.productList.length > 0) {
        this.insertKeyMessage(
          this.productList,
          this.initKeyMessage,
          this.keyMessageList,
          this.results,
          this.initProducts
        );
      }

      if(!_.isEmpty(_cascade)){
        this.generatorInitalData(_cascade);
      }
    });
  }

  generatorInitalData(_cascade){
    // console.log(_cascade);
    // console.log(
    //   this.products, 
    //   this.productList,
    //   this.initKeyMessage,
    //   this.keyMessageList,
    //   this.results,
    //   this.initProducts
    // );
    if(!_.isEmpty(_cascade.create)){
      if(_cascade.create.call_call_product_list && _cascade.create.call_call_product_list.length > 0){
        this.virProducts = _.concat(this.virProducts, _cascade.create.call_call_product_list)
      }
      if(_cascade.create.call_call_key_message_list && _cascade.create.call_call_key_message_list.length > 0){
        this.virMessage = _.concat(this.virMessage, _cascade.create.call_call_key_message_list);
      }
    }
    if(!_.isEmpty(_cascade.update)){
      if(_cascade.update.call_call_product_list && _cascade.update.call_call_product_list.length > 0){
        _.each(this.productList, prod => {
          _.each(_cascade.update.call_call_product_list, virUpdate => {
            if(prod.id == virUpdate.product && virUpdate['reaction']){
              this.productValue[virUpdate.product] = virUpdate['reaction'];
            }
          })
        })
      }
      if(_cascade.update.call_call_key_message_list && _cascade.update.call_call_key_message_list.length > 0){
        _.each(_cascade.update.call_call_key_message_list, mess => {
          _.each(this.productList, product => {
            if(product.id == mess.product){
              if(!product.message){
                product.message = [];
              }
              product.message.push(mess);
            }
          })
          if(mess['reaction']){
            this.keyMessageValue[`${mess.product}/${mess.key_message}`] = mess['reaction'];
          }
        })
      }
    }
    if(!_.isEmpty(_cascade.delete)){
      if(_cascade.delete.call_call_product_list && _cascade.delete.call_call_product_list.length > 0){
        _.each(_cascade.delete.call_call_product_list, delProduct => {
          _.each(this.productList, (product, index) => {
            if(delProduct.product == product.id){
              delete this.productValue[delProduct.product];
              this.productList.splice(index,1);
            }
          })
        })
      }
      if(_cascade.delete.call_call_key_message_list && _cascade.delete.call_call_key_message_list.length > 0){
        _.each(_cascade.delete.call_call_key_message_list, mess => {
          _.each(this.productList, prod => {
            if(prod.id == mess.product){
              if(prod.message && prod.message.length > 0){
                _.each(prod.message, (mk, index) => {
                  if(mk.id == mess.key_message){
                    prod.message.splice(index, 1);
                  }
                })
              }
              delete this.keyMessageValue[mess.product + '/' + mess.key_message];
            }
          })
        })
      }
    }

    _.each(this.virProducts, product => {
      if(product){
        _.each(this.products, prod => {
          if(prod.id == product.product){
            prod.is_checked = true;
            this.productList.push(prod);
          }
        })
        this.productValue[product.product] = product['reaction'] ? product['reaction'] : '';
      }
    })
    _.each(this.virMessage, mess => {
      if(mess){
        _.each(this.productList, product => {
          if(product.id == mess.product){
            if(!product.message){
              product.message = [];
            }
            product.message.push(mess);
          }
        })
        if(mess['reaction']){
          this.keyMessageValue[`${mess.product}/${mess.key_message}`] = mess['reaction'];
        }
      }
    })
  }

  insertKeyMessage(
    productList,
    initKeyMessage,
    keyMessageList,
    results,
    initProducts
  ) {
    console.log('this.productList =======>', this.productList);
    this.productList.forEach(pro => {
      let message = [];
      initProducts.forEach(product => {
        if (product.reaction === "1") {
          product.reaction = "positive";
        } else if (product.reaction === "2") {
          product.reaction = "neutral";
        } else if (product.reaction === "3") {
          product.reaction = "negative";
        }
        this.productValue[product.product] = product.reaction;
      });
      initKeyMessage.forEach(keyMessage => {
        if (pro.id == keyMessage.product) {
          message.push(keyMessage);
          if (keyMessage.reaction === "1") {
            keyMessage.reaction = "positive";
          } else if (keyMessage.reaction === "2") {
            keyMessage.reaction = "neutral";
          } else if (keyMessage.reaction === "3") {
            keyMessage.reaction = "negative";
          }
          this.keyMessageValue[pro.id + "/" + keyMessage.key_message] =
            keyMessage.reaction;
        }
      });
      pro.message = message;
      this.initProdLists.forEach(initProd => {
        if (pro.id == initProd.id) {
          initProd.message = _.cloneDeep(message);
        }
      });
    });
  }

  updateProductList(e, product) {
    product.is_checked = e.checked.toString();
    if (e.checked === false) {
      this.removeProductOfReactList(product);
    } else {
      this.addProductOfReactList(product);
    }
    this.events.publish("menuAction:click");
  }

  removeProductOfReactList(product) {
    this.productList.forEach(pro => {
      if (pro.id == product.id) {
        this.productList.splice(this.productList.indexOf(pro), 1);
        //this.productValue
        for (let i in this.keyMessageValue) {
          if (i.substring(0, i.indexOf("/")) == pro.id) {
            delete this.keyMessageValue[i];
          }
        }
        for (let j in this.productValue) {
          if (j == pro.id) {
            delete this.productValue[j];
          }
        }
      }
    });
    this.resetProduct();
    //this.resetKeyMessage();
  }

  addProductOfReactList(product) {
    product.message = [];
    this.productList.push(product);
  }

  deleteKeyMessage(product) {
    this.products.forEach(prod => {
      if (product.id == prod.id) {
        prod.is_checked = false;
      }
    });
    this.productList.splice(this.productList.indexOf(product), 1);
  }

  addKeyMessage(product) {
    if (this.initCallKeyMessage.length !== 0) {
    } else {
      if (this.keyMessageList.length > 0) {
        let messageList = [];
        this.keyMessageList.forEach(keyMessage => {
          if (product.id == keyMessage.product) {
            messageList.push(keyMessage);
          }
        });
        let alert = this.alertCtrl.create();
        alert.setCssClass("fc-alert-css");
        alert.setTitle(product.name);
        if (messageList.length <= 0) {
          alert.setSubTitle(
            this.translateService.translateFunc(
              "pad.product_reaction_remind_no_react"
            )
          );
        } else {
          this.navCtrl.push(KeyMessageView, {
            name: product.name,
            result: messageList,
            template: product.message,
            keyMessageValue: this.keyMessageValue,
            type: 'edit',
            product
          })
        }
      } else {
        let alert = this.alertCtrl.create({
          title: this.translateService.translateFunc("pad.alert_remind_title"),
          subTitle: this.translateService.translateFunc(
            "pad.product_no_more_reaction"
          ),
          buttons: [
            {
              text: this.translateService.translateFunc("pad.action_ok"),
              handler: data => {}
            }
          ]
        });
        alert.present();
      }
    }
    console.log("add keymessage after =====>", product);
  }

  removeKeyMessage(product, mess) {
    if (product.message !== undefined) {
      product.message.splice(product.message.indexOf(mess), 1);
    }
    delete this.keyMessageValue[product.id + "/" + mess.key_message];
    //this.resetKeyMessage();
  }

  resetProduct() {
    for (let x in this.productValue) {
      if (this.productValue[x] == "") {
      } else {
        this.middleProductData[x] = this.productValue[x];
      }
    }
    this.productValue = this.middleProductData;
  }

  resetKeyMessage() {
    for (let x in this.keyMessageValue) {
      if (this.keyMessageValue[x] == "") {
      } else {
        this.middleKeyMessageData[x] = this.keyMessageValue[x];
      }
    }
    this.keyMessageValue = this.middleKeyMessageData;
  }

  getValuesOfProducts() {
    const initKms = [];
    const prodKms = [];

    //初始化这些list
    this.createProList = [];
    this.updateProList = [];
    this.deleteProList = [];

    this.createMessList = [];
    this.updateMessList = [];
    this.deleteMessList = [];

    for(let key of this.productValue){
      if(!this.productValue[key]){
        delete this.productValue[key];
      }
    }

    for(let key of this.keyMessageValue){
      if(!this.keyMessageValue[key]){
        delete this.keyMessageValue[key];
      }
    }

    this.initProdLists.forEach(initProd => {
      if (initProd.message) {
        initProd.message.forEach(ms => {
          initKms.push(ms);
        });
      }
    });

    this.productList.forEach(prod => {
      if (prod.message) {
        prod.message.forEach(ms => {
          prodKms.push(ms);
        });
      }
    });

    let productMap = {};
    let keyMessageMap = {};
    if (this.productList.length > 0) {
      for (let prod of this.productList) {
        productMap[prod.id] = prod;
        if (prod.message && prod.message.length > 0) {
          for (let pr of prod.message) {
            keyMessageMap[pr.id] = pr.name;
          }
        }
      }
    }
    for (let create in this.productValue) {
      let createFlag = true;
      this.initProducts.forEach(initProd => {
        if (initProd.product == create) {
          createFlag = false;
        }
      });
      if (createFlag) {
        this.createProList.push({
          product: create,
          product__r: { id: create, name: productMap[create].name },
          reaction: this.productValue[create],
          version: 0
        });
      }
    }
    if (this.productList.length > 0) {
      this.productList.forEach(prod => {
        let flag = false;
        this.initProdLists.forEach(initProd => {
          if (prod.id == initProd.id) {
            flag = true;
          }
        });
        if (!flag && !this.productValue[prod.id]) {
          this.createProList.push({
            product: prod.id,
            product__r: { id: prod.id, name: prod.name },
            reaction: "",
            version: 0
          });
        }
      });
    }

    this.initProducts.forEach(initProd => {
      let deleteFlag = true;
      this.productList.forEach(prod => {
        if (initProd.product == prod.id) {
          deleteFlag = false;
        }
      });
      if (deleteFlag) {
        let reaction = "";
        if (initProd.reaction !== undefined) {
          reaction = initProd.reaction;
        }
        this.deleteProList.push({ id: initProd.id, version: initProd.version });
      }
    });

    this.initProducts.forEach(initProd => {
      for (let prodKey in this.productValue) {
        if (prodKey == initProd.product) {
          if (
            this.productValue[prodKey] !== initProd.reaction &&
            this.productValue[prodKey] !== undefined
          ) {
            this.updateProList.push({
              reaction: this.productValue[initProd.product],
              id: initProd.id,
              version: initProd.version
            });
          }
        }
      }
    });

    this.productList.forEach(prod => {
      this.initProducts.forEach(initProd => {
        if (prod.id == initProd.product) {
          if (this.productValue[initProd.product]) {
          } else {
            if (initProd.reaction !== "") {
              this.updateProList.push({
                reaction: "",
                id: initProd.id,
                version: initProd.version
              });
            }
          }
        }
      });
    });

    this.productList.forEach(prod => {
      const keyMesses = prod.message;
      if (keyMesses && keyMesses.length > 0) {
        keyMesses.forEach(km => {
          let isHave = false;
          for (let createKey in this.keyMessageValue) {
            if (createKey == prod.id + "/" + km.key_message) {
              isHave = true;
            }
          }
          if (!isHave) {
            this.createMessList.push({
              key_message: km.key_message,
              key_message__r: {
                id: km.key_message,
                name: keyMessageMap[km.key_message]
              },
              product: prod.id,
              reaction: "",
              version: 0
            });
          }
        });
      }
    });

    for (let createKey in this.keyMessageValue) {
      let createKeyFlag = true;
      let proId = createKey.substring(0, createKey.indexOf("/"));
      let keyId = createKey.substring(createKey.indexOf("/") + 1);
      this.initKeyMessage.forEach(initKey => {
        if (initKey.key_message == keyId) {
          createKeyFlag = false;
        }
      });
      if (createKeyFlag) {
        this.createMessList.push({
          key_message: keyId,
          key_message__r: { id: keyId, name: keyMessageMap[keyId] },
          product: proId,
          reaction: this.keyMessageValue[createKey],
          version: 0
        });
      }
    }

    initKms.forEach(initKm => {
      let flag = true;
      prodKms.forEach(prodKm => {
        if (initKm.key_message == prodKm.key_message) {
          flag = false;
        }
      });

      if (flag) {
        this.deleteMessList.push({ id: initKm.id, version: initKm.version });
      }
    });

    initKms.forEach(prodKm => {
      for (let x in this.keyMessageValue) {
        let key = x.substring(x.indexOf("/") + 1);
        if (
          prodKm.key_message == key &&
          prodKm.reaction != this.keyMessageValue[x]
        ) {
          if (this.keyMessageValue[x] !== undefined) {
            this.updateMessList.push({
              reaction: this.keyMessageValue[x],
              id: prodKm.id,
              version: prodKm.version
            });
          }
        }
      }
    });

    return [
      this.createProList,
      this.deleteProList,
      this.updateProList,
      this.createMessList,
      this.deleteMessList,
      this.updateMessList
    ];
  }

  getInitValues() {
    return [this.initProducts, this.initKeyMessage];
  }
}
