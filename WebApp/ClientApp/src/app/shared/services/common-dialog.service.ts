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
import {DialogRef, DialogService} from "@progress/kendo-angular-dialog";
import {Injectable, TemplateRef, ViewContainerRef} from "@angular/core";
import {Observable} from "rxjs";
import {DialogResult} from "@progress/kendo-angular-dialog/dist/es2015/dialog/dialog-settings";
import {TranslateService} from "@ngx-translate/core";

@Injectable()
export class CommonDialogService {

	/**
	 * 다이얼로그 서비스
	 */
	private _dialogService: DialogService = null;

	constructor(
		dialogService: DialogService,
		private translateService: TranslateService,
	) {
		this._dialogService = dialogService;
	}

	/**
	 * 확인 다이얼로그를 표시한다.
	 * @param title 다이얼로그 제목
	 * @param content 내용
	 * @param width 다이얼로그 넓이 (0인 경우, 지정안함)
	 * @param height 다이얼로그 높이 (0인 경우, 지정안함)
	 * @param container 표시할 컨테이너
	 */
	confirm(title: string, content: string, width: number = 0, height: number = 0, container: ViewContainerRef = null): Observable<DialogResult> {

		const yes: string = this.translateService.instant("UL_COMMON__YES");
		const no: string = this.translateService.instant("UL_COMMON__NO");

		const dialog: DialogRef = this.create(title, content
			, [
				{ text: yes, primary: true },
				{ text: no }
			]
			, width, height
			, container
		);

		return dialog.result;
	}

	/**
	 * 확인 다이얼로그를 표시한다.
	 * @param title 다이얼로그 제목
	 * @param content 내용 템플릿
	 * @param width 다이얼로그 넓이 (0인 경우, 지정안함)
	 * @param height 다이얼로그 높이 (0인 경우, 지정안함)
	 * @param container 표시할 컨테이너
	 */
	confirmWithTemplate(title: string, content: TemplateRef<any>, width: number = 0, height: number = 0, container: ViewContainerRef = null): Observable<DialogResult> {

		const yes: string = this.translateService.instant("UL_COMMON__YES");
		const no: string = this.translateService.instant("UL_COMMON__NO");

		const dialog: DialogRef = this.create(title, content
			, [
				{ text: yes, primary: true },
				{ text: no }
			]
			, width, height
			, container
		);

		return dialog.result;
	}

	/**
	 * 안내 다이얼로그를 표시한다.
	 * @param title 다이얼로그 제목
	 * @param content 내용
	 * @param width 다이얼로그 넓이 (0인 경우, 지정안함)
	 * @param height 다이얼로그 높이 (0인 경우, 지정안함)
	 * @param container 표시할 컨테이너
	 */
	information(title: string, content: string, width: number = 0, height: number = 0, container: ViewContainerRef = null): Observable<DialogResult> {
		const dialog: DialogRef = this.create(title, content
			, [
				{ text: '예', primary: true }
			]
			, width, height
			, container
		);

		return dialog.result;
	}

	/**
	 * 안내 다이얼로그를 표시한다.
	 * @param title 다이얼로그 제목
	 * @param content 내용 템플릿
	 * @param width 다이얼로그 넓이 (0인 경우, 지정안함)
	 * @param height 다이얼로그 높이 (0인 경우, 지정안함)
	 * @param container 표시할 컨테이너
	 */
	informationWithTemplate(title: string, content: TemplateRef<any>, width: number = 0, height: number = 0, container: ViewContainerRef = null): Observable<DialogResult> {

		const ok: string = this.translateService.instant("UL_COMMON__OK");

		const dialog: DialogRef = this.create(title, content
			, [
				{ text: ok, primary: true }
			]
			, width, height
			, container
		);

		return dialog.result;
	}

	/**
	 * 템플릿으로 다이얼로그를 표시한다.
	 * @param title 다이얼로그 제목
	 * @param content 내용 템플릿
	 * @param actionButtons 버튼 목록
	 * @param width 다이얼로그 넓이 (0인 경우, 지정안함)
	 * @param height 다이얼로그 높이 (0인 경우, 지정안함)
	 * @param container 표시할 컨테이너
	 */
	show(title: string, content: TemplateRef<any>, actionButtons: any[] | TemplateRef<any>, width: number = 0, height: number = 0, container: ViewContainerRef = null): Observable<DialogResult> {
		const dialog: DialogRef = this.create(title, content
			, actionButtons
			, width, height
			, container
		);

		return dialog.result;
	}

	/**
	 * 다이얼로그를 생성한다.
	 * @param title 다이얼로그 제목
	 * @param content 내용
	 * @param actionButtons 버튼 목록
	 * @param width 다이얼로그 넓이 (0인 경우, 지정안함)
	 * @param height 다이얼로그 높이 (0인 경우, 지정안함)
	 * @param container 표시할 컨테이너
	 */
	create(title: string, content: string | TemplateRef<any>, actionButtons: any[] | TemplateRef<any>, width: number = 0, height: number = 0, container: ViewContainerRef = null): DialogRef {

		const dialog: DialogRef = this._dialogService.open({
			title: title,
			content: content,
			actions: actionButtons,
			width: width,
			height: height,
			minWidth: width,
			appendTo: container
		});

		return dialog;
	}
}
