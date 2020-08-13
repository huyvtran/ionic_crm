import { Component } from '@angular/core';
import { NavParams } from 'ionic-angular';
import { TranslateService } from '../../providers/index';

const evaluation = {
  "name": "",
  "evaluation": [

  ],
  "score": '',
  "overall_score": '',
  "manager_advice": "",
  "plan": ""

};

@Component({
  selector: 'page-survey',
  templateUrl: 'survey.html'
})

export class SurveyPage {
  constructor(
    public navParams: NavParams,
    public translateService: TranslateService
  ) {
    if (navParams.data[0].result) {
      evaluation.evaluation = JSON.parse(navParams.data[0].result);
      evaluation.overall_score = navParams.data[0].overall_score;
      evaluation.name = navParams.data[0].employee__r.name + this.translateService.translateFunc('pad.employee_selector_detail_value');
      evaluation.manager_advice = navParams.data[0].overall_score;
      evaluation.plan = navParams.data[0].overall_score;
      this.evaluation = evaluation;
      this.evaluateItems = JSON.parse(navParams.data[0].result);
    }
  }

  initData(data) {
    if (data.result) {
      evaluation.evaluation = JSON.parse(data.result);
      evaluation.overall_score = data.overall_score;
      evaluation.name = data.employee__r.name + this.translateService.translateFunc('pad.employee_selector_detail_value');
      evaluation.manager_advice = data.overall_score;
      evaluation.plan = data.overall_score;
      this.evaluation = evaluation;
      this.evaluateItems = JSON.parse(data.result);
    }
  }

  evaluation: any = evaluation;
  evaluateItems = [];
}
