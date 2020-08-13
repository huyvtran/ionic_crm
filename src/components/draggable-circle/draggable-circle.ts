import {
  AfterViewInit,
  Component,
  EventEmitter,
  Input,
  Output,
  OnDestroy,
  ViewChild
} from "@angular/core";

@Component({
  selector: "draggable-circle",
  templateUrl: "draggable-circle.html"
})
export class DraggableCircleComp implements AfterViewInit, OnDestroy {
  @Input() text: string;
  @Input() diameter: string;
  @Output() onTapped: EventEmitter<any> = new EventEmitter<any>();

  @ViewChild("draggableItem") draggableItem;
  @ViewChild("innerDiv") innerDiv;

  active: boolean = false;

  initialX: number = 0; //拖动开始时，手指的x坐标
  initialY: number = 0;
  xOffset: number = 0; //transform偏移多少
  yOffset: number = 0;
  xOffset_start = 0; //拖动开始时，记录之前的数值，用于判断deltaX
  yOffset_start = 0;

  logPrefix(prefix) {
    console.log(prefix, {
      active: this.active,
      xOffset: this.xOffset,
      intialX: this.initialX
    });
  }

  getDraggableItemStyle() {
    const activeBg = "rgba(50%,50%,50%,0.5)";
    const normalBg = "rgba(80%,80%,80%,0.5)";
    const style = {
      // "border-width": "1px",
      // "border-color": "red",
      // "border-style": "solid",

      zIndex: 1000,
      // "border-radius": "50%",
      // "touch-action": "none",
      // "user-select": "none",
      width: this.diameter,
      height: this.diameter,
      position: "absolute",
      left: `${this.getCSSLeft()}px`,
      top: 0,
      color: "#fff",
      // "background-color": "#108ee9",
      transform: `translate3d( ${this.xOffset}px, ${this.yOffset}px, 0)`
    };
    return style;
  }

  getCSSLeft(): number {
    const { windowW } = DraggableCircleComp.getWindowWH();
    const cssLeft = windowW - parseInt(this.diameter);
    return cssLeft;
  }

  getInnerDivStyle() {
    return {
      "line-height": this.diameter,
      "text-align": "center"
    };
  }

  //代码参考 https://www.kirupa.com/html5/drag.htm
  ngAfterViewInit(): void {
    const dragItem = this.draggableItem.nativeElement;
    dragItem.addEventListener("touchstart", this.dragStart, false);
    dragItem.addEventListener("touchend", this.dragEnd, false);
    dragItem.addEventListener("touchmove", this.drag, false);

    dragItem.addEventListener("mousedown", this.dragStart, false);
    dragItem.addEventListener("mouseup", this.dragEnd, false);
    dragItem.addEventListener("mousemove", this.drag, false);
  }

  ngOnDestroy(): void {
    const dragItem = this.draggableItem.nativeElement;
    dragItem.removeEventListener("touchstart", this.dragStart, false);
    dragItem.removeEventListener("touchend", this.dragEnd, false);
    dragItem.removeEventListener("touchmove", this.drag, false);

    dragItem.removeEventListener("mousedown", this.dragStart, false);
    dragItem.removeEventListener("mouseup", this.dragEnd, false);
    dragItem.removeEventListener("mousemove", this.drag, false);
  }

  dragStart = e => {
    this.logPrefix("dragStart");
    this.xOffset_start = this.xOffset;
    this.yOffset_start = this.yOffset;

    if (e.type === "touchstart") {
      this.initialX = e.touches[0].clientX - this.xOffset;
      this.initialY = e.touches[0].clientY - this.yOffset;
    } else {
      this.initialX = e.clientX - this.xOffset;
      this.initialY = e.clientY - this.yOffset;
    }

    if (
      e.target === this.draggableItem.nativeElement ||
      e.target === this.innerDiv.nativeElement
    ) {
      this.active = true;
    }
  };

  dragEnd = e => {
    this.active = false;

    const deltaX = Math.abs(this.xOffset_start - this.xOffset);
    const deltaY = Math.abs(this.yOffset_start - this.yOffset);
    this.logPrefix("dragEnd deltaX deltaY" + deltaX + "  " + deltaY);

    if (deltaX <= 3 && deltaY <= 3) {
      //没有移动，是点击
      this.onTapped.emit();
    }
  };

  static getWindowWH = () => {
    var windowW = Math.max(
      document.documentElement.clientWidth,
      window.innerWidth || 0
    );
    var windowH = Math.max(
      document.documentElement.clientHeight,
      window.innerHeight || 0
    );
    return { windowW, windowH };
  };

  drag = e => {
    this.logPrefix("drag");
    if (this.active) {
      e.preventDefault();
      let currentX = 0;
      let currentY = 0;
      if (e.type === "touchmove") {
        currentX = e.touches[0].clientX - this.initialX;
        currentY = e.touches[0].clientY - this.initialY;
      } else {
        currentX = e.clientX - this.initialX;
        currentY = e.clientY - this.initialY;
      }
      const { windowW, windowH } = DraggableCircleComp.getWindowWH();

      if (
        this.resultLeftX(currentX) >= 0 &&
        this.resultRightX(currentX) <= windowW
      ) {
        this.xOffset = currentX;
      }
      if (
        this.resultTopY(currentY) >= 0 &&
        this.resultBottomY(currentY) <= windowH
      ) {
        this.yOffset = currentY;
      }
    }
  };

  resultRightX = xOffset => {
    const x = this.getCSSLeft() + xOffset + parseInt(this.diameter);
    return x;
  };
  resultLeftX = xOffset => {
    const x = this.getCSSLeft() + xOffset;
    return x;
  };
  resultTopY = yOffset => {
    const y = 0 + yOffset;
    return y;
  };
  resultBottomY = yOffset => {
    const y = 0 + yOffset + parseInt(this.diameter);
    return y;
  };
}
