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
  Component, OnDestroy, AfterContentInit, Input, ViewChild, ElementRef, ViewEncapsulation, HostListener
  , ContentChild, TemplateRef,
} from '@angular/core';

import { pagesToggleService } from '../../services/toggler.service'
declare var pg: any;
@Component({
  selector: 'pg-horizontal-menu',
  templateUrl: './horizontal-menu.component.html',
  styleUrls: ['./horizontal-menu.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class HorizontalMenuComponent implements AfterContentInit, OnDestroy {
  menuItems: any = [];
  _renduerMenuItems: any = [];
  _hideExtra = 0;
  currentItem: any = null;
  _horizontalMobileMenu: boolean = false;
  resizeId: any;
  _service: any;
  //Simple hack flag to check if its wrapped
  _wrapped: boolean = false;
  @ViewChild('menuItemsList', { static: false }) _menuItemsList: ElementRef;
  @ViewChild('menuWrapper', { static: false }) _menuWrapper: ElementRef;
  @ContentChild('mobileSidebarFooter', { static: true }) mobileSidebarFooter: TemplateRef<void>;
  constructor(private toggler: pagesToggleService) {

    this._service = this.toggler.mobileHorizontaMenu
      .subscribe(state => {
        this._horizontalMobileMenu = state;
        this.closeHorizontalMenu();
      });
  }

  @Input()
  set HideExtra(value: any) {
    this._hideExtra = value
  }

  @Input()
  set Items(value: any) {
    this.menuItems = value
    this._renduerMenuItems = this.menuItems.slice();
  }

  ngOnInit() {

  }
  ngOnDestroy() {
    this._service.unsubscribe();
  }
  ngAfterContentInit(): void {
  }

  ngOnChanges(): void {
  }

  ngAfterViewInit(): void {
    setTimeout(() => {
      if (pg.isVisibleSm() || pg.isVisibleXs()) return false
      this._onContentChanges();
    })
  }

  closeHorizontalMenu() {
    if (!this.currentItem) {
      return;
    }
    this.currentItem["open"] = false;
    this.currentItem["opening"] = false;
    this.currentItem["ghost"] = {
      visibility: "hidden"
    }
  }

  toggleLink(event: any, item: any) {
    //Mobile
    if (pg.isVisibleSm() || pg.isVisibleXs()) {
      if (this.currentItem && this.currentItem != item) {
        this.currentItem["mToggle"] = 'close';
      }
      this.currentItem = item;
      item.mToggle = (item.mToggle === 'close' ? 'open' : 'close');
      return false
    }

    //Desktop
    if (this.currentItem && this.currentItem != item) {
      this.currentItem["open"] = false;
      this.currentItem["opening"] = false;
      this.currentItem["ghost"] = {
        visibility: "hidden"
      }
    }
    this.currentItem = item;
    let elParent = event.currentTarget.parentNode;
    if (item["open"]) {
      let el = elParent.querySelector("ul");
      let rect = el.getBoundingClientRect();
      item.ghost = {
        width: rect.width + 'px',
        height: 0,
        zIndex: "auto"
      }
      item["open"] = false;
      setTimeout(() => {
        item["opening"] = false;
      }, 240);
    }
    else {
      item["open"] = true;
      setTimeout(() => {
        let el = elParent.querySelector("ul");
        let rect = el.getBoundingClientRect();
        item.ghost = {
          height: "0",
          width: rect.width + 'px',
          zIndex: "auto"
        }
        item.ghost = {
          width: rect.width + 'px',
          height: rect.height + 'px',
          zIndex: "auto"
        }

        setTimeout(() => {
          item["opening"] = true;
        }, 140);
      }, 0);

    }

  }

  @HostListener('window:resize', ['$event'])
  onResize(event: any) {
    clearTimeout(this.resizeId);
    this.resizeId = setTimeout(() => {
      if (pg.isVisibleSm() || pg.isVisibleXs()) {
        this._renduerMenuItems = this.menuItems.slice();
        return false
      }
      this._onContentChanges();
    }, 140);
  }

  _onContentChanges() {
    //Cache User Items
    this._renduerMenuItems = this.menuItems.slice();
    let children = this._menuItemsList.nativeElement.childNodes
    let totalChildrenWidth = 0;
    let liCount = 0
    for (var i = 0; i < children.length; i++) {
      if (children[i]["nodeName"] == "LI") {
        totalChildrenWidth = totalChildrenWidth + children[i].offsetWidth
        if (totalChildrenWidth > this._menuWrapper.nativeElement.offsetWidth) {
          this.wrap(liCount)
          break;
        }
        liCount++;
      }
    }

    //@TODO:Will Force Wrap
    if (!this._wrapped)
      this.wrap(liCount)
  }

  wrap(startIndex: number) {
    if (this._hideExtra > 0) {
      this._wrapped = true;
      startIndex = startIndex - this._hideExtra;
      let temp = {
        type: "more",
        toggle: "close",
        submenu: ([] as any)
      }
      for (var i = startIndex; i < this._renduerMenuItems.length; i++) {
        temp["submenu"].push(this._renduerMenuItems[i]);
      }
      this._renduerMenuItems.splice(startIndex, this._renduerMenuItems.length);
      this._renduerMenuItems.push(temp);
    }
  }

  toggleHorizontalMenu() {
    if (this._horizontalMobileMenu) {
      this._horizontalMobileMenu = false;
    }
    else {
      this._horizontalMobileMenu = true;
    }
    this.toggler.toggleMobileHorizontalMenu(this._horizontalMobileMenu);
  }
}
