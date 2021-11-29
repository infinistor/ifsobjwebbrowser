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
import { MarksArray } from './slider-marks.component';

@Component({
  selector     : 'pg-slider-step',
  encapsulation: ViewEncapsulation.None,
  template     : `
    <div class="{{PrefixCls}}-step">
      <span *ngFor="let attr of attrs; trackBy: trackById" [ngClass]="attr.classes" [ngStyle]="attr.style"></span>
    </div>
  `
})
export class pgSliderStepComponent implements OnChanges {
  private _vertical = false;
  private _included = false;

  // Dynamic properties
  @Input() LowerBound: number = null;
  @Input() UpperBound: number = null;
  @Input() MarksArray: MarksArray;

  // Static properties
  @Input() PrefixCls: string;

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

  // TODO: using named interface
  attrs: Array<{ id: number, value: number, offset: number, classes: { [key: string]: boolean }, style: object }>;

  ngOnChanges(changes: SimpleChanges): void {
    if (changes.MarksArray) {
      this.buildAttrs();
    }
    if (changes.MarksArray || changes.LowerBound || changes.UpperBound) {
      this.togglePointActive();
    }
  }

  trackById(index: number, attr: { id: number, value: number, offset: number, classes: { [key: string]: boolean }, style: object }): number {
    return attr.id;
  }

  buildAttrs(): void {
    const orient = this.Vertical ? 'bottom' : 'left';
    const prefixCls = this.PrefixCls;
    this.attrs = this.MarksArray.map(mark => {
      const { value, offset } = mark;
      return {
        id     : value,
        value,
        offset,
        style  : {
          [orient]: `${offset}%`
        },
        classes: {
          [`${prefixCls}-dot`]       : true,
          [`${prefixCls}-dot-active`]: false
        }
      };
    });
  }

  togglePointActive(): void {
    if (this.attrs && this.LowerBound !== null && this.UpperBound !== null) {
      this.attrs.forEach(attr => {
        const value    = attr.value;
        const isActive = (!this.Included && value === this.UpperBound) ||
            (this.Included && value <= this.UpperBound && value >= this.LowerBound);
        attr.classes[ `${this.PrefixCls}-dot-active` ] = isActive;
      });
    }
  }

}
