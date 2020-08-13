import { Component } from "@angular/core";
import { NavParams, ViewController } from "ionic-angular";
import _ from "lodash";
import { UserInfo } from "../../utils/index";
import { TranslateService } from "../../providers/index";

@Component({
  selector: "page-select-tree",
  templateUrl: "select-tree.html"
})
export class SelectTree {
  constructor(
    private navParams: NavParams,
    public viewCtrl: ViewController,
    public userInfo: UserInfo,
    public translateService: TranslateService
  ) {
    this.header == undefined
      ? this.translateService.translateFunc("pad.select_comp_chioce_downlevel")
      : this.header;
  }

  header: any;
  selectTree = [];
  childTreeList = [];
  checkList = [];
  grandParent: any;
  isSelectAll = false;

  ionViewDidEnter() {
    console.log(this.navParams.data, "======== this.navParams.data=========");
    this.header = this.navParams.data.title;
    let selectTree = _.cloneDeep(this.navParams.data.selectTree);
    if (this.navParams.data.isAllSelect) {
      this.isSelectAll = this.navParams.data.isAllSelect;
      this.childrenListInit(selectTree, true);
      this.checkCurrentAll();
    } else {
      this.childrenListInit(selectTree);
      this.checkCurrentAll();
    }
  }

  childrenListInit(selectTree, isAll?: boolean) {
    this.childTreeList = _.cloneDeep(this.navParams.data.childTreeList);
    this.childTreeList.forEach(child => {
      // child["checked"] = child.clecked;
      child["isHaveSubPerson"] = false;
    });
    selectTree.forEach(select => {
      if (_.get(select, "isClass2Visible", true)) {
        select["checked"] = select.checked;
      } else {
        select["checked"] = !select.isClass2Visible;
      }

      select["isHaveSubPerson"] = false;
      this.childTreeList.forEach(child => {
        if (child.parent_id == select.id) {
          select["isHaveSubPerson"] = true;
        }
      });
      this.selectTree.push(select);
    });
  }

  checkCurrentAll() {
    this.checkList = [];
    console.log(this.isSelectAll);
    if (this.isSelectAll) {
      this.selectTree.forEach(child => {
        if (_.get(child, "isClass2Visible", true)) {
          child["checked"] = child.checked;
        } else {
          child["checked"] = !child.isClass2Visible;
        }
      });
      this.selectTree.forEach(select => {
        this.childTreeList.forEach(child => {
          if (select.id == child.id) {
            if (this.checkList.indexOf(child) < 0) {
              this.checkList.push(child);
            }
            this.checkAllChildren(child);
          }
        });
      });
    } else {
      this.selectTree.forEach(child => {
        if (_.get(child, "isClass2Visible", true)) {
          child["checked"] = child.checked;
        } else {
          child["checked"] = !child.isClass2Visible;
        }
      });
      this.selectTree.forEach(select => {
        this.childTreeList.forEach(child => {
          if (_.get(child, "isClass2Visible") != undefined) {
            if (!child.isClass2Visible) {
              let index = this.checkList.indexOf(child);
              if (index < 0) {
                this.checkList.push(child);
              }
              // this.disCheckChildren(child);
            }
          } else {
            if (child.checked) {
              let index = this.checkList.indexOf(child);
              if (index < 0) {
                this.checkList.push(child);
              }
            }
          }
        });
      });
    }
  }
  checknewCurrentAll() {
    this.checkList = [];
    console.log(this.isSelectAll);
    if (this.isSelectAll) {
      this.selectTree.forEach(child => {
        if (_.get(child, "isClass2Visible", true)) {
          child["checked"] = true;
        } else {
          child["checked"] = true;
        }
      });
      this.selectTree.forEach(select => {
        this.childTreeList.forEach(child => {
          if (select.id == child.id) {
            if (this.checkList.indexOf(child) < 0) {
              this.checkList.push(child);
            }
            this.checkAllChildren(child);
          }
        });
      });
    } else {
      this.selectTree.forEach(child => {
        if (_.get(child, "isClass2Visible", true)) {
          child["checked"] = false;
        } else {
          child["checked"] = false;
        }
      });
    }
  }
  checkName(select) {
    if (!select.checked) {
      this.selectTree.forEach(child => {
        if (select.id == child.id) {
          select["checked"] = true;
        }
      });
      this.childTreeList.forEach(check => {
        if (check.id == select.id) {
          check.checked = false;
          const index = this.checkList.indexOf(check);
          this.checkList.splice(index, 1);
          this.disCheckChildren(check);
        }
        // if (!check.isClass2Visible) {
        //   const index = this.checkList.indexOf(check);
        //   this.checkList.splice(index, 1);
        //   this.disCheckChildren(check);
        // }
      });
    } else {
      let ifInStack = false;
      this.checkList.forEach(check => {
        if (check.id == select.id) {
          ifInStack = true;
        }
      });
      if (!ifInStack) {
        //select["checked"] = true;
        this.childTreeList.forEach(child => {
          if (child.id == select.id) {
            child.checked = true;
            if (this.checkList.indexOf(child) < 0) {
              this.checkList.push(child);
              this.checkAllChildren(child);
            }
          }
        });
      }
    }
    this.checkSelectAll();
  }

  checkAllChildren(select) {
    this.childTreeList.forEach(child => {
      if (select.parent_id == child.id && select.id == undefined) {
        child.checked = true;
        if (this.checkList.indexOf(child) < 0) {
          this.checkList.push(child);
          //child['checked'] = true;
          this.checkAllChildren(child);
        }
      }
    });
  }

  disCheckChildren(select) {
    this.childTreeList.forEach(child => {
      if (select.parent_id == child.id && select.id == undefined) {
        child.checked = false;
        this.checkList.splice(this.checkList.indexOf(child), 1);
        //child['checked'] = false;
        this.disCheckChildren(child);
      }
    });
  }

  checkSelectAll() {
    let flag = false;
    this.selectTree.forEach(child => {
      if (child["checked"] == false) {
        flag = true;
        this.isSelectAll = false;
      }
    });
    this.selectTree.forEach(select => {
      this.checkList.forEach(check => {
        if (select.id == check.id) {
          select["checked"] = true;
        }
      });
    });
    let length = this.checkList.length;
    if (this.childTreeList.length !== length) {
      flag = true;
      this.isSelectAll = false;
    } else {
      this.isSelectAll = true;
    }

    if (!flag) {
      this.isSelectAll = true;
    }
  }

  selectUp(select) {
    const selectTree = [];
    let parent: any;
    let grandPa: any;
    this.grandParent = select.parent_id;
    this.childTreeList.forEach(child => {
      if (child.id == this.grandParent) {
        parent = child;
      }
    });
    this.childTreeList.forEach(child => {
      if (parent.parent_id !== undefined) {
        if (parent.parent_id == this.userInfo.userid) {
          grandPa = {
            id: this.userInfo.userid
          };
        } else if (parent.parent_id == child.id) {
          grandPa = child;
        }
      }
    });
    this.childTreeList.forEach(child => {
      if (child.parent_id == grandPa.id) {
        selectTree.push(child);
      }
    });
    if (parent.parent_id == this.userInfo.userid) {
      this.grandParent = undefined;
    }
    selectTree.forEach(select => {
      this.childTreeList.forEach(child => {
        if (select.id == child.parent_id) {
          select["isHaveSubPerson"] = true;
        }
      });
    });
    if (selectTree.length > 0) {
      this.selectTree = selectTree;
    }
    this.checkList.forEach(check => {
      this.selectTree.forEach(one => {
        if (check.id == one.id) {
          one["checked"] = true;
        }
      });
    });
    this.checkSelectAll();
  }

  selectDown(select) {
    const selectTree = [];
    this.childTreeList.forEach(child => {
      if (child.parent_id == select.id) {
        selectTree.push(child);
      }
    });
    selectTree.forEach(select => {
      this.childTreeList.forEach(child => {
        if (select.id == child.parent_id) {
          select["isHaveSubPerson"] = true;
        }
      });
    });
    if (selectTree.length > 0) {
      this.grandParent = select.parent_id;
      this.selectTree = selectTree;
    }
    this.checkSelectAll();
  }

  confirmSelect() {
    this.viewCtrl.dismiss(this.checkList);
  }

  cancelSelect() {
    // this.checkList = [];
    this.viewCtrl.dismiss(this.checkList);
  }

  ionViewWillEnter() {}
}
