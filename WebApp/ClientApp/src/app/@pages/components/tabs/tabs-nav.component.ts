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
/** code from https://github.com/angular/material2 */
import { Direction, Directionality } from '@angular/cdk/bidi';
import {
  AfterContentChecked,
  AfterContentInit,
  Component,
  ContentChild,
  ContentChildren,
  ElementRef,
  Input,
  NgZone,
  Optional,
  QueryList,
  Renderer2,
  TemplateRef,
  ViewChild,
  ViewEncapsulation,
} from '@angular/core';
import { Subscription } from 'rxjs/Subscription';
import { fromEvent } from 'rxjs/observable/fromEvent';
import { merge } from 'rxjs/observable/merge';
import { of as observableOf } from 'rxjs/observable/of';
import { auditTime } from 'rxjs/operators/auditTime';
import { startWith } from 'rxjs/operators/startWith';
import { toBoolean } from '../util/convert';
import { pgTabLabelDirective } from './tab-label.directive';
import { pgTabsInkBarDirective } from './tabs-ink-bar.directive';

const EXAGGERATED_OVERSCROLL = 64;
export type ScrollDirection = 'after' | 'before';

/** duplicated defined https://github.com/angular/angular-cli/issues/2034 **/
export type TabPositionMode = 'horizontal' | 'vertical';

@Component({
  selector     : 'pg-tabs-nav',
  encapsulation: ViewEncapsulation.None,
  template     : `
  
    <div class="nav-tabs-wrapper" [class.scrolling]="_showPaginationControls" #tabListContainer>
      <span class="nav-tabs-navigator left btn btn-link" (click)="_scrollHeader('before')" [class.disabled]="_disableScrollBefore" *ngIf="_showPaginationControls">
        <i class="pg pg-arrow_left"></i>
      </span>
      <div class="nav-wrap">
          <ul class="nav nav-tabs nav-tabs-{{_type}} nav-tabs-{{_tabPosition}}" [class.tabs-nav-animated]="Animated" #tabList (cdkObserveContent)="_onContentChanges()">
            <div class="active-bar" pg-tabs-ink-bar [hidden]="HideBar" [Animated]="Animated" [PositionMode]="PositionMode" style="display: block;"></div>
            <ng-content></ng-content>
          </ul>
      </div>
      <span class="nav-tabs-navigator right btn btn-link" (click)="_scrollHeader('after')" [class.disabled]="_disableScrollAfter" *ngIf="_showPaginationControls">
        <i class="pg pg-arrow_right"></i>
      </span>
    </div> 
  `,
  host: {

  }
})
export class pgTabsNavComponent implements AfterContentChecked, AfterContentInit {
  private _animated = true;
  private _hideBar = false;
  private _showPagination = true;

  _showPaginationControls = false;
  _disableScrollAfter = true;
  _disableScrollBefore = true;
  _scrollDistance = 0;
  _selectedIndexChanged = false;
  _realignInkBar: Subscription | null = null;
  _tabLabelCount: number;
  _scrollDistanceChanged: boolean;
  _selectedIndex = 0;
  _tabPositionMode: TabPositionMode = 'horizontal';
  _tabPosition = 'top';
  @Input() Size = 'default';
  _type = 'line';

  @Input()
  set Animated(value: boolean) {
    this._animated = toBoolean(value);
  }

  get Animated(): boolean {
    return this._animated;
  }

  @Input()
  set Position(value:string){
    this._tabPosition =  value;
  }

  get Position(): string {
    return this._tabPosition;
  }

  @Input()
  set HideBar(value: boolean) {
    this._hideBar = toBoolean(value);
  }

  get HideBar(): boolean {
    return this._hideBar;
  }

  @Input()
  set Type(value: string) {
    this._type = value;
  }

  get Type(): string {
    return this._type;
  }

  @ContentChild('tabBarExtraContent', { static: true }) _tabBarExtraContent: TemplateRef<void>;
  @ContentChildren(pgTabLabelDirective) _labelWrappers: QueryList<pgTabLabelDirective>;
  @ViewChild(pgTabsInkBarDirective, { static: true }) _inkBar: pgTabsInkBarDirective;
  @ViewChild('tabListContainer', { static: true }) _tabListContainer: ElementRef;
  @ViewChild('tabList', { static: true }) _tabList: ElementRef;

  @Input()
  set ShowPagination(value: boolean) {
    this._showPagination = toBoolean(value);
  }

  get ShowPagination(): boolean {
    return this._showPagination;
  }

  @Input()
  set PositionMode(value: TabPositionMode) {
    this._tabPositionMode = value;
    this._alignInkBarToSelectedTab();
    if (this.ShowPagination) {
      this._updatePagination();
    }
  }

  get PositionMode(): TabPositionMode {
    return this._tabPositionMode;
  }

  @Input()
  set selectedIndex(value: number) {
    this._selectedIndexChanged = this._selectedIndex !== value;

    this._selectedIndex = value;
  }

  get selectedIndex(): number {
    return this._selectedIndex;
  }

  constructor(public _elementRef: ElementRef,
              private _ngZone: NgZone,
              private _renderer: Renderer2,
              @Optional() private _dir: Directionality) {
  }

  _onContentChanges(): void {
    if (this.ShowPagination) {
      this._updatePagination();
    }
    this._alignInkBarToSelectedTab();
  }

  _scrollHeader(scrollDir: ScrollDirection): void {

    // Move the scroll distance one-third the length of the tab list's viewport.
    this.scrollDistance += (scrollDir === 'before' ? -1 : 1) * this.viewWidthHeightPix / 3;
  }

  ngAfterContentChecked(): void {
    if (this._tabLabelCount !== this._labelWrappers.length) {
      if (this.ShowPagination) {
        this._updatePagination();
      }
      this._tabLabelCount = this._labelWrappers.length;
    }
    if (this._selectedIndexChanged) {
      this._scrollToLabel(this._selectedIndex);
      if (this.ShowPagination) {
        this._checkScrollingControls();
      }
      this._alignInkBarToSelectedTab();
      this._selectedIndexChanged = false;
    }
    if (this._scrollDistanceChanged) {
      if (this.ShowPagination) {
        this._updateTabScrollPosition();
      }
      this._scrollDistanceChanged = false;
    }
  }

  ngAfterContentInit(): void {
    this._realignInkBar = this._ngZone.runOutsideAngular(() => {
      const dirChange = this._dir ? this._dir.change : observableOf(null);
      const resize = typeof window !== 'undefined' ?
        fromEvent(window, 'resize').pipe(auditTime(10)) :
        observableOf(null);
      return merge(dirChange, resize).pipe(startWith(null)).subscribe(() => {
        if (this.ShowPagination) {
          this._updatePagination();
        }
        this._alignInkBarToSelectedTab();
      });
    });
  }

  _updateTabScrollPosition(): void {
    const scrollDistance = this.scrollDistance;
    if (this.PositionMode === 'horizontal') {
      const translateX = this._getLayoutDirection() === 'ltr' ? -scrollDistance : scrollDistance;
      this._renderer.setStyle(this._tabList.nativeElement, 'transform',
        `translate3d(${translateX}px, 0, 0)`);
    } else {
      this._renderer.setStyle(this._tabList.nativeElement, 'transform',
        `translate3d(0,${-scrollDistance}px, 0)`);
    }
  }

  _updatePagination(): void {
    this._checkPaginationEnabled();
    this._checkScrollingControls();
    this._updateTabScrollPosition();
  }

  _checkPaginationEnabled(): void {
    this._showPaginationControls =
      this.tabListScrollWidthHeightPix > this.elementRefOffSetWidthHeight;

    if (!this._showPaginationControls) {
      this.scrollDistance = 0;
    }
  }

  _scrollToLabel(labelIndex: number): void {
    const selectedLabel = this._labelWrappers
      ? this._labelWrappers.toArray()[ labelIndex ]
      : null;

    if (!selectedLabel) {
      return;
    }

    // The view length is the visible width of the tab labels.

    let labelBeforePos: number;
    let labelAfterPos: number;
    if (this.PositionMode === 'horizontal') {
      if (this._getLayoutDirection() === 'ltr') {
        labelBeforePos = selectedLabel.getOffsetLeft();
        labelAfterPos = labelBeforePos + selectedLabel.getOffsetWidth();
      } else {
        labelAfterPos = this._tabList.nativeElement.offsetWidth - selectedLabel.getOffsetLeft();
        labelBeforePos = labelAfterPos - selectedLabel.getOffsetWidth();
      }
    } else {
      labelBeforePos = selectedLabel.getOffsetTop();
      labelAfterPos = labelBeforePos + selectedLabel.getOffsetHeight();
    }
    const beforeVisiblePos = this.scrollDistance;
    const afterVisiblePos = this.scrollDistance + this.viewWidthHeightPix;

    if (labelBeforePos < beforeVisiblePos) {
      // Scroll header to move label to the before direction
      this.scrollDistance -= beforeVisiblePos - labelBeforePos + EXAGGERATED_OVERSCROLL;
    } else if (labelAfterPos > afterVisiblePos) {
      // Scroll header to move label to the after direction
      this.scrollDistance += labelAfterPos - afterVisiblePos + EXAGGERATED_OVERSCROLL;
    }
  }

  _checkScrollingControls(): void {
    // Check if the pagination arrows should be activated.
    this._disableScrollBefore = this.scrollDistance === 0;
    this._disableScrollAfter = this.scrollDistance === this._getMaxScrollDistance();
  }

  /**
   * Determines what is the maximum length in pixels that can be set for the scroll distance. This
   * is equal to the difference in width between the tab list container and tab header container.
   *
   * This is an expensive call that forces a layout reflow to compute box and scroll metrics and
   * should be called sparingly.
   */
  _getMaxScrollDistance(): number {
    return (this.tabListScrollWidthHeightPix - this.viewWidthHeightPix) || 0;
  }

  /** Sets the distance in pixels that the tab header should be transformed in the X-axis. */
  set scrollDistance(v: number) {
    this._scrollDistance = Math.max(0, Math.min(this._getMaxScrollDistance(), v));

    // Mark that the scroll distance has changed so that after the view is checked, the CSS
    // transformation can move the header.
    this._scrollDistanceChanged = true;

    this._checkScrollingControls();
  }

  get scrollDistance(): number {
    return this._scrollDistance;
  }

  get viewWidthHeightPix(): number {
    let PAGINATION_PIX = 0;
    if (this._showPaginationControls) {
      PAGINATION_PIX = 64;
    }
    if (this.PositionMode === 'horizontal') {
      return this._tabListContainer.nativeElement.offsetWidth - PAGINATION_PIX;
    } else {
      return this._tabListContainer.nativeElement.offsetHeight - PAGINATION_PIX;
    }
  }

  get tabListScrollWidthHeightPix(): number {
    if (this.PositionMode === 'horizontal') {
      return this._tabList.nativeElement.scrollWidth;
    } else {
      return this._tabList.nativeElement.scrollHeight;
    }
  }

  get elementRefOffSetWidthHeight(): number {
    if (this.PositionMode === 'horizontal') {
      return this._elementRef.nativeElement.offsetWidth;
    } else {
      return this._elementRef.nativeElement.offsetHeight;
    }
  }

  _getLayoutDirection(): Direction {
    return this._dir && this._dir.value === 'rtl' ? 'rtl' : 'ltr';
  }

  _alignInkBarToSelectedTab(): void {
   
    if (this.Type !== 'fillup') {
      const selectedLabelWrapper = this._labelWrappers && this._labelWrappers.length
        ? this._labelWrappers.toArray()[ this.selectedIndex ].elementRef.nativeElement
        : null;
      if (this._inkBar) {
        this._inkBar.alignToElement(selectedLabelWrapper);
      }
    }
  }
}
