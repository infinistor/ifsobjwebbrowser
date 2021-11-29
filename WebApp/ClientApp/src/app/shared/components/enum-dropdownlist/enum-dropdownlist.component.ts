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
import { Component, Input, Output, OnInit, EventEmitter } from '@angular/core';
import {List} from "linq-collections";

@Component({
		selector: 'enum-dropdownlist',
		templateUrl: 'enum-dropdownlist.component.html',
})
export class EnumDropDownList implements OnInit {
	@Input() class: string;
	@Input() data: any;
	@Input() includeSelect: boolean = false;
	@Input() includeAll: boolean = true;
	@Input()
	set selectText(value: string) {

		this.m_selectText = value;

		// 선택 항목을 가져온다.
		const selectItem = new List<any>(this.dataItem).where(i => i.isSelectItem).firstOrDefault();
		// 선택 항목이 존재하는 경우
		if(selectItem)
			selectItem.text = this.selectText;
		// 선택 항목이 존재하지 않는 경우
		else
			this.dataItem.push({ text: this.selectText, value: null, enable: true, isSelectItem: true, isAllItem: false });
	}
	get selectText(): string {
		return this.m_selectText;
	}
	private m_selectText: string = "UL_COMMON__SELECT";
	@Input()
	set allText(value: string) {

		this.m_allText = value;

		// 전체 항목을 가져온다.
		const allItem = new List<any>(this.dataItem).where(i => i.isAllItem).firstOrDefault();
		// 전체 항목이 존재하는 경우
		if(allItem)
			allItem.text = this.m_allText;
		// 전체 항목이 존재하지 않는 경우
		else
			this.dataItem.push({ text: this.m_allText, value: null, enable: true, isSelectItem: false, isAllItem: true });
	}
	get allText(): string {
		return this.m_allText;
	}
	private m_allText: string = "UL_COMMON__ALL";
	@Input() selectedValue: number = null;
	@Input() filter?: (value: number) => boolean;
  // 비활성화 여부
	@Input() disabled: boolean = false;
	// 비활성화 아이템 값
	@Input()
	get disabledValues(): number[] {
		return this.m_disabledValues;
	}
	set disabledValues(values: number[]) {

		this.m_disabledValues = values;

		this.dataItem.map((item) => {
			// 비활성화 목록에 존재하는 경우, 비활성화
			if(this.m_disabledValues.findIndex((value) => { return item.value === value; }) >= 0)
				item.enable = false;
			// 비활성화 목록에 존재하지 않는 경우, 활성화
			else
				item.enable = true;
		});
	}
	private m_disabledValues: number[] = [];


	// 감춤 아이템 값
	@Input()
	get hiddenValues(): number[] {
		return this.m_hiddenValues;
	}
	set hiddenValues(values: number[]) {

		this.m_hiddenValues = values;

		this.setData();
	}
	private m_hiddenValues: number[] = [];

	@Output('onChange') onChangeEmitter: EventEmitter<any> = new EventEmitter<any>();

	public dataItem: { text: string; value: number, enable: boolean, isSelectItem: boolean, isAllItem: boolean }[] = [];

	// 초기화
	ngOnInit() {

		this.setData();

		// // 선택 텍스트 포함인 경우
		// if (this.includeSelect) {
		// 	// 선택 항목이 존재하지 않는 경우
		// 	if(!new List<any>(this.dataItem).where(i => i.isSelectItem).any())
		// 		this.dataItem.push({ text: this.selectText, value: null, enable: true, isSelectItem: true, isAllItem: false });
		// }
		// // 전체 포함인 경우
		// if (this.includeAll) {
		// 	// 전체 항목이 존재하지 않는 경우
		// 	if(!new List<any>(this.dataItem).where(i => i.isAllItem).any())
		// 		this.dataItem.push({ text: this.allText, value: null, enable: true, isSelectItem: false, isAllItem: true });
		// }
		//
		// // 데이터 값을 드롭다운 리스트에 맞도록 변경
		// let data = this.data;
		// for (let value in data) {
		// 	if (data.hasOwnProperty(value)) {
		// 		const enumValue = data[value];
		//
		// 		if (typeof enumValue === 'number') {
		// 			if (this.filter && !this.filter(enumValue)) {
		// 				continue;
		// 			}
		//
		// 			if (data.hasOwnProperty('toDisplayShortName'))
		// 				this.dataItem.push({ text: data.toDisplayShortName(enumValue), value: enumValue, enable: true, isSelectItem: false, isAllItem: false });
		// 			else
		// 				this.dataItem.push({ text: data[enumValue], value: enumValue, enable: true, isSelectItem: false, isAllItem: false });
		// 		}
		// 	}
		// }
	}

	// 초기화
	setData() {

		this.dataItem = [];

		// 선택 텍스트 포함인 경우
		if (this.includeSelect) {
			// 선택 항목이 존재하지 않는 경우
			if(!new List<any>(this.dataItem).where(i => i.isSelectItem).any())
				this.dataItem.push({ text: this.selectText, value: null, enable: true, isSelectItem: true, isAllItem: false });
		}
		// 전체 포함인 경우
		if (this.includeAll) {
			// 전체 항목이 존재하지 않는 경우
			if(!new List<any>(this.dataItem).where(i => i.isAllItem).any())
				this.dataItem.push({ text: this.allText, value: null, enable: true, isSelectItem: false, isAllItem: true });
		}

		// 데이터 값을 드롭다운 리스트에 맞도록 변경
		let data = this.data;
		for (let value in data) {
			if (data.hasOwnProperty(value)) {
				const enumValue = data[value];

				if (typeof enumValue === 'number') {
					if (this.filter && !this.filter(enumValue)) {
						continue;
					}

					// 감춤 목록에 존재하는 경우, 스킵
					if(this.hiddenValues.findIndex((hiddenValue) => { return enumValue === hiddenValue; }) >= 0)
						continue;

					let enable: boolean = true;

					// 비활성화 목록에 존재하는 경우, 비활성화
					if(this.disabledValues.findIndex((disabledValue) => { return enumValue === disabledValue; }) >= 0)
						enable = false;

					if (data.hasOwnProperty('toDisplayShortName'))
						this.dataItem.push({ text: data.toDisplayShortName(enumValue), value: enumValue, enable: enable, isSelectItem: false, isAllItem: false });
					else
						this.dataItem.push({ text: data[enumValue], value: enumValue, enable: enable, isSelectItem: false, isAllItem: false });
				}
			}
		}
	}

	// 값 변경 이벤트
	public onChange(event: any) {
		this.onChangeEmitter.emit(event);
	}

	// 초기값으로 설정
	public setInit() {
		if (this.includeAll) this.selectedValue = null;
		else this.selectedValue = 0;
	}

	// 비활성화 아이템인지 여부를 반환한다.
	public getItemDisabled(itemArgs: { dataItem: any, index: number }) {
		return !itemArgs.dataItem.enable;
	}
}
