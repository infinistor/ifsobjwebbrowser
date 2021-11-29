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
import { Directive,ElementRef,HostListener,Renderer2 } from '@angular/core';
declare var pg: any;

@Directive({
	selector: '[pg-parallax]'
})
export class ParallaxDirective {

	scrollElement:any = "window";
	scrollPos = 0;
	nativeElement: any;
	coverPhotoSpeend = 0.3;
	contentSpeed = 0.17
	windowSize: any;
	constructor(private parallaxEl: ElementRef,private renderer: Renderer2) { 
		this.windowSize = window.innerWidth;
	}

	ngOnInit() {
		this.nativeElement = this.parallaxEl.nativeElement;
		this.registerPageContainerScroller();

	}
	registerPageContainerScroller(){
		if(!pg.isHorizontalLayout){
			return;
		}
		let pageContainer = document.querySelector(".page-container");
		if(pageContainer){
			this.scrollElement = pageContainer;
			this.renderer.listen(pageContainer, 'scroll', (event) => {
				this.animate();
			});
		}
	}

	@HostListener("window:resize", [])
	onResize() {
		this.windowSize = window.innerWidth;
	}

	@HostListener("window:scroll", [])
	onWindowScroll() {
		this.animate()
	}

	animate(){
		//Disable on mobile;
		if(this.windowSize = window.innerWidth < 1025){
			return;
		}
		let rect = this.nativeElement.getBoundingClientRect();
		let opacityKeyFrame = rect.width * 50 / 100;
		let direction = 'translateX';

		if (this.scrollElement == "window"){
			this.scrollPos = window.pageYOffset || document.documentElement.scrollTop;
		}
		else{
			this.scrollPos =  this.scrollElement.scrollTop;
		}
		
		direction = 'translateY';
		let styleString = direction + '(' + this.scrollPos * this.coverPhotoSpeend + 'px)';

		this.nativeElement.style.transform = styleString
		//Legacy Browsers
		this.nativeElement.style.webkitTransform = styleString
		this.nativeElement.style.mozTransform = styleString
		this.nativeElement.style.msTransform = styleString

		if (this.scrollPos > opacityKeyFrame) {
			this.nativeElement.style.opacity =  1 - this.scrollPos / 1200;
		} else {
			this.nativeElement.style.opacity = 1;
		}
	}
}
