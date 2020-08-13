import { Component } from '@angular/core';
import { AlertController, NavParams, Platform, ViewController, NavController } from 'ionic-angular';
import { File } from '@ionic-native/file';
import { MainService, TranslateService } from '../../providers/index';
import { UserInfo } from '../../utils/index';
import _ from 'lodash';
@Component({
  selector: 'page-clm-pick-list',
  templateUrl: 'clm-pick-list.html'
})
export class ClmPickListPage {
  clmDir: string = 'clm';
  clmList: ClmListItem[];
  clmDownloadedList: { [index: string]: ClmListItem } = {};
  clmSelectedList: { [index: string]: boolean } = {};
  clmCount: number = 0;
  constructor(
    public alertCtrl: AlertController,
    public file: File,
    public navCtrl: NavController,
    public mainService: MainService,
    public navParams: NavParams,
    public plt: Platform,
    public viewCtrl: ViewController,
    public translateService: TranslateService,
    public userInfo: UserInfo
  ) { 
    const { data: { surveyData } } = navParams;
    this.surveyData = surveyData
  }
  surveyData:any = {}
  close() {
    // this.viewCtrl.dismiss();
    this.navCtrl.pop()
  }
  ionViewDidEnter() {
    this.clmList = [];
    this.readList();
  }
  /**读取并解析媒体文件信息 */
  readList() {
    let reader = [this.readFullList()];
    this.readSelectedList();
    if (this.plt.is('cordova')) {
      reader.push(this.readDownloadedList());
    }
    Promise.all(reader).then(res => {
      let fulllist = res[0];
      for (let ful of fulllist) {
        let isDownload = false;
        let isSelected = false;
        if (ful.id) {
          if (this.plt.is('cordova')) {
            if (this.clmDownloadedList[ful.id]) {
              if (this.clmDownloadedList[ful.id].version >= ful.version) {
                isDownload = true;
              }
            }
          } else {
            if (Math.random() > 0.5) {
              isDownload = true;
            }
          }
          if (this.clmSelectedList[ful.id]) {
            isSelected = true;
          }
          let clmItem: ClmListItem = {
            id: ful.id,
            name: ful.name,
            version: ful.version,
            download: isDownload,
            select: isSelected,
            url: ful.url,
            product: ful.product__r.name
          };
          this.clmList.push(clmItem);
        }
      }
    });
  }
  /**读取全部媒体文件列表 */
  /**读取全部媒体文件列表 */
  readFullList() {
    let availableProductParam = {
      pageSize: 1000,
      pageNo: 1,
      joiner: 'and',
      objectApiName: 'product',
      order: 'asc',
      orderBy: 'update_time',
      criterias: [{
        field: 'level',
        value: ['2'],
        operator: '=='
      }]
    };
    let userProduct = {
      pageSize: 1000,
      pageNo: 1,
      joiner: 'and',
      objectApiName: 'user_product',
      order: 'asc',
      orderBy: 'update_time',
      criterias: [
        {
          field: "user_info",
          value: [this.userInfo.userid],
          operator: "=="
        }
      ],
    }
    return this.mainService.getSearchData(availableProductParam).then((res: any) => {
      let productList = [];

      for (let rdata of res.body.result) {
        productList.push(rdata.id);
      }
      return this.mainService.getSearchData(userProduct).then((res: any) => {
        const userProductList = res.body.result;
        const products = [];
        productList.forEach(pro => {
          let flag = false;
          if (userProductList.length > 0) {
            userProductList.forEach(usrP => {
              if (usrP.product == pro) {
                flag = true;
              }
            })
          }
          if (flag) {
            products.push(pro);
          }
        })
        let body = {
          pageSize: 1000,
          pageNo: 1,
          joiner: "and",
          objectApiName: "clm_presentation",
          order: "asc",
          orderBy: "create_time",
          criterias: []
        };

        let productParam = {
          field: 'product',
          operator: 'in',
          value: products
        };
        let productParamStatus = {
          field: 'status',
          operator: '==',
          value: ['1']
        };
        body.criterias.push(productParam);
        body.criterias.push(productParamStatus);
        return this.mainService.getSearchData(body);
      })

    }).then(res => {
      return res.body.result as any[];
    }).catch(() => {
      return [];
    });
  }
  /**读取本地所有媒体文件列表 */
  readDownloadedList() {
    return this.file.listDir(this.file.dataDirectory, this.clmDir).then(res => {
      let downloadItem: Promise<void>[] = [];
      for (let re of res) {
        if (re.isDirectory) {
          downloadItem.push(this.readDownloadedItem(re));
        }
      }
      return Promise.all(downloadItem);
    }).catch(err => {
      return Promise.all([]);
    });
  }
  /**读取单个媒体文件内信息 */
  readDownloadedItem(re) {
    return this.file.readAsText(this.file.dataDirectory + this.clmDir + '/' + re.name + '/', 'clminfo.json').then(res2 => {
      let resObj: ClmListItem = JSON.parse(res2);
      let clmItem: ClmListItem = {
        id: resObj.id,
        name: resObj.name,
        version: resObj.version,
        download: true,
        select: false
      };
      this.clmDownloadedList[resObj.id] = clmItem;
    }, err => {
    });
  }
  /**读取已选中的媒体文件列表 */
  readSelectedList() {
    if (this.navParams.data) {
      for (let dat of this.navParams.data) {
        this.clmSelectedList[dat.id] = true;
      }
    }
  }
  /**返回选中的媒体信息 */
  returnClmInfo(clItem: ClmListItem) {
    let ishave = false
    if(!clItem.select){
      let surveyItem = {
        id: clItem.id,
        name: clItem.name,
        isDownloaded: clItem.download,
        reaction: undefined,
        survey: undefined,
        url: clItem.url,
        product: clItem.product
      };
      _.each(this.surveyData, rst => {
          if(rst.id === surveyItem.id){
            ishave = true
          }
      })
      if(!ishave){
        this.surveyData.push(surveyItem)
      }
      this.navCtrl.pop()
    }
    
  }
}
export interface ClmListItem {
  id: string;
  name: string;
  version: string;
  download: boolean;
  select: boolean;
  url?: string;
  product?: any;
}
