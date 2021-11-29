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
import { Component, Input, Renderer2, ElementRef, SimpleChange, SimpleChanges, OnInit, OnChanges } from '@angular/core';
import { animate, style, transition, trigger } from '@angular/animations';
import { UploadListType, UploadFile, ShowUploadListInterface } from './interface';

@Component({
  selector: 'pg-upload-list',
  template: `
  <div *ngFor="let file of items" class="list-group-item upload-{{file.status}}" @itemState>
    <ng-template #icon>
      <ng-container *ngIf="listType === 'picture' || listType === 'picture-card'; else defIcon">
        <ng-container *ngIf="file.status === 'uploading' || (!file.thumbUrl && !file.url); else thumbIcon">
          <div *ngIf="listType === 'picture-card'" class="upload-list-item-uploading-text">{{ locale.uploading }}</div>
          <i *ngIf="listType !== 'picture-card'" class="anticon anticon-picture upload-list-item-thumbnail"></i>
        </ng-container>
      </ng-container>
      <ng-template #defIcon>
        <pg-progress *ngIf="file.status === 'uploading'" type="circle" indeterminate="true"></pg-progress>
        <i *ngIf="file.status !== 'uploading'" class="fa fa-paperclip p-l-5 p-r-5"></i>
      </ng-template>
      <ng-template #thumbIcon>
        <a class="img-thumbnail" target="_blank" rel="noopener noreferrer"
          [href]="file.thumbUrl || file.url"
          (click)="handlePreview(file, $event)">
          <img [src]="file.thumbUrl || file.url" [attr.alt]="file.name" />
        </a>
      </ng-template>
    </ng-template>
    <ng-template #preview>
      <ng-container *ngIf="file.url; else prevText">
        <a [href]="file.thumbUrl || file.url" target="_blank" rel="noopener noreferrer"
          (click)="handlePreview(file, $event)" class="list-item-name" title="{{ file.name }}">{{ file.name }}</a>
      </ng-container>
      <ng-template #prevText>
        <span (click)="handlePreview(file, $event)" class="list-item-name" title="{{ file.name }}">{{ file.name }}</span>
      </ng-template>
    </ng-template>
    <div class="list-group-item-inner justify-content-between">
    <div class="d-flex">
      <ng-template [ngTemplateOutlet]="icon"></ng-template>
      <ng-template [ngTemplateOutlet]="preview"></ng-template>
    </div>
    <ng-container *ngIf="listType === 'picture-card' && file.status !== 'uploading'; else cross">
      <span class="upload-list-item-actions">
        <a *ngIf="icons.showPreviewIcon" [href]="file.thumbUrl || file.url"
          target="_blank" rel="noopener noreferrer"
          title="{{ locale.previewFile }}"
          [ngStyle]="!(file.url || file.thumbUrl) && {'opacity': .5, 'pointer-events': 'none'}"
          (click)="handlePreview(file, $event)">
            <i class="fa fa-eye"></i>
        </a>
        <i *ngIf="icons.showRemoveIcon" (click)="handleClose(file)" class="pg pg-close" title="{{ locale.removeFile }}"></i>
      </span>
    </ng-container>
    <ng-template #cross>
      <i *ngIf="icons.showRemoveIcon" (click)="handleClose(file)" class="pg pg-close" title="{{ locale.removeFile }}"></i>
    </ng-template>
    </div>
    <div *ngIf="file.status === 'uploading' && progressType !== 'circle';" class="item-progress">
      <div *ngIf="listType === 'picture-card';else determineBlock">
        <pg-progress type="circle" indeterminate="true"></pg-progress>
      </div>
      <ng-template #determineBlock>
        <pg-progress *ngIf="file.percent == 0" type="bar" indeterminate="true"></pg-progress>
        <pg-progress *ngIf="file.percent != 0" type="bar" indeterminate="false" value="file.percent"></pg-progress>
      </ng-template>
    </div>
  </div>
  `,
  animations: [
    trigger('itemState', [
      transition(':enter', [
        style({ height: '0', width: '0', opacity: 0 }),
        animate(150, style({height: '*', width: '*', opacity: 1}))
      ]),
      transition(':leave', [
        animate(150, style({ height: '0', width: '0', opacity: 0 }))
      ])
    ])
  ],
  host: {
    '[class.list-group]': 'true',
    '[class.upload-list]': 'true'
  },
  preserveWhitespaces: false
})
export class pgUploadListComponent implements OnInit, OnChanges {

  // region: fields

  @Input() listType: UploadListType;
  @Input() items: UploadFile[];
  @Input() icons: ShowUploadListInterface;
  @Input() progressType: string;
  @Input() onPreview: (file: UploadFile) => void;
  @Input() onRemove: (file: UploadFile) => void;

  // endregion

  // region: styles

  _prefixCls = 'upload-list';
  _classList: string[] = [];

  _setClassMap(): void {
    this._classList.forEach(cls => this._renderer.removeClass(this._el.nativeElement, cls));

    this._classList = [
      this._prefixCls,
      `${this._prefixCls}-${this.listType}`
    ].filter(item => !!item);

    this._classList.forEach(cls => this._renderer.addClass(this._el.nativeElement, cls));
  }

  // endregion

  // region: render

  //private locale = {
  //  uploading: "Uploading",
  //  previewFile: "Preview File",
  //  removeFile: "Remove File",
  //};

  handlePreview(file: UploadFile, e: any): void {
    if (!this.onPreview) return;

    e.preventDefault();
    return this.onPreview(file);
  }

  handleClose(file: UploadFile): void {
    if (this.onRemove) this.onRemove(file);
  }

  // endregion

  constructor(private _el: ElementRef, private _renderer: Renderer2) {}

  ngOnInit(): void {
  }

  ngOnChanges(changes: { [P in keyof this]?: SimpleChange } & SimpleChanges): void {
    this._setClassMap();
  }

}
