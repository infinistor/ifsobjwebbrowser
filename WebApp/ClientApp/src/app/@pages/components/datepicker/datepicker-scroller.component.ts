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
  ElementRef,
  Input,
  OnInit,
  ViewChild,
  ViewEncapsulation,
  Renderer2,
  EventEmitter,
  Output,
} from '@angular/core';
import * as moment from 'moment';
import { pgDatePickerComponent } from './datepicker.component'

@Component({
  selector: 'pg-datepicker-scroller',
  encapsulation: ViewEncapsulation.None,
  template: `
  <div class="wrap-scroller" #wrapper>
    <div class="horizontal-dates" style="position: relative;" >
    <div class="d-flex flex-row full-width" #monthSlider  (cdkObserveContent)="_onContentChanges()">
        <ng-container *ngFor="let monthIndex of _List">
            <ng-container *ngIf="(monthIndex === _selectedMonth || monthIndex == _showMonth); else determineBlock">
                <a class="month-select selected-date" title="" #selectedElement  (click)="_changeMonthView()">
                    {{ _getMonthForamated(monthIndex) }}
                </a>
            </ng-container>
            <ng-template #determineBlock>
                <a class="month-select" title="" (click)="_changeMonth(monthIndex)">
                    {{ _getMonthForamated(monthIndex) }}
                </a>
            </ng-template>
        </ng-container>
        </div>             
    </div>
</div>
  `,
})
export class pgDateScroller implements OnInit {
  _monthList: any = [];
  _List: any = [];
  _yearList: any = []
  _selectedMonth: any;
  _selectedYear: any;
  _showMonth: any;
  _mode = 'month';
  _el: HTMLElement;
  @ViewChild('selectedElement', { static: false }) _selectedElement: any;
  @ViewChild('monthSlider', { static: false }) _monthSlider: any;
  @ViewChild('wrapper', { static: false }) _wrapper: any;
  @Output() onDateChange: EventEmitter<void> = new EventEmitter();
  constructor(private _elementRef: ElementRef, private _renderer: Renderer2, private picker: pgDatePickerComponent) {
    this._el = this._elementRef.nativeElement;
  }
  _generate(): void {
    //let _t: string[] = [];
    if (this._mode == "month") {
      for (let i = 0; i < 12; i++) {
        this._monthList.push(i);
      }
      this._List = this._monthList
    }
    else {
      for (let i = 0; i < 10; i++) {
        this._yearList.push(i);
      }
      this._List = this._yearList;
    }

  }
  ngOnInit(): void {
    this._generate();
  }
  ngAfterViewInit(): void {
    this.alignToElement();
  }
  @Input()
  set selectedMonth(value: Date) {
    this._selectedMonth = value;
  }

  @Input()
  set Mode(value: string) {
    this._mode = value;
  }

  @Input()
  set selectedYear(value: Date) {
    this._selectedYear = value;
  }

  _getMonthForamated(value: number): string {
    return moment().month(value).format("MMMM");
  }
  _onContentChanges() {
    this.alignToElement();
  }
  _changeMonthView() {
    this.picker._changeMonthView();
  }
  _changeMonth(value: any) {
    if (this._selectedMonth > value) {
      this.picker._showMonth = this.picker._showMonth - (this._selectedMonth - value)

    }
    else {
      this.picker._showMonth = this.picker._showMonth + (value - this._selectedMonth)
    }
    this._selectedMonth = value;
  }

  alignToElement(): void {
    // if(this._selectedMonth == 0 || this._selectedMonth == 11){
    //     return;
    // }
    let rect = this._el.querySelector(".wrap-scroller").getBoundingClientRect();
    let offset = this._selectedElement ? this._selectedElement.nativeElement.offsetLeft + 'px' : '0';
    let realOffset = -(parseFloat(offset) - (rect.width / 2 - this._selectedElement.nativeElement.offsetWidth / 2)) + 'px';
    this._renderer.setStyle(this._monthSlider.nativeElement, 'transform',
      `translate3d(${realOffset}, 0px, 0px)`);
  }
}
