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
  Input,
  OnDestroy,
  OnInit,
  ViewEncapsulation,
} from '@angular/core';

import { toBoolean } from '../util/convert';
import { pgSelectFXComponent } from './select.component';

@Component({
  selector     : 'pg-selectfx-option',
  encapsulation: ViewEncapsulation.None,
  template     : `
    <ng-content></ng-content>
  `,
  styleUrls    : []
})
export class pgOptionComponent implements OnDestroy, OnInit {
  private _disabled = false;

  _value: string;
  _label: string;
  @ContentChild('OptionTemplate', { static: false }) OptionTemplate: any;

  @Input()
  set Value(value: string) {
    if (this._value === value) {
      return;
    }
    this._value = value;
  }

  get Value(): string {
    return this._value;
  }

  @Input()
  set Label(value: string) {
    if (this._label === value) {
      return;
    }
    this._label = value;
  }

  get Label(): string {
    return this._label;
  }

  @Input()
  set Disabled(value: boolean) {
    this._disabled = toBoolean(value);
  }

  get Disabled(): boolean {
    return this._disabled;
  }

  constructor(private _Select: pgSelectFXComponent) {
  }

  ngOnInit(): void {
    this._Select.addOption(this);
  }

  ngOnDestroy(): void {
    this._Select.removeOption(this);
  }
}
