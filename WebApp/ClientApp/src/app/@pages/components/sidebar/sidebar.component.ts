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
import {
	Component,
	OnInit,
	ViewEncapsulation,
	TemplateRef,
	ContentChild,
	HostListener,
	HostBinding,
	Output, EventEmitter
} from '@angular/core';
import { Subscription } from 'rxjs/Subscription';
import { pagesToggleService} from '../../services/toggler.service';
declare var pg: any;


@Component({
  selector: 'pg-sidebar',
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.scss'],
  host: {
    'class': 'page-sidebar',
  },
  encapsulation: ViewEncapsulation.None
})
export class SidebarComponent implements OnInit {
  subscriptions: Array<Subscription> = [];
  pin:boolean = false;
  drawer:boolean = false;
  //sidebar;
  timer: any;
  @HostBinding('style.transform')
  @HostBinding('style.transform')
  style:string;

	@Output()
	expanded: EventEmitter<boolean> = new EventEmitter<any>();

  //private sideBarWidth = 280;
  private sideBarWidthCondensed = 280 - 70;

  @ContentChild('sideBarOverlay', { static: true }) sideBarOverlay: TemplateRef<void>;
  @ContentChild('sideBarHeader', { static: true }) sideBarHeader: TemplateRef<void>;
  @ContentChild('menuItems', { static: true }) menuItems: TemplateRef<void>;

  constructor(private toggler:pagesToggleService) {
  	this.subscriptions.push(this.toggler.sideBarToggle.subscribe(toggle => { this.toggleMobile(toggle) }));
  	this.subscriptions.push(this.toggler.pageContainerHover.subscribe(message => { this.closeSideBar() }));
    this.subscriptions.push(this.toggler.menuDrawer.subscribe(message => { this.toggleDrawer() }));
    this.mobileSidebar = false;
  }

  ngOnInit() {
  }
  ngOnDestroy() {
    for (const subs of this.subscriptions) {
      subs.unsubscribe();
    }
    clearTimeout(this.timer);
  }
  @HostBinding('class.visible') mobileSidebar:boolean;

  @HostListener('mouseenter', ["$event"])
  @HostListener('click', ["$event"])
  openSideBar(){
    if (pg.isVisibleSm() || pg.isVisibleXs()) return false
    if(this.pin) return false;

		this.expanded.emit(true);
    this.style = 'translate3d(' + this. sideBarWidthCondensed + 'px, 0,0)';
    pg.addClass(document.body,"sidebar-visible");
  }

  closeSideBar(){
    if (pg.isVisibleSm() || pg.isVisibleXs()) return false
    if(this.pin) return false;

		this.expanded.emit(false);
    this.style = 'translate3d(0,0,0)';
    pg.removeClass(document.body,"sidebar-visible");

    //this.drawer = false;
  }

  toggleMenuPin(){
    if(this.pin)
      this.pin = false;

    else
      this.pin = true;
  }

  toggleDrawer(){
    if(this.drawer)
      this.drawer = false;
    else
      this.drawer = true;
  }

  toggleMobile(toggle:boolean){
      clearTimeout(this.timer);
      if(toggle){
        this.mobileSidebar = toggle;
      }
      else{
        this.timer = setTimeout(()=>{
          this.mobileSidebar = toggle;
        },400)
      }
  }
}
