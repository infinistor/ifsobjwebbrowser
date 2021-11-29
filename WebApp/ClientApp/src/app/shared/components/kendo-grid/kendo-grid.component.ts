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
import { Component, Input, OnInit, HostListener, Output, EventEmitter, IterableDiffers, IterableDiffer } from '@angular/core';
import { Grid } from '../../classes/grid/grid.model';
import { RowArgs, PageChangeEvent, SelectionEvent } from '@progress/kendo-angular-grid';
import { CommonKendoGridService } from '../../services/common.grid.service';

@Component({
		selector: 'common-kendo-grid',
		templateUrl: 'kendo-grid.component.html',
})
export class CommonKendoGridComponent implements OnInit {
	/**
		* 호스트 컴포넌트에서 받아올 그리드 객체
		*/
	@Input()
	grid: Grid = null;
	@Input()
	isLoading: boolean = false;

	/**
	 * 호스트 컴포넌트로 전달할 페이지 변경 이벤트 객체
	 */
	@Output('pageChange') pageChangeEmitter: EventEmitter<PageChangeEvent> = new EventEmitter<PageChangeEvent>();

	/**
	 * 그리드 셀 변경시 일어나는 이벤트
	 */
	@Output() selectionEmiiter: EventEmitter<SelectionEvent> = new EventEmitter<SelectionEvent>();

	/**
		* 그리드 변화 참조 비교기
		*/
	public gridItemsDiffer: IterableDiffer<Array<any>> = null;

	/**
		* 그리드 변화 참조 비교기
		*/
	public skipTask: Array<number> = new Array<number>();

	/**
		* 그리드 변화 참조 비교기
		*/
	public apiCallSkips: Array<number> = new Array<number>();

	/**
		* 그리드 변화 참조 비교기
		*/
	public updateViewIndex: number = 0;


	/**
		* 그리드 변화 참조 비교기
		*/
	public updateApiIndex: number = 0;


	/**
		* 생성자
		* @param iterableDiffers
		* @param commonKendoGridService
		*/
	constructor(public iterableDiffers: IterableDiffers, public commonKendoGridService: CommonKendoGridService) {
			this.gridItemsDiffer = iterableDiffers.find([]).create(null);
	}

	/**
		* ngOnInit
		*/
	ngOnInit(): void {
			this.setGridHeight();
	}

	/**
		* 최초 그리드 사이즈를 설정한다
		*/
	public setGridHeight(): void {
			this.grid.height = this.grid.isUseFixedHeight ? this.grid.height : (window.innerHeight - 184);
	}

	/**
	* 브라우저 사이즈 변경시 호출되는 이벤트
	* @param event
	*/
	@HostListener('window:resize', ['$event'])
	public onResize(event: any): void {
			this.grid.height = this.grid.isUseFixedHeight ? this.grid.height : (event.target.innerHeight - 184);
	}

	/**
		* grid 객체의 변경 여부를 감시한다
		*/
	public ngDoCheck(): void {
			if (this.gridItemsDiffer) {
					let changes = this.gridItemsDiffer.diff(this.grid.diffItems);
					if (changes)
							this.applyGridChange();
			}
	};

	/**
		* 그리드 변경 내용을 적용한다
		*/
	public applyGridChange(): void {
			// 그리드에 데이터가 최초로 들어오는 경우
			if (this.grid.totalCount === 0) {
					//this.grid.totalCount = this.grid.diffTotal;
					this.commonKendoGridService.initializeData(this.grid);
					this.skipTask = [];
					this.apiCallSkips = [];
					this.updateViewIndex = 0;
					this.updateApiIndex = 0;
					// 최초요청시엔 수동으로 그리드를 그린다
					this.skipTask.push(0);
					this.updateView({"skip":0});
			}
	}

	/**
		* 페이지 변경시 발생하는 이벤트
		* @param event
		*/
	public pageChange(event: PageChangeEvent): void {
			// 페이지 이동시 받아온 스킵을 보관한다
			this.skipTask.push(event.skip);

			// 쌓아둔 테스크를 실행한다
			this.doTask(event);
	};

	/**
		* 테스크에 등록된 작업을 진행한다
		*/
	public doTask(event: any): void {
			this.updateView(event);
			//callParentApi
			this.updateViewManual(event);
	};

	/**
		* pageChange 이벤트를 전달한다
		* @param $event
		*/
	public dispatchPageChangeEvent($event: any): void {
			this.pageChangeEmitter.emit($event);
	}

	/**
		* 뷰를 업데이트한다
		* @param event
		*/
	public updateView(event: any): void {
			this.grid.gridView.data = this.grid.items.slice(event.skip, event.skip + this.grid.pageSize );
			this.grid.gridView.total = this.grid.totalCount;
	};

	/**
		* 수동으로 뷰를 업데이트한다
		*/
	public updateViewManual(event: any): void  {
		var i: number;
		for (i = this.updateApiIndex; i <= this.skipTask.length; i++) {
					let shouldApiCall: boolean = false;

					let curSkip = this.skipTask[i];
					let curEndSkip = (curSkip + this.grid.pageSize);

					// 최초 요청인 경우
					if (this.apiCallSkips.isEmpty()) {
							// 스킵한 인덱스를 보관한다
							for (i = curSkip; i < curEndSkip; i++) {
									this.apiCallSkips.push(i);
							}
							shouldApiCall = true;
					}

					// 기존 요청한 범위 스킵에 포함되는지 여부를 검사한다
					for (i = curSkip; i < curEndSkip; i++) {
							// 포함되지 않을경우
							if (this.apiCallSkips.indexOf(i) === -1) {
									//api 를 호출
									shouldApiCall = true;
									this.apiCallSkips.push(i);
							}
					}

					//반복된 범위는 다시 요청하지 않기 위해 요청한 스킵은 보관한다
					if (shouldApiCall) {
							this.dispatchPageChangeEvent(event);
					}
			}

			this.updateApiIndex++;
	};

	/**
	* 그리드 아이디를 리턴한다
	* @param context
	*/
	public itemId(context: RowArgs): any {
			let propertyName: string = "";

			if (!(typeof context.dataItem["Id"] === "undefined")) {
					propertyName = "Id";
			}
			else if (!(typeof context.dataItem["TeamId"] === "undefined")) {
					propertyName = "TeamId";
			}
			else if (!(typeof context.dataItem["RegDate"] === "undefined")) {
					propertyName = "RegDate";
			}


			return context.dataItem[propertyName];
	}

	/**
	* 체크박스 셀릭트시 발생하는 이벤트
	* @param e
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

	/**
		* 셀 셀렉트시 반응하는 이벤트
		* @param event
		*/
	public selectionChange(event: SelectionEvent): void {
			this.selectionEmiiter.emit(event);
	};
}
