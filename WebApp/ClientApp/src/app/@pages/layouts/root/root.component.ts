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

import { Component, OnInit, OnDestroy, ViewChild, Input, HostListener, ElementRef} from '@angular/core';
import { Subscription } from 'rxjs/Subscription';
import { pagesToggleService } from '../../services/toggler.service';
import { Router, Event, NavigationEnd } from '@angular/router';
import { LocalStorage } from 'ngx-store';
declare var pg: any;

@Component({
	selector: 'root-layout',
	templateUrl: './root.component.html',
	styleUrls: ['./root.component.scss'],
})
export class RootLayout implements OnInit,OnDestroy {

	@ViewChild('root', { static: false }) root: ElementRef;
	layoutState:string;
	extraLayoutClass:string;
	_boxed:boolean = false
	@LocalStorage('menuPin') _menuPin:boolean = false;
	_enableHorizontalContainer:boolean;
	_pageContainerClass = "";
	_contentClass = "";
	_footer:boolean = true;
	_menuDrawerOpen:boolean = false;
	//Mobile
	_secondarySideBar:boolean = false;
	 //Mobile
	_mobileSidebar:boolean = false;
	//Mobile
	_mobileHorizontalMenu:boolean = false;
	_pageTitle:string;
	//Sub layout - eg: email
	_layoutOption:string;
	_subscriptions:  Array<Subscription> = [];
	_layout: any;
	@Input()
	public contentClass:string = "";

	@Input()
	public pageWrapperClass:string = "";

	@Input()
	public footer:boolean = true;

	constructor(public toggler: pagesToggleService, public router: Router) {
		if(this.layoutState){
			pg.addClass(document.body,this.layoutState);
		}
		router.events.subscribe( (event: Event) => {
			if (event instanceof NavigationEnd) {
				var root = this.router.routerState.snapshot.root;
				while (root) {
						if (root.children && root.children.length) {
								root = root.children[0];
						} else if (root.data) {
								//Custom Route Data here
								this._pageTitle = root.data["title"]
								this._layoutOption = root.data["layoutOption"];
								this._boxed = root.data["boxed"]
								break;
						} else {
								break;
						}
				}
				//Reset Any Extra Layouts added from content pages
				pg.removeClass(document.body,this.extraLayoutClass);
				//Close Sidebar and Horizonta Menu
				if(this._mobileSidebar){
					this._mobileSidebar = false;
					pg.removeClass(document.body,"sidebar-open");
					this.toggler.toggleMobileSideBar(this._mobileSidebar);
				}
				this._mobileHorizontalMenu = false;
				this.toggler.toggleMobileHorizontalMenu(this._mobileHorizontalMenu);
				//Scoll Top
				this.scrollToTop();
			}

			//Subscribition List
			this._subscriptions.push(this.toggler.pageContainerClass
			.subscribe(state => {
				this._pageContainerClass = state;
			}));

			this._subscriptions.push(this.toggler.contentClass
			.subscribe(state => {
				this._contentClass = state;
			}));

			this._subscriptions.push(this.toggler.bodyLayoutClass
			.subscribe(state => {
				if(state){
					this.extraLayoutClass = state;
					pg.addClass(document.body,this.extraLayoutClass);
				}
			}));

			this._subscriptions.push(this.toggler.Applayout
			.subscribe(state => {
				this.changeLayout(state);
			}));

			this._subscriptions.push(this.toggler.Footer
			.subscribe(state => {
				this._footer = state;
			}));

			this._subscriptions.push(this.toggler.mobileHorizontaMenu
			.subscribe(state => {
				this._mobileHorizontalMenu = state;
			}));

	});
	}

	/** @function changeLayout
	*   @description Add Document Layout Class
	*/
	changeLayout(type:string){
		this.layoutState = type;
		if(type){
			pg.addClass(document.body,type);
		}
	}

	/** @function removeLayout
	*   @description Remove Document Layout Class
	*/
	removeLayout(type:string){
		pg.removeClass(document.body,type);
	}

	ngOnInit() {
	}

	ngOnDestroy() {
		for(const sub of this._subscriptions){
			sub.unsubscribe();
		}
	}
	ngAfterViewInit() {
	}

	/** @function scrollToTop
	*   @description Force to scroll to top of page. Used on Route
	*/
	scrollToTop(){
		let top = window.pageYOffset;
		if(top == 0){
			let scroller = document.querySelector(".page-container");
			if(scroller)
				scroller.scrollTop = 0;
		}
		else{
			window.scrollTo(0, 0)
		}
	}
	
	/** @function toggleMenuPin
	*   @description Permanently Open / Close Main Sidebar
	*/
	toggleMenuPin(show: any){
		if(pg.isVisibleSm()){
			this._menuPin = false;
			return this._menuPin;
		}

		if (show === undefined) {
			if (this._menuPin) {
				pg.removeClass(document.body, "menu-pin");
				this._menuPin = false;
			} else {
				pg.addClass(document.body, "menu-pin");
				this._menuPin = true;
			}
		}
		else {
			if (show) {
				pg.addClass(document.body, "menu-pin");
				this._menuPin = true;
			} else {
				pg.removeClass(document.body, "menu-pin");
				this._menuPin = false;
			}
		}

		return this._menuPin;
	}

	/** @function toggleMenuDrawer
	*   @description Open Main Sidebar Menu Drawer - Service
	*/
	toggleMenuDrawer(){
		this._menuDrawerOpen = (this._menuDrawerOpen == true ? false : true);
		this.toggler.toggleMenuDrawer();
	}

	/** @function toggleMobileSidebar
	*   @description Open Main Sidebar on Mobile - Service
	*/
	toggleMobileSidebar(){
		if(this._mobileSidebar){
			this._mobileSidebar = false;
			pg.removeClass(document.body,"sidebar-open");
		}
		else{
			this._mobileSidebar = true;
			pg.addClass(document.body,"sidebar-open");
		}
		this.toggler.toggleMobileSideBar(this._mobileSidebar);
	}

	/** @function toggleHorizontalMenuMobile
	*   @description Open Secondary Sidebar on Mobile - Service
	*/
	toggleSecondarySideBar() {
		this._secondarySideBar = (this._secondarySideBar == true ? false : true);
		this.toggler.toggleSecondarySideBar(this._secondarySideBar);
	}

	/** @function toggleHorizontalMenuMobile
	*   @description Call Horizontal Menu Toggle Service for mobile
	*/
	toggleHorizontalMenuMobile(){
		this._mobileHorizontalMenu = (this._mobileHorizontalMenu == true ? false : true);
		this.toggler.toggleMobileHorizontalMenu(this._mobileHorizontalMenu);
	}

	@HostListener("window:resize", [])
	onResize() {
		this.autoHideMenuPin();
	}

	//Utils
	autoHideMenuPin(){
		if(window.innerWidth < 1025){
			if(pg.hasClass(document.body,"menu-pin")){
				pg.addClass(document.body,"menu-unpinned");
				pg.removeClass(document.body,"menu-pin");
			}
		}
		else{
			if(pg.hasClass(document.body,"menu-unpinned")){
				pg.addClass(document.body,"menu-pin");
			}
		}
	}
}
