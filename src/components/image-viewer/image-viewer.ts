import { Component } from "@angular/core";
import { NavParams, NavController } from "ionic-angular";
import { TranslateService, HttpService } from "../../providers/index";
import { config, UserInfo } from '../../utils/index';
import _ from 'lodash';

@Component({
  templateUrl: "image-viewer.html"
})

export class ImageViewer{
  constructor(
    public navParams: NavParams,
    public navCtrl: NavController,
    public translateService: TranslateService,
    public userInfo: UserInfo,
    public httpService: HttpService
  ){
    console.log(this.navParams.data);
    this.slides = [];
  }

  slides = [
  ];

  backToUp(){
    this.navCtrl.pop();
  }

  inoViewWillLoad(){
    
  }
  ionViewDidLoad(){
    // imgurl = baseurl + apiname +key+ token
    const field = this.navParams.data['field'];
    const data = this.navParams.data['data'];
    const fieldData = data[field.field];
    if(!_.isEmpty(fieldData)){
      _.each(fieldData, key => {
        const imgUrl = config.file_server + config.api.upload_image.replace('{key}', key) + '?token=' + this.userInfo.token; 
        this.slides.push({
          image: imgUrl
        })
      })
    }
  }
}
