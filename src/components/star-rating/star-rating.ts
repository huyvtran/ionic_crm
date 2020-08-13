import { Component, OnInit, Input, EventEmitter, Output} from '@angular/core';

@Component({
  selector: 'star-rating',
  templateUrl: 'star-rating.html'
})
export class StarRating implements OnInit {

  @Input()
  public rating: number;

  @Output()
  ratingChange: EventEmitter<number> = new EventEmitter(); 
  @Input()
  public max: number;

  @Input()
  public readonly: boolean;
  @Input()
  //是否显示半星，默认为flash不显示
  public need_half_star: boolean;
  @Input()
  //是否显示右侧label，默认为flash不显示
  public show_label: boolean;


  public stars = [];

  constructor() { 

  }

  ngOnInit() {
    this.stars = [];
    if(this.rating==undefined){
      this.rating = 0
    }
    for (let i = 0; i < this.max; i++) {
      this.stars.push(i < this.rating)
    }
  }

  onClickstar(rate: number) {
    if( !this.readonly ){
        if(this.need_half_star){
            this.rating = rate + 0.5; 
            this.ngOnInit();
            this.ratingChange.emit(this.rating);
        }else{
            //因为数组是从0开始，
            this.rating = rate + 1; 
            this.ngOnInit();
            this.ratingChange.emit(this.rating);
        }
      
    }
  }

}