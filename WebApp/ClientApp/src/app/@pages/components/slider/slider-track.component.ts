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
import { Component, Input, OnChanges, SimpleChanges, ViewEncapsulation } from '@angular/core';
import { toBoolean } from '../util/convert';

@Component({
  selector     : 'pg-slider-track',
  encapsulation: ViewEncapsulation.None,
  template     : `
    <div [class]="ClassName" [ngStyle]="style"></div>
  `
})
export class pgSliderTrackComponent implements OnChanges {
  private _vertical = false;
  private _included = false;

  // Dynamic properties
  @Input() Offset: number;
  @Input() Length: number;

  // Static properties
  @Input() ClassName: string;

  @Input()
  set Vertical(value: boolean) { // Required
    this._vertical = toBoolean(value);
  }

  get Vertical(): boolean {
    return this._vertical;
  }

  @Input()
  set Included(value: boolean) {
    this._included = toBoolean(value);
  }

  get Included(): boolean {
    return this._included;
  }

  style: { bottom?: string, height?: string, left?: string, width?: string, visibility?: string } = {};

  ngOnChanges(changes: SimpleChanges): void {
    if (changes.Included) {
      this.style.visibility = this.Included ? 'visible' : 'hidden';
    }
    if (changes.Vertical || changes.Offset || changes.Length) {
      if (this.Vertical) {
        this.style.bottom = `${this.Offset}%`;
        this.style.height = `${this.Length}%`;
      } else {
        this.style.left = `${this.Offset}%`;
        this.style.width = `${this.Length}%`;
      }
    }
  }

}
