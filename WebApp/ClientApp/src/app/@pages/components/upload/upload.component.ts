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
// tslint:disable:ordered-imports no-any
import { Component, ChangeDetectionStrategy, ViewChild, ViewEncapsulation, Input, Output, EventEmitter, OnInit, OnChanges, SimpleChanges, SimpleChange, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { Observable } from 'rxjs/Observable';
import { Subscription } from 'rxjs/Subscription';
import { of } from 'rxjs/observable/of';
import { filter } from 'rxjs/operators/filter';
import { toBoolean } from '../util/convert';
import { pgUploadBtnComponent } from './upload-btn.component';
import { UploadFile, UploadListType, ShowUploadListInterface, UploadChangeParam, UploadType, ZipButtonOptions, UploadFilter } from './interface';

@Component({
  selector: 'pg-upload',
  templateUrl:"./upload.component.html",
  styleUrls: [
    './upload.scss',
  ],
  encapsulation: ViewEncapsulation.None,
  preserveWhitespaces: false,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class pgUploadComponent implements OnInit, OnChanges, OnDestroy {

  //private inited = false;
  private progressTimer: any;
  /** @private */
  @ViewChild('upload', { static: false }) upload: pgUploadBtnComponent;

  // region: fields
  @Input() Type: UploadType = 'select';
  @Input() Limit: number = 0;
  @Input() Size: number = 0;
  @Input() FileType: string;
  @Input() Accept: string;
  @Input() Action: string;
  @Input() progressType: string;
  @Input() BeforeUpload: (file: UploadFile, fileList: UploadFile[]) => boolean | Observable<any>;
  @Input() CustomRequest: (item: any) => Subscription;
  @Input() Data: {} | ((file: UploadFile) => {});
  @Input() Filter: UploadFilter[] = [];
  @Input() FileList: UploadFile[] = [];
  @Output() FileListChange: EventEmitter<UploadFile[]> = new EventEmitter<UploadFile[]>();

  private _disabled = false;
  @Input()
  set Disabled(value: boolean) {
    this._disabled = toBoolean(value);
  }
  get Disabled(): boolean {
    return this._disabled;
  }

  @Input() Headers: {};
  @Input() ListType: UploadListType = 'text';
  @Input() extraClass:string;

  private _multiple = false;
  @Input()
  set Multiple(value: boolean) {
    this._multiple = toBoolean(value);
  }
  get Multiple(): boolean {
    return this._multiple;
  }

  @Input() Name = 'file';

  private _showUploadList: boolean | ShowUploadListInterface = true;
  @Input()
  set ShowUploadList(value: boolean | ShowUploadListInterface) {
    this._showUploadList = typeof value === 'boolean' ? toBoolean(value) : value;
  }
  get ShowUploadList(): boolean | ShowUploadListInterface {
    return this._showUploadList;
  }

  private _showBtn = true;
  @Input()
  set ShowButton(value: boolean) {
    this._showBtn = toBoolean(value);
  }
  get ShowButton(): boolean {
    return this._showBtn;
  }

  private _withCredentials = false;
  @Input()
  set WithCredentials(value: boolean) {
    this._withCredentials = toBoolean(value);
  }
  get WithCredentials(): boolean {
    return this._withCredentials;
  }

  @Input() Remove: (file: UploadFile) => boolean | Observable<boolean>;
  @Input() Preview: (file: UploadFile) => void;

  @Output() Change: EventEmitter<UploadChangeParam> = new EventEmitter<UploadChangeParam>();

  /** @private */
  _btnOptions: ZipButtonOptions;

  private zipOptions(): this {
    if (typeof this.ShowUploadList === 'boolean' && this.ShowUploadList) {
      this.ShowUploadList = {
        showPreviewIcon: true,
        showRemoveIcon: true
      };
    }
    // filters
    const filters: UploadFilter[] = this.Filter.slice();
    if (this.Multiple && this.Limit > 0 && filters.findIndex(w => w.name === 'limit') === -1) {
      filters.push({
        name: 'limit',
        fn: (fileList: UploadFile[]) => fileList.slice(-this.Limit)
      });
    }
    if (this.Size > 0 && filters.findIndex(w => w.name === 'size') === -1) {
      filters.push({
        name: 'size',
        fn: (fileList: UploadFile[]) => fileList.filter(w => (w.size / 1024) <= this.Size)
      });
    }
    if (this.FileType && this.FileType.length > 0 && filters.findIndex(w => w.name === 'type') === -1) {
      const types = this.FileType.split(',');
      filters.push({
        name: 'type',
        fn: (fileList: UploadFile[]) => fileList.filter(w => ~types.indexOf(w.type))
      });
    }
    this._btnOptions = {
      disabled: this.Disabled,
      accept: this.Accept,
      action: this.Action,
      beforeUpload: this.BeforeUpload,
      customRequest: this.CustomRequest,
      data: this.Data,
      headers: this.Headers,
      name: this.Name,
      multiple: this.Multiple,
      withCredentials: this.WithCredentials,
      filters,
      onStart: this.onStart,
      onProgress: this.onProgress,
      onSuccess: this.onSuccess,
      onError: this.onError
    };
    return this;
  }

  // endregion

  constructor(private cd: ChangeDetectorRef) {}

  // region: upload

  private fileToObject(file: UploadFile): UploadFile {
    return {
      lastModified: file.lastModified,
      lastModifiedDate: file.lastModifiedDate,
      name: file.filename || file.name,
      size: file.size,
      type: file.type,
      uid: file.uid,
      response: file.response,
      error: file.error,
      percent: 0,
      // tslint:disable-next-line:no-angle-bracket-type-assertion
      originFileObj: <any>file
    };
  }

  private getFileItem(file: UploadFile, fileList: UploadFile[]): UploadFile {
    const matchKey = file.uid !== undefined ? 'uid' : 'name';
    return fileList.filter(item => item[matchKey] === file[matchKey])[0];
  }

  private removeFileItem(file: UploadFile, fileList: UploadFile[]): UploadFile[] {
    const matchKey = file.uid !== undefined ? 'uid' : 'name';
    const removed = fileList.filter(item => item[matchKey] !== file[matchKey]);
    if (removed.length === fileList.length) {
      return null;
    }
    return removed;
  }

  private uploadErrorText = "Error Upload";
  private genErr(file: UploadFile): string {
    return file.response && typeof file.response === 'string' ?
            file.response :
            (file.error && file.error.statusText) || this.uploadErrorText;
  }

  private clearProgressTimer(): void {
    clearInterval(this.progressTimer);
  }

  private genPercentAdd(): (s: number) => number {
    let k = 0.1;
    const i = 0.01;
    const end = 0.98;
    return (s: number) => {
      let start = s;
      if (start >= end) {
        return start;
      }

      start += k;
      k = k - i;
      if (k < 0.001) {
        k = 0.001;
      }
      return start * 100;
    };
  }

  private autoUpdateProgress(file: UploadFile): void {
    const getPercent = this.genPercentAdd();
    let curPercent = 0;
    this.clearProgressTimer();
    this.progressTimer = setInterval(() => {
      curPercent = getPercent(curPercent);
      this.onProgress({
        percent: curPercent,
      }, file);
    }, 200);
  }

  private genThumb(file: UploadFile): void {
    if (typeof document === 'undefined' ||
        typeof window === 'undefined' ||
        !(window as any).FileReader || !(window as any).File ||
        !(file.originFileObj instanceof File) ||
        file.thumbUrl !== undefined
      ) {
      return;
    }

    file.thumbUrl = '';

    const reader = new FileReader();
    reader.onloadend = () => file.thumbUrl = reader.result as string;
    reader.readAsDataURL(file.originFileObj);
  }

  private onStart = (file: any): void => {
    if (!this.FileList) this.FileList = [];
    const targetItem = this.fileToObject(file);
    targetItem.status = 'uploading';
    this.FileList.push(targetItem);
    this.genThumb(targetItem);
    this.FileListChange.emit(this.FileList);
    this.Change.emit({ file: targetItem, fileList: this.FileList });
    // fix ie progress
    if (!(window as any).FormData) {
      this.autoUpdateProgress(targetItem);
    }
    this.cd.detectChanges();
  }

  private onProgress = (e: { percent: number }, file: UploadFile): void => {
    const fileList = this.FileList;
    const targetItem = this.getFileItem(file, fileList);
    // removed
    if (!targetItem) return;
    targetItem.percent = e.percent;
    this.Change.emit({
      event: e,
      file: { ...targetItem },
      fileList: this.FileList,
    });
    this.cd.detectChanges();
  }

  private onSuccess = (res: any, file: any, xhr?: any): void => {
    this.clearProgressTimer();
    const fileList = this.FileList;
    const targetItem = this.getFileItem(file, fileList);
    // removed
    if (!targetItem) return;
    targetItem.status = 'complete';
    targetItem.response = res;
    this.Change.emit({
      file: { ...targetItem },
      fileList,
    });
    this.cd.detectChanges();
  }

  private onError = (err: any, file: any): void => {
    this.clearProgressTimer();
    const fileList = this.FileList;
    const targetItem = this.getFileItem(file, fileList);
    // removed
    if (!targetItem) return;
    targetItem.error = err;
    targetItem.status = 'error';
    targetItem.message = this.genErr(file);
    this.Change.emit({
      file: { ...targetItem },
      fileList,
    });
    this.cd.detectChanges();
  }

  // endregion

  // region: drag

  private dragState: string;
  fileDrop(e: DragEvent): void {
    if (e.type === this.dragState) return;
    this.dragState = e.type;
    this._setClassMap();
  }

  // endregion

  // region: list

  onRemove = (file: UploadFile): void => {
    this.upload.abort(file);
    file.status = 'removed';
    ((this.Remove ? this.Remove instanceof Observable ? this.Remove : of(this.Remove(file)) : of(true)) as Observable<any>)
      .pipe(filter((res: boolean) => res))
      .subscribe(res => {
        const removedFileList = this.removeFileItem(file, this.FileList);
        if (removedFileList) {
          this.FileList = removedFileList;
          this.Change.emit({
            file,
            fileList: removedFileList
          });
          this.FileListChange.emit(this.FileList);
          this.cd.detectChanges();
        }
      });
  }

  // endregion

  // region: styles
  _prefixCls = 'upload';
  _classList: string[] = [];
  _setClassMap(): void {
    //const isDrag = this.Type === 'drag';
    let subCls: string[] = [];
    if (this.Type === 'drag') {
      subCls = [
        this.FileList.some(file => file.status === 'uploading') && `${this._prefixCls}-drag-uploading`,
        this.dragState === 'dragover' && `${this._prefixCls}-drag-hover`
      ];
    } else {
      subCls = [
        `${this._prefixCls}-select-${this.ListType}`
      ];
    }

    this._classList = [
      this._prefixCls,
      `${this._prefixCls}-${this.Type}`,
      ...subCls,
      this.Disabled && `${this._prefixCls}-disabled`
    ].filter(item => !!item);

    this.cd.detectChanges();
  }
  // endregion

  ngOnInit(): void {
    //this.inited = true;
  }

  ngOnChanges(changes: { [P in keyof this]?: SimpleChange } & SimpleChanges): void {
    if (changes.FileList) (this.FileList || []).forEach(file => file.message = this.genErr(file));
    this.zipOptions()._setClassMap();
  }

  ngOnDestroy(): void {
    this.clearProgressTimer();
  }
}
