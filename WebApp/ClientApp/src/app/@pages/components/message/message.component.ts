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
  Input,
  OnDestroy,
  OnInit,
  ViewEncapsulation,
} from '@angular/core';
import { MessageContainerComponent } from './message-container.component';
import { MessageDataFilled, MessageDataOptions } from './message.definitions';
declare var pg: any;


@Component({
  selector     : 'pg-message',
  encapsulation: ViewEncapsulation.None,
  animations   : [
    trigger('enterLeave', [
      state('enter', style({ opacity: 1, transform: 'translateY(0)' })),
      transition('* => enter', [
        style({ opacity: 0, transform: 'translateY(-50%)' }),
        animate('100ms linear')
      ]),
      state('leave', style({ opacity: 0, transform: 'translateY(-50%)' })),
      transition('* => leave', [
        style({ opacity: 1, transform: 'translateY(0)' }),
        animate('100ms linear')
      ]),
    ])
  ],
  templateUrl : 'message.component.html',
  styleUrls    : []
})
export class MessageComponent implements OnInit, OnDestroy {

  @Input() Message: MessageDataFilled;
  @Input() Index: number;
  _enableHorizontalContainer: any;
  _options: MessageDataOptions; // Shortcut reference to Message.options

  // For auto erasing(destroy) self
  private _autoErase: boolean; // Whether record timeout to auto destroy self
  private _eraseTimer: number = null;
  private _eraseTimingStart: number;
  private _eraseTTL: number; // Time to live

  constructor(private _messageContainer: MessageContainerComponent) { }

  ngOnInit(): void {
    this._options = this.Message.options;
    if (this._options.Animate) {
      this.Message.state = 'enter';
    }

    this._autoErase = this._options.Duration > 0;

    if (this._autoErase) {
      this._initErase();
      this._startEraseTimeout();
    }

    this._enableHorizontalContainer = pg.isHorizontalLayout
  }

  ngOnDestroy(): void {
    if (this._autoErase) {
      this._clearEraseTimeout();
    }
  }

  onEnter(): void {
    if (this._autoErase && this._options.PauseOnHover) {
      this._clearEraseTimeout();
      this._updateTTL();
    }
  }

  onLeave(): void {
    if (this._autoErase && this._options.PauseOnHover) {
      this._startEraseTimeout();
    }
  }

  onClickClose(): void {
    this._destroy();
  }
  // Remove self
  protected _destroy(): void {
    if (this._options.Animate) {
      this.Message.state = 'leave';
      setTimeout(() => this._messageContainer.removeMessage(this.Message.messageId), 200);
    } else {
      this._messageContainer.removeMessage(this.Message.messageId);
    }
  }

  private _initErase(): void {
    this._eraseTTL = this._options.Duration;
    this._eraseTimingStart = Date.now();
  }

  private _updateTTL(): void {
    if (this._autoErase) {
      this._eraseTTL -= Date.now() - this._eraseTimingStart;
    }
  }

  private _startEraseTimeout(): void {
    if (this._eraseTTL > 0) {
      this._clearEraseTimeout(); // To prevent calling _startEraseTimeout() more times to create more timer
      this._eraseTimer = window.setTimeout(() => this._destroy(), this._eraseTTL);
      this._eraseTimingStart = Date.now();
    } else {
      this._destroy();
    }
  }

  private _clearEraseTimeout(): void {
    if (this._eraseTimer !== null) {
      window.clearTimeout(this._eraseTimer);
      this._eraseTimer = null;
    }
  }
}
