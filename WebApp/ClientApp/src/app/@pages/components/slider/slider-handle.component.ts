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

@Component({
  selector     : 'pg-slider-handle',
  encapsulation: ViewEncapsulation.None,
  template     : `
    <div [class]="ClassName" [ngStyle]="style">
      <div class="tooltip fade top" [class.show]="_showToolTip" style="top: -33px;left: -7px;">
        <div class="tooltip-inner">
          <span>{{tooltipTitle}}</span>
        </div>
      </div>
    </div>
  `
})
export class pgSliderHandleComponent implements OnChanges {
  
  // Locals
  tooltipTitle: string; 
  style: object = {};
  _showToolTip = false;

  @Input() ClassName: string;
  @Input() Vertical: string;
  @Input() Offset: number;
  @Input() Value: number; // [For tooltip]
  @Input() TipFormatter: (value: number) => string; // [For tooltip]
  @Input() set Active(value: boolean) { // [For tooltip]
    this._showToolTip = value
  }

  constructor() { }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes.Offset) {
      this._updateStyle();
    }
    if (changes.Value) {
      this._updateTooltipTitle(); // [For tooltip]
    }
  }

  private _updateTooltipTitle(): void { // [For tooltip]
    this.tooltipTitle = this.TipFormatter ? this.TipFormatter(this.Value) : `${this.Value}`;
  }

  private _updateStyle(): void {
    (this.style as any)[this.Vertical ? 'bottom' : 'left'] = `${this.Offset}%`;
  }
}
