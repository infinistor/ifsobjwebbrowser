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
import { AnimationEvent } from '@angular/animations';
import {
  AfterViewInit,
  Component,
  ElementRef,
  EventEmitter,
  HostBinding,
  Input,
  Output,
  Renderer2,
  ViewEncapsulation,
} from '@angular/core';
import { tagAnimation } from '../../animations/tag-animations';
import { toBoolean } from '../util/convert';

@Component({
  selector       : 'pg-tag',
  encapsulation: ViewEncapsulation.None,
  animations   : [
    tagAnimation
  ],
  template       : `
    <span *ngIf="!_closed"
      class="label"
      [ngClass]="_colorclass"
      [@tagAnimation]
      (@tagAnimation.done)="_afterClose($event)">
      <span [class]="_textClass"><ng-content></ng-content></span>
      <i class="pg pg-close" (click)="_close($event)" *ngIf="Closable"></i>
    </span>
  `,
  styleUrls      : [
    './tag.scss',
  ]
})
export class pgTagComponent implements AfterViewInit {
  private _closable = false;
  _prefixCls = 'label';
  _closed = false;
  _colorclass = "label-info";
  /** Whether tag is closable */
  @Input()
  set Closable(value: boolean) {
    this._closable = toBoolean(value);
  }

  @Input()
  set ColorClass(value: string) {
    this._colorclass = value
  }

  get Closable(): boolean {
    return this._closable;
  }

  /** The tag color */
  @Input() color: string;

  /** Event: emit before close */
  @Output() BeforeClose = new EventEmitter<Event>();

  // TODO: AnimationEvent is not subclass of Event, but all payloads should be unified
  /** Event: emit after close */
  @Output() Close = new EventEmitter<AnimationEvent>();

  @HostBinding('attr.data-show')
  get _dataShow(): boolean {
    return !this._closed;
  }

  _afterClose(event: AnimationEvent): void {
    if (this._closed) {
      this.Close.emit(event);
    }
  }


  get _textClass(): string {
    return `${this._prefixCls}-text`;
  }

  _close(event: Event): void {
    this.BeforeClose.emit(event);
    if (event.defaultPrevented) {
        return;
    }
    this._closed = true;
  }


  constructor(
    private _elementRef: ElementRef,
    private _render: Renderer2) {

  }

  ngAfterViewInit(): void {
    this._render.addClass(this._elementRef.nativeElement, `${this._prefixCls}-wrapper`);
  }
}
