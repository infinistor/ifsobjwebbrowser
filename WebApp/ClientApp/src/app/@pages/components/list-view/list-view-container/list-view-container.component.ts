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
import { Component, OnInit,ElementRef, ViewChild, HostListener } from '@angular/core';
import { ListItemComponent } from '../list-item/list-item.component'
import { PerfectScrollbarConfigInterface } from 'ngx-perfect-scrollbar';

@Component({
	selector: 'pg-list-view-container',
	templateUrl: './list-view-container.component.html',
	styleUrls: ['./list-view-container.component.scss']
})
export class ListViewContainerComponent implements OnInit {
	
	_items: ListItemComponent[] = [];
  elems: any = [];
	topHeader:any;
  topElement: any;
	fakeHeaderHidden = false;
	topClassAnimated = false;
	public config: PerfectScrollbarConfigInterface = {};
	isPerfectScrollbarDisabled = false;
	
	@ViewChild('itemListWrapper', { static: false }) itemListWrapper: ElementRef;

	constructor(private el: ElementRef) { }

	ngOnInit() {
	}

	ngAfterViewInit() {
		setTimeout(()=>{
			this.togglePerfectScrollbar();
		})
	}

	@HostListener("window:resize", [])
	onResize() {
		this.togglePerfectScrollbar();
	}

	togglePerfectScrollbar(){
		this.isPerfectScrollbarDisabled = window.innerWidth < 1025
	}


	cacheElements(){
		var rootRect = this.el.nativeElement.getBoundingClientRect();
		var els = this.el.nativeElement.querySelectorAll('.list-view-group-container');
		for (var i=0; i<els.length; i++){
				var rect = els[i].getBoundingClientRect();
				var offsetTop =  rect.top - rootRect.top;
				var headerElement = els[i].querySelector(".list-view-group-header")
				this.elems.push({
					'listHeight': rect.height,
					'headerHeight': headerElement.offsetHeight,
					'listOffset': offsetTop,
					'listBottom': rect.height + offsetTop,
					'animated':false
				})
				
		}
		this.computeHeader();
	}

	computeHeader(){
		let currentTop = this.itemListWrapper.nativeElement.scrollTop;
		let topElementBottom,topIndex = 0;
		let i = 0;
		while ((this.elems[i].listOffset - currentTop) <= 0) {
			this.topElement = this.elems[i];
			topIndex = i;
			topElementBottom = this.topElement.listBottom - currentTop;
			if (topElementBottom < -this.topElement.headerHeight) {
			}
			i++;
			if (i >= this.elems.length) {
					break;
			}
		}
		if (topElementBottom < this.topElement.headerHeight && topElementBottom > 0) {
			this.fakeHeaderHidden = true;
			this.topElement.animated = true;
		} else {
				this.fakeHeaderHidden = false;
				if (this.topElement) {
					this.topElement.animated = false;
				}
		}

		if (this.topElement && this._items[topIndex]) {
			this.topHeader = this._items[topIndex]._itemHeading
		}
	}
}
