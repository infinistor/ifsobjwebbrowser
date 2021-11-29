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
  selector     : 'pg-slider-marks',
  encapsulation: ViewEncapsulation.None,
  template     : `
    <div [class]="ClassName">
      <span *ngFor="let attr of attrs; trackBy: trackById" [ngClass]="attr.classes" [ngStyle]="attr.style" [innerHTML]="attr.label"></span>
    </div>
  `
})
export class pgSliderMarksComponent implements OnChanges {
  private _vertical = false;
  private _included = false;

  // Dynamic properties
  @Input() LowerBound: number = null;
  @Input() UpperBound: number = null;
  @Input() MarksArray: MarksArray;

  // Static properties
  @Input() ClassName: string;
  @Input() Min: number; // Required
  @Input() Max: number; // Required

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
  attrs: Array<{ id: number, value: number, offset: number, classes: { [key: string]: boolean }, style: object, label: Mark }>; // points for inner use

  ngOnChanges(changes: SimpleChanges): void {
    if (changes.MarksArray) {
      this.buildAttrs();
    }
    if (changes.MarksArray || changes.LowerBound || changes.UpperBound) {
      this.togglePointActive();
    }
  }

  trackById(index: number, attr: { id: number, value: number, offset: number, classes: { [key: string]: boolean }, style: object, label: Mark }): number {
    return attr.id;
  }

  buildAttrs(): void {
    const range = this.Max - this.Min;
    this.attrs = this.MarksArray.map(mark => {
      const { value, offset, config } = mark;
      // calc styles
      let label = config;
      let style: object;
      if (this.Vertical) {
        style = {
          marginBottom: '-50%',
          bottom      : `${(value - this.Min) / range * 100}%`
        };
      } else {
        const marksCount = this.MarksArray.length;
        const unit       = 100 / (marksCount - 1);
        const markWidth  = unit * 0.9;
        style = {
          width     : `${markWidth}%`,
          marginLeft: `${-markWidth / 2}%`,
          left      : `${(value - this.Min) / range * 100}%`
        };
      }
      // custom configuration
      if (typeof config === 'object') {
        label = config.label;
        if (config.style) {
          style = { ...style, ...config.style };
        }
      }
      return {
        id     : value,
        value,
        offset,
        classes: {
          [`${this.ClassName}-text`]: true
        },
        style,
        label
      };
    }); // END - map
  }

  togglePointActive(): void {
    if (this.attrs && this.LowerBound !== null && this.UpperBound !== null) {
      this.attrs.forEach(attr => {
        const value    = attr.value;
        const isActive = (!this.Included && value === this.UpperBound) ||
            (this.Included && value <= this.UpperBound && value >= this.LowerBound);
        attr.classes[ `${this.ClassName}-text-active` ] = isActive;
      });
    }
  }

}

// DEFINITIONS

export type Mark = string | {
  style: object;
  label: string;
};

export class Marks {
  number: Mark;
}

// TODO: extends Array could cause unexpected behavior when targeting es5 or below
export class MarksArray extends Array<{ value: number, offset: number, config: Mark }> {
  [index: number]: {
    value: number;
    offset: number;
    config: Mark;
  }
}
