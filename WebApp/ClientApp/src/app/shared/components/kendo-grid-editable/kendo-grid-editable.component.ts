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
/// <reference path="../kendo-grid/kendo-grid.component.ts" />
import { Component, Input, OnInit, HostListener, KeyValueDiffers } from '@angular/core';
import { Grid } from '../../classes/grid/grid.model';
import { RowArgs } from '@progress/kendo-angular-grid';
import {MessageNotificationService} from "../../services/notification.service";

@Component({
		selector: 'common-kendo-grid-editable',
		templateUrl: 'kendo-grid-editable.component.html'
})
export class CommonKendoGridEditableComponent implements OnInit {
	/**
	* 호스트 컴포넌트에서 받아올 그리드 객체
	*/
	@Input() grid: Grid = null;

	@Input() isLoading: boolean = false;

	@Input() inCommunication: boolean = false;


	/**
	* ngOnInit
	*/
	ngOnInit(): void {
		this.setGridHeight();
	}


	/**
	* 생성자
	*/
	constructor(public keyValueDiffers: KeyValueDiffers, public messageService: MessageNotificationService) {
	}


	/**
	* 그리드 기본정보를 세팅한다
	*/
	public setGridBase(): void {
		this.grid.gridView.data = [];
		this.grid.gridView.total = 0;
	};


	/**
	* 최초 그리드 사이즈를 설정한다
	*/
	public setGridHeight(): void {
		this.grid.height = this.grid.isUseFixedHeight ? this.grid.height : (window.innerHeight - 184) - this.grid.flexingSize;
	}

	/**
	* 브라우저 사이즈 변경시 호출되는 이벤트
	* @param event
	*/
	@HostListener('window:resize', ['$event'])
	public onResize(event: any): void {
		this.grid.height = this.grid.isUseFixedHeight ? this.grid.height : (event.target.innerHeight - 184) - this.grid.flexingSize;
	}

	/**
	 * 체크박스 셀릭트시 발생하는 이벤트
	 */
	public onSelectedKeysChange(e: any) {

		// 선택된 항목 저장
		this.grid.selectedItems = this.grid.items.filter(item => e.includes(this.GetKeyValue(item)));
	}

	/**
	 * 키 선택 변경 시 발생하는 이벤트
	 * @param context 행 정보 객체
	 */
	public getSelectionKey(context: RowArgs): string {

		// 이 컴포넌트 객체를 가져온다.
		const $this: any = ((this) as any).cd._view.parent.context;

		// 해당 행 데이터의 키 값을 가져온다.
		return $this.GetKeyValue(context.dataItem);
	}

	/**
	  * 행 데이터에서 키 값을 가져온다.
	  * @param rowData 행 데이터
	  */
	public GetKeyValue(rowData: any) {
		let keyValue = '';

		if (rowData !== null) {
			for (var index = 0; index < this.grid.keyColumnNames.length; index++) {
				const value = rowData[this.grid.keyColumnNames[index]];
				keyValue = keyValue ? keyValue + ',' + value : value;
			}
		}

		return keyValue;
	}
}
