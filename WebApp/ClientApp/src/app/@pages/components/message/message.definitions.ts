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
export interface MessageDataOptions {
  Position?:string;
  Style?:string;
  Duration?: number;
  Animate?: boolean;
  Title?:string;
  imgURL?:string;
  PauseOnHover?: boolean;
}

// Message data for terminal users
export interface MessageData {
  // For html
  html?: string;

  // For string content
  // TODO: remove the literal parts as it's widened anyway
  type?: 'success' | 'info' | 'warning' | 'error' | 'loading' | string;
  style?: 'simple' | 'bar' | 'flip' | 'circle' | string;
  position?:'top';
  content?: string;
}

// Filled version of MessageData (includes more private properties)
export interface MessageDataFilled extends MessageData {
  messageId: string; // Service-wide unique id, auto generated
  state?: 'enter' | 'leave';
  options?: MessageDataOptions;
  createdAt: Date; // Auto created
}
