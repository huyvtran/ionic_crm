/// <reference path="../../wechat/wechat.d.ts"/>
import { Component, ViewChild, ElementRef,ChangeDetectorRef } from "@angular/core";
import {
  Events,
  NavController,
  NavParams,
  AlertController
} from "ionic-angular";
import moment from "moment";
import { TranslateService, MainService } from "../../providers/index";
import { gcj02tobd09, wgs84togcj02,fc_getCurrentUserInfo} from '../../utils/index';
import { CompileNgModuleMetadata } from "@angular/compiler";
/**
 * Generated class for the MapPage page.
 *
 * See http://ionicframework.com/docs/components/#navigation for more info
 * on Ionic pages and navigation.
 */
// baidu map
declare var BMap;
declare var BMAP_STATUS_SUCCESS;

//微信jssdk
declare let wx: any;

//* 复杂签到字段
const SIGN_IN_STATE = {
  location: "sign_in_location",
  latitude: "sign_in_latitude",
  longitude: "sign_in_longitude",
  time: "sign_in_time",
  photo: "sign_in_photo",
  abnormal: "abnormal_sign_in",
  deviation: "sign_in_deviation"
};

// *复杂签出字段
const SIGN_OUT_STATE = {
  location: "sign_out_location",
  latitude: "sign_out_latitude",
  longitude: "sign_out_longitude",
  time: "sign_out_time",
  photo: "sign_out_photo",
  abnormal: "abnormal_sign_out",
  deviation: "sign_out_deviation"
};

const SIGN_IN = 'sign_in'
const SIGN_OUT = 'sign_out'
@Component({
  selector: "page-sign-in",
  templateUrl: "sign-in.html"
})
export class SignInPage {
  @ViewChild('map') map_container: ElementRef;
  map: any;//地图对象
  marker: any;//标记
  geolocation1: any;
  myIcon: any;
  location: any
  header = '';
  baiduPoint: any;
  showdetail:boolean;
  allPois:any;
  myGeo:any;
  poiindex:number;

  constructor(
    public alertCtrl: AlertController,
    public translateService: TranslateService,
    public navParams: NavParams,
    public events: Events,
    public navCtrl: NavController,
    public mService: MainService,
    private cdr: ChangeDetectorRef
  ) {
    this.myIcon = new BMap.Icon("assets/img/avatar.png", new BMap.Size(30, 30));
    this.myGeo = new BMap.Geocoder(); 
    this.getWxConfig();
  }
  getWxConfig() {
    const body = {
      url: window.location.href.split("#")[0]
    };
    let self = this
    this.mService.getWxData(body).then((res: any) => {
      //console.log('wx.config res ======> ', res);
      wx.config({
        beta: true,
        signature: res.data.signature,
        appId: res.data.appId,
        nonceStr: res.data.noncestr,
        timestamp: res.data.timestamp,
        jsApiList: [
          "openLocation",
          "getLocation",
          "onLocationChange",
          "checkJsApi",
          "getLocalImgData",
          "previewFile",
          "playVoice",
          "onMenuShareWechat",
          "chooseImage"
        ]
      });
      // config取到以后 再在wx.ready里面使用具体的接口
      wx.ready(() => {
        wx.checkJsApi({
          jsApiList:['getLocation','openLocation','onLocationChange','getLocalImgData','previewFile','playVoice','onMenuShareWechat','chooseImage'],
          success : function(res){
            self.getLocationByWx();
          }
        })
      }) 
      
      //失败的提示
      wx.error( (errMsg:any) =>{
        console.log(errMsg)
        alert('验证失败！')
      })
    });
  }
  ngOnInit(){
    if(this.navParams.data.render_type=="text"){
        this.showdetail = true
    }else{
        this.showdetail = false
    }
  }
  ionViewDidEnter(){
  }
  

  createBaiduMap(longitude, latitude) {
    const editData = this.navParams.data;
    this.header = editData.name;
    //每次进来取最新定位的经纬度。
    if(editData && editData.latitude && editData.longitude){
      longitude = editData.longitude.toFixed(6);
      latitude = editData.latitude.toFixed(6);
    }
    let map =
      this.map =
      new BMap.Map(
        this.map_container.nativeElement,
        {
          enableMapClick: true,//点击拖拽
          enableScrollWheelZoom: true,//启动滚轮放大缩小，默认禁用
          enableContinuousZoom: true //连续缩放效果，默认禁用
        }
      );//创建地图实例
    map.addControl(new BMap.MapTypeControl());//地图类型切换
    map.addControl(new BMap.GeolocationControl()); 
    //map.setCurrentCity("北京"); //设置当前城市
    let point = new BMap.Point(longitude, latitude);//坐标可以通过百度地图坐标拾取器获取
    this.baiduPoint = point;
    let marker = new BMap.Marker(point,{ icon: this.myIcon });
    this.showWindow(this.baiduPoint);
    this.map.addOverlay(marker);
    map.centerAndZoom(point, 16);//设置中心和地图显示级别
  }

  getLocationByBrowser() {
    let geolocation1 = this.geolocation1 = new BMap.Geolocation();   
    geolocation1.getCurrentPosition((r) => {
      if (geolocation1.getStatus() == BMAP_STATUS_SUCCESS) {
        let mk = this.marker = new BMap.Marker(this.baiduPoint, { icon: this.myIcon });
        this.showWindow(this.baiduPoint);
        this.marker.enableDragging(); 
        this.marker.addEventListener("dragend", (e) => {    
          this.showWindow(e);
        })  
        this.map.addOverlay(mk);
        this.map.panTo(this.baiduPoint, 16);
      }
      else {
        console.log('failed' + this.geolocation1.getStatus());
      }
    }, { enableHighAccuracy: false })
  }

  showWindow(point){
    var opts = {    
      width : 250,     // 信息窗口宽度    
      height: 40,     // 信息窗口高度    
      title : "当前位置："  // 信息窗口标题   
    } 
    var mOption = {  
      poiRadius :500,           //半径为1000米内的POI,默认100米  
      numPois :10                //列举出50个POI,默认10个  
  }  
    // var myGeo = new BMap.Geocoder();      
    // 根据坐标得到地址描述    
    this.myGeo.getLocation(new BMap.Point(point.lng, point.lat), (result) => {      
      if (result){      
        this.location = result;
        this.allPois = result.surroundingPois   
        let infoWindow = new BMap.InfoWindow(result.address, opts);  // 创建信息窗口对象    
        this.map.openInfoWindow(infoWindow, point);      // 打开信息窗口  
        this.cdr.markForCheck();
        this.cdr.detectChanges(); 
      }      
    },mOption);
  }
  displayPOI(index,point){
    this.poiindex = index;
    var opts = {    
      width : 250,     // 信息窗口宽度    
      height: 40,     // 信息窗口高度    
      title : "当前位置："  // 信息窗口标题   
    }    
    this.myGeo.getLocation(new BMap.Point(point.lng, point.lat), (result) => {      
      if (result){      
        this.location = result; 
        let infoWindow = new BMap.InfoWindow(result.address, opts);  // 创建信息窗口对象    
        this.map.openInfoWindow(infoWindow, point);      // 打开信息窗口   
      }      
    });
    this.cdr.markForCheck();
    this.cdr.detectChanges(); 
  }
  backToUp() {
    this.navCtrl.pop();
  }
  getLocationByWx = () => {
    // wx 定位
    wx.getLocation({
      type: "wgs84", // 默认为wgs84的gps坐标，如果要返回直接给openLocation用的火星坐标，可传入'gcj02'
      success: res => {
        var latitude = res.latitude; // 纬度，浮点数，范围为90 ~ -90
        var longitude = res.longitude; // 经度，浮点数，范围为180 ~ -180。
        const gcjPoint = wgs84togcj02(longitude, latitude)
        const baiduPoint = gcj02tobd09(gcjPoint[0], gcjPoint[1]);
        var lat = baiduPoint[0]-0.000160;
        var log = baiduPoint[1]-0.000160;
        this.createBaiduMap(lat.toFixed(6),log.toFixed(6));
      }
    });
  };

  confirm(){
    const item = this.navParams.data['origin'];
    if(item.form_item_extender === 'CustomSignFormItem'){
      //CustomSignFormItem 签到加签出 还没加拍照
      if(!item.sign_type){
        console.warn('sign_type is needed!');
      }
      const signField = item.sign_type == SIGN_IN ? SIGN_IN_STATE : SIGN_OUT_STATE;
      if(!this.location){
        this.alertCtrl.create({
          title:'请选择位置！',
          buttons : ['确定']
        }).present()
        return
      }
      const signValue = {
          [signField.location]: this.location.address,
          [signField.latitude]: this.location.point.lat.toFixed(5),
          [signField.longitude]: this.location.point.lng.toFixed(5),
          mapType: 'baidu',
          [signField.time]: parseInt(moment().format('x'))
      }
      let alert = this.alertCtrl.create({
        title: this.translateService.translateFunc('pad.alert_remind_title'),
        subTitle: '您确认选择此位置？',
        buttons: [
          {
            text:this.translateService.translateFunc('pad.action_ok'),
            handler: () => {
              const item = this.navParams.data;
              item['signValue'] = signValue;
              item.value = signValue[signField.location];
              this.events.publish('form-comp:signSearch', item);
              this.navCtrl.pop();
            }
          }
        ]
      });
      alert.present();
    }else if(item.form_item_extender === 'SignInLiteFormItem'){
      //SignInLiteFormItem 只有签到 
      if(this.location){
        const sign_in_location = this.location.address;
        const latitude = this.location.point.lat.toFixed(5);
        const longitude = this.location.point.lng.toFixed(5);
        const mapType = 'baidu';
        const sign_in_time = parseInt(moment().format('x'));
        const signValue = {
          sign_in_location,
          latitude,
          longitude,
          mapType,
          sign_in_time
        }
  
        let alert = this.alertCtrl.create({
          title: this.translateService.translateFunc('pad.alert_remind_title'),
          subTitle: '您确认选择此位置？',
          buttons: [
            {
              text:this.translateService.translateFunc('pad.action_ok'),
              handler: () => {
                const item = this.navParams.data;
                item['signValue'] = signValue;
                item.value = signValue.sign_in_location;
                this.events.publish('form-comp:signSearch', item);
                this.navCtrl.pop();
              }
            }
          ]
        });
        alert.present();
  
      }else{
        let alert = this.alertCtrl.create({
          title: this.translateService.translateFunc('pad.alert_remind_title'),
          subTitle: this.translateService.translateFunc('pad.alert_gps_reminder'),
          buttons: [this.translateService.translateFunc('pad.action_ok')]
        });
        alert.present();
      }
    }
  }
}
