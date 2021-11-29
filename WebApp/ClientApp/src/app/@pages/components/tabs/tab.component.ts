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
import {
  Component,
  ContentChild,
  EventEmitter,
  Input,
  OnDestroy,
  OnInit,
  Output,
  TemplateRef,
  ViewChild,
} from '@angular/core';
import { toBoolean } from '../util/convert';
import { pgTabSetComponent } from './tabset.component';

@Component({
  selector: 'pg-tab',
  template: `
    <ng-template>
      <ng-content></ng-content>
    </ng-template>
  `,
  styles  : [],
  host: {
    '[class.ant-tabs-tabpane]': 'true'
  }
})
export class pgTabComponent implements OnDestroy, OnInit {
  private disabled = false;

  position: number | null = null;
  origin: number | null = null;

  @Input()
  set Disabled(value: boolean) {
    this.disabled = toBoolean(value);
  }

  get Disabled(): boolean {
    return this.disabled;
  }

  @Output() pgSelect = new EventEmitter();
  @Output() pgClick = new EventEmitter();
  @Output() pgDeselect = new EventEmitter();
  @ContentChild('TabHeading', { static: true }) _tabHeading: TemplateRef<void>;
  @ViewChild(TemplateRef, { static: true }) _content: TemplateRef<void>;

  get content(): TemplateRef<void> | null {
    return this._content;
  }

  constructor(private pgTabSetComponent: pgTabSetComponent) {
  }

  ngOnInit(): void {
    this.pgTabSetComponent._tabs.push(this);
  }

  ngOnDestroy(): void {
    this.pgTabSetComponent._tabs.splice(this.pgTabSetComponent._tabs.indexOf(this), 1);
  }

}
