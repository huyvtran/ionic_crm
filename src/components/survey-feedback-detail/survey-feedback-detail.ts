import { Component } from '@angular/core';
import { AlertController, Events, ModalController, NavController, NavParams, Platform } from 'ionic-angular';
import { File } from '@ionic-native/file';
import _ from 'lodash';
import { MainService, TranslateService } from '../../providers/index';

@Component({
  selector: 'comp-survey-feedback-detail',
  templateUrl: 'survey-feedback-detail.html'
})
export class SurveyFeedbackDetailComp {
  clmDir: string = 'clm';
  surveyData: SurveyDataItem[] = [];
  listid: number = 0;
  callId: string;
  showSurvey: boolean = false;
  constructor(
    public alertCtrl: AlertController,
    public events: Events,
    public file: File,
    public mainService: MainService,
    public modalCtrl: ModalController,
    public navCtrl: NavController,
    public navParams: NavParams,
    public plt: Platform,
    public translateService: TranslateService
  ) { }
  reactionItem = ['', this.translateService.translateFunc('pad.clm_reactive'), this.translateService.translateFunc('pad.clm_neutral'), this.translateService.translateFunc('pad.clm_nagtive')];
  ngOnInit() {
    this.callId = this.navParams.data[0].id;
    console.log('this.navParams.data ======> ', this.navParams.data);
    let searchParam = {
      "joiner": "and",
      "criterias": [
        { "field": "call", "operator": "==", "value": [] }
      ],
      "orderBy": "create_time",
      "order": "asc",
      "objectApiName": 'survey_feedback',
      "pageSize": 10000,
      "pageNo": 1
    };
    searchParam.criterias[0].value.push(this.callId);
    this.mainService.getSearchData(searchParam).then((res: any) => {
      let clmResult = res.body.result;
      for (let clmr of clmResult) {
        let surveyItem: SurveyDataItem = {
          id: clmr.clm_presentation,
          name: clmr.clm_presentation__r.name,
          reaction: this.reactionItem[parseInt(clmr.reaction)],
          survey_feedback: clmr.id,
        };
        if (clmr.survey_answer) {
          surveyItem['survey'] = clmr.survey_answer;
        }
        this.surveyData.push(surveyItem);
      }
      if (this.surveyData.length > 0) {
        this.showSurvey = true;
      }
      if(this.navParams.data[0] && this.navParams.data[0]['_cascade']){
        this.generatorNewSurveyData(this.surveyData, this.navParams.data[0]['_cascade']);
      }
    })
  }

  generatorNewSurveyData(surveyData, _cascade){
    let initData = _.cloneDeep(surveyData);
    if(!_.isEmpty(_cascade)){
      if(_cascade.create && !_.isEmpty(_cascade.create)){
        if(_cascade.create['call_survey_feedback_list']){
          _cascade.create['call_survey_feedback_list'].forEach(element => {
            if(element.clm_presentation__r){
              element['name'] = element.clm_presentation__r.name;
            }
          });
          initData = _.concat(initData, _cascade.create['call_survey_feedback_list']);
        }
      }
      if(_cascade.update && !_.isEmpty(_cascade.update)){
        if(_cascade.update['call_survey_feedback_list']){
          if(initData.length > 0){
            _.each(initData, (init, index) => {
              _cascade.update['call_survey_feedback_list'].forEach(element => {
                if(init.survey_feedback == element.id){
                  init.reaction = this.reactionItem[parseInt(element.reaction)];
                }
              });
            })
          }
        }
      }
      if(_cascade.delete && !_.isEmpty(_cascade.delete)){
        if(_cascade.delete['call_survey_feedback_list']){
          if(initData.length > 0){
            _.each(initData, (init, index) => {
              _cascade.delete['call_survey_feedback_list'].forEach(element => {
                if(init.survey_feedback == element.id){
                  initData.splice(index,1);
                }
              });
            })
          }
        }
      }
    }
    this.surveyData = initData;
  }
}
export interface SurveyDataItem {
  id: string;
  name: string;
  reaction: string;
  survey?: string;
  survey_feedback?: any
}
