/*
Author : NG-ZORRO
Profile : https://github.com/NG-ZORRO
Repository : https://github.com/NG-ZORRO/ng-zorro-antd
version : 
Modifed : Yes
*/
import {
  Component,
  ContentChild,
  ElementRef,
  EventEmitter,
  HostBinding,
  Input,
  OnInit,
  Output,
  TemplateRef,
  ViewEncapsulation,
} from '@angular/core';

import * as moment from 'moment';
import { Moment } from 'moment';
import { toBoolean } from '../util/convert';

export interface MonthInterface {
  index: number;
  name: string;
  year: number;
  isCurrentMonth: boolean;
  isSelectedMonth: boolean;
  disabled: boolean;
}

export type QuartersType = MonthInterface[];

export interface DayInterface {
  number: number;
  isLastMonth: boolean;
  isNextMonth: boolean;
  isCurrentDay: boolean;
  isSelectedDay: boolean;
  isInRange?: boolean;
  title: string;
  date: Moment;
  disabled: boolean;
  firstDisabled: boolean;
  lastDisabled: boolean;
}

export interface WeekInterface {
  days: DayInterface[];
}

export enum RangePart { Start = 0, End = 1 }

@Component({
  selector     : 'pg-calendar-view',
  encapsulation: ViewEncapsulation.None,
  templateUrl:'calendar.component.html',
  styleUrls    : [
    'calendar.scss'
  ]
})
export class pgCalendarViewComponent implements OnInit {
  //private _clearTime = true;
  private _datePicker = false;
  private _fullScreen = true;
  private _showHeader = true;
  private _isRange = false;

  _el: HTMLElement;
  _weeksCalendar: WeekInterface[] = [];
  _quartersCalendar: QuartersType[] = [];
  _listOfWeekName: string[] = [];
  _listOfMonthName: string[] = [];
  _listOfYearName: number[] = [];
  _disabledDate: (value: Date) => boolean;
  _yearUnit = '0';
  _monthUnit = '0';
  _showMonth = moment(new Date()).month();
  _showYear = moment(new Date()).year();
  _value: Date = new Date();
  _rangeValue: Date[] = [null, null];
  _hoveringSelectValue: Date;
  _locale = 'en';
  @ContentChild('dateCell', { static: true }) dateCell: TemplateRef<void>;
  @ContentChild('monthCell', { static: true }) monthCell: TemplateRef<void>;

  @Output() ClickDay: EventEmitter<DayInterface> = new EventEmitter();
  @Output() ClickMonth: EventEmitter<MonthInterface> = new EventEmitter();
  @Output() HoverDay: EventEmitter<DayInterface> = new EventEmitter();
  @Input() ClearTime = true;
  @Input() Mode = 'month';

  @Input()
  set FullScreen(value: boolean) {
    this._fullScreen = toBoolean(value);
  }

  get FullScreen(): boolean {
    return this._fullScreen;
  }

  @Input()
  set ShowHeader(value: boolean) {
    this._showHeader = toBoolean(value);
  }

  get ShowHeader(): boolean {
    return this._showHeader;
  }

  @Input()
  set IsRange(value: boolean) {
    this._isRange = toBoolean(value);
  }

  get IsRange(): boolean {
    return this._isRange;
  }

  @Input()
  set DisabledDate(value: (value: Date) => boolean) {
    this._disabledDate = value;
    this._buildCalendar();
  }

  get DisabledDate(): (value: Date) => boolean {
    return this._disabledDate;
  }

  @Input()
  @HostBinding('class.pg-patch-full-height')
  set DatePicker(value: boolean) {
    this._datePicker = toBoolean(value);
  }

  get DatePicker(): boolean {
    return this._datePicker;
  }

  @Input()
  set Value(value: Date) {
    if (this._value === value) {
      return;
    }
    this._value = value || new Date();
    this._showMonth = moment(this._value).month();
    this._showYear = moment(this._value).year();
    this._buildCalendar();
  }

  get Value(): Date {
    return this._value || new Date();
  }

  @Input()
  get RangeValue(): Date[] {
    return this._rangeValue;
  }

  set RangeValue(value: Date[]) {
    this._rangeValue = value;
    this._buildCalendar();
  }

  @Input()
  get HoveringSelectValue(): Date {
    return this._hoveringSelectValue;
  }

  set HoveringSelectValue(value: Date) {
    if (this._hoveringSelectValue === value) {
      return;
    }
    this._hoveringSelectValue = value;
    this._buildCalendar();
  }

  @Input()
  set ShowYear(value: number) {
    this._showYear = value;
    this._buildCalendar();
  }

  get ShowYear(): number {
    return this._showYear;
  }

  @Input()
  set ShowMonth(value: number) {
    this._showMonth = value;
    this._buildCalendar();
  }

  get ShowMonth(): number {
    return this._showMonth;
  }

  @Input()
  set Locale(value: string) {
    this._locale = value;
    moment.locale(this._locale);
  }

  get Locale(): string {
    return this._locale;
  }

  _removeTime(date: Moment): Moment {
    if (this.ClearTime) {
      return date.hour(0).minute(0).second(0).millisecond(0);
    } else {
      return date;
    }
  }

  _clickDay($event: MouseEvent, day: DayInterface): void {
    $event.preventDefault();
    $event.stopPropagation();
    if (day.disabled) {
      return;
    }
    this.ClickDay.emit(day);
  }

  _clickMonth($event: MouseEvent, month: MonthInterface): void {
    $event.preventDefault();
    $event.stopPropagation();
    if (month.disabled) {
      return;
    }
    this.ClickMonth.emit(month);
  }

  _onDayHover($event: MouseEvent, day: DayInterface): void {
    $event.preventDefault();
    $event.stopPropagation();
    if (day.disabled || day.date.isSame(this._hoveringSelectValue)) {
      return;
    }
    this.HoverDay.emit(day);
  }

  _isSelectedDay(date: Moment, month: Moment): boolean {
    if (this.IsRange) {
      return (date.isSame(this._rangeValue[RangePart.Start], 'day')
        || date.isSame(this._rangeValue[RangePart.End], 'day')
        || date.isSame(this._hoveringSelectValue, 'day'))
        && date.month() === month.month();
    } else {
      return date.isSame(this.Value, 'day');
    }
  }

  _isInRange(date: Moment, month: Moment): boolean {
    let ghostDate: Date;
    if (this.IsRange && date.month() === month.month()) {
      if (this._rangeValue.every(e => moment(e).isValid())) {
        return date.isBetween.apply(date, this._rangeValue);
      }
      ghostDate = this._rangeValue.find(e => moment(e).isValid());
      if (ghostDate && this._hoveringSelectValue) {
        const start = moment.min(moment(ghostDate), moment(this._hoveringSelectValue)).toDate();
        const end = moment.max(moment(ghostDate), moment(this._hoveringSelectValue)).toDate();
        return date.isBetween(start, end);
      }
      return false;
    } else {
      return false;
    }
  }

  _buildMonth(d: Moment): WeekInterface[] {
    const weeks: WeekInterface[] = [];
    const _rawDate = this._removeTime(d);
    const start = _rawDate.clone().date(1).day(0);
    const month = _rawDate.clone();
    let done = false;
    const date = start.clone();
    //let monthIndex = date.month();
    let count = 0;
    while (!done) {
      weeks.push({ days: this._buildWeek(date.clone(), month) });
      date.add(1, 'w');
      done = count++ > 4;
      //monthIndex = date.month();
    }
    return weeks;
  }

  _buildWeek(firstDate: Moment, month: Moment): DayInterface[] {
    let date = firstDate;
    const days: DayInterface[] = [];
    for (let i = 0; i < 7; i++) {
      days.push({
        number       : date.date(),
        isLastMonth  : date.month() < month.month(),
        isNextMonth  : date.month() > month.month(),
        isCurrentDay : date.isSame(new Date(), 'day'),
        isSelectedDay: this._isSelectedDay(date, month),
        isInRange    : this._isInRange(date, month),
        title        : date.format('YYYY-MM-DD'),
        date,
        disabled     : this.DisabledDate && this.DisabledDate(date.toDate()),
        firstDisabled: this.DisabledDate && this.DisabledDate(date.toDate()) && (date.day() === 0 || (date.day() !== 0 && this.DisabledDate && !this.DisabledDate(date.clone().subtract(1, 'day').toDate()))),
        lastDisabled : this.DisabledDate && this.DisabledDate(date.toDate()) && (date.day() === 6 || (date.day() !== 6 && this.DisabledDate && !this.DisabledDate(date.clone().add(1, 'day').toDate())))
      });
      date = date.clone();
      date.add(1, 'd');
    }
    return days;
  }

  _buildYears(date: Moment): MonthInterface[][] {
    const quarters: MonthInterface[][] = [];
    let months: MonthInterface[] = [];
    for (let i = 0; i < 12; i++) {
      months.push({
        index          : i,
        name           : this._listOfMonthName[ i ],
        year           : date.year(),
        isCurrentMonth : moment(new Date()).month() === i && date.isSame(new Date(), 'year'),
        isSelectedMonth: this._showMonth === i,
        disabled       : this.DisabledDate && this.DisabledDate(date.month(i).toDate())
      });
      if ((i + 1) % 3 === 0) {
        quarters.push(months);
        months = [];
      }
    }
    return quarters;
  }

  _buildCalendar(): void {
    moment.locale(this._locale);

    this._listOfYearName = this._generateYears(this._showYear);
    this._listOfWeekName = moment.weekdaysMin();
    this._listOfMonthName = moment.monthsShort();
    const date = moment(this.Value).year(this._showYear).month(this._showMonth);
    this._weeksCalendar = this._buildMonth(date);
    this._quartersCalendar = this._buildYears(date);
  }

  _generateYears(year: number): number[] {
    const listOfYears: number[] = [];
    for (const i of Array.from(Array(20).keys())) {
      listOfYears.push(i - 10 + year);
    }
    return listOfYears;
  }

  constructor(private _elementRef: ElementRef) {
    this._el = this._elementRef.nativeElement;
  }

  ngOnInit(): void {
    this._buildCalendar();
  }
}
