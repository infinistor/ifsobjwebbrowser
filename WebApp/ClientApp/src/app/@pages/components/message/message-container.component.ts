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
import { Component, Inject, Optional, ViewEncapsulation } from '@angular/core';
import { MessageConfig, _MESSAGE_CONFIG, _MESSAGE_DEFAULT_CONFIG } from './message-config';
import { MessageDataFilled, MessageDataOptions } from './message.definitions';

@Component({
  selector     : 'pg-message-container',
  encapsulation: ViewEncapsulation.None,
  template     : `
    <div class="pgn-wrapper" [class.hide]="messages.length == 0" *ngIf="currentMessage" [attr.data-position]="currentMessage.options.Position" [ngStyle]="style">
      <pg-message *ngFor="let message of messages; let i = index" [Message]="message" [Index]="i"></pg-message>
    </div>
  `,
  styleUrls    : []
})
export class MessageContainerComponent {
  messages: MessageDataFilled[] = [];
  currentMessage: any= null;
  style: any;
  config: MessageConfig;

  constructor(@Optional() @Inject(_MESSAGE_DEFAULT_CONFIG) defaultConfig: MessageConfig,
              @Optional() @Inject(_MESSAGE_CONFIG) config: MessageConfig) {
    this.config = { ...defaultConfig, ...config };
  }

  // Create a new message
  createMessage(message: MessageDataFilled): void {
    let el = window.document.querySelector(".header ");
    if(el){
      let rect = el.getBoundingClientRect();
      this.style = {
        marginTop:rect.height+"px"
      }
    }
    this.currentMessage = message;
    if (this.messages.length >= this.config.MaxStack) {
      this.messages.splice(0, 1);
    }
    message.options = this._mergeMessageOptions(message.options);
    this.messages.push(message);
  }

  // Remove a message by messageId
  removeMessage(messageId: string): void {
    this.messages.some((message, index) => {
      if (message.messageId === messageId) {
        this.messages.splice(index, 1);
        return true;
      }
    });
  }

  // Remove all messages
  removeMessageAll(): void {
    this.messages = [];
  }

  // Merge default options and cutom message options
  protected _mergeMessageOptions(options: MessageDataOptions): MessageDataOptions {
    const defaultOptions: MessageDataOptions = {
      Position: this.config.Position,
      Style: this.config.Style,
      Duration: this.config.Duration,
      Animate: this.config.Animate,
      PauseOnHover: this.config.PauseOnHover
    };
    return { ...defaultOptions, ...options };
  }
}
