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
import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {AppSharedModule} from '../shared/app-shared.module';
import {SharedModule} from '../@pages/components/shared.module';
import {S3ExplorerComponent} from "./explorer/s3-explorer.component";
import {S3RoutingModule} from "./s3-routing.module";
import {FileManagerAllModule} from "@syncfusion/ej2-angular-filemanager";
import {S3ProviderService} from "../shared/services/data-providers/s3-provider.service";
import {S3AuthComponent} from "./auth/s3-auth.component";
import {ReactiveFormsModule} from "@angular/forms";
import {DialogsModule} from "@progress/kendo-angular-dialog";
import { ButtonsModule } from '@progress/kendo-angular-buttons';
import {SwitchModule} from "@progress/kendo-angular-inputs";
import {CommonKendoPaginateModule} from "../shared/modules/common-kendo-grid-paginate.module";
import {GridModule} from "@progress/kendo-angular-grid";
import {DateInputsModule} from "@progress/kendo-angular-dateinputs";
import {CommonDialogService} from "../shared/services/common-dialog.service";

@NgModule({
	declarations: [
		S3AuthComponent,
		S3ExplorerComponent
	],
	imports: [
		S3RoutingModule,
		CommonModule,
		SharedModule,
		AppSharedModule,
		FileManagerAllModule,
		ReactiveFormsModule,
		DialogsModule,
		ButtonsModule,
		SwitchModule,
		CommonKendoPaginateModule,
		GridModule,
		DateInputsModule,
		DialogsModule,
	],
	providers: [
		S3ProviderService,
		CommonDialogService
	]
})
export class S3Module {
}
