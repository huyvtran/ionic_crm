import { Injectable } from '@angular/core';
import { ActionSheetController } from 'ionic-angular';
import { Camera } from '@ionic-native/camera';
import { File } from '@ionic-native/file';
import {  FileTransfer,  FileTransferObject,  FileUploadOptions} from "@ionic-native/file-transfer";
import { TranslateService } from '../providers/translate-service';
import { UserInfo, config } from '../utils/index';

@Injectable()
export class ImageService {
  constructor(
    public actionSheet: ActionSheetController,
    public camera: Camera,
    public translateService: TranslateService,
    public file: File,
    public userInfo: UserInfo,
    public transfer: FileTransfer,
  ) { }

  /**当前拍照（选择照片对象路径） */
  path: any;
  /**当前拍照对象 */
  image: any;
  /**图片文件夹 */
  filePath: string = "crmPhotos";
  /**获取存储image的存储列表 */
  imageList = [];
  /**检查文件夹是否存在，如果没有则创建 */
  dirStatus: boolean;

  checkFolder() {
    this.file.checkDir(this.file.dataDirectory, this.filePath + '/').then(res => {
      if(res){
        this.checkDownladFile();
      }
    }, err => {
      this.dirStatus = false;
      console.log('the checkDir is failed');
    })
  }

  checkDownladFile() {
    const path = this.file.dataDirectory + this.filePath + '/';
    this.file.checkFile(path, 'uploadInfo.json').then(res => {
      if(res){
        this.file.readAsText(path, 'uploadInfo.json').then(res => {
          if(res){
            let values = [];
            values = JSON.parse(res);
            if(values !== undefined){
              values.forEach(value => {
                this.checkUploadFile(value);
              })
            }
          }
        }, err => {
          console.log('upload file is not exist!');
        })
      }
    })
  }

  checkUploadFile(fileObj){
    if (fileObj.is_upload !== undefined && !fileObj.is_upload) {
      let options: FileUploadOptions = {
        fileName: fileObj.name, // 文件名称
        httpMethod: "POST",
        headers: {
          token: this.userInfo.token
        }
        //params: {} // 如果要传参数，写这里
      };
      const fileTransfer: FileTransferObject = this.transfer.create();
      const serverUrl = config.file_server + config.api.upload_image.replace("{key}", fileObj.name);
      fileTransfer.upload(fileObj.nativeURL, serverUrl, options).then(data => {
          // success
          console.log(345545);
          fileObj["is_upload"] = true;
          this.writeUploadFile(JSON.stringify(fileObj));
          console.log("upload is success!");
        }, err => {
          // error
          fileObj["is_upload"] = false;
          this.writeUploadFile(JSON.stringify(fileObj));
        }
      );
    }
  }

  /**
   * 写入上传图片文件
   * @param str 写入本地上传标识文件的对象转为的字符串
   */
  writeUploadFile(str) {
    let writeJSON = JSON.parse(str);
    this.file.readAsText(this.file.dataDirectory + this.filePath + "/", "uploadInfo.json").then(res => {
        let obj = JSON.parse(res);
        let is_have = false;
        let content = [];
        if (obj !== null) {
          content = obj;
        }
        content.forEach((o, index) => {
          if (o.key == writeJSON.old_key) {
            is_have = true;
            writeJSON.old_key = writeJSON.key;
            writeJSON.is_update = false;
            obj[index] = writeJSON;
          }
        });
        if (!is_have) {
          content.push(writeJSON);
        }
        this.file.writeExistingFile(this.file.dataDirectory + this.filePath + "/", "uploadInfo.json", JSON.stringify(content)).then(res => {
            console.log("write file status success!");
          },
          err => {
            console.log("write file status failed:");
            console.log(err);
          }
        );
      }, err => {
        console.log("read file error.");
        console.log(err);
      }
    );
  }
}
