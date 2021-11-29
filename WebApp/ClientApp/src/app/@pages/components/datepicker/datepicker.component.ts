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
import { ConnectedOverlayPositionChange, ConnectionPositionPair } from '@angular/cdk/overlay';
import {
  forwardRef,
  ChangeDetectorRef,
  Component,
  ElementRef,
  Input,
  OnInit,
  ViewChild,
  ViewEncapsulation,
} from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import * as moment from 'moment';

import { DayInterface, MonthInterface } from './date';
import { dropDownAnimation,scaleInAnimation } from '../../animations/dropdown-animations';
import { DEFAULT_DATEPICKER_POSITIONS } from '../../utils/overlay-position-map';

import { pgTimePickerInnerComponent } from '../time-picker/timepicker-inner.component';
import { toBoolean } from '../util/convert';


@Component({
  selector     : 'pg-datepicker',
  encapsulation: ViewEncapsulation.None,
  animations   : [
    dropDownAnimation,
    scaleInAnimation
  ],
  templateUrl     : "datepicker.component.html",
  providers    : [
    {
      provide    : NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => pgDatePickerComponent),
      multi      : true
    }
  ],
  styleUrls    : ['./datepicker.scss'],
  host         : {
    '[class.ant-calendar-picker]': 'true'
  }
})
export class pgDatePickerComponent implements ControlValueAccessor, OnInit {
  private _allowClear = true;
  private _disabled = false;
  private _showTime: Partial<pgTimePickerInnerComponent> = null;
  _el: HTMLElement;
  _open = false;
  _mode = 'year';
  _dropDownPosition = 'bottom';
  _placeHolder = 'Select Date';
  _value: Date = null;
  _disabledDate: any;
  _today = new Date();
  _selectedMonth = moment(this.Value).month();
  _selectedYear = moment(this.Value).year();
  _selectedDate = moment(this.Value).date();
  _showMonth = moment(new Date()).month();
  _showYear = moment(new Date()).year();
  _startDecade = Math.floor(this._showYear / 10) * 10;
  _yearPanel: string[][] = [];
  _monthList: any = [];
  _positions: ConnectionPositionPair[] = [ ...DEFAULT_DATEPICKER_POSITIONS ];
  // ngModel Access
  onChange: (value: Date) => void = () => null;
  onTouched: () => void = () => null;

  @Input() Format = 'YYYY-MM-DD';
  @Input() Size = '';
  @Input() Mode: 'day' | 'month' = 'day';
  @ViewChild('trigger', { static: false }) trigger: any;
  @ViewChild(pgTimePickerInnerComponent, { static: false }) timePickerInner: pgTimePickerInnerComponent;
  @ViewChild('monthSlider', { static: false }) _monthSlider: ElementRef;
  @Input()
  set ShowTime(value: Partial<pgTimePickerInnerComponent>) {
    if (typeof value === 'string' || typeof value === 'boolean') {
      this._showTime = toBoolean(value) ? {} : null;
      this.HideFooter = false;
    } else {
      this._showTime = value;
    }
  }

  get ShowTime(): Partial<pgTimePickerInnerComponent> {
    return this._showTime;
  }

  @Input()
  set Placeholder(value: any) {
    this._placeHolder = value
  }

  @Input() HideFooter = true;

  @Input()
  set AllowClear(value: boolean) {
    this._allowClear = toBoolean(value);
  }

  get AllowClear(): boolean {
    return this._allowClear;
  }

  @Input()
  set Disabled(value: boolean) {
    this._disabled = toBoolean(value);
    this._closeCalendar();
  }

  get Disabled(): boolean {
    return this._disabled;
  }

  @Input()
  set DisabledDate(value: () => boolean) {
    this._disabledDate = value;
  }

  get DisabledDate(): () => boolean {
    if (this._mode === 'month' && this.Mode === 'day') {
      return;
    }
    return this._disabledDate;
  }

  get _disabledToday(): boolean {
    if (this._disabledDate) {
      return this._disabledDate(new Date());
    } else {
      return false;
    }
  }

  onPositionChange(position: ConnectedOverlayPositionChange): void {
    const _position = position.connectionPair.originY === 'bottom' ? 'top' : 'bottom';
    if (this._dropDownPosition !== _position) {
      this._dropDownPosition = _position;
      this._cdr.detectChanges();
    }
  }

  get Value(): Date {
    return this._value || new Date();
  }

  set Value(value: Date) {
    this._updateValue(value);
  }

  _changeTime($event: Date): void {
    this._value = $event;
  }

  _blurInput(box: HTMLInputElement): void {
    if (Date.parse(box.value)) {
      this.Value = new Date(box.value);
      this.onChange(this._value);
    }
  }

  _preYear(): void {
    this._showYear = this._showYear - 1;
  }

  _nextYear(): void {
    this._showYear = this._showYear + 1;
  }

  _preMonth(): void {
    if (this._showMonth - 1 < 0) {
      this._showMonth = 11;
      this._preYear();
    } else {
      this._showMonth = this._showMonth - 1;
    }
  }

  _nextMonth(): void {
    if (this._showMonth + 1 > 11) {
      this._showMonth = 0;
      this._nextYear();
    } else {
      this._showMonth = this._showMonth + 1;
    }
  }

  _setShowYear(year: number, $event: MouseEvent): void {
    $event.stopPropagation();
    this._showYear = year;
    this._mode = this.Mode === 'day' ? 'year' : 'month';
  }

  _preDecade(): void {
    this._startDecade = this._startDecade - 10;
  }

  _nextDecade(): void {
    this._startDecade = this._startDecade + 10;
  }

  _clearValue(e: MouseEvent): void {
    e.preventDefault();
    e.stopPropagation();
    this.Value = null;
    this.onChange(this._value);
  }

  _changeToToday(): void {
    if (!this._disabledToday) {
      this.Value = new Date();
      this.onChange(this._value);
      this._closeCalendar();
    }
  }

  _clickDay(day: DayInterface): void {
    if (!this.ShowTime) {
      this._closeCalendar();
      this.Value = day.date.toDate();
      this.onChange(this._value);
    } else {
      this.Value = moment(this.Value).year(day.date.year()).month(day.date.month()).date(day.date.date()).toDate();
      this.onChange(this._value);
    }

  }

  _clickMonth(month: MonthInterface): void {
    if (this.Mode === 'month') {
      this._closeCalendar();
      this.Value = moment(this.Value).year(this._showYear).month(month.index).toDate();
      this.onChange(this._value);
    } else {
      this._showMonth = month.index;
      this._mode = 'year';
    }
  }

  _openCalendar(): void {
    if (this.Disabled) {
      return;
    }
    this._mode = this.Mode === 'day' ? 'year' : 'month';
    this._open = true;
  }

  _closeCalendar(): void {
    if (!this._open) {
      return;
    }
    if (this.ShowTime) {
      this._updateValue(this._value);
      this.onChange(this._value);
    }
    this._open = false;
  }

  _changeMonthView(): void {
    this._mode = 'month';
  }

  _changeDecadeView($event: MouseEvent): void {
    $event.stopPropagation();
    this._mode = 'decade';
  }

  _changeTimeView($event: MouseEvent): void {
    $event.stopPropagation();
    this._mode = 'time';
    setTimeout(() => {
      this.timePickerInner._initPosition();
    });
  }

  _changeYearView($event: MouseEvent): void {
    $event.stopPropagation();
    this._mode = 'year';
  }

  get _showClearIcon(): boolean {
    return this._value && !this.Disabled && this.AllowClear;
  }

  _generateYearPanel(): void {
    let _t: string[] = [];
    for (let i = 0; i < 10; i++) {
      if (i === 1 || i === 4 || i === 7 || i === 9) {
        _t.push(i.toString());
        this._yearPanel.push(_t);
        _t = [];
      } else {
        _t.push(i.toString());
      }
    }
    this._yearPanel[ 0 ].unshift('start');
    this._yearPanel[ 3 ].push('end');
  }


  constructor(private _elementRef: ElementRef, private _cdr: ChangeDetectorRef) {
    this._el = this._elementRef.nativeElement;
  }

  ngOnInit(): void {
    this._generateYearPanel();
    
  }

  writeValue(value: Date): void {
    // this.Value = value;
    this._updateValue(value);
  }

  registerOnChange(fn: (_: Date) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.Disabled = isDisabled;
  }

  private _updateValue(value: Date): void {
    if (this._value === value) {
      return;
    }
    if (this._disabledDate && this._disabledDate(value)) {
      return;
    }
    this._value = value;
    this._selectedMonth = moment(this.Value).month();
    this._selectedYear = moment(this.Value).year();
    this._selectedDate = moment(this.Value).date();
    this._showYear = moment(this.Value).year();
    this._showMonth = moment(this.Value).month();
    this._startDecade = Math.floor(this._showYear / 10) * 10;
  }

}
