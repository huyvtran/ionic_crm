import { Component, Input } from "@angular/core";
import { NavParams } from "ionic-angular";
import { DomSanitizer } from "@angular/platform-browser";
import { MenuController } from "ionic-angular";
import { SafeResourceUrl } from "@angular/platform-browser/src/security/dom_sanitization_service";

@Component({
  templateUrl: "iframe.html",
  selector: "page-iframe"
})
export class IFramePage {
  url_sanitized: SafeResourceUrl;
  constructor(
    public navParams: NavParams,
    private sanitizer: DomSanitizer,
    private menu: MenuController
  ) {
    //见 https://angular.cn/guide/security#xss
    //angular规定必须执行bypassSecurityTrustResourceUrl。每次计算返回的都是新的实例，避免重新render所以放在constructor中
    const url = this.navParams.get("url");
    this.url_sanitized = this.sanitizer.bypassSecurityTrustResourceUrl(url);
  }

  getTitle() {
    return this.navParams.get("title");
  }

  shouldShowHeader() {
    return this.navParams.get("showHeader");
  }

  //header 和 draggableCircle 只显示一个
  shouldShowDraggableCircle() {
    return !this.shouldShowHeader();
  }

  //打开drawer(抽屉菜单)
  onTapped() {
    console.log("onTapped");
    this.menu.open().then(v => {
      console.log("onTapped promise", v);
    });
  }
}
