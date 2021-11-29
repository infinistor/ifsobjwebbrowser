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
/**
 * complex but work well
 * TODO: rebuild latter
 */
import { DOWN_ARROW, ENTER, TAB } from '@angular/cdk/keycodes';
import { CdkConnectedOverlay, ConnectedOverlayPositionChange } from '@angular/cdk/overlay';
import {
  forwardRef,
  AfterContentChecked,
  AfterContentInit,
  Component,
  ElementRef,
  EventEmitter,
  HostListener,
  Input,
  OnInit,
  Output,
  Renderer2,
  ViewChild,
  ViewEncapsulation,
} from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { dropDownAnimation } from '../../animations/dropdown-animations';
import { tagAnimation } from '../../animations/tag-animations';
//import { LocaleService } from '../locale/index';
import { toBoolean } from '../util/convert';
import { pgOptionComponent } from './option.component';
import { OptionPipe } from './option.pipe';

@Component({
  selector     : 'pg-select-fx',
  encapsulation: ViewEncapsulation.None,
  providers    : [
    {
      provide    : NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => pgSelectFXComponent),
      multi      : true
    }
  ],
  animations   : [
    dropDownAnimation,
    tagAnimation
  ],
  templateUrl:'./select.component.html',
  styleUrls    : [
    './style/index.scss',
  ]
})
export class pgSelectFXComponent implements OnInit, AfterContentInit, AfterContentChecked, ControlValueAccessor {
  private _allowClear = false;
  private _disabled = false;
  private _isTags = false;
  private _isMultiple = false;
  private _keepUnListOptions = false;
  _el: HTMLElement;
  _isOpen = false;
  _prefixCls = 'pg-select';
  _classList: string[] = [];
  _dropDownClassMap: any;
  _dropDownPrefixCls = `${this._prefixCls}-dropdown`;
  _selectionClassMap: any;
  _selectionPrefixCls = `${this._prefixCls}-selection`;
  _size: string;
  _value: string[] | string;
  _placeholder = 'placeholder';
  _notFoundContent = "No Content";
  _searchText = '';
  _triggerWidth = 0;
  _selectedOption: pgOptionComponent;
  _operatingMultipleOption: pgOptionComponent;
  _selectedOptions: Set<pgOptionComponent> = new Set();
  _options: pgOptionComponent[] = [];
  _cacheOptions: pgOptionComponent[] = [];
  _filterOptions: pgOptionComponent[] = [];
  _tagsOptions: pgOptionComponent[] = [];
  _activeFilterOption: pgOptionComponent;
  _isMultiInit = false;
  _dropDownPosition: 'top' | 'center' | 'bottom' = 'bottom';
  _composing = false;
  _mode: any;
  _backDropStyles = {
    "transform":'scale3d(1,1,1)'
  }
  _openBackdrop = false
  // ngModel Access
  onChange: (value: string | string[]) => void = () => null;
  onTouched: () => void = () => null;
  @ViewChild('searchInput', { static: false }) searchInput: ElementRef;
  @ViewChild('trigger', { static: false }) trigger: ElementRef;
  @ViewChild('dropdownUl', { static: false }) dropdownUl: ElementRef;
  @ViewChild('csOptions', { static: false }) csOptions: ElementRef;
  @ViewChild('placeHolder', { static: false }) placeHolder: ElementRef;
  @Output() SearchChange: EventEmitter<string> = new EventEmitter();
  @Output() OpenChange: EventEmitter<boolean> = new EventEmitter();
  @Output() ScrollToBottom: EventEmitter<boolean> = new EventEmitter();
  @Input() Filter = true;
  @Input() MaxMultiple = Infinity;
  @ViewChild(CdkConnectedOverlay, { static: false }) _cdkOverlay: CdkConnectedOverlay;

  @Input()
  set AllowClear(value: boolean) {
    this._allowClear = toBoolean(value);
  }

  get AllowClear(): boolean {
    return this._allowClear;
  }

  @Input()
  set KeepUnListOptions(value: boolean) {
    this._keepUnListOptions = toBoolean(value);
  }

  get KeepUnListOptions(): boolean {
    return this._keepUnListOptions;
  }

  @Input()
  set Mode(value: string) {
    this._mode = value;
  }

  @Input()
  set Multiple(value: boolean) {
    this._isMultiple = toBoolean(value);
  }

  get Multiple(): boolean {
    return this._isMultiple;
  }

  @Input()
  set PlaceHolder(value: string) {
    this._placeholder = value;
  }

  get PlaceHolder(): string {
    return this._placeholder;
  }

  @Input()
  set NotFoundContent(value: string) {
    this._notFoundContent = value;
  }

  get NotFoundContent(): string {
    return this._notFoundContent;
  }

  @Input()
  set Size(value: string) {
    if (value === 'large')
      value = 'lg';
    if (value === 'small')
      value = 'sm';
    this._size = value;
    this.setClassMap();
  }

  get Size(): string {
    return this._size;
  }

  @Input()
  set Tags(value: boolean) {
    const isTags = toBoolean(value);
    this._isTags = isTags;
    this.Multiple = isTags;
  }

  get Tags(): boolean {
    return this._isTags;
  }

  @Input()
  set Disabled(value: boolean) {
    this._disabled = toBoolean(value);
    this.closeDropDown();
    this.setClassMap();
  }

  get Disabled(): boolean {
    return this._disabled;
  }

  @Input()
  set Open(value: boolean) {
    const isOpen = toBoolean(value);

    if (this._isOpen === isOpen) {
      setTimeout(() => {
        this._backDropStyles = {
          "transform":'scale3d(1,1,1)'
        }
      });
      return;
    }
    if (isOpen) {
      this.scrollToActive();
      this._setTriggerWidth();

      var contentHeight = this.csOptions.nativeElement.offsetHeight;
      var originalHeight = this.placeHolder.nativeElement.offsetHeight;

      //var contentWidth = this.csOptions.nativeElement.offsetWidth;
      //var originalWidth = this.placeHolder.nativeElement.offsetWidth;

      var scaleV = contentHeight / originalHeight;
      //var scaleH = (contentWidth > originalWidth) ? contentWidth / originalWidth : 1.05;
      setTimeout(() => {
        this._openBackdrop = true;
        this._backDropStyles = {
          "transform":'scale3d(' + 1 + ', ' + scaleV + ', 1)'
        }
      });
    }
    this._isOpen = isOpen;
    this.OpenChange.emit(this._isOpen);
    this.setClassMap();
    if (this._isOpen) {
      setTimeout(() => {
        this.checkDropDownScroll();
      });
    }

  }

  get Open(): boolean {
    return this._isOpen;
  }

  /** new -option insert or new tags insert */
  addOption = (option: any) => {
    this._options.push(option);
    if (!this._isTags) {
      if (option.Value) {
        this.updateSelectedOption(this._value);
      } else {
        this.forceUpdateSelectedOption(this._value);
      }
    }
  }

  /** -option remove or tags remove */
  removeOption(option: pgOptionComponent): void {
    this._options.splice(this._options.indexOf(option), 1);
    if (!this._isTags) {
      this.forceUpdateSelectedOption(this._value);
    }
  }

  /** dropdown position changed */
  onPositionChange(position: ConnectedOverlayPositionChange): void {
    this._dropDownPosition = position.connectionPair.originY;
  }

  compositionStart(): void {
    this._composing = true;
  }

  compositionEnd(): void {
    this._composing = false;
  }

  /** clear single selected option */
  clearSelect($event?: MouseEvent): void {
    if ($event) {
      $event.preventDefault();
      $event.stopPropagation();
    }
    this._selectedOption = null;
    this.Value = null;
    this.onChange(null);
  }

  /** click dropdown option by user */
  clickOption(option: pgOptionComponent, $event?: MouseEvent): void {
    if (!option) {
      return;
    }
    this.chooseOption(option, true, $event);
    this.closeDropDown();

  }

  /** choose option */
  chooseOption(option: pgOptionComponent, isUserClick: boolean = false, $event?: MouseEvent): void {
    if ($event) {
      $event.preventDefault();
      $event.stopPropagation();
    }
    this._activeFilterOption = option;
    if (option && !option.Disabled) {
      if (!this.Multiple) {
        this._selectedOption = option;
        this._value = option.Value;
        if (isUserClick) {
          this.onChange(option.Value);
        }
      } else {
        if (isUserClick) {
          this.isInSet(this._selectedOptions, option) ? this.unSelectMultipleOption(option) : this.selectMultipleOption(option);
        }
      }
    }
  }

  updateWidth(element: HTMLInputElement, text: string): void {
    if (text) {
      /** wait for scroll width change */
      setTimeout(() => {
        this._renderer.setStyle(element, 'width', `${element.scrollWidth}px`);
      });
    } else {
      this._renderer.removeStyle(element, 'width');
    }
  }

  /** determine if option in set */
  isInSet(set: Set<pgOptionComponent>, option: pgOptionComponent): pgOptionComponent {
    return ((Array.from(set) as pgOptionComponent[]).find((data: pgOptionComponent) => data.Value === option.Value));
  }

  /** cancel select multiple option */
  unSelectMultipleOption = (option: any, $event?: any, emitChange = true) => {
    this._operatingMultipleOption = option;
    this._selectedOptions.delete(option);
    if (emitChange) {
      this.emitMultipleOptions();
    }

    // 对Tag进行特殊处理
    if (this._isTags && (this._options.indexOf(option) !== -1) && (this._tagsOptions.indexOf(option) !== -1)) {
      this.removeOption(option);
      this._tagsOptions.splice(this._tagsOptions.indexOf(option), 1);
    }
    if ($event) {
      $event.preventDefault();
      $event.stopPropagation();
    }
  }

  /** select multiple option */
  selectMultipleOption(option: pgOptionComponent, $event?: MouseEvent): void {
    /** if tags do push to tag option */
    if (this._isTags && (this._options.indexOf(option) === -1) && (this._tagsOptions.indexOf(option) === -1)) {
      this.addOption(option);
      this._tagsOptions.push(option);
    }
    this._operatingMultipleOption = option;
    if (this._selectedOptions.size < this.MaxMultiple) {
      this._selectedOptions.add(option);
    }
    this.emitMultipleOptions();

    if ($event) {
      $event.preventDefault();
      $event.stopPropagation();
    }
  }

  /** emit multiple options */
  emitMultipleOptions(): void {
    if (this._isMultiInit) {
      return;
    }
    const arrayOptions = Array.from(this._selectedOptions);
    this._value = arrayOptions.map(item => item.Value);
    this.onChange(this._value);
  }

  /** update selected option when add remove option etc */
  updateSelectedOption(currentModelValue: string | string[], triggerByNgModel: boolean = false): void {
    if (currentModelValue == null) {
      return;
    }
    if (this.Multiple) {
      const selectedOptions = this._options.filter((item) => {
        return (item != null) && (currentModelValue.indexOf(item.Value) !== -1);
      });
      if ((this.KeepUnListOptions || this.Tags) && (!triggerByNgModel)) {
        const _selectedOptions = Array.from(this._selectedOptions);
        selectedOptions.forEach(option => {
          const _exist = _selectedOptions.some(item => item._value === option._value);
          if (!_exist) {
            this._selectedOptions.add(option);
          }
        });
      } else {
        this._selectedOptions = new Set();
        selectedOptions.forEach(option => {
          this._selectedOptions.add(option);
        });
      }

    } else {
      const selectedOption = this._options.filter((item) => {
        return (item != null) && (item.Value === currentModelValue);
      });
      this.chooseOption(selectedOption[ 0 ]);
    }
  }

  forceUpdateSelectedOption(value: string | string[]): void {
    /** trigger dirty check */
    setTimeout(() => {
      this.updateSelectedOption(value);
    });
  }

  get Value(): string | string[] {
    return this._value;
  }

  set Value(value: string | string[]) {
    this._updateValue(value);
  }

  clearAllSelectedOption(emitChange: boolean = true): void {
    this._selectedOptions.forEach(item => {
      this.unSelectMultipleOption(item, null, emitChange);
    });
  }

  handleKeyEnterEvent(event: KeyboardEvent): void {
    /** when composing end */
    if (!this._composing && this._isOpen) {
      event.preventDefault();
      event.stopPropagation();
      this.updateFilterOption(false);
      this.clickOption(this._activeFilterOption);
    }
  }

  handleKeyBackspaceEvent(event: KeyboardEvent): void {
    if ((!this._searchText) && (!this._composing) && (this._isMultiple)) {
      event.preventDefault();
      const lastOption = Array.from(this._selectedOptions).pop();
      this.unSelectMultipleOption(lastOption);
    }
  }

  handleKeyDownEvent($event: MouseEvent): void {
    if (this._isOpen) {
      $event.preventDefault();
      $event.stopPropagation();
      this._activeFilterOption = this.nextOption(this._activeFilterOption, this._filterOptions.filter(w => !w.Disabled));
      this.scrollToActive();
    }
  }

  handleKeyUpEvent($event: MouseEvent): void {
    if (this._isOpen) {
      $event.preventDefault();
      $event.stopPropagation();
      this._activeFilterOption = this.preOption(this._activeFilterOption, this._filterOptions.filter(w => !w.Disabled));
      this.scrollToActive();
    }
  }

  preOption(option: pgOptionComponent, options: pgOptionComponent[]): pgOptionComponent {
    return options[ options.indexOf(option) - 1 ] || options[ options.length - 1 ];
  }

  nextOption(option: pgOptionComponent, options: pgOptionComponent[]): pgOptionComponent {
    return options[ options.indexOf(option) + 1 ] || options[ 0 ];
  }

  clearSearchText(): void {
    this._searchText = '';
    this.updateFilterOption();
  }

  updateFilterOption(updateActiveFilter: boolean = true): void {
    if (this.Filter) {
      this._filterOptions = new OptionPipe().transform(this._options, {
        'searchText'     : this._searchText,
        'tags'           : this._isTags,
        'notFoundContent': this._isTags ? this._searchText : this._notFoundContent,
        'disabled'       : !this._isTags,
        'value'          : this._isTags ? this._searchText : 'disabled'
      });
    } else {
      this._filterOptions = this._options;
    }

    /** TODO: cause pre & next key selection not work */
    if (updateActiveFilter && !this._selectedOption) {
      this._activeFilterOption = this._filterOptions[ 0 ];
    }
  }

  onSearchChange(searchValue: string): void {
    this.SearchChange.emit(searchValue);
  }

  @HostListener('click', [ '$event' ])
  onClick(e: MouseEvent): void {
    e.preventDefault();
    if (!this._disabled) {
      this.Open = !this.Open;
    }
  }

  @HostListener('keydown', [ '$event' ])
  onKeyDown(e: KeyboardEvent): void {
    const keyCode = e.keyCode;
    if (keyCode === TAB && this.Open) {
      this.Open = false;
      return;
    }
    if ((keyCode !== DOWN_ARROW && keyCode !== ENTER) || this.Open) {
      return;
    }
    e.preventDefault();
    if (!this._disabled) {
      this.Open = true;
    }
  }

  closeDropDown(): void {
    if (!this.Open) {
      return;
    }
    this._openBackdrop = false;
    this._backDropStyles = {
      "transform":'scale3d(1,1,1)'
    }
    setTimeout(() => {
      this.onTouched();
      this.clearSearchText();
      this.Open = false;
    },300);
  }

  setClassMap(): void {
    this._classList.forEach(_className => {
      this._renderer.removeClass(this._el, _className);
    });
    this._classList = [
      this._prefixCls,
      (this._mode === 'combobox') && `${this._prefixCls}-combobox`,
      (!this._disabled) && `${this._prefixCls}-enabled`,
      (this._disabled) && `${this._prefixCls}-disabled`,
      this._isOpen && `${this._prefixCls}-open`,
      this._size && `${this._prefixCls}-${this._size}`
    ].filter((item) => {
      return !!item;
    });
    this._classList.forEach(_className => {
      this._renderer.addClass(this._el, _className);
    });
    this._selectionClassMap = {
      [this._selectionPrefixCls]               : true,
      [`${this._selectionPrefixCls}--single`]  : !this.Multiple,
      [`${this._selectionPrefixCls}--multiple`]: this.Multiple
    };
  }

  setDropDownClassMap(): void {
    // setTimeout(()=>{ 
    //   this._dropDownClassMap = {
    //     [' cs-active']                               : true,
    //   }
    // },300);
  }

  scrollToActive(): void {
    /** wait for dropdown display */
    setTimeout(() => {
      if (this._activeFilterOption && this._activeFilterOption.Value) {
        const index = this._filterOptions.findIndex(option => option.Value === this._activeFilterOption.Value);
        try {
          const scrollPane = this.dropdownUl.nativeElement.children[ index ] as HTMLLIElement;
          // TODO: scrollIntoViewIfNeeded is not a standard API, why doing so?
          /* tslint:disable-next-line:no-any */
          (scrollPane as any).scrollIntoViewIfNeeded(false);
        } catch (e) {
        }
      }
    });
  }

  flushComponentState(): void {
    this.updateFilterOption();
    if (!this.Multiple) {
      this.updateSelectedOption(this._value);
    } else {
      if (this._value) {
        this.updateSelectedOption(this._value);
      }
    }
  }

  _setTriggerWidth(): void {
    this._triggerWidth = this._getTriggerRect().width;
    let rect = this._getTriggerRect();
    /** should remove after after https://github.com/angular/material2/pull/8765 merged **/
    setTimeout(() => {
      if (this._cdkOverlay && this._cdkOverlay.overlayRef) {
        this._cdkOverlay.overlayRef.updateSize({
          width: this._triggerWidth,
          height:rect.height,
        });
      }
    });
  }

  _getTriggerRect(): ClientRect {
    return this.trigger.nativeElement.getBoundingClientRect();
  }

  writeValue(value: string | string[]): void {
    this._updateValue(value, false);
  }

  registerOnChange(fn: (value: string | string[]) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.Disabled = isDisabled;
  }

  dropDownScroll(ul: HTMLUListElement): void {
    if (ul && (ul.scrollHeight - ul.scrollTop === ul.clientHeight)) {
      this.ScrollToBottom.emit(true);
    }
  }

  checkDropDownScroll(): void {
    if (this.dropdownUl && (this.dropdownUl.nativeElement.scrollHeight === this.dropdownUl.nativeElement.clientHeight)) {
      this.ScrollToBottom.emit(true);
    }
  }

  constructor(private _elementRef: ElementRef, private _renderer: Renderer2) {
    this._el = this._elementRef.nativeElement;
  }

  ngAfterContentInit(): void {
    if (this._value != null) {
      this.flushComponentState();
    }
  }

  ngOnInit(): void {
    this.updateFilterOption();
    this.setClassMap();
    this.setDropDownClassMap();
  }

  ngAfterContentChecked(): void {
    if (this._cacheOptions !== this._options) {
      /** update filter option after every content check cycle */
      this.updateFilterOption();
      this._cacheOptions = this._options;
    } else {
      this.updateFilterOption(false);
    }
  }

  private _updateValue(value: string[] | string, emitChange: boolean = true): void {
    if (this._value === value) {
      return;
    }
    if ((value == null) && this.Multiple) {
      this._value = [];
    } else {
      this._value = value;
    }
    if (!this.Multiple) {
      if (value == null) {
        this._selectedOption = null;
      } else {
        this.updateSelectedOption(value);
      }
    } else {
      if (value) {
        if (value.length === 0) {
          this.clearAllSelectedOption(emitChange);
        } else {
          this.updateSelectedOption(value, true);
        }
      } else if (value == null) {
        this.clearAllSelectedOption(emitChange);
      }
    }
  }
}
