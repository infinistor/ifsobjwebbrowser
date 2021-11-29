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
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ObserversModule } from '@angular/cdk/observers';

import { SecondarySidebarComponent } from './secondary-sidebar/secondary-sidebar.component';

import { TypeaheadModule } from 'ngx-bootstrap/typeahead';

import { ParallaxDirective } from './parallax/parallax.directive';
import { BreadcrumbComponent } from './breadcrumb/breadcrumb.component';
import { FormGroupDefaultDirective } from './forms/form-group-default.directive';
import { ViewDirective } from './view/view.directive';

import { pgCollapseModule } from './collapse/collapse.module';

import { PerfectScrollbarModule } from 'ngx-perfect-scrollbar';
import { PERFECT_SCROLLBAR_CONFIG } from 'ngx-perfect-scrollbar';
import { PerfectScrollbarConfigInterface } from 'ngx-perfect-scrollbar';
import { ContainerComponent } from './container/container.component';
import { pageContainer } from './container/page-container.component';
import { RouterModule } from '@angular/router';
import { MenuComponent } from './menu/menu.component';
import { MenuAltComponent } from './menu/menu-alt.component';
import { MenuIconComponent } from './menu/menu-icon.component';

import { ListItemComponent } from './list-view/list-item/list-item.component';
import { ListViewContainerComponent } from './list-view/list-view-container/list-view-container.component';
import { pgRetinaDirective } from './retina/retina.directive';
import {TranslateModule} from "@ngx-translate/core";

const DEFAULT_PERFECT_SCROLLBAR_CONFIG: PerfectScrollbarConfigInterface = {
  suppressScrollX: true
};

@NgModule({
	imports: [
		CommonModule,
		ObserversModule,
		TypeaheadModule.forRoot(),
		PerfectScrollbarModule,
		RouterModule,
		TranslateModule,
	],
  declarations: [
    SecondarySidebarComponent,
    ParallaxDirective,
    BreadcrumbComponent,
    FormGroupDefaultDirective,
    ViewDirective,
    ContainerComponent,
    pageContainer,
    MenuComponent,
    MenuAltComponent,
    MenuIconComponent,
    ListItemComponent,
    ListViewContainerComponent,
    pgRetinaDirective,
  ],
  exports: [
    SecondarySidebarComponent,
    ParallaxDirective,
    BreadcrumbComponent,
    FormGroupDefaultDirective,
    ViewDirective,
    pgCollapseModule,
    ContainerComponent,
    pageContainer,
    MenuComponent,
    MenuAltComponent,
    MenuIconComponent,
    ListItemComponent,
    ListViewContainerComponent,
    pgRetinaDirective
  ],
  providers: [
    {
      provide: PERFECT_SCROLLBAR_CONFIG,
      useValue: DEFAULT_PERFECT_SCROLLBAR_CONFIG
    }
  ]

})
export class SharedModule { }
