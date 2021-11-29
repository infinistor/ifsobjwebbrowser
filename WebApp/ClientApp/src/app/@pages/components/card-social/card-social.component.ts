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
    Input,
    ViewEncapsulation,
    ElementRef,
    ViewChild,
    TemplateRef,
    ContentChild,
  } from '@angular/core';

  @Component({
    selector     : 'pgcardsocial',
    encapsulation: ViewEncapsulation.None,
    templateUrl : './card-social.component.html'
  })
  export class pgCardSocial {
    _title:string = "";
    _titleClass:string = "text-complete";
    _type:string = "text";
    _comments:string = "";
    _likes:string = "";
    _body:string = "";
    _timestamp:string = "";
    _source:string = "";
    _image:string = "";
    _author:string = "";
    _activity:string = "";
    _location:string = "";

    _additionalClasses = "";
    
    @ViewChild('hostContent', { static: false }) _hostContent: ElementRef;
    @ContentChild('CustomBody', { static: true }) CustomBody: TemplateRef<void>;
    @ContentChild('AuthorAvatar', { static: true }) AuthorAvatar: TemplateRef<void>;

    @Input()
    set Title(value:string){
      this._title = value
    }

    @Input()
    set TitleClass(value:string){
      this._titleClass = value
    }

    @Input()
    set Type(value:string){
      this._type = value;
    }

    @Input()
    set Comments(value:string){
      this._comments = value;
    }

    @Input()
    set Likes(value:string){
      this._likes = value;
    }

    @Input()
    set Body(value:string){
      this._body = value;
    }

    @Input()
    set Timestamp(value:string){
      this._timestamp = value;
    }

    @Input()
    set Source(value:string){
      this._source = value;
    }

    @Input()
    set Author(value:string){
      this._author = value;
    }

    @Input()
    set Activity(value:string){
      this._activity = value;
    }

    @Input()
    set Image(value:string){
      this._image = value;
    }

    @Input()
    set Location(value:string){
      this._location = value;
    }

    @Input()
    set AdditionalClasses(value:string){
      this._additionalClasses = value;
    }
  }
