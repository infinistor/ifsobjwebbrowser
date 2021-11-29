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
//Angular Core
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { BrowserModule, HammerGestureConfig, HAMMER_GESTURE_CONFIG } from '@angular/platform-browser';
import {LOCALE_ID, NgModule} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { HttpClientModule, HttpClient } from '@angular/common/http';
import { UrlSerializer } from '@angular/router';

//Routing
import { AppRoutingModule } from './app.routing';
import { AppComponent } from './app.component';

//Layouts
import { CondensedComponent, BlankComponent, RootLayout } from './@pages/layouts';
//Layout Service - Required
import { pagesToggleService } from './@pages/services/toggler.service';

//Shared Layout Components
import { SidebarComponent } from './@pages/components/sidebar/sidebar.component';
import { HeaderComponent } from './@pages/components/header/header.component';
import { HorizontalMenuComponent } from './@pages/components/horizontal-menu/horizontal-menu.component';
import { SharedModule } from './@pages/components/shared.module';
import { pgListViewModule } from './@pages/components/list-view/list-view.module';
import { pgCardModule } from './@pages/components/card/card.module';
import { pgCardSocialModule } from './@pages/components/card-social/card-social.module';

//Basic Bootstrap Modules
import { BsDropdownModule } from 'ngx-bootstrap/dropdown';
import { AccordionModule } from 'ngx-bootstrap/accordion';
import { AlertModule } from 'ngx-bootstrap/alert';
import { CollapseModule } from 'ngx-bootstrap/collapse';
import { ModalModule } from 'ngx-bootstrap/modal';
import { ProgressbarModule } from 'ngx-bootstrap/progressbar';
import { TabsModule } from 'ngx-bootstrap/tabs';
import { TooltipModule as ngxTooltipModule } from 'ngx-bootstrap/tooltip';
import { TypeaheadModule } from 'ngx-bootstrap/typeahead';

//Pages Globaly required Components - Optional
import { pgTabsModule } from './@pages/components/tabs/tabs.module';
import { pgSwitchModule } from './@pages/components/switch/switch.module';
import { ProgressModule } from './@pages/components/progress/progress.module';

//Thirdparty Components / Plugins - Optional
import { PerfectScrollbarModule } from 'ngx-perfect-scrollbar';
import { PERFECT_SCROLLBAR_CONFIG } from 'ngx-perfect-scrollbar';
import { PerfectScrollbarConfigInterface } from 'ngx-perfect-scrollbar';
import { WebStorageModule } from 'ngx-store';
import { BreadcrumbService } from './shared/services/breadcrumb.service';
import { DropDownsModule } from '@progress/kendo-angular-dropdowns';
import { PopupModule } from '@progress/kendo-angular-popup';
import { DateInputsModule } from '@progress/kendo-angular-dateinputs';
import { GridModule } from '@progress/kendo-angular-grid';
import { DialogsModule } from '@progress/kendo-angular-dialog';
import { TreeViewModule } from '@progress/kendo-angular-treeview';
import { ButtonsModule } from '@progress/kendo-angular-buttons';
import { AngularResizedEventModule } from 'angular-resize-event';
import { TranslateModule, TranslateLoader, TranslateService } from '@ngx-translate/core';
import { TranslateHttpLoader } from '@ngx-translate/http-loader';
import { LocalCacheService, SessionCacheService } from "./shared/services/cache/cache.service";
import { SiteSharedModule } from './shared/modules/site-shared.module';
import { LowerCaseUrlSerializer } from './lower-case-url-serializer';
import { MessageModule } from './@pages/components/message/message.module';
import { ExcelExportModule } from '@progress/kendo-angular-excel-export';
import { PDFExportModule } from '@progress/kendo-angular-pdf-export';
import { SortableModule } from '@progress/kendo-angular-sortable';
import { ChartsModule } from '@progress/kendo-angular-charts';
import 'hammerjs';
import { ProgressBarModule } from '@progress/kendo-angular-progressbar';
import { LayoutModule } from '@progress/kendo-angular-layout';
import { MomentModule } from 'ngx-moment';
import { CommonKendoPaginateModule } from "./shared/modules/common-kendo-grid-paginate.module";
import { AppSharedModule } from "./shared/app-shared.module";
import { NotificationModule } from '@progress/kendo-angular-notification';
import { MessageNotificationService } from "./shared/services/notification.service";
import { InputsModule } from '@progress/kendo-angular-inputs';
import {CommonKendoVirtualModule} from "./shared/modules/common-kendo-grid-virtual.module";
import { UploadModule } from '@progress/kendo-angular-upload';

import { registerLocaleData } from '@angular/common';
import localeKo from '@angular/common/locales/ko';
import {EnumDropDownListModule} from "./shared/modules/enum-dropdownlist.module";
import { FileManagerModule } from '@syncfusion/ej2-angular-filemanager';
import { ScrollViewModule } from '@progress/kendo-angular-scrollview';

import '@progress/kendo-angular-intl/locales/ko/all';

registerLocaleData(localeKo, 'ko');

const DEFAULT_PERFECT_SCROLLBAR_CONFIG: PerfectScrollbarConfigInterface = {
	suppressScrollX: true
};

//Hammer Config Overide
//https://github.com/angular/angular/issues/10541
export class AppHammerConfig extends HammerGestureConfig {
	overrides = <any>{
		'pinch': { enable: false },
		'rotate': { enable: false }
	}
}

// 번역 json 파일 로드
export function createTranslateLoader(http: HttpClient) {
	return new TranslateHttpLoader(http, 'assets/i18n/', '.json');
}


@NgModule({
	declarations: [
		AppComponent,
		CondensedComponent,
		BlankComponent,
		SidebarComponent, HeaderComponent, HorizontalMenuComponent,
		RootLayout,
	],
	imports: [
		BrowserModule,
		BrowserAnimationsModule,
		CommonModule,
		FormsModule,
		HttpClientModule,
		MessageModule,
		SharedModule,
		SiteSharedModule,
		ProgressModule,
		pgListViewModule,
		pgCardModule,
		pgCardSocialModule,
		AppRoutingModule,
		BsDropdownModule.forRoot(),
		AccordionModule.forRoot(),
		AlertModule.forRoot(),
		CollapseModule.forRoot(),
		ModalModule.forRoot(),
		ProgressbarModule.forRoot(),
		TabsModule.forRoot(),
		ngxTooltipModule.forRoot(),
		TypeaheadModule.forRoot(),
		pgTabsModule,
		PerfectScrollbarModule,
		pgSwitchModule,
		WebStorageModule,
		TranslateModule.forRoot({
			loader: {
				provide: TranslateLoader,
				useFactory: (createTranslateLoader),
				deps: [HttpClient]
			}
		}),
		DropDownsModule,
		PopupModule,
		DateInputsModule,
		GridModule,
		DialogsModule,
		TreeViewModule,
		ButtonsModule,
		AngularResizedEventModule,
		ExcelExportModule,
		PDFExportModule,
		SortableModule,
		ChartsModule,
		ProgressBarModule,
		LayoutModule,
		AppSharedModule,
		ReactiveFormsModule,
		CommonKendoPaginateModule,
		MomentModule,
		NotificationModule,
		InputsModule,
		CommonKendoVirtualModule,
		UploadModule,
		EnumDropDownListModule,
		FileManagerModule,
		ScrollViewModule,
	],
	providers: [
		{ provide: UrlSerializer, useClass: LowerCaseUrlSerializer },
		pagesToggleService,
		{
			provide: PERFECT_SCROLLBAR_CONFIG,
			useValue: DEFAULT_PERFECT_SCROLLBAR_CONFIG
		},
		{
			provide: HAMMER_GESTURE_CONFIG,
			useClass: AppHammerConfig
		},
		LocalCacheService,
		SessionCacheService,
		BreadcrumbService,
		MessageNotificationService,
		{ provide: LOCALE_ID, useValue: navigator.language }
	],
	bootstrap: [AppComponent],
})
export class AppModule {
	// 생성자
	constructor(private translateService: TranslateService) {
		// 언어 번역 설정
		this.translateService.addLangs(['en', 'ko']);
		this.translateService.setDefaultLang('ko');

		const browserLang = this.translateService.getBrowserLang();
		this.translateService.use(browserLang.match(/en|ko/) ? browserLang : 'ko');
	}
}
