import { Injectable } from '@angular/core';
import _ from 'lodash';
import { UserInfo ,constApiName} from '../utils/index';

@Injectable()
export class PermissionHelper {
  constructor(
    public userInfo: UserInfo
  ) { }

  fc_hasObjectPrivilege(objectCode, expectedCodeValue = 0) {
    const objectPrivilegeCode = this.userInfo.permission[`obj.${objectCode}`];
    return (objectPrivilegeCode | 2 ** expectedCodeValue) === objectPrivilegeCode;
  };

  fc_hasFieldPrivilege(objCode, fieldCode, expectedCodeValues = 4) {
    const permissionCode = _.get(this.userInfo.permission, `field.${objCode}.${fieldCode}`);
    if (permissionCode < 2) {
      return 'hidden';
    } else if (permissionCode < 4) {
      return 'disabled';
    } else {
      return 'visible';
    }
  };

  fc_hasFunctionPrivilege(functionCode, expectedCodeValue = 2) {
    return this.userInfo.permission[`function.${functionCode}`] === expectedCodeValue;
  };
  isInclude(action:string,actionType: string):boolean{
    return _.indexOf([action],actionType)> -1?true:false;
  }
  judgeFcObjectPrivilvege(action:string,apiName:string){
        if(this.isInclude(action,constApiName.ADD)){
            return this.fc_hasObjectPrivilege(apiName, 1);
        }else if(this.isInclude(action,constApiName.EDIT)){
          return this.fc_hasObjectPrivilege(apiName, 2);
        }else if(this.isInclude(action,constApiName.DETAIL)){
          return this.fc_hasObjectPrivilege(apiName, 3);
        }else if(this.isInclude(action,constApiName.DELETE)){
          return this.fc_hasObjectPrivilege(apiName, 2);
        }else{
          return true
        }
  }
}


