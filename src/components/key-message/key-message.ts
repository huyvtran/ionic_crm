import { Component } from "@angular/core";
import { NavParams, NavController, Events } from "ionic-angular";
import { TranslateService, HttpService } from "../../providers/index";
import { config, UserInfo } from '../../utils/index';
import _ from 'lodash';

@Component({
  templateUrl: "key-message.html"
})

export class KeyMessageView {
    constructor(
        public navParams: NavParams,
        public navCtrl: NavController,
        public events: Events,
        public translateService: TranslateService
    ) {
        const { data: { name, result, template, product, type, keyMessageValue } } = navParams;
        this.title = name;
        this.product = product;
        this.type = type;
        this.keyMessageValue = keyMessageValue;
        // if(type === 'edit') {
        //     _.each(result, rst => {
        //         _.each(template, temp => {
        //             if(rst.id === temp.key_message) {
        //                 rst.is_item_checked = true;
        //             }
        //         })
        //     })
        //     this.items = result;
        // }else {
        //     _.each(result, rst => {
        //         let is_have = false;
        //         _.each(template, temp => {
        //             if(rst.id === temp.id) {
        //                 is_have = true;
        //             }
        //         })
        //         if(is_have) {
        //             this.items.push(rst)
        //         }
        //     })
        // }
        _.each(result, rst => {
            _.each(template, temp => {
                if(rst.id === temp.key_message) {
                    rst.is_item_checked = true;
                }
            })
        })
        this.items = result;
    }

    title: string;
    items: any[] = [];
    product: any = {};
    type: string;
    keyMessageValue: any = {};

    backToUp() {
        // this.product.message = []
        this.navCtrl.pop();
    }

    confirmSelect() {
        this.product.message = this.items.filter(item => item.is_item_checked === true);
        if(this.type === 'edit') {
            _.each(this.product.message, item => {
                item.key_message = item.id;
                this.keyMessageValue[this.product.id + '/' + item.id] = '';
            })
        }
        this.navCtrl.pop()
    }
}