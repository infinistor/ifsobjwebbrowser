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
  animate,
  state,
  style,
  transition,
  trigger,
} from '@angular/animations';
import {
  Component,
  ElementRef,
  Host,
  HostBinding,
  Input,
} from '@angular/core';
import { pgCollapsesetComponent } from './collapseset.component';

@Component({
  selector  : 'pg-collapse',
  templateUrl: './collapse.component.html',
  animations: [
    trigger('collapseState', [
      state('inactive', style({
        opacity: '0',
        height : 0
      })),
      state('active', style({
        opacity: '1',
        height : '*'
      })),
      transition('inactive => active', animate('125ms ease-in')),
      transition('active => inactive', animate('125ms ease-out'))
    ])
  ],
  host      : {
    '[class.card]': 'true',
    '[class.card-default]': 'true',
    '[class.m-b-0]': 'true',
  }
})

export class pgCollapseComponent {
  private _disabled = false;
  _active = false;
  _el: any;
  @Input() Title: string;

  @Input()
  @HostBinding('class.disabled')
  set Disabled(value: boolean) {
    this._disabled = value;
  }

  get Disabled(): boolean {
    return this._disabled;
  }

  @Input()
  set Active(value: boolean) {
    const active = value;
    if (this._active === active) {
      return;
    }
    if (!this.Disabled) {
      this._active = active;
    }
  }

  get Active(): boolean {
    return this._active;
  }

  clickHeader($event: MouseEvent): void {
    this.Active = !this.Active;
    /** trigger host collapseSet click event */
    this._collapseSet.pgClick(this);
  }

  constructor(@Host() private _collapseSet: pgCollapsesetComponent, private _elementRef: ElementRef) {
    this._el = this._elementRef.nativeElement;
    this._collapseSet.addTab(this);
  }
}
