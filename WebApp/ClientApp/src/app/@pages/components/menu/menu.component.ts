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

import { Component, OnInit,Input, ViewEncapsulation, HostListener } from '@angular/core';
import {
	animate,
	transition,
	trigger,
} from '@angular/animations';
import { PerfectScrollbarConfigInterface } from 'ngx-perfect-scrollbar';
import { Router, NavigationEnd } from '@angular/router';

@Component({
	selector: 'pg-menu-items',
	templateUrl: './menu.component.html',
	styleUrls: ['./menu.component.scss'],
	animations: [
		trigger('toggleHeight', [
				transition('close => open', animate('140ms ease-in')),
				transition('open => close', animate('140ms ease-out'))
		])
	],
	encapsulation:ViewEncapsulation.None
})
export class MenuComponent implements OnInit {
	menuItems: any = [];
	currentItem: any = null;
	isPerfectScrollbarDisabled = false
	public config: PerfectScrollbarConfigInterface = {};

	constructor(private router: Router) {

		// 페이지 경로 변경 시 발생하는 이벤트
		this.router.events.subscribe((val) => {

			// 네비게이션이 끝난 경우
			if (val instanceof NavigationEnd) {

				this.syncMenuActive(val.urlAfterRedirects);
			}
		});
	}

	ngOnInit() {
	}

	ngAfterViewInit() {
		setTimeout(()=>{
			this.syncMenuActive(this.router.url);
			this.togglePerfectScrollbar();
		})
	}

	@HostListener("window:resize", [])
	onResize() {
		this.togglePerfectScrollbar();
	}

	// 메뉴 활성화 동기화
	syncMenuActive(currentUrl: string) {

		// 모든 메뉴 아이템에 대해서 처리
		this.menuItems.map((item: any) => {

			// 링크가 존재하고, 현재 링크가 메뉴의 링크로 시작하는 경우
			if (item.routerLink && currentUrl.startsWith(item.routerLink)) {
				item.thumbnailClass = 'bg-primary';
			}
			// 링크가 존재하지 않거나 메뉴의 링크로 시작하지 않는 경우
			else {
				item.thumbnailClass = '';

				// 하위 메뉴가 존재하는 경우
				if (item.submenu) {
					// 모든 하위 메뉴에 대해서 처리
					item.submenu.map((subitem: any) => {

						// 링크가 존재하고, 현재 링크가 메뉴의 링크로 시작하는 경우
						if (subitem.routerLink && currentUrl.startsWith(subitem.routerLink)) {
							// 상위 메뉴를 열고, 메뉴 아이콘 활성화
							item.toggle = 'open';
							item.thumbnailClass = 'bg-primary';
							subitem.thumbnailClass = 'bg-primary';
						}
						else {
							subitem.thumbnailClass = '';
						}
					});
				}
			}
		});
	}

	togglePerfectScrollbar(){
		this.isPerfectScrollbarDisabled = window.innerWidth < 1025
	}

	@Input()
	set Items(value: any) {
		this.menuItems = value
	}

	toggleNavigationSub(event: any, item: any) {
		event.preventDefault();
		if(this.currentItem && this.currentItem != item){
			this.currentItem["toggle"] = 'close';
		}
		this.currentItem = item;
		item.toggle = (item.toggle === 'close' ? 'open' : 'close');
	}
}
