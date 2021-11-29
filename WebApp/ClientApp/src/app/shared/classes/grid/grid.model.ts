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
import { GridColumn } from "./grid-column.model";
import { GridDataResult, SelectableSettings, SortSettings } from "@progress/kendo-angular-grid";
import { CommonSearch } from "./common-search.model";
import { GridManualItem, objectStatus } from "./grid-manual-item.model";
import { GridColumnsConfig } from "./grid-columns-configs.model";
import { SortDescriptor } from "@progress/kendo-data-query";
import {IGridComponent} from "./grid-component-interface";

/**
 * 그리드
 */
export class Grid {

	public isUseCalcuratePageSize: boolean = true;

	public isUseDiabledGrid: boolean = false;

	public disabledGridProperty: string = "";

	public apiSkip: number;


	public cachedGridData: Array<any>;

	// 이 객체와 연결된 컴포넌트 객체
	public component: IGridComponent = null;

	// 그리드명
	public name: string;

	// 검색 필드명
	public searchFields: Array<string> = [];

	// 검색 키워드
	public searchKeyword: string = "";

	// 에디터블 오브젝트
	public /*editObject*/: any;


	// api 주소
	public baseApi: string;

	// 데이터 전체 크기
	public get totalCount(): number {
		if(this.gridView)
			return this.gridView.total;
		else
			return 0;
	}

	// 페이지 크기
	public pageSize: number = 40;

	// 페이징 사용 여부
	public pageable: boolean = true;

	// 스킵
	public skip: number = 0;

	// 진행중 스킵
	public progressSkip: Array<number>;

	// 페이지번호
	public pageNo: number = 1;

	// 정렬 사용여부
	public get sortSettings(): boolean | SortSettings {
		return this._sortSettings;
	}
	private _sortSettings: boolean | SortSettings = false;

	// 정렬 컬럼 정보
	public get sortColumns(): SortDescriptor[] {
		return this._sortColumns;
	}
	private _sortColumns: SortDescriptor[] = [];


	// 소팅 컬럼을 설정한다.
	public setSortColumns(sortColumns: boolean | SortDescriptor[]) {
		if (sortColumns instanceof Boolean && sortColumns === false) {
			this._sortSettings = false;
			this._sortColumns = [];
		} else {
			if(!this._sortSettings)
				this._sortSettings = { mode: 'multiple', allowUnsort: true };
			this._sortColumns = sortColumns as SortDescriptor[];
		}
	}

	// 소팅 환경을 설정한다.
	public setSortSettings(useSort: boolean, multipleMode: boolean = true, allowUnsort: boolean = true)
	{
		if(!useSort)
			this._sortSettings = useSort;
		else
			this._sortSettings = { mode: multipleMode ? 'multiple' : 'single', allowUnsort: allowUnsort };
	}

	// 필터 사용 여부
	public filterable: boolean = false;

	// 그리드 컬럼 데이터
	public get columns(): Array<GridColumn> {
		return this._columns;
	}
	public set columns(value: Array<GridColumn>) {
		this._columns = value;
	}
	private _columns:  Array<GridColumn>;

	// 키 컬럼명 목록
	public keyColumnNames: Array<string> = [];

	// 받아올 아이템 제너릭 타입
	public items: Array<any>;

	// 임의로 추가할 아이템 (그리드가 살아있는 동안은 살아있음)
	public manualItems:Array<GridManualItem>;

	// Differ 아이템
	public diffItems: Array<any>;

	// Differ Total 카운트
	public diffTotal: number;

	// 선택된 아이템
	public selectedItems: Array<any>;

	// 그리드 뷰
	public gridView: GridDataResult;

	// 선택된 키 목록
	public selectedKeys: any[] = [];

	// 상세그리드 컬럼명
	public detailGridColumnName: string = 'Items';

	// 상세그리드 사용여부
	public isUseDetailGrid: boolean = false;

	// 에디팅 그리드 사용여부
	public isUseEditGrid: boolean = false;

	// 컬럼리사이즈 사용여부
	public isUseResize: boolean = true;

	// 로딩바 사용여부
	public isUseLoading: boolean = true;

	// 모두 선택 체크 박스 표시 여부
	public isShowSelectAll: boolean = true;

	// 그리드 셀렉트 세팅
	public selectableSettings: SelectableSettings;

	// 그리드 Height 세팅
	public height: number;

	// 고정비 높이를 쓸지 여부
	public isUseFixedHeight: boolean;

	// 상세그리드
	public detailGrid: Grid;

	// 체크박스 셀렉트 사용여부
	public isUseCheckboxSelect: boolean = false;

	// API 업데이트 여부 Flag 스트링
	public apiUpdateFlag: string = "";

	// 공통 검색 오브젝트
	public commonSearch: any;

	// 옵션 검색 오브젝트
	public commonSearchOptions: any;

	// - + 할 사이즈
	public flexingSize: number = 0;

	// 행번호 자동 노출 여부
	public isUseSequence: boolean = false;

	// 컬러 표시 여부
	public enableColor: boolean = false;

	// 여러 상세 그리드를 표시할지 여부
	public useMultipleDetailGrid: boolean = false;

	public location: string = '';

	/**
	* API 및 그리드 리로딩을 강제 요청한다
	*/
	public forceApiReload(): void {
		this.commonSearch["isForce"] = !this.commonSearch["isForce"];
	};


	/**
	* 로우가 선택 안되어있는지 여부를 판단한다
	*/
	public isNotSelectedAnyRow(): boolean {
		if (this.selectedItems.length === 0)
			return true;
		else
			return false;
	};

	/**
	* 그리드 뷰를 업데이트한다
	*/
	public updateGridView(): void {
		this.gridView.data = this.items.slice(this.skip, this.skip + this.pageSize);
		this.gridView.total = this.items.length;
	};

	/**
	* 그리드 뷰를 업데이트한다
	*/
	public updateGridViewManual(adder:number): void {
		this.gridView.data = this.items.slice(this.skip, this.skip + this.pageSize + adder);
		this.gridView.total = this.items.length;
	};

	/**
	 * 로드된 데이터를 초기화 한다.
	 */
	public clear(): void {
		if(this.component) {
			this.component.updateGridView([], 0);
			this.component.clearSelection();
		}
	};

	/**
	 * 그리드 뷰를 업데이트한다
	 */
	public updateData(data: any[], total: number = 0): void {
		if(this.component)
			this.component.updateGridView(data, total === 0 ? data.length : total);
	};

	/**
	* 수동으로 아이템을 추가시킨다
	* @param item
	* @param status
	* @param skip
	* @param key
	*/
	public addManualItem(item: any, status: objectStatus, skip: number, key:string): void {
		let addedItem = new GridManualItem();
		addedItem.item = item;
		addedItem.status = status;
		addedItem.Skip = skip;
		addedItem.key = key;

		this.manualItems.push(addedItem);
		this.doManual();
	}

	/** */
	public doManual(): void {
		if (this.manualItems.length === 0)
			return;

		for (let manulItem of this.manualItems) {
			// 추가라면
			if (manulItem.status === "added") {
				if (this.skip === manulItem.Skip) {
					this.gridView.data.push(manulItem.item);
					this.gridView.data.sort((a, b) => {
						let nameA = a[manulItem.key].toUpperCase();
						let nameB = b[manulItem.key].toUpperCase();

						if (nameA < nameB) {
							return -1;
						}
						if (nameA > nameB) {
							return 1;
						}

						return 0;
					});
				};
			}
			// 삭제라면
			else if (manulItem.status === "removed") {
				this.gridView.data = this.gridView.data.filter(x => x[manulItem.key] !== manulItem.item[manulItem.key]);
			}
			// 수정 이라면
			else {
				//let modifyItem = this.gridView.data.filter(x => x[manulItem.key] == manulItem.item[manulItem.key]);

				let foundIndex = 0;
				for (let item of this.gridView.data) {
					if (item[manulItem.key] === manulItem.item[manulItem.key]) {
						break;
					}
					foundIndex++;
				}
				this.gridView.data[foundIndex] = manulItem.item;

			}
		}
	}

	getGridPath(): string {
		if(!this.location || !this.name) {
			return '';
		}

		return [this.location, this.name].join('::');
	}

	setDisplayColumn(field: string, isHidden: boolean): void {
		if(!this.columns) {
			return;
		}

		this.columns.filter(item => item.field === field)
			.forEach(item => item.isHidden = isHidden);
	}

	getHiddenColumnFields(): string[] {
		if(!this.columns) {
			return [];
		}

		return this.columns.filter(item => item.isHidden).map(item => item.field);
	}

	applyColumnsConfig(config: GridColumnsConfig): void {
		if(!config || !config.hiddenColumnFields) {
			return;
		}

		this.columns.filter(item => config.hiddenColumnFields.includes(item.field))
			.forEach(item => item.isHidden = true);
	}

	/**
	 * 특정 인덱스의 데이터를 선택한다.
	 * @param index 선택할 인덱스
	 */
	selectByIndex(index: number): any {
		if(this.component)
			return this.component.selectByIndex(index);
		else
			return [];
	}

	/**
	 * 특정 인덱스의 데이터를 선택한다.
	 * @param index 선택할 인덱스
	 */
	selectByIndexes(indexes: number[]): any[] {
		if(this.component)
			return this.component.selectByIndexes(indexes);
		else
			return [];
	}

	/**
	 * 주어진 데이터 동일한 키를 가지는 데이터를 선택한다.
	 * @param item 선택할 데이터 객체
	 */
	selectByItem(item: any): any {
		if(this.component)
			this.component.selectByItem(item);
		else
			return [];
	}

	/**
	 * 주어진 데이터 동일한 키를 가지는 데이터를 선택한다.
	 * @param item 선택할 데이터 객체
	 */
	selectByItems(items: any[]): any[] {
		if(this.component)
			this.component.selectByItems(items);
		else
			return [];
	}

	/**
	 * 모든 선택을 해제 한다.
	 */
	clearSelection(): any {
		if(this.component) {
			this.component.clearSelection();
		}
	}


	/**
	* 생성자
	*
	*/
	constructor() {
		this.selectableSettings = {
			checkboxOnly: false,
			mode: 'multiple'
		};
		this.pageSize = 100;
		this.skip = 0;
		this.gridView = {
			data :[],
			total : 0,
		};
		this.pageNo = 1;
		this.items = new Array<any>();
		//this.height = 700;
		this.progressSkip = [];
		this.apiUpdateFlag = "objectSeq";
		this.diffItems = [];
		this.diffTotal = 0;
		this.searchFields = [];
		this.searchKeyword = "";
		this.selectedItems = [];
		this.isUseFixedHeight = false;
		this.isUseLoading = true;
		this.commonSearchOptions = {};
		this.isUseCalcuratePageSize = true;

		// 공통 검색 모델에 force 플래그 destructing
		let searchModel = new CommonSearch(null, null, null, [], "");
		this.commonSearch = { searchModel, ...{ isForce: false } };

		this.manualItems = new Array<GridManualItem>();
		this.isUseDiabledGrid = false;
		this.disabledGridProperty = "";
		this.cachedGridData = new Array<any>();
		this.apiSkip = 0;
		this.searchKeyword = "";


	}
}
