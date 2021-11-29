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
  forwardRef,
  ChangeDetectorRef,
  Component,
  Input,
  OnInit,
  ViewChild,
  ViewEncapsulation,
} from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import * as moment from 'moment';
import { dropDownAnimation } from '../../animations/dropdown-animations';
import { reqAnimFrame } from '../util/request-animation';
import { toBoolean } from '../util/convert';

export interface TimeUnitInterface {
  index: number;
  name: string;
  disabled: boolean;
}

@Component({
  selector     : 'pg-timepicker-inner',
  encapsulation: ViewEncapsulation.None,
  template     : `
      <div
        class="time-picker-panel"
        [@dropDownAnimation]="'bottom'">
        <div class="time-picker-inner"
          [class.time-picker-column-3]="_showHour&&_showMinute&&_showSecond"
          [class.time-picker-column-2]="_showHour&&_showMinute&&!_showSecond"
          [class.time-picker-column-1]="_showHour&&(!_showMinute)&&(!_showSecond)">
        <div class="time-picker-panel-combobox d-flex flex-row">
          <div
            class="select-panel"
            #hourListInstance
            *ngIf="_showHour">
            <ul class="no-style no-padding text-center">
              <ng-template
                ngFor
                let-_hour
                [ngForOf]="_hourList"
                let-i="index">
                 <li>
                  <span class="btn btn-link"
                   [ngClass]="_hour.name"
                   *ngIf="!(HideDisabledOptions&&_hour.disabled)"
                   [class.active]="_hour.index===_selectedHour"
                   [class.option-disabled]="_hour.disabled"
                   (click)="_selectHour(hourListInstance,_hour.index,_hour.disabled)">
                   {{ _hour.name }}
                   </span>
                 </li>
              </ng-template>
            </ul>
          </div>
          <div
            class="select-panel"
            #minuteListInstance
            *ngIf="_showMinute">
            <ul class="no-style no-padding text-center">
              <ng-template
                ngFor
                let-_minute
                [ngForOf]="_minuteList"
                let-i="index">
                 <li>
                  <span class="btn btn-link"
                   [ngClass]="_minute.name"
                   *ngIf="!(HideDisabledOptions&&_minute.disabled)"
                   [class.active]="_minute.index===_selectedMinute"
                   [class.option-disabled]="_minute.disabled"
                   (click)="_selectMinute(minuteListInstance,_minute.index,_minute.disabled)">
                   {{ _minute.name }}
                   </span>
                 </li>
              </ng-template>
            </ul>
          </div>
          <div
            class="select-panel"
            #secondListInstance
            *ngIf="_showSecond">
            <ul class="no-style no-padding text-center">
              <ng-template
                ngFor
                let-_second
                [ngForOf]="_secondList"
                let-i="index">
                 <li>
                  <span class="btn btn-link"
                   [ngClass]="_second.name"
                   *ngIf="!(HideDisabledOptions&&_second.disabled)"
                   [class.active]="_second.index===_selectedSecond"
                   [class.option-disabled]="_second.disabled"
                   (click)="_selectSecond(secondListInstance,_second.index,_second.disabled)">
                   {{ _second.name }}
                  </span>
                 </li>
              </ng-template>
            </ul>
          </div>
          <div class="select-panel"
          #ampmListInstance *ngIf="_showAMPM"
          (mouseover)="_overSecond()">
            <ul class="no-style no-padding text-center">
              <ng-template
                ngFor
                let-_ampm
                [ngForOf]="_ampmList"
                let-i="index">
                <li
                class="btn btn-link"
                  [ngClass]="_ampm.name"
                  [class.active]="_ampm.index===_selectedAMPM"
                  [class.disabled]="_ampm.disabled"
                  *ngIf="!(HideDisabledOptions&&_ampm.disabled)"
                  (click)="_selectAMPM(ampmListInstance,_ampm.index,_ampm.disabled)">
                  {{ _ampm.name }}
                </li>
              </ng-template>
            </ul>
          </div>
        </div>
      </div>
      </div>`,
  animations   : [
    dropDownAnimation
  ],
  providers    : [
    {
      provide    : NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => pgTimePickerInnerComponent),
      multi      : true
    }
  ],
  styleUrls    : ['./timepicker.scss']
})
export class pgTimePickerInnerComponent implements OnInit, ControlValueAccessor {
  private _disabled = false;
  private _hideDisabledOptions = false;
  _now = new Date();
  _el: HTMLElement;
  _open = false;
  _hourList: TimeUnitInterface[] = [];
  _minuteList: TimeUnitInterface[] = [];
  _secondList: TimeUnitInterface[] = [];
  _value: any = null;
  _format = 'HH:mm:ss';
  _formats = this._format.split(":");
  _selectedHour =  parseInt(moment(this._now).format(this._formats[0]))
  _selectedMinute = moment(this._now).minutes();
  _selectedSecond = moment(this._now).seconds();
  _selectedAMPM = moment(this._now).format("a") == 'am' ? 0 : 1;
  _ampmList: any = [];
  _showHour = this._formats.length >= 1;
  _showMinute = this._formats.length >= 2;
  _showSecond = this._formats.length >= 3;
  _showAMPM = this._formats[0] === ("h" || "hh") ? true : false;
  _width = `${( +this._showHour + +this._showMinute + +this._showSecond + +this._showAMPM) * 56 + 1 }px`;
  _DisabledHours: () => number[];
  // ngModel Access
  onChange: (value: Date) => void = () => null;
  onTouched: () => void = () => null;

  @ViewChild('hourListInstance', { static: false }) _hourListInstance: any;
  @ViewChild('minuteListInstance', { static: false }) _minuteListInstance: any;
  @ViewChild('inputTimeInstance', { static: false }) _inputTimeInstance: any;
  @ViewChild('secondListInstance', { static: false }) _secondListInstance: any;

  @Input()
  set HideDisabledOptions(value: boolean) {
    this._hideDisabledOptions = toBoolean(value);
  }

  get HideDisabledOptions(): boolean {
    return this._hideDisabledOptions;
  }

  @Input() PlaceHolder = "Select Time";
  @Input() Size: 'small' | 'large' | 'default' = 'default';

  @Input()
  set DisabledHours(fun: () => number[]) {
    this._DisabledHours = fun;
    this._buildHours();
  }

  get DisabledHours(): () => number[] {
    return this._DisabledHours;
  }

  @Input() DisabledMinutes: (hour: number) => number[];
  @Input() DisabledSeconds: (hour: number, minute: number) => number[];

  @Input()
  set Disabled(value: boolean) {
    this._disabled = toBoolean(value);
  }

  get Disabled(): boolean {
    return this._disabled;
  }

  @Input()
  set Format(value: string) {
    this._format = value;
    this._formats = this._format.split(":");
    this._selectedHour =  parseInt(moment(this._now).format(this._formats[0]));
    this._showHour = this._formats.length >= 1;
    this._showMinute = this._formats.length >= 2;
    this._showSecond = this._formats.length >= 3;
    this._showAMPM = this._formats[0] === ("h" || "hh") ? true : false;
    this._width = `${( +this._showHour + +this._showMinute + +this._showSecond + +this._showAMPM) * 56 + 1 }px`;
  }

  get Format(): string {
    return this._format;
  }

  get Value(): Date {
    return this._value || this._now;
  }

  set Value(value: Date) {
    if (this._value === value) {
      return;
    }
    this._value = value;
    this._selectedHour = parseInt(moment(this.Value).format(this._formats[0]));
    this._selectedMinute = moment(this.Value).minutes();
    this._selectedSecond = moment(this.Value).seconds();
    this._selectedAMPM = moment(this.Value).format("a") == 'am' ? 0 : 1;
  }

  _scrollToSelected(instance: HTMLElement, index: number, duration: number = 0, unit: string): void {
    const _transIndex = this._translateIndex(index, unit);
    const currentOption = (instance.children[ 0 ].children[ _transIndex ] || instance.children[ 0 ].children[ 0 ]) as HTMLElement;
    this.scrollTo(instance, currentOption.offsetTop, duration);
  }

  // got from rc-timepicker
  scrollTo(element: HTMLElement, to: number, duration: number): void {
    if (duration <= 0) {
      element.scrollTop = to;
      return;
    }
    const difference = to - element.scrollTop;
    const perTick = difference / duration * 10;

    reqAnimFrame(() => {
      element.scrollTop = element.scrollTop + perTick;
      if (element.scrollTop === to) {
        return;
      }
      this.scrollTo(element, to, duration - 10);
    });
  }

  _selectHour(instance: HTMLElement, index: number, disabled: boolean): void {
    if (disabled) {
      return;
    }
    this._scrollToSelected(instance, index, 120, 'hour');
    this._selectedHour = index;
    this.Value = moment(this.Value).hour(index).toDate();
    this.onChange(this._value);
    this._buildMinutes();
    this._buildSeconds();
  }

  _selectMinute(instance: HTMLElement, index: number, disabled: boolean): void {
    if (disabled) {
      return;
    }
    this._scrollToSelected(instance, index, 120, 'minute');
    this._selectedMinute = index;
    this.Value = moment(this.Value).minute(index).toDate();
    this.onChange(this._value);
    this._buildSeconds();
  }

  _selectSecond(instance: HTMLElement, index: number, disabled: boolean): void {
    if (disabled) {
      return;
    }
    this._scrollToSelected(instance, index, 120, 'second');
    this._selectedSecond = index;
    this.Value = moment(this.Value).second(index).toDate();
    this.onChange(this._value);
  }

  _selectAMPM(instance: HTMLElement, index: number, disabled: boolean): void {
    if (disabled) {
      return;
    }
    this._scrollToSelected(instance, index, 120, 'second');
    this._selectedAMPM = index;
    const tempDateString = moment(this.Value).format("YYYY MM DD")+ ","+ moment(this.Value).format(this._format) +" "+this._ampmList[index].name;
    this.Value = moment(tempDateString).toDate();
    this.onChange(this._value);
  }

  _translateIndex(index: number, unit: string): number {
    if (!this.HideDisabledOptions) {
      if (unit === 'hour') {
        index = this._formats[0] === ("h" || "hh") ?  index-1 : index;
      }
      return index;
    }
    if (unit === 'hour') {
      const disabledHours = this.DisabledHours && this.DisabledHours();
      return this._calcIndex(disabledHours, index);
    } else if (unit === 'minute') {
      const disabledMinutes = this.DisabledMinutes && this.DisabledMinutes(this._selectedHour);
      return this._calcIndex(disabledMinutes, index);
    } else if (unit === 'second') {
      const disabledSeconds = this.DisabledSeconds && this.DisabledSeconds(this._selectedHour, this._selectedMinute);
      return this._calcIndex(disabledSeconds, index);
    }
  }

  _calcIndex(array: number[], index: number): number {
    if (array && array.length) {
      return index - array.reduce((pre, value) => {
        return pre + (value < index ? 1 : 0);
      }, 0);
    } else {
      return index;
    }

  }

  _initPosition(): void {
    this._selectedHour = parseInt(moment(this.Value).format(this._formats[0]))
    this._selectedMinute = moment(this.Value).minutes();
    this._selectedSecond = moment(this.Value).seconds();
    if (this._showHour) {
      this._scrollToSelected(this._hourListInstance.nativeElement, this._selectedHour, 0, 'hour');
    }
    if (this._showMinute) {
      this._scrollToSelected(this._minuteListInstance.nativeElement, this._selectedMinute, 0, 'minute');
    }
    if (this._showSecond) {
      this._scrollToSelected(this._secondListInstance.nativeElement, this._selectedSecond, 0, 'second');
    }
  }

  _buildTime(): void {
    this._buildHours();
    this._buildMinutes();
    this._buildSeconds();
    this._buildAMPM();
  }

  _buildHours(): void {
    this._hourList = [];
    var dayLength = this._formats[0] === ("h" || "hh" ) ?  11 : 23;
    for (let i = 0; i <= dayLength; i++) {
      this._hourList.push({
        disabled: this.DisabledHours && (this.DisabledHours().indexOf(i) !== -1),
        name    : "",
        index   : i
      });
      if(dayLength == 11){
        this._hourList[i]["name"] = moment().startOf('day').add(i+1,"hours").format(this._format[0])
        this._hourList[i]["index"] =  i+1
      }
      else{
        this._hourList[i]["name"] = i.toString().length === 0 ? (moment().startOf('day').format(this._format[0])) : (moment().startOf('day').add(i,"hours").format(this._format[0]))
      }
    }
  }

  _buildMinutes(): void {
    this._minuteList = [];
    for (let i = 0; i <= 59; i++) {
      this._minuteList.push({
        disabled: this.DisabledMinutes && (this.DisabledMinutes(this._selectedHour).indexOf(i) !== -1),
        name    :  i.toString().length === 1 ? ('0' + i) : ('' + i),
        index   : i
      });
    }
  }

  _buildSeconds(): void {
    this._secondList = [];
    for (let i = 0; i <= 59; i++) {
      this._secondList.push({
        disabled: this.DisabledSeconds && (this.DisabledSeconds(this._selectedHour, this._selectedMinute).indexOf(i) !== -1),
        name    : i.toString().length === 1 ? ('0' + i) : ('' + i),
        index   : i
      });
    }
  }

  _buildAMPM(): void {
    this._ampmList = [];
    this._ampmList.push({
      disabled: false,
      name    : "am",
      index   : 0
    });
    this._ampmList.push({
      disabled: false,
      name    : "pm",
      index   : 1
    });
  }

  writeValue(value: Date): void {
    this.Value = value;
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

  constructor(public _cdr: ChangeDetectorRef) {
  }

  ngOnInit(): void {
    this._buildTime();
  }
}
