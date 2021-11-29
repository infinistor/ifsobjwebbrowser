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
import { Injectable } from '@angular/core';
import { Subject } from 'rxjs/Subject';

@Injectable()
export class pagesToggleService {

	//Sidebar Toggle - Mobile
	private _sideBarToggle = <Subject<boolean>> new Subject();
	sideBarToggle = this._sideBarToggle.asObservable();

	//Secondary Sidebar Toggle - Mobile
	private _secondarySideBarToggle = <Subject<any>> new Subject();
	secondarySideBarToggle = this._secondarySideBarToggle.asObservable();
	
	//Horizontal Menu Toggle - Mobile
	private _mobileHorizontaMenu = <Subject<boolean>> new Subject();
	mobileHorizontaMenu = this._mobileHorizontaMenu.asObservable();

	//Menu Pin Toggle
	private _menuPinToggle = new Subject();
	menuPinToggle = this._menuPinToggle.asObservable();

	//Menu Pin Toggle
	private _menuDrawer = <Subject<string>> new Subject();
	menuDrawer = this._menuDrawer.asObservable();

	//Page Wrapper Class
	private _pageContainerClass = <Subject<string>> new Subject();
	pageContainerClass = this._pageContainerClass.asObservable();

	//Page Content Class
	private _contentClass = <Subject<string>> new Subject();
	contentClass = this._contentClass.asObservable();

	//Header Class
	private _headerClass = <Subject<string>> new Subject();
	headerClass = this._headerClass.asObservable();

	//Body Layout Class
	private _bodyLayoutClass = <Subject<string>> new Subject();
	bodyLayoutClass = this._bodyLayoutClass.asObservable();

	//App Layout
	private _layout = <Subject<string>> new Subject();
	Applayout = this._layout.asObservable();

	//Footer Visiblity
	private _footer = <Subject<boolean>> new Subject();
	Footer = this._footer.asObservable();

	//Page Container Hover Event - Used for sidebar
	private _pageContainerHover = <Subject<boolean>> new Subject();
	pageContainerHover = this._pageContainerHover.asObservable();

	setContent(className:string){
		this._contentClass.next(className);
	}

	setPageContainer(className:string){
		this._pageContainerClass.next(className);
	}

	setHeaderClass(className:string){
		this._headerClass.next(className);
	}

	setBodyLayoutClass(className:string){
		this._bodyLayoutClass.next(className);
	}

	removeBodyLayoutClass(className:string){
		this._bodyLayoutClass.next(className);
	}

	changeLayout(className:string){
		this._layout.next(className);
	}

	toggleMenuPin(toggle:boolean){
		this._menuPinToggle.next({text:toggle});
	}

	toggleMenuDrawer(){
		this._menuDrawer.next();
	}

	toggleMobileSideBar(toggle:boolean){
		this._sideBarToggle.next(toggle);
	}

	toggleSecondarySideBar(toggle: boolean){
		this._secondarySideBarToggle.next(toggle);
	}

	toggleMobileHorizontalMenu(toggle: boolean){
		this._mobileHorizontaMenu.next(toggle);
	}

	toggleFooter(toggle:boolean){
		this._footer.next(toggle);
	}

	triggerPageContainerHover(toggle:boolean){
		this._pageContainerHover.next(toggle);
	}
	
}
