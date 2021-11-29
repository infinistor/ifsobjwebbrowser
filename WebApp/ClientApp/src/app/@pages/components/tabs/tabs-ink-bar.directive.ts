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
import { Directive, ElementRef, HostBinding, Input, NgZone, Renderer2 } from '@angular/core';
import { reqAnimFrame } from '../util/request-animation';
import { toBoolean } from '../util/convert';

export type TabPositionMode = 'horizontal' | 'vertical';

@Directive({
  selector: '[pg-tabs-ink-bar]',
  host: {
    '[class.nav-item]': 'true'
  }
})
export class pgTabsInkBarDirective {
  private _animated = false;

  @Input()
  @HostBinding('class.nav-item-animated')
  set Animated(value: boolean) {
    this._animated = toBoolean(value);
  }

  get Animated(): boolean {
    return this._animated;
  }

  @Input() PositionMode: TabPositionMode = 'horizontal';

  constructor(private _renderer: Renderer2,
              private _elementRef: ElementRef,
              private _ngZone: NgZone) {
  }

  alignToElement(element: HTMLElement): void {
    this.show();

    this._ngZone.runOutsideAngular(() => {
      reqAnimFrame(() => {
        /** when horizontal remove height style and add transfrom left **/
        if (this.PositionMode === 'horizontal') {
          this._renderer.removeStyle(this._elementRef.nativeElement, 'height');
          this._renderer.setStyle(this._elementRef.nativeElement, 'transform',
            `translate3d(${this._getLeftPosition(element)}, 0px, 0px)`);
          this._renderer.setStyle(this._elementRef.nativeElement, 'width',
            this._getElementWidth(element));
        } else {
          /** when vertical remove width style and add transfrom top **/
          this._renderer.removeStyle(this._elementRef.nativeElement, 'width');
          this._renderer.setStyle(this._elementRef.nativeElement, 'transform',
            `translate3d(0px, ${this._getTopPosition(element)}, 0px)`);
          this._renderer.setStyle(this._elementRef.nativeElement, 'height',
            this._getElementHeight(element));
        }
      });
    });
  }

  show(): void {
    this._renderer.setStyle(this._elementRef.nativeElement, 'visibility', 'visible');
  }

  setDisplay(value: string): void {
    this._renderer.setStyle(this._elementRef.nativeElement, 'display', value);
  }

  hide(): void {
    this._renderer.setStyle(this._elementRef.nativeElement, 'visibility', 'hidden');
  }

  _getLeftPosition(element: HTMLElement): string {
    return element ? element.offsetLeft + 'px' : '0';
  }

  _getElementWidth(element: HTMLElement): string {
    return element ? element.offsetWidth + 'px' : '0';
  }

  _getTopPosition(element: HTMLElement): string {
    return element ? element.offsetTop + 'px' : '0';
  }

  _getElementHeight(element: HTMLElement): string {
    return element ? element.offsetHeight + 'px' : '0';
  }
}
