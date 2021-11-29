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

export class FilterList<T> {

	/**
	 * 생성자
	 * @param searchField 검색 필드명
	 */
	constructor(searchField: string) {
		this.SearchField = searchField;
	}

	/**
	 * 검색어
	 */
	public get Keyword(): string {
		return this._keyword;
	}
	public set Keyword(value: string) {
		this._keyword = value;
		this.applyFilter();
	}
	private _keyword: string = "";

	/**
	 * 검색할 필드
	 */
	private SearchField: string = "";

	/**
	 * 원본 데이터 목록
	 */
	public get Items(): Array<T> {
		return this._items;
	}
	public set Items(value: Array<T>) {
		this._items = value;
		this.applyFilter();
	}
	private _items: Array<T> = [];

	/**
	 * 필더링된 데이터 목록
	 */
	public FilteredItems: Array<T> = [];

	/**
	 * 필터 적용
	 */
	public applyFilter() {
		if(this.SearchField) {
			this.FilteredItems = this.Items.filter((i: any) => {
				return (<string>i[this.SearchField]).toLowerCase().indexOf(this._keyword.toLowerCase()) >= 0;
			});
		}
		else
			this.FilteredItems = this.Items;
	}

}
