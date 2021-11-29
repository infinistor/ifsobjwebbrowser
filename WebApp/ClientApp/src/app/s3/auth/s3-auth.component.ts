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
import {Component, OnInit} from '@angular/core';
import {FormBuilder, FormGroup, Validators} from "@angular/forms";
import {Router} from "@angular/router";
import {SessionStorage} from "ngx-store";
import {environment} from "../../../environments/environment";

@Component({
	selector: 'app-s3-auth',
	templateUrl: './s3-auth.component.html',
	styleUrls: ['./s3-auth.component.scss']
})
export class S3AuthComponent implements OnInit {

	// 서비스 URL
	@SessionStorage() ServiceUrl: string = "";
	// Access Key
	@SessionStorage() AccessKey: string = "";
	// Access Secret
	@SessionStorage() AccessSecret: string = "";

	// 통신중 플래그
	inCommunication: boolean = false;

	// 로그인 폼
	formGroupLogin: FormGroup;

	// 생성자
	constructor(
		private router: Router,
		private formBuilder: FormBuilder
	) {
	}

	// 초기화
	ngOnInit() {
		this.ServiceUrl = "";
		this.AccessKey = "";
		this.AccessSecret = "";

		// 실사용환경인 경우
		if(environment.production) {
			// 폼 그룹 생성
			this.formGroupLogin = this.formBuilder.group({
				ServiceUrl: ['', [Validators.required, Validators.pattern(/(http|https):\/\/(\w+:{0,1}\w*@)?(\S+)(:[0-9]+)?(\/|\/([\w#!:.?+=&%@!\-\/]))?/)]],
				AccessKey: ['', [Validators.required]],
				AccessSecret: ['', [Validators.required]],
			});
		}
		// 개발환경인 경우
		else {
			// 폼 그룹 생성
			this.formGroupLogin = this.formBuilder.group({
				ServiceUrl: ['http://192.168.11.226:8080', [Validators.required, Validators.pattern(/(http|https):\/\/(\w+:{0,1}\w*@)?(\S+)(:[0-9]+)?(\/|\/([\w#!:.?+=&%@!\-\/]))?/)]],
				AccessKey: ['e80698bc751a901009f3', [Validators.required]],
				AccessSecret: ['9702735a51275824389b2ef9', [Validators.required]],
			});
		}
	}


	// 로그인
	onLogin(value: any) {

		this.ServiceUrl = value.ServiceUrl;
		this.AccessKey = value.AccessKey;
		this.AccessSecret = value.AccessSecret;

		this.router.navigate(['/s3/s3explorer'], { replaceUrl: true });
	}
}
