import { Component } from "@angular/core";
import { NavParams } from "ionic-angular";
import _ from "lodash";
import { MainService, TranslateService } from "../../providers/index";

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
  criterias: [],
  orderBy: "create_time",
  order: "asc",
  objectApiName: "key_message",
  pageSize: 10000,
  pageNo: 1
};

@Component({
  selector: "comp-product-detail",
  templateUrl: "product-detail.html"
})
export class ProductDetail {
  initCallKeyMessage = [];
  initCallProduct = [];

  products: any;
  productList = [];
  keyMessageList = [];
  reactionOptions: any;

  store: any;
  recordId: any;
  fakeId: any;
  initData: any;

  virCascade: any;

  constructor(
    public mainService: MainService,
    public navParams: NavParams,
    public translateService: TranslateService
  ) {
    this.init();
    this.initData = this.navParams.data[0];
    this.recordId = this.navParams.data[0].id;
    this.fakeId = this.navParams.data[0]["fakeId"];
    if (searchBody.criterias[0]) {
      searchBody.criterias[0].value = [];
      searchBody.criterias[0].value.push(this.recordId);
    }
    if (prodBody.criterias[0]) {
      prodBody.criterias[0].value = [];
      prodBody.criterias[0].value.push(this.recordId);
    }
    if (!this.recordId && this.fakeId) {
      searchBody.criterias = [];
      prodBody.criterias = [];
      this.getVProducts();
    } else {
      this.getProducts();
    }
  }

  init() {
    this.initCallKeyMessage = [];
    this.initCallProduct = [];

    this.products = undefined;
    this.productList = [];
    this.keyMessageList = [];
    this.reactionOptions = undefined;

    this.store = undefined;
    this.recordId = undefined;
  }

  getVProducts() {
    if (
      this.initData["_cascade"] &&
      (this.initData["_cascade"].create || this.initData["_cascade"].update)
    ) {
      let productActions = [];
      let keyMessageActions = [];
      if (
        this.initData["_cascade"].create &&
        this.initData["_cascade"].create.call_call_product_list
      ) {
        productActions = _.concat(
          productActions,
          this.initData["_cascade"].create.call_call_product_list
        );
        if (this.initData["_cascade"].create.call_call_key_message_list) {
          keyMessageActions = _.concat(
            keyMessageActions,
            this.initData["_cascade"].create.call_call_key_message_list
          );
        }
      }
      if (
        this.initData["_cascade"].update &&
        this.initData["_cascade"].update.call_call_product_list
      ) {
        productActions = _.concat(
          productActions,
          this.initData["_cascade"].update.call_call_product_list
        );
        if (this.initData["_cascade"].update.call_call_key_message_list) {
          keyMessageActions = _.concat(
            keyMessageActions,
            this.initData["_cascade"].update.call_call_key_message_list
          );
        }
      }
      _.each(productActions, product => {
        const messages = [];
        _.each(keyMessageActions, keymess => {
          if (keymess.product === product.product) {
            messages.push(keymess);
          }
        });
        product.message = messages;
      });
      this.mainService.getDescribeByApiName("key_message").then((res: any) => {
        const keyMessageDesFields = res.body.fields;
        keyMessageDesFields.forEach(des => {
          if (des.api_name === "reaction_options") {
            this.reactionOptions = des.options;
          }
        });
        this.productList = productActions;
      });
    }
  }

  getProducts() {
    Promise.all([
      this.mainService.getSearchData(searchBody),
      this.mainService.getSearchData(keyBody),
      this.mainService.getSearchData(prodBody),
      this.mainService.getDescribeByApiName("key_message")
    ]).then((res: any) => {
      this.initCallKeyMessage = res[0].body.result;
      this.initCallProduct = res[2].body.result;
      let keys = res[0].body.result;
      let allMessage = res[1].body.result;
      this.productList = _.cloneDeep(res[2].body.result);
      console.log('this.productList =====>', res[2].body.result);
      let describe = res[3].body.fields;
      describe.forEach(des => {
        if (des.api_name === "reaction_options") {
          this.reactionOptions = des.options;
        }
      });
      keys.forEach(key => {
        allMessage.forEach(message => {
          if (key.key_message == message.id) {
            this.keyMessageList.push({ key: key, message: message });
          }
        });
      });
      this.productList.forEach(product => {
        let message = [];
        this.keyMessageList.forEach(keyMessage => {
          if (product.product == keyMessage.key.product) {
            message.push(keyMessage);
          }
        });
        product.message = message;
      });
      this.editVirtrulList(this.initData);
    });
  }

  generatorVirtrulData(
    addProducts,
    editProducts,
    deleteProducts,
    addKeyMesses,
    editKeyMesses,
    deleteKeyMesses
  ) {
    console.log(addProducts,
      this.productList);
    if (addProducts.length > 0) {
      _.each(addProducts, prod => {
        let is_have = false;
        _.each(this.productList, product => {
          if (product.product == prod.product) {
            is_have = true;
            product.reaction = prod.reaction;
            //console.log('prod ====> ', prod);
            //product.product__r = prod.product__r;
          }
        });
        if(!is_have){
          this.productList.push(prod);
        }
      });
    }
    if (editProducts.length > 0) {
      _.each(editProducts, prod => {
        _.each(this.productList, product => {
          if (product.id == prod.id) {
            product.reaction = prod.reaction;
            //product.product__r = prod.product__r;
          }
        });
      });
    }
    if (deleteProducts.length > 0) {
      _.each(deleteProducts, prod => {
        _.each(this.productList, product => {
          if (product.id == prod.id) {
            delete product.reaction;
            delete product.message;
          }
        });
      });
    }
    if (addKeyMesses.length > 0) {
      _.each(addKeyMesses, keyMess => {
        _.each(this.productList, product => {
          if (product.product == keyMess.product) {
            if (!product.message) {
              product.message = [];
            }
            product.message.push(keyMess);
          }
        });
      });
    }
    if (editKeyMesses.length > 0) {
      _.each(editKeyMesses, keyMess => {
        _.each(this.productList, product => {
          if (product.message) {
            _.each(product.message, mess => {
              if (mess.message && mess.key.id == keyMess.id) {
                mess.reaction = keyMess.reaction;
              }
            });
          }
        });
      });
    }
    if(deleteKeyMesses.length > 0){
      _.each(deleteKeyMesses, keyMess => {
        _.each(this.productList, product => {
          if(product.message){
            _.each(product.message, (mess, index) => {
              if(mess.message && mess.key.id == keyMess.id){
                product.message.splice(index, 1);
              }
            })
          }
        })
      })
    }
    console.log(this.productList);
  }

  editVirtrulList(record: any) {
    const { _cascade } = record;
    if (_cascade && !_.isEmpty(_cascade)) {
      let addProducts = [];
      let addKeyMesses = [];
      let editProducts = [];
      let editKeyMesses = [];
      let deleteProducts = [];
      let deleteKeyMesses = [];

      //add virtrul
      if (_cascade.create) {
        if (
          _cascade.create.call_call_key_message_list &&
          _cascade.create.call_call_key_message_list.length > 0
        ) {
          addKeyMesses = _.concat(
            addKeyMesses,
            _cascade.create.call_call_key_message_list
          );
        }
        if (
          _cascade.create.call_call_product_list &&
          _cascade.create.call_call_product_list.length > 0
        ) {
          addProducts = _.concat(
            addProducts,
            _cascade.create.call_call_product_list
          );
        }
      }

      //edit virtrul
      if (_cascade.update) {
        if (
          _cascade.update.call_call_product_list &&
          _cascade.update.call_call_product_list.length > 0
        ) {
          editProducts = _.concat(
            editProducts,
            _cascade.update.call_call_product_list
          );
        }
        if (
          _cascade.update.call_call_key_message_list &&
          _cascade.update.call_call_key_message_list.length > 0
        ) {
          editKeyMesses = _.concat(
            editKeyMesses,
            _cascade.update.call_call_key_message_list
          );
        }
      }

      //delete virtrul
      if (_cascade.delete) {
        if (
          _cascade.delete.call_call_product_list &&
          _cascade.delete.call_call_product_list.length > 0
        ) {
          deleteProducts = _.concat(
            deleteProducts,
            _cascade.delete.call_call_product_list
          );
        }
        if (
          _cascade.delete.call_call_key_message_list &&
          _cascade.delete.call_call_key_message_list.length > 0
        ) {
          deleteKeyMesses = _.concat(
            deleteKeyMesses,
            _cascade.delete.call_call_key_message_list
          );
        }
      }

      this.generatorVirtrulData(
        addProducts,
        editProducts,
        deleteProducts,
        addKeyMesses,
        editKeyMesses,
        deleteKeyMesses
      );
    }
  }

  getReaction(reaction) {
    let reactLabel = "";
    this.reactionOptions.forEach(react => {
      if (reaction == react.value) {
        reactLabel = react.label;
        if (react.value.indexOf("positive") > -1) {
          reactLabel = this.translateService.translateFunc(
            "pad.product_reactive"
          );
        } else if (react.value.indexOf("neutral") > -1) {
          reactLabel = this.translateService.translateFunc(
            "pad.product_neutral"
          );
        } else if (react.value.indexOf("negative") > -1) {
          reactLabel = this.translateService.translateFunc(
            "pad.product_negative"
          );
        }
      }
    });
    let x = _.get(this.reactionOptions, reaction);
    if (x !== undefined) {
      reactLabel = x.label;
    }
    return reactLabel;
  }
}
