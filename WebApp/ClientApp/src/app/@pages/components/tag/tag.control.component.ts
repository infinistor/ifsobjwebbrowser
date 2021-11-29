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
  Component,
  ElementRef,
  Input,
  OnInit,
  ViewEncapsulation,
  ViewChild
} from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

@Component({
  selector: 'pg-tag-control',
  encapsulation: ViewEncapsulation.None,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => pgTagControl),
      multi: true
    }
  ],
  templateUrl: "./tag.control.component.html",
  styleUrls: ["./tag.scss"]
})
export class pgTagControl implements OnInit, ControlValueAccessor {

  onChange: (value: string[]) => void = () => null;
  onTouched: () => void = () => null;
  @ViewChild('wrapper', { static: false }) wrapper: ElementRef;
  _tags: any = [];
  inputValue = '';
  _placeholder = '';
  @Input()
  set placeholder(value: string) {
    this._placeholder = value
  }

  handleClose(removedTag: any): void {
    this._tags = this._tags.filter((tag: any) => tag !== removedTag);
  }
  sliceTagName(tag: string): string {
    const isLongTag = tag.length > 20;
    return isLongTag ? `${tag.slice(0, 20)}...` : tag;
  }
  handleInputConfirm(): void {
    if (this.inputValue) {
      this._tags.push(this.inputValue);
    }
    this.inputValue = '';
  }
  handleFocus(): void {
    this.wrapper.nativeElement.parentNode.parentNode.classList.add('focused');
  }
  handleFocusOut(): void {
    this.wrapper.nativeElement.parentNode.parentNode.classList.remove('focused');
  }
  handleInputBack(): void {
    if (!this.inputValue) {
      this._tags.splice(-1, 1);
    }
  }
  updateValue(value: string[]): void {
    this._tags = value;
  }
  writeValue(value: string[]): void {
    this.updateValue(value);
  }

  registerOnChange(fn: (_: string[]) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }
  ngOnInit(): void {
  }
}
