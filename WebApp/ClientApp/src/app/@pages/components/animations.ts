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
import { trigger, state, transition, animate, style } from '@angular/animations';

export class pgAnimations {
    public static slideInOut = trigger('slideInOut', [
        state('true', style({ height: '0px' })),
        state('false', style({ height: '*' })),
        transition('1 => 0', animate('500ms ease-in')),
        transition('0 => 1', animate('500ms ease-out'))
    ]);

    public static fadeIn = trigger('fadeIn', [
	  state('void', style({ opacity: 0 })),
	  state('true', style({ opacity: 1 })),
	  state('false', style({ opacity: 0 })),
	  transition('* => true', animate('150ms cubic-bezier(0.0, 0.0, 0.2, 1)')),
	  transition('* => void', animate('150ms cubic-bezier(0.4, 0.0, 1, 1)')),
    ]);
}