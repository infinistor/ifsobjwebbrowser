/*
* Author : NG-ZORRO - ANT UI
* Github : https://github.com/NG-ZORRO/ng-zorro-antd
* Copyright Reserved : MIT LICENSE
* Modified : Ace Revox
*/
import {
  forwardRef,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  Output,
  SimpleChanges,
  ViewChild,
  ViewEncapsulation,
} from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { Observable } from 'rxjs/Observable';
import { Subscription } from 'rxjs/Subscription';
import { fromEvent } from 'rxjs/observable/fromEvent';
import { merge } from 'rxjs/observable/merge';
import { distinctUntilChanged } from 'rxjs/operators/distinctUntilChanged';
import { filter } from 'rxjs/operators/filter';
import { map } from 'rxjs/operators/map';
import { pluck } from 'rxjs/operators/pluck';
import { takeUntil } from 'rxjs/operators/takeUntil';
import { tap } from 'rxjs/operators/tap';
import { toBoolean } from '../util/convert';
import { Marks} from './slider-marks.component';
import { SliderService } from './slider.service';

export type SliderValue = number[] | number;

export class SliderHandle {
  offset: number;
  value: number;
  active: boolean;
}

@Component({
  selector     : 'pg-slider',
  encapsulation: ViewEncapsulation.None,
  providers    : [ {
    provide    : NG_VALUE_ACCESSOR,
    useExisting: forwardRef(() => pgSliderComponent),
    multi      : true
  } ],
  template     : `
    <div #slider [ngClass]="classMap" >
      <div class="pg-slider-rail"></div>
      <pg-slider-track
        ClassName="{{prefixCls}}-track"
        [Vertical]="Vertical"
        [Included]="Included"
        [Offset]="track.offset"
        [Length]="track.length"
      ></pg-slider-track>
      <pg-slider-step *ngIf="marksArray"
        PrefixCls="{{prefixCls}}"
        [Vertical]="Vertical"
        [LowerBound]="bounds.lower"
        [UpperBound]="bounds.upper"
        [MarksArray]="marksArray"
        [Included]="Included"
      ></pg-slider-step>
      <pg-slider-handle
        *ngFor="let handle of handles;"
        ClassName="{{prefixCls}}-handle"
        [Vertical]="Vertical"
        [Offset]="handle.offset"
        [Value]="handle.value"
        [Active]="handle.active"
        [TipFormatter]="TipFormatter"
      ></pg-slider-handle>
      <pg-slider-marks *ngIf="marksArray"
        ClassName="{{prefixCls}}-mark"
        [Vertical]="Vertical"
        [Min]="Min"
        [Max]="Max"
        [LowerBound]="bounds.lower"
        [UpperBound]="bounds.upper"
        [MarksArray]="marksArray"
        [Included]="Included"
      ></pg-slider-marks>
    </div>
  `,
  styleUrls    : [
    './slider.scss'
  ]
})
export class pgSliderComponent implements ControlValueAccessor, OnInit, OnChanges, OnDestroy {
  _color:string = "";
  _toolTipForce: boolean;
  // Debugging
  @Input() DebugId: number | string = null; // set this id will print debug informations to console

  // Dynamic property settings
  @Input()
  set Disabled(value: boolean) {
    this._disabled = toBoolean(value);
  }

  get Disabled(): boolean {
    return this._disabled;
  }

  // Static configurations (properties that can only specify once)
  @Input() Step = 1;
  @Input() Marks: Marks = null;
  @Input() Min = 0;
  @Input() Max = 100;
  @Input() DefaultValue: SliderValue = null;
  @Input() Tooltip:boolean = false;
  @Input() TipFormatter: (value: number) => string;
  @Output() OnAfterChange = new EventEmitter<SliderValue>();

  @Input()
  set Vertical(value: boolean) {
    this._vertical = toBoolean(value);
  }

  get Vertical(): boolean {
    return this._vertical;
  }

  @Input()
  set TooltipForceVisiblity(value: boolean) {
    //this._showHandleTooltip(this.Range ? this.activeValueIndex : 0);
    this._toolTipForce = value;
  }

  @Input()
  set Range(value: boolean) {
    this._range = toBoolean(value);
  }

  get Range(): boolean {
    return this._range;
  }

  @Input()
  set Dots(value: boolean) {
    this._dots = toBoolean(value);
  }

  get Dots(): boolean {
    return this._dots;
  }

  @Input()
  set Included(value: boolean) {
    this._included = toBoolean(value);
  }

  get Included(): boolean {
    return this._included;
  }

  @Input()
  set Color(value: string) {
    this._color = value;
  }

  get Color(): string {
    return this._color;
  }

  // Inside properties
  private _disabled = false;
  private _dots = false;
  private _included = true;
  private _range = false;
  private _vertical = false;

  value: SliderValue = null; // CORE value state
  @ViewChild('slider', { static: true }) slider: ElementRef;
  sliderDOM: HTMLDivElement;
  cacheSliderStart: number = null;
  cacheSliderLength: number = null;
  prefixCls = 'pg-slider';
  classMap: object;
  activeValueIndex: number = null; // Current activated handle's index ONLY for range=true
  track: any = { offset: null, length: null }; // Track's offset and length
  handles: SliderHandle[]; // Handles' offset
  marksArray: Marks[]; // "marks" in array type with more data & FILTER out the invalid mark
  bounds: any = { lower: null, upper: null }; // now for pg-slider-step
  onValueChange: (value: SliderValue) => void; // Used by ngModel. BUG: onValueChange() will not success to effect the "value" variable ( [(ngModel)]="value" ) when the first initializing, except using "nextTick" functionality (MAY angular2's problem ?)
  isDragging = false; // Current dragging state

  // Events observables & subscriptions
  dragstart$: Observable<number>;
  dragmove$: Observable<number>;
  dragend$: Observable<Event>;
  dragstart_: Subscription;
  dragmove_: Subscription;
  dragend_: Subscription;

  // |--------------------------------------------------------------------------------------------
  // | value accessors & ngModel accessors
  // |--------------------------------------------------------------------------------------------

  setValue(val: SliderValue, isWriteValue: boolean = false): void {
    if (isWriteValue) { // [ngModel-writeValue]: Formatting before setting value, always update current value, but trigger onValueChange ONLY when the "formatted value" not equals "input value"
      this.value = this.formatValue(val);
      this.log(`[ngModel:setValue/writeValue]Update track & handles`);
      this.updateTrackAndHandles();
      // if (!this.isValueEqual(this.value, val)) {
      //   this.log(`[ngModel:setValue/writeValue]onValueChange`, val);
      //   if (this.onValueChange) { // NOTE: onValueChange will be unavailable when writeValue() called at the first time
      //     this.onValueChange(this.value);
      //   }
      // }
    } else { // [Normal]: setting value, ONLY check changed, then update and trigger onValueChange
      if (!this.isValueEqual(this.value, val)) {
        this.value = val;
        this.log(`[Normal:setValue]Update track & handles`);
        this.updateTrackAndHandles();
        this.log(`[Normal:setValue]onValueChange`, val);
        if (this.onValueChange) { // NOTE: onValueChange will be unavailable when writeValue() called at the first time
          this.onValueChange(this.value);
        }
      }
    }
  }

  getValue(cloneAndSort: boolean = false): SliderValue {
    // TODO: using type guard, remove type cast
    if (cloneAndSort && this.Range) { // clone & sort range values
      return this.utils.cloneArray(this.value as number[]).sort((a, b) => a - b);
    }
    return this.value;
  }

  // clone & sort current value and convert them to offsets, then return the new one
  getValueToOffset(value?: SliderValue): SliderValue {
    let normalizedValue = value;
    if (typeof normalizedValue === 'undefined') {
      normalizedValue = this.getValue(true);
    }
    // TODO: using type guard, remove type cast
    return this.Range ?
      (normalizedValue as number[]).map(val => this.valueToOffset(val)) :
      this.valueToOffset(normalizedValue as number);
  }

  writeValue(val: SliderValue): void { // NOTE: writeValue will be called twice when initialized (may BUG? see: https://github.com/angular/angular/issues/14988), here we just ignore the first inited(the first the onValueChange will not registered)
    if (typeof this.onValueChange !== 'function') {
      return;
    } // ignore the first initial call
    this.log(`[ngModel/writeValue]current writing value = `, val);
    this.setValue(val, true);
  }

  registerOnChange(fn: (value: SliderValue) => void): void {
    this.onValueChange = fn;
  }

  registerOnTouched(fn: () => void): void { }

  setDisabledState(isDisabled: boolean): void {
    this.Disabled = isDisabled;
    this.toggleDragDisabled(isDisabled);
    this.setClassMap();
  }

  // |--------------------------------------------------------------------------------------------
  // | Lifecycle hooks
  // |--------------------------------------------------------------------------------------------

  constructor(private utils: SliderService) {
  }

  // initialize event binding, class init, etc. (called only once)
  ngOnInit(): void {
    // initial checking
    this.checkValidValue(this.DefaultValue); // check DefaultValue
    // default handles
    this.handles = this._generateHandles(this.Range ? 2 : 1);
    // initialize
    this.sliderDOM = this.slider.nativeElement;
    if (this.getValue() === null) {
      this.setValue(this.formatValue(null));
    } // init with default value
    this.marksArray = this.Marks === null ? null : this.toMarksArray(this.Marks);
    // event bindings
    this.createDrag();
    // initialize drag's disabled status
    this.toggleDragDisabled(this.Disabled);
    // the first time to init classes
    this.setClassMap();
    if(this._toolTipForce){
      this._showHandleTooltip(this.Range ? this.activeValueIndex : 0);
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    const { Disabled, Marks } = changes;
    if (Disabled && !Disabled.firstChange) {
      this.toggleDragDisabled(Disabled.currentValue);
      this.setClassMap();
    } else if (Marks && !Marks.firstChange) {
      this.marksArray = this.Marks ? this.toMarksArray(this.Marks) : null;
    }
  }

  ngOnDestroy(): void {
    this.unsubscribeDrag();
  }

  // |--------------------------------------------------------------------------------------------
  // | Basic flow functions
  // |--------------------------------------------------------------------------------------------

  setClassMap(): void {
    this.classMap = {
      [this.prefixCls]                : true,
      [this._color]                : true,
      [`${this.prefixCls}-disabled`]  : this.Disabled,
      [`${this.prefixCls}-vertical`]  : this.Vertical,
      [`${this.prefixCls}-with-marks`]: this.marksArray ? this.marksArray.length : 0
    };
  }

  // find the cloest value to be activated (only for range = true)
  setActiveValueIndex(pointerValue: number): void {
    if (this.Range) {
      let minimal: any = null;
      let gap;
      let activeIndex;
      // TODO: using type guard, remove type cast
      (this.getValue() as number[]).forEach((val, index) => {
        gap = Math.abs(pointerValue - val);
        if (minimal === null || gap < minimal) {
          minimal = gap;
          activeIndex = index;
        }
      });
      this.activeValueIndex = activeIndex;
    }
  }

  setActiveValue(pointerValue: number): void {
    if (this.Range) {
      // TODO: using type guard, remove type cast
      const newValue = this.utils.cloneArray(this.value as number[]);
      newValue[ this.activeValueIndex ] = pointerValue;
      this.setValue(newValue);
    } else {
      this.setValue(pointerValue);
    }
  }

  updateTrackAndHandles(): void {
    const value: SliderValue = this.getValue();
    const offset: SliderValue = this.getValueToOffset(value);
    const valueSorted: SliderValue = this.getValue(true);
    const offsetSorted: SliderValue = this.getValueToOffset(valueSorted);
    const boundParts = this.Range ? valueSorted as number[] : [ 0, valueSorted ];
    const trackParts = this.Range ? [(offsetSorted as number[])[0], (offsetSorted as number[])[1] - (offsetSorted as number[])[ 0 ] ] : [ 0, offsetSorted ];

    this.handles.forEach((handle, index) => {
      handle.offset = this.Range ? (offset as number[])[index] : (offset as number);
      handle.value = this.Range ? (value as number[])[index] : (value as number);
    });
    [ this.bounds.lower, this.bounds.upper ] = boundParts;
    [ this.track.offset, this.track.length ] = trackParts;
  }

  toMarksArray(marks: any): Marks[] {
    const marksArray: any = [];
    for (const key in marks) {
      const mark = marks[ key ];
      const val = typeof key === 'number' ? key : parseFloat(key);
      if (val < this.Min || val > this.Max) {
        continue;
      }
      marksArray.push({ value: val, offset: this.valueToOffset(val), config: mark });
    }
    return marksArray;
  }

  // |--------------------------------------------------------------------------------------------
  // | Event listeners & bindings
  // |--------------------------------------------------------------------------------------------

  onDragStart(value: number): void {
    this.log('[onDragStart]dragging value = ', value);
    this.toggleDragMoving(true);
    // cache DOM layout/reflow operations
    this.cacheSliderProperty();
    // trigger drag start
    this.setActiveValueIndex(value);
    this.setActiveValue(value);
    // Tooltip visibility of handles
    if(this.Tooltip){
      this._showHandleTooltip(this.Range ? this.activeValueIndex : 0);
    }
  }

  onDragMove(value: number): void {
    this.log('[onDragMove]dragging value = ', value);
    // trigger drag moving
    this.setActiveValue(value);
  }

  onDragEnd(): void {
    this.log('[onDragEnd]');
    this.toggleDragMoving(false);
    this.OnAfterChange.emit(this.getValue(true));
    // remove cache DOM layout/reflow operations
    this.cacheSliderProperty(true);
    // Hide all tooltip
    this._hideAllHandleTooltip();
  }

  createDrag(): void {
    const sliderDOM   = this.sliderDOM;
    const orientField = this.Vertical ? 'pageY' : 'pageX';
    // TODO: using named interface
    const mouse  = {
      start: 'mousedown', move: 'mousemove', end: 'mouseup',
      pluckKey                                  : [ orientField ]
    } as { start: string, move: string, end: string, pluckKey: string[], filter(e: Event): boolean, startPlucked$: Observable<number>, end$: Observable<Event>, moveResolved$: Observable<number> } ;
    const touch = {
      start: 'touchstart', move: 'touchmove', end: 'touchend',
      pluckKey                                   : [ 'touches', '0', orientField ],
      filter                                     : (e: MouseEvent | TouchEvent) => !this.utils.isNotTouchEvent(e as TouchEvent)
    } as { start: string, move: string, end: string, pluckKey: string[], filter(e: Event): boolean, startPlucked$: Observable<number>, end$: Observable<Event>, moveResolved$: Observable<number> } ;
    // make observables
    [ mouse, touch ].forEach(source => {
      // TODO: remove any
      // TODO: filterFunc doesn't match filter in touch, should be checked
      /* tslint:disable-next-line:no-any */
      const { start, move, end, pluckKey, filterFunc = (() => true) } = source as any;
      // start
      source.startPlucked$ = fromEvent(sliderDOM, start).pipe(
        filter(filterFunc),
        tap(this.utils.pauseEvent),
        pluck(...pluckKey),
        map((position: number) => this.findClosestValue(position))
      );
      // end
      source.end$ = fromEvent(document, end);
      // resolve move
      source.moveResolved$ = fromEvent(document, move).pipe(
        filter(filterFunc),
        tap(this.utils.pauseEvent),
        pluck(...pluckKey),
        distinctUntilChanged(),
        map((position: number) => this.findClosestValue(position)),
        distinctUntilChanged(),
        takeUntil(source.end$),
      );
      // merge to become moving
      // source.move$ = source.startPlucked$.mergeMapTo(source.moveResolved$);
    });
    // merge mouse and touch observables
    this.dragstart$ = merge(mouse.startPlucked$, touch.startPlucked$);
    // this.dragmove$ = Observable.merge(mouse.move$, touch.move$);
    this.dragmove$ = merge(mouse.moveResolved$, touch.moveResolved$);
    this.dragend$ = merge(mouse.end$, touch.end$);
  }

  subscribeDrag(periods: string[] = [ 'start', 'move', 'end' ]): void {
    this.log('[subscribeDrag]this.dragstart$ = ', this.dragstart$);
    if (periods.indexOf('start') !== -1 && this.dragstart$ && !this.dragstart_) {
      this.dragstart_ = this.dragstart$.subscribe(this.onDragStart.bind(this));
    }

    if (periods.indexOf('move') !== -1 && this.dragmove$ && !this.dragmove_) {
      this.dragmove_ = this.dragmove$.subscribe(this.onDragMove.bind(this));
    }

    if (periods.indexOf('end') !== -1 && this.dragend$ && !this.dragend_) {
      this.dragend_ = this.dragend$.subscribe(this.onDragEnd.bind(this));
    }
  }

  unsubscribeDrag(periods: string[] = [ 'start', 'move', 'end' ]): void {
    this.log('[unsubscribeDrag]this.dragstart_ = ', this.dragstart_);
    if (periods.indexOf('start') !== -1 && this.dragstart_) {
      this.dragstart_.unsubscribe();
      this.dragstart_ = null;
    }

    if (periods.indexOf('move') !== -1 && this.dragmove_) {
      this.dragmove_.unsubscribe();
      this.dragmove_ = null;
    }

    if (periods.indexOf('end') !== -1 && this.dragend_) {
      this.dragend_.unsubscribe();
      this.dragend_ = null;
    }
  }

  toggleDragMoving(movable: boolean): void {
    const periods = [ 'move', 'end' ];
    if (movable) {
      this.isDragging = true;
      this.subscribeDrag(periods);
    } else {
      this.isDragging = false;
      this.unsubscribeDrag(periods);
    }
  }

  toggleDragDisabled(disabled: boolean): void {
    if (disabled) {
      this.unsubscribeDrag();
    } else {
      this.subscribeDrag([ 'start' ]);
    }
  }

  // |--------------------------------------------------------------------------------------------
  // | Util functions (tools)
  // |--------------------------------------------------------------------------------------------

  // find the closest value depend on pointer's position
  findClosestValue(position: number): number {
    const sliderStart = this.getSliderStartPosition();
    const sliderLength = this.getSliderLength();
    const ratio  = this.utils.correctNumLimit((position - sliderStart) / sliderLength, 0, 1);
    const val = (this.Max - this.Min) * (this.Vertical ? 1 - ratio : ratio) + this.Min;
    const points = (this.Marks === null ? [] : Object.keys(this.Marks).map(parseFloat));
    // push closest step
    if (this.Step !== null && !this.Dots) {
      const closestOne = Math.round(val / this.Step) * this.Step;
      points.push(closestOne);
    }
    // calculate gaps
    const gaps = points.map(point => Math.abs(val - point));
    const closest = points[ gaps.indexOf(Math.min(...gaps)) ];
    // return the fixed
    return this.Step === null ? closest :
      parseFloat(closest.toFixed(this.utils.getPrecision(this.Step)));
  }

  valueToOffset(value: number): number {
    return this.utils.valueToOffset(this.Min, this.Max, value);
  }

  getSliderStartPosition(): number {
    if (this.cacheSliderStart !== null) {
      return this.cacheSliderStart;
    }
    const offset = this.utils.getElementOffset(this.sliderDOM);
    return this.Vertical ? offset.top : offset.left;
  }

  getSliderLength(): number {
    if (this.cacheSliderLength !== null) {
      return this.cacheSliderLength;
    }
    const sliderDOM = this.sliderDOM;
    return this.Vertical ?
      sliderDOM.clientHeight : sliderDOM.clientWidth;
  }

  // cache DOM layout/reflow operations for performance (may not necessary?)
  cacheSliderProperty(remove: boolean = false): void {
    this.cacheSliderStart = remove ? null : this.getSliderStartPosition();
    this.cacheSliderLength = remove ? null : this.getSliderLength();
  }

  formatValue(value: SliderValue): SliderValue { // NOTE: will return new value
    let res = value;
    if (!this.checkValidValue(value)) { // if empty, use default value
      res = this.DefaultValue === null ?
        (this.Range ? [ this.Min, this.Max ] : this.Min) : this.DefaultValue;
    } else { // format
      // TODO: using type guard, remove type cast
      res = this.Range ?
        (value as number[]).map(val => this.utils.correctNumLimit(val, this.Min, this.Max)) :
        this.utils.correctNumLimit(value as number, this.Min, this.Max);
    }
    return res;
  }

  // check if value is valid and throw error if value-type/range not match
  checkValidValue(value: SliderValue): boolean {
    const range = this.Range;
    if (value === null || value === undefined) {
      return false;
    } // it's an invalid value, just return
    const isArray = Array.isArray(value);
    if (!Array.isArray(value)) {
      let parsedValue: number =  value;
      if (typeof value !== 'number') {
        parsedValue = parseFloat(value);
      }
      if (isNaN(parsedValue)) {
        return false;
      } // it's an invalid value, just return
    }
    if (isArray !== !!range) { // value type not match
      throw new Error(`The "Range" can't match the "Value"'s type, please check these properties: "Range", "Value", "DefaultValue".`);
    }
    return true;
  }

  isValueEqual(value: SliderValue, val: SliderValue): boolean {
    if (typeof value !== typeof val) {
      return false;
    }
    if (Array.isArray(value)) {
      const len = value.length;
      for (let i = 0; i < len; i++) {
        if (value[i] !== (val as number[])[i]) {
          return false;
        }
      }
      return true;
    } else {
      return value === val;
    }
  }

  // print debug info
  // TODO: should not kept in component
  /* tslint:disable-next-line:no-any */
  log(...messages: any[]): void {
    if (this.DebugId !== null) {
      const args = [ `[pg-slider][#${this.DebugId}] ` ].concat(Array.prototype.slice.call(arguments));
      console.log.apply(null, args);
    }
  }

  // Show one handle's tooltip and hide others'
  private _showHandleTooltip(handleIndex: number = 0): void {
    this.handles.forEach((handle, index) => {
      this.handles[ index ].active = index === handleIndex;
    });
  }

  private _hideAllHandleTooltip(): void {
    if(!this._showHandleTooltip)
      this.handles.forEach(handle => handle.active = false);
  }

  private _generateHandles(amount: number): SliderHandle[] {
    const handles: SliderHandle[] = [];
    for (let i = 0; i < amount; i++) {
      handles.push({ offset: null, value: null, active: false });
    }
    return handles;
  }

}
