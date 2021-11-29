/*
* Copyright (c) 2021 PSPACE, inc. KSAN Development Team ksan@pspace.co.kr
* KSAN is a suite of free software: you can redistribute it and/or modify it under the terms of
* the GNU General Public License as published by the Free Software Foundation, either version 
* 3 of the License.  See LICENSE for details
*
* 본 프로그램 및 관련 소스코드, 문서 등 모든 자료는 있는 그대로 제공이 됩니다.
* KSAN 프로젝트의 개발자 및 개발사는 이 프로그램을 사용한 결과에 따른 어떠한 책임도 지지 않습니다.
* KSAN 개발팀은 사전 공지, 허락, 동의 없이 KSAN 개발에 관련된 모든 결과물에 대한 LICENSE 방식을 변경 할 권리가 있습니다.
*/
// tslint:disable:prefer-method-signature
import { Observable } from 'rxjs/Observable';
import { Subscription } from 'rxjs/Subscription';

export type UploadFileStatus = 'error' | 'success' | 'complete' | 'uploading' | 'removed';

export type UploadType = 'select' | 'drag';

export type UploadListType = 'text' | 'picture' | 'picture-card';

export interface UploadFile {
  uid: string;
  size: number;
  name: string;
  filename?: string;
  lastModified?: string;
  lastModifiedDate?: Date;
  url?: string;
  status?: UploadFileStatus;
  originFileObj?: File;
  percent?: number;
  thumbUrl?: string;
  response?: any;
  error?: any;
  linkProps?: any;
  type: string;
  [key: string]: any;
}

export interface UploadChangeParam {
  file: UploadFile;
  fileList: UploadFile[];
  event?: { percent: number };
}

export interface ShowUploadListInterface {
  showRemoveIcon?: boolean;
  showPreviewIcon?: boolean;
}

export interface ZipButtonOptions {
  disabled?: boolean;
  accept?: string;
  action?: string;
  beforeUpload?: (file: UploadFile, fileList: UploadFile[]) => boolean | Observable<any>;
  customRequest?: (item: any) => Subscription;
  data?: {} | ((file: UploadFile) => {});
  headers?: {};
  name?: string;
  multiple?: boolean;
  withCredentials?: boolean;
  filters?: UploadFilter[];
  onStart?: (file: UploadFile) => void;
  onProgress?: (e: any, file: UploadFile) => void;
  onSuccess?: (ret: any, file: UploadFile, xhr: any) => void;
  onError?: (err: any, file: UploadFile) => void;
}

export interface UploadFilter {
  name: string;
  fn: (fileList: UploadFile[]) => UploadFile[];
}
