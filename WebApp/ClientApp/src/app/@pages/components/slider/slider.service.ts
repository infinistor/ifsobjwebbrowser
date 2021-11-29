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
import { Injectable } from '@angular/core';

@Injectable()
export class SliderService {

  pauseEvent(e: Event): void {
    e.stopPropagation();
    e.preventDefault();
  }

  getPrecision(num: number): number {
    const numStr = num.toString();
    const dotIndex = numStr.indexOf('.');
    return dotIndex >= 0 ? numStr.length - dotIndex - 1 : 0;
  }

  cloneArray<T>(arr: T[]): T[] {
    return arr.slice();
  }

  isNotTouchEvent(e: TouchEvent): boolean {
    return !e.touches || e.touches.length > 1 ||
      (e.type.toLowerCase() === 'touchend' && e.touches.length > 0);
  }

  // convert value to offset in percent
  valueToOffset(min: number, max: number, value: number): number {
    return (value - min) / (max - min) * 100;
  }

  correctNumLimit(num: number, min: number, max: number): number {
    let res = +num;
    if (isNaN(res)) { return min; }
    if (num < min) { res = min; } else if (num > max) { res = max; }
    return res;
  }

  /**
   * get the offset of an element relative to the document (Reference from jquery's offset())
   * @param elem HTMLElement ref
   */
  getElementOffset(elem: HTMLElement): { top: number, left: number } {
    // Return zeros for disconnected and hidden (display: none) elements (gh-2310)
    // Support: IE <=11 only
    // Running getBoundingClientRect on a
    // disconnected node in IE throws an error
    if (!elem.getClientRects().length) {
      return { top: 0, left: 0 };
    }
    // Get document-relative position by adding viewport scroll to viewport-relative gBCR
    const rect = elem.getBoundingClientRect();
    const win = elem.ownerDocument.defaultView;
    return {
      top: rect.top + win.pageYOffset,
      left: rect.left + win.pageXOffset
    };
  }

}
