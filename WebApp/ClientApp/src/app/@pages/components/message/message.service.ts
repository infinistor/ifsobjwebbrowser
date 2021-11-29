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
import { Overlay } from '@angular/cdk/overlay';
import { ComponentPortal } from '@angular/cdk/portal';
import { Injectable, Type } from '@angular/core';
import { MessageContainerComponent } from './message-container.component';
import { MessageData, MessageDataFilled, MessageDataOptions } from './message.definitions';
import { _MESSAGE_DEFAULT_CONFIG } from './message-config';

// TODO: remove MessageData generic type as it has no contributon in typing
export class MessageBaseService<ContainerClass extends MessageContainerComponent, MessageData> {
  protected _counter = 0; // Id counter for messages
  protected _container: ContainerClass;

  constructor(overlay: Overlay, containerClass: Type<ContainerClass>, private _idPrefix: string = '') {
    //Wait till wrapper gets init parameters
    setTimeout(()=>{
      this._container = overlay.create().attach(new ComponentPortal(containerClass)).instance;
    }, 100);
  }

  remove(messageId?: string): void {
    if (messageId) {
      if(this._container)
        this._container.removeMessage(messageId);
    } else {
      if(this._container)
        this._container.removeMessageAll();
    }
  }

  createMessage(message: object, options?: MessageDataOptions): MessageDataFilled {
    // TODO: spread on literal has been disallow on latest proposal
    const resultMessage: MessageDataFilled = { ...message, ...{
      messageId: this._generateMessageId(),
      options,
      createdAt: new Date()
    }};
    this._container.createMessage(resultMessage);

    return resultMessage;
  }

  protected _generateMessageId(): string {
    return this._idPrefix + this._counter++;
  }
}

@Injectable()
export class MessageService extends MessageBaseService<MessageContainerComponent, MessageData> {

  constructor(overlay: Overlay) {
    super(overlay, MessageContainerComponent, 'message-');
  }

  // Shortcut methods
  success(content: string, options?: MessageDataOptions): MessageDataFilled {
    return this.createMessage({ type: 'success', content }, options);
  }

  error(content: string, options?: MessageDataOptions): MessageDataFilled {
    if (!options) {
      options =
      {
        Duration: 0
      };
    }
    return this.createMessage({ type: 'error', content }, options);
  }

  info(content: string, options?: MessageDataOptions): MessageDataFilled {
    return this.createMessage({ type: 'info', content }, options);
  }

  warning(content: string, options?: MessageDataOptions): MessageDataFilled {
    return this.createMessage({ type: 'warning', content }, options);
  }

  create(type: string, content: string, options?: MessageDataOptions): MessageDataFilled {
    return this.createMessage({ type, content }, options);
  }
}
