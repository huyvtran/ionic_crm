import { NgModule, ErrorHandler } from "@angular/core";
import { HttpModule } from "@angular/http";
import { BrowserModule } from "@angular/platform-browser";
import { IonicApp, IonicModule, IonicErrorHandler } from "ionic-angular";
import { IonicStorageModule } from "@ionic/storage";
import { MyApp } from "./app.component";

//native
import { StatusBar } from "@ionic-native/status-bar";
import { ScreenOrientation } from "@ionic-native/screen-orientation";
import { File } from "@ionic-native/file";
import { FileTransfer } from "@ionic-native/file-transfer";
import { Zip } from "@ionic-native/zip";
import { Device } from "@ionic-native/device";
import { Network } from "@ionic-native/network";
import { InAppBrowser } from "@ionic-native/in-app-browser";
import { Camera } from "@ionic-native/camera";
import { ImagePicker } from "@ionic-native/image-picker";
import { CalendarModule } from "ion2-calendar";

//providers
import {
  MainService,
  LoginService,
  HttpService,
  ListService,
  DataService,
  NetworkService,
  IdGeneratorService,
  ImageService,
  TranslateService,
  CRMUtils
} from "../providers/index";

import { UserInfo, DcrHandler, PermissionHelper } from "../utils/index";

//components
import {
  List,
  Product,
  ProductEdit,
  ProductDetail,
  FormComp,
  SurveyFeedbackAddComp,
  SurveyFeedbackEditComp,
  SurveyFeedbackDetailComp,
  SelectTree,
  ImageViewer,
  DetailForm,
  HomePopover,
  ModalComponent,
  StarRating,
  KeyMessageView,
  DraggableCircleComp
} from "../components/index";

//pages
import {
  HomePage,
  MainPage,
  LoginHaoSenPage,
  AddPage,
  PickList,
  EditPage,
  DetailPage,
  CalendarPage,
  UserPage,
  SelectPage,
  DropDownPage,
  RelatedList,
  NoticePage,
  NoticeDetail,
  SurveyPage,
  DetailInfoPage,
  ClmPlayPage,
  ClmDetailPage,
  ClmPickListPage,
  Segmentation,
  ViewPage,
  ParticipantsPage,
  AboutPage,
  SubordinatePage,
  CoachFeedback,
  SearchOptions,
  CameraPicker,
  PicDetail,
  ExternalPage,
  SignInPage,
  TodoPage,
  BatchAddition,
  IFramePage
} from "../pages/index";

//pipes
import { SafePipe } from "../pipes/safe";

//services

let pages: any[] = [
  MyApp,
  List,
  DetailForm,
  Product,
  ProductDetail,
  FormComp,
  RelatedList,
  ProductEdit,
  SurveyFeedbackAddComp,
  SurveyFeedbackEditComp,
  SurveyFeedbackDetailComp,
  SelectTree,
  CameraPicker,
  PicDetail,
  ImageViewer,
  HomePopover,

  MainPage,
  AddPage,
  HomePage,
  LoginHaoSenPage,
  CalendarPage,
  PickList,
  EditPage,
  DetailPage,
  UserPage,
  SelectPage,
  DropDownPage,
  NoticePage,
  NoticeDetail,
  SurveyPage,
  DetailInfoPage,
  ClmPlayPage,
  ClmDetailPage,
  ClmPickListPage,
  Segmentation,
  ViewPage,
  ParticipantsPage,
  AboutPage,
  SubordinatePage,
  CoachFeedback,
  SearchOptions,
  ExternalPage,
  SignInPage,
  TodoPage,
  ModalComponent,
  StarRating,
  KeyMessageView,
  BatchAddition,
  IFramePage
];
export function declarations() {
  return [...pages, SafePipe];
}
export function entryComponents() {
  return pages;
}
export function providers() {
  return [
    UserInfo,
    DcrHandler,
    MainService,
    DataService,
    NetworkService,
    LoginService,
    HttpService,
    ListService,
    TranslateService,
    IdGeneratorService,
    PermissionHelper,
    StatusBar,
    ScreenOrientation,
    File,
    FileTransfer,
    Zip,
    Device,
    Network,
    InAppBrowser,
    IonicStorageModule,
    Camera,
    ImagePicker,
    ImageService,
    CRMUtils,
    { provide: ErrorHandler, useClass: IonicErrorHandler }
  ];
}

@NgModule({
  declarations: [declarations(), DraggableCircleComp],
  imports: [
    BrowserModule,
    HttpModule,
    IonicStorageModule,
    IonicModule.forRoot(MyApp, {
      backButtonText: "返回", // 配置返回按钮的文字
      backButtonIcon: "arrow-back", // 配置返回按钮的图标
      statusbarPadding: false,
      iconMode: "ios", //手机端特有
      mode: "ios" //手机端特有
    }),
    IonicStorageModule.forRoot(),
    CalendarModule,
  ],
  bootstrap: [IonicApp],
  entryComponents: entryComponents(),
  providers: providers()
})
export class AppModule {}
