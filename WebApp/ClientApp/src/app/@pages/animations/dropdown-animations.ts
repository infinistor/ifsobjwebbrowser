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
  AnimationTriggerMetadata,
} from '@angular/animations';

export const dropDownAnimation: AnimationTriggerMetadata = trigger('dropDownAnimation', [
  state('bottom', style({
    opacity        : 1,
    transform      : 'scaleY(1)',
    transformOrigin: '0% 0%'
  })),
  transition('void => bottom', [
    style({
      opacity        : 0,
      transform      : 'scaleY(0)',
      transformOrigin: '0% 0%'
    }),
    animate('150ms cubic-bezier(0.25, 0.8, 0.25, 1)')
  ]),
  state('top', style({
    opacity        : 1,
    transform      : 'scaleY(1)',
    transformOrigin: '0% 100%'
  })),
  transition('void => top', [
    style({
      opacity        : 0,
      transform      : 'scaleY(0)',
      transformOrigin: '0% 100%'
    }),
    animate('150ms cubic-bezier(0.25, 0.8, 0.25, 1)')
  ]),
  transition('* => void', [
    animate('250ms 100ms linear', style({ opacity: 0 }))
  ])
]);


export const scaleInAnimation: AnimationTriggerMetadata = trigger('scaleInAnimation', [
    state('close', style({
        height: '0',
        opacity: '0',
        transform:'scale(0.7)',
       
    })),
    state('open', style({
        display:'block',
        opacity: '1',
        transform:'scale(1)',
    })),
    transition('close => open', animate('140ms ease-in')),
    transition('open => close', animate('140ms ease-out'))

]);


