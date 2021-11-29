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
import {Component, OnInit, ViewChild} from '@angular/core';
import {
	BeforeDownloadEventArgs,
	BeforeImageLoadEventArgs,
	FileDragEventArgs,
	FileManager,
	MenuClickEventArgs,
	MenuOpenEventArgs,
	SuccessEventArgs,
	ToolbarClickEventArgs,
	ToolbarCreateEventArgs
} from '@syncfusion/ej2-filemanager';
import {List} from "linq-collections";
import {Router} from "@angular/router";
import {SessionStorage} from "ngx-store";
import {FormBuilder, FormGroup, Validators} from "@angular/forms";
import {S3ProviderService} from "../../shared/services/data-providers/s3-provider.service";
import {finalize} from "rxjs/operators";
import {EnumResponseResult} from "../../_model/enums/enum-response-result.model";
import {MessageNotificationService} from "../../shared/services/notification.service";
import {RequestS3VersioningConfig} from "../../_model/request/s3/request-s3-versioning-config.model";
import {Grid} from "../../shared/classes/grid/grid.model";
import {ResponseS3AclGrant} from "../../_model/response/s3/response-s3-acl-grant.model";
import {ResponseS3AclGrantForGrid} from "../../_model/response/s3/response-s3-acl-grant-for-grid.model";
import {CommonKendoGridPaginateComponent} from "../../shared/components/kendo-grid-paginate/kendo-grid-paginate.component";
import {RequestS3MetadataKeyValue} from "../../_model/request/s3/request-s3-metadata.model";
import {RequestS3OperationTaggingTag} from "../../_model/request/s3/request-s3-operation-tagging.model";
import {RequestS3LifeCycleRule} from "../../_model/request/s3/request-s3-lifecycle-rule.model";
import {ResponseS3MetadataKeyValue} from "../../_model/response/s3/response-s3-object-metadata.model";
import {ResponseS3ObjectTagging} from "../../_model/response/s3/response-s3-object-tagging.model";
import {ResponseS3LifeCycleRule} from "../../_model/response/s3/response-s3-lifecycle-rule.model";
import {RequestS3AclGrant} from "../../_model/request/s3/request-s3-acl-grant.model";
import {RequestS3AclConfigUpdate} from "../../_model/request/s3/request-s3-acl-config-update.model";
import * as moment from "moment";
import {ClipboardService} from "ngx-clipboard";
import {TranslateService} from "@ngx-translate/core";
import {GridColumnConfigService} from "../../shared/services/grid-column-config.service";
import {ResponseS3VersioningInfo} from "../../_model/response/s3/response-s3-versioning-info.model";
import {CommonDialogService} from "../../shared/services/common-dialog.service";
import {DialogAction} from "@progress/kendo-angular-dialog";
import {HttpErrorResponse} from "@angular/common/http";
import {saveAs} from "@progress/kendo-file-saver";
import {RequestS3BucketPolicy} from "../../_model/request/s3/request-s3-bucket-policy.model";

@Component({
	selector: 'app-s3-explorer',
	templateUrl: './s3-explorer.component.html',
	styleUrls: ['./s3-explorer.component.scss']
})
export class S3ExplorerComponent implements OnInit {

	// 통신중 플래그
	inCommunication: boolean = false;

	// 서비스 URL
	@SessionStorage() ServiceUrl: string = "";
	// Access Key
	@SessionStorage() AccessKey: string = "";
	// Access Secret
	@SessionStorage() AccessSecret: string = "";

	// 그리드
	grid: Grid = new Grid();

	// 메타데이터 그리드
	gridMetadata: Grid = new Grid();

	// 테깅 그리드
	gridTagging: Grid = new Grid();

	// 라이프사이클 그리드
	gridLifeCycle: Grid = new Grid();

	// 버전 목록 그리드
	gridVersions: Grid = new Grid();

	// 초기화 되었는지 여부
	initialized: boolean = false;

	// 통신 설정
	ajaxSettings: object;

	// 메뉴 설정
	contextMenuSettings: object;

	// 툴바 설정
	toolbarSettings: object;

	// 업로드 설정
	uploadSettings: object;

	// 보기 모드
	viewMode: string = 'Details';

	// 마지막 상태 저장 여부
	enablePersistence: boolean = false;

	// ACL 권한 목록
	aclGrantsForGrid: ResponseS3AclGrantForGrid[] = [];

	// 메타데이터
	metadatas: ResponseS3MetadataKeyValue[];

	// 태깅
	taggings: ResponseS3ObjectTagging[];

	// 라이프사이클 정책 목록
	lifeCycleRules: ResponseS3LifeCycleRule[] = [];

	// 설정할 수 있는 최소 시간
	minDateTime: Date = new Date();

	// 다이얼로그
	public dialogOpenedCors: boolean = false;
	public dialogOpenedWebsite: boolean = false;
	public dialogOpenedAcl: boolean = false;
	public dialogOpenedVersioning: boolean = false;
	public dialogOpenedMetadata: boolean = false;
	public dialogOpenedMetadataInput: boolean = false;
	public dialogOpenedTagging: boolean = false;
	public dialogOpenedTaggingInput: boolean = false;
	public dialogOpenedLifeCycle: boolean = false;
	public dialogOpenedLifeCycleInput: boolean = false;
	public dialogOpenedShare: boolean = false;
	public dialogOpenedVersions: boolean = false;
	public dialogOpenedBucketPolicy: boolean = false;

	// 등록 폼
	formGroupCors: FormGroup;
	formGroupWebsite: FormGroup;
	formGroupVersioning: FormGroup;
	formGroupMetadata: FormGroup;
	formGroupTagging: FormGroup;
	formGroupLifeCycle: FormGroup;
	formGroupShare: FormGroup;
	formGroupBucketPolicy: FormGroup;

	// 파일 매니져 컴포넌트 객체
	@ViewChild('fileManager', { static: false }) public fileManagerInstance: FileManager;

	@ViewChild('acl_grid', { static: false })
	set aclGrid(value: CommonKendoGridPaginateComponent) {
		this.m_aclGrid = value;
		if(this.m_aclGrid) {
			// 데이터 업데이트
			this.grid.updateData(this.aclGrantsForGrid, this.aclGrantsForGrid.length);
		}
	}
	get aclGrid(): CommonKendoGridPaginateComponent {
		return this.m_aclGrid;
	}
	private m_aclGrid: CommonKendoGridPaginateComponent = null;

	@ViewChild('metadata_grid', { static: false })
	set metadataGrid(value: CommonKendoGridPaginateComponent) {
		this.m_metadataGrid = value;
		if(this.m_metadataGrid) {
			if(this.metadatas) {
				// 데이터 업데이트
				this.gridMetadata.updateData(Object.assign([], this.metadatas), this.metadatas.length);
				this.metadatas = null;
			}
		}
	}
	get metadataGrid(): CommonKendoGridPaginateComponent {
		return this.m_metadataGrid;
	}
	private m_metadataGrid: CommonKendoGridPaginateComponent = null;

	@ViewChild('tagging_grid', { static: false })
	set taggingGrid(value: CommonKendoGridPaginateComponent) {
		this.m_taggingGrid = value;
		if(this.m_taggingGrid) {
			if(this.taggings) {
				// 데이터 업데이트
				this.gridTagging.updateData(Object.assign([], this.taggings), this.taggings.length);
				this.taggings = null;
			}
		}
	}
	get taggingGrid(): CommonKendoGridPaginateComponent {
		return this.m_taggingGrid;
	}
	private m_taggingGrid: CommonKendoGridPaginateComponent = null;

	@ViewChild('lifecycle_grid', { static: false })
	set lifecycleGrid(value: CommonKendoGridPaginateComponent) {
		this.m_lifecycleGrid = value;
		if(this.m_lifecycleGrid) {
			if(this.lifeCycleRules) {
				// 데이터 업데이트
				this.gridLifeCycle.updateData(Object.assign([], this.lifeCycleRules), this.lifeCycleRules.length);
				this.lifeCycleRules = null;
			}
		}
	}
	get lifecycleGrid(): CommonKendoGridPaginateComponent {
		return this.m_lifecycleGrid;
	}
	private m_lifecycleGrid: CommonKendoGridPaginateComponent = null;

	// 생성자
	constructor(
		private router: Router,
		private gridColumnConfigService: GridColumnConfigService,
		private formBuilder: FormBuilder,
		private messageService: MessageNotificationService,
		private clipboardService: ClipboardService,
		private translateService: TranslateService,
		private commonDialogService: CommonDialogService,
		private s3Provider: S3ProviderService
	) {
	}

	// 초기화
	ngOnInit() {

		// 인증 관련 정보가 존재하는 경우
		if(this.ServiceUrl && this.AccessKey && this.AccessSecret)
		{
			const hostUrl: string = '/api/v1/S3';

			// 통신 설정
			this.ajaxSettings = {
				url: hostUrl + '/Operations',
				getImageUrl: hostUrl + '/GetImage',
				uploadUrl: hostUrl + '/Upload',
				downloadUrl: hostUrl + '/Download'
			};
			// 메뉴 설정
			this.contextMenuSettings = {
				file: ['Open','|', 'Cut', 'Copy', '|', 'Delete', 'Rename', '|', 'Details', 'Share', 'Metadata', 'Tagging', 'Versions', 'ACLSettings'],
				folder: ['Open','|', 'Cut', 'Copy', 'Paste', '|', 'Delete', 'Rename', '|', 'Details', 'Metadata', 'Tagging', '|', 'LifeCycle', 'Versions', '|', 'ACLSettings', 'CORSSettings', 'WebsiteSettings', 'VersioningSettings', 'BucketPolicy'],
				layout: ['SortBy', 'View', 'Refresh', '|', 'Paste', '|', 'NewFolder', 'Upload', '|', 'Details', '|', 'SelectAll'],
				visible: true
			};
			// 툴바 설정
			this.toolbarSettings = {
				items: [
					'Delete', 'Download', 'Rename', 'SortBy', 'Refresh', 'Selection', 'View', 'Details', 'ACLSettings', 'CORSSettings', 'WebsiteSettings', 'VersioningSettings', 'BucketPolicy', 'LifeCycle'
				]
			};
			// 업로드 설정
			this.uploadSettings = {
				//autoUpload: false,
				maxFileSize: 5e+8,
			}

			// 보기 모드 설정
			this.viewMode = "Details";

			// 폼 그룹 생성
			this.formGroupCors = this.formBuilder.group({
				BucketName: ['', [Validators.required]],
				Cors: ['', [Validators.required]],
			});
			this.formGroupWebsite = this.formBuilder.group({
				BucketName: ['', [Validators.required]],
				Enable: [true, [Validators.required]],
				ErrorDocument: ['', [Validators.required]],
				IndexDocumentSuffix: ['', [Validators.required]],
			});
			this.formGroupVersioning = this.formBuilder.group({
				BucketName: ['', [Validators.required]],
				Enable: [false, [Validators.required]],
			});
			this.formGroupMetadata = this.formBuilder.group({
				Key: ['', [Validators.required]],
				Value: ['', [Validators.required]],
			});
			this.formGroupTagging = this.formBuilder.group({
				Key: ['', [Validators.required]],
				Value: ['', [Validators.required]],
			});
			this.formGroupLifeCycle = this.formBuilder.group({
				Id: ['', [Validators.required]],
				Prefix: ['', []],
				Days: [0, [Validators.required, Validators.min(1)]],
			});
			this.formGroupShare = this.formBuilder.group({
				Path: ['', [Validators.required]],
				Name: ['', [Validators.required]],
				Expiration: [moment().add(30, 'days').toDate(), [Validators.required]],
				ShareUrl: ['', [Validators.required]]
			});
			this.formGroupBucketPolicy = this.formBuilder.group({
				BucketName: ['', [Validators.required]],
				Policy: ['', []],
			});

		}
		// 인증 관련 정보가 존재하지 않는 경우
		else {
			this.router.navigateByUrl('/s3');
		}
	}

	/**
	 * 파일 매니져 생성시 발생하는 이벤트
	 * @param args
	 */
	onCreated(args: any) {

		// 폴더 업로드가 가능하도록 설정
		this.fileManagerInstance.uploadObj.directoryUpload = null;
		//this.fileManagerInstance.uploadObj.sequentialUpload = true;
	}

	/**
	 * 통신 전에 발생하는 이벤트
	 * @param args
	 */
	onBeforeSend(args: any){
		const serviceUrl: string = this.ServiceUrl;
		const accessKey: string = this.AccessKey;
		const accessSecret: string = this.AccessSecret;
		args.ajaxSettings.beforeSend = function (sender: any) {
			sender.httpRequest.setRequestHeader("s3-service-url", serviceUrl);
			sender.httpRequest.setRequestHeader("s3-access-key", accessKey);
			sender.httpRequest.setRequestHeader("s3-access-secret", accessSecret);
		}
	}

	/**
	 * 다운로드 전에 발생하는 이벤트
	 * @param args 다운로드 이벤트 객체
	 */
	onBeforeDownload(args: BeforeDownloadEventArgs){
		if(args && args.data) {
			(<any>args.data).serviceUrl = this.ServiceUrl;
			(<any>args.data).accessKey = this.AccessKey;
			(<any>args.data).accessSecret = this.AccessSecret;
		}
	}

	/**
	 * 이미지 로드 전에 발생하는 이벤트
	 * @param args 이미지 로드 이벤트 객체
	 */
	onBeforeImageLoad(args: BeforeImageLoadEventArgs){
		if(args && args.imageUrl) {
			args.imageUrl = args.imageUrl + "&serviceUrl=" + this.ServiceUrl + "&accessKey=" + this.AccessKey + "&accessSecret=" + this.AccessSecret;
		}
	}

	/**
	 * 통신 성공 시 발생하는 이벤트
	 * @param args
	 */
	onSuccess(args: SuccessEventArgs){

		if(args.action === "read") {
			const result: any = args.result;

			// 현재 폴더가 서버인 경우
			if(result.cwd.filterPath === null) {
				this.fileManagerInstance.uploadObj.enabled = false;
				this.fileManagerInstance.disableToolbarItems(['CORSSettings', 'WebsiteSettings', 'VersioningSettings', 'BucketPolicy', 'LifeCycle']);
			}
			// 현재 폴더가 서버가 아닌 경우
			else {
				this.fileManagerInstance.uploadObj.enabled = true;

				// 버킷 노드인 경우
				if(result.cwd.filterPath === '/') {
					this.fileManagerInstance.enableToolbarItems(['CORSSettings', 'WebsiteSettings', 'VersioningSettings', 'BucketPolicy', 'LifeCycle']);
				}
				// 버킷 노드가 아닌 경우
				else {
					this.fileManagerInstance.disableToolbarItems(['CORSSettings', 'WebsiteSettings', 'VersioningSettings', 'BucketPolicy', 'LifeCycle']);
				}
			}
		}
	}

	/**
	 * 메뉴 오픈 시 발생하는 이벤트
	 * @param args 메뉴 오픈 이벤트 객체
	 */
	onMenuOpen(args: MenuOpenEventArgs) {
		// 이벤트 객체와 파일 상세가 유효한 경우
		if(args && args.fileDetails) {
			// 첫번째 파일 정보를 가져온다.
			const currentObject: any = (<any>args.fileDetails[0]);

			// 파일/폴더 영역 메뉴인 경우
			if(args.menuType === "folder" || args.menuType === "file") {

				// 모든 메뉴에 대해서 처리
				for(let i = 0; i < args.items.length; i++) {
					switch (args.items[i].text) {
						case 'Versions':
							args.items[i].iconCss = 'fas fa-history';
							break;
						case 'CORSSettings':
						case 'ACLSettings':
						case 'WebsiteSettings':
						case 'VersioningSettings':
							args.items[i].text = args.items[i].text.replace('Settings', ' Settings');
							args.items[i].iconCss = 'fas fa-cog';
							break;
						case 'BucketPolicy':
							args.items[i].text = args.items[i].text.replace('Policy', ' Policy');
							args.items[i].iconCss = 'fas fa-shield-alt';
							break;
						case 'Metadata':
							args.items[i].iconCss = 'fas fa-info-circle';
							break;
						case 'Tagging':
							args.items[i].iconCss = 'fas fa-tags';
							break;
						case 'LifeCycle':
							args.items[i].text = 'Life Cycle';
							args.items[i].iconCss = 'fas fa-spinner';
							break;
						case 'Share':
							args.items[i].iconCss = 'fas fa-share-square';
							break;
					}
				}

				// 서버인 경우
				if(currentObject.filterPath === null && currentObject.isFile === false)
					args.cancel = true;
				// 버킷인 경우
				else if(currentObject.filterPath === '/' && currentObject.isFile === false) {
					this.fileManagerInstance.disableMenuItems(['Cut', 'Copy', 'Rename', 'Download', 'Details', 'Metadata']);
				}
				// 그외
				else {
					this.fileManagerInstance.disableMenuItems([ 'CORSSettings', 'WebsiteSettings', 'VersioningSettings', 'BucketPolicy', 'LifeCycle' ]);
				}
			}
			// 레이아웃 영역 메뉴인 경우
			else {

				// 모든 메뉴에 대해서 처리
				for(var j = 0; j < args.items.length; j++) {
					switch (args.items[j].text) {
						case 'Metadata':
							args.items[j].iconCss = 'fas fa-info-circle';
							break;
						case 'Tagging':
							args.items[j].iconCss = 'fas fa-tags';
							break;
						case 'LifeCycle':
							args.items[j].text = 'Life Cycle';
							args.items[j].iconCss = 'fas fa-history';
							break;
						case 'ACLSettings':
							args.items[j].text = args.items[j].text.replace('Settings', ' Settings');
							args.items[j].iconCss = 'fas fa-cog';
							break;
						case 'BucketPolicy':
							args.items[j].text = args.items[j].text.replace('Policy', ' Policy');
							args.items[j].iconCss = 'fas fa-shield-alt';
							break;
					}
				}

				// 서버 및 버킷 폴더인 경우, 메뉴가 나오지 않도록 수정
				if(currentObject.filterPath === null && currentObject.isFile === false)
					this.fileManagerInstance.disableMenuItems(['Upload', 'Paste', 'Details']);
				// 버킷인 경우
				else if(currentObject.filterPath === '/' && currentObject.isFile === false)
					this.fileManagerInstance.disableMenuItems(['Details']);
			}
		}
	}

	/**
	 * 메뉴 클릭 시 발생하는 이벤트
	 * @param args 메뉴 클릭 이벤트 객체
	 */
	onMenuClick(args: MenuClickEventArgs) {

		if(args.fileDetails.length <= 0) return;

		let bucketName: string = '';
		let path: string = '';
		let itemName: string = '';

		// 첫번째 파일 정보를 가져온다.
		const currentObject: any = (<any>args.fileDetails[0]);

		// 최상위 경로인 경우
		if(currentObject.filterPath === '/') {
			switch (args.item.text) {
				case 'CORS Settings':
				case 'Website Settings':
				case 'Versioning Settings':
				case 'Life Cycle':
					bucketName = currentObject.name;
					break;
				case 'ACL Settings':
				case 'Versions':
				case 'Tagging':
					path = currentObject.filterPath;
					itemName = currentObject.name;
					break;
			}
		}
		// 최상위 경로가 아닌 경우
		else {
			// 경로를 분해한다.
			const pathItems: string[] = currentObject.filterPath ? new List<string>(currentObject.filterPath.split('/')).where(i => !i.isEmpty()).toArray() : [];

			// 버킷 정보가 존재하는 경우
			if(pathItems && pathItems.length > 0) {
				switch (args.item.text) {
					case 'CORS Settings':
					case 'Website Settings':
					case 'Versioning Settings':
					case 'Life Cycle':
					case 'Bucket Policy':
						bucketName = pathItems[0];
						break;
					case 'Share':
					case 'ACL Settings':
					case 'Versions':
					case 'Metadata':
					case 'Tagging':
						path = currentObject.filterPath;
						itemName = currentObject.name;
						break;
				}
			}
		}

		switch (args.item.text) {
			case 'CORS Settings':
				this.showCors(bucketName);
				break;
			case 'ACL Settings':
				this.showAcl(path, itemName);
				break;
			case 'Versions':
				this.showVersions(path, itemName);
				break;
			case 'Website Settings':
				this.showWebSite(bucketName);
				break;
			case 'Versioning Settings':
				this.showVersioning(bucketName);
				break;
			case 'Bucket Policy':
				this.showBucketPolicy(bucketName);
				break;
			case 'Metadata':
				this.showMetadata(path, itemName);
				break;
			case 'Tagging':
				this.showTagging(path, itemName);
				break;
			case 'Life Cycle':
				this.showLifeCycle(bucketName);
				break;
			case 'Share':
				this.showShare(path, itemName);
				break;
		}
	}

	/**
	 * 드래그 시작 시 발생하는 이벤트
	 * @param args 드래그 이벤트 객체
	 */
	onFileDragStart(args: FileDragEventArgs) {
		if(args && args.fileDetails) {
			if(new List<any>(args.fileDetails).where(i => i.filterPath === '/').any())
				args.cancel = true;
		}
	}

	/**
	 * 파일/폴더 선택/선택해제 시 발생하는 이벤트
	 * @param args 드래그 이벤트 객체
	 */
	onFileSelect(args: any) {

		let enabled: boolean = false;

		// 상위 경로가 '/'인 경우 (버킷 선택)
		if(args.fileDetails.filterPath === '/') {
			// 선택된 항목이 존재하는 경우
			if(this.fileManagerInstance.selectedItems.length > 0)
				enabled = true;
		}
		// 상위 경로가 '/'이 아닌 경우 (버킷이 아닌 경우)
		else {
			// 경로를 분해한다.
			let pathItems: string[] = [];
			if(args.fileDetails instanceof Array)
				pathItems = args.fileDetails[0].filterPath ? new List<string>(args.fileDetails[0].filterPath.split('/')).where(i => !i.isEmpty()).toArray() : [];
			else
				pathItems = args.fileDetails.filterPath ? new List<string>(args.fileDetails.filterPath.split('/')).where(i => !i.isEmpty()).toArray() : [];

			// 경로가 버킷인 경우
			if(pathItems.length === 1) {
				// 선택된 항목이 존재하지 않는 경우
				if(this.fileManagerInstance.selectedItems.length <= 0)
					enabled = true;
			}
		}

		// 툴바 활성화가 필요한 경우
		if(enabled) {
			this.fileManagerInstance.enableToolbarItems(['CORSSettings', 'WebsiteSettings', 'VersioningSettings', 'BucketPolicy', 'LifeCycle']);
		}
		// 툴바 비활성화가 필요한 경우
		else {
			this.fileManagerInstance.disableToolbarItems(['CORSSettings', 'WebsiteSettings', 'VersioningSettings', 'BucketPolicy', 'LifeCycle']);
		}
	}

	/**
	 * 툴바 생성 시 발생하는 이벤트
	 * @param args 툴바 생성 이벤트 객체
	 */
	onToolbarCreate(args: ToolbarCreateEventArgs) {
		// 툴바의 모든 항목에 대해서 처리
		for(var i = 0; i < args.items.length; i++) {
			switch(args.items[i].text) {
				case 'CORSSettings':
				case 'ACLSettings':
				case 'WebsiteSettings':
				case 'VersioningSettings':
					args.items[i].text = args.items[i].text.replace('Settings', ' Settings');
					args.items[i].tooltipText = args.items[i].text;
					args.items[i].prefixIcon= 'fas fa-cog';
					break;
				case 'BucketPolicy':
					args.items[i].text = args.items[i].text.replace('Policy', ' Policy');
					args.items[i].tooltipText = args.items[i].text;
					args.items[i].prefixIcon= 'fas fa-shield-alt';
					break;
				case 'Metadata':
					args.items[i].prefixIcon = 'fas fa-info-circle';
					break;
				case 'Tagging':
					args.items[i].prefixIcon = 'fas fa-tags';
					break;
				case 'LifeCycle':
					args.items[i].text = 'Life Cycle';
					args.items[i].prefixIcon = 'fas fa-history';
					break;
			}
		}
	}

	/**
	 * 툴바 클릭 시 발생하는 이벤트
	 * @param args 툴바 클릭 이벤트 객체
	 */
	onToolbarClick(args: ToolbarClickEventArgs) {

		let filterPath: string = '';
		let name: string = '';

		// 파일 상세 정보가 존재하지 않는 경우
		if(args.fileDetails.length <= 0) {
			// 경로를 분해한다.
			const pathItems: string[] = new List<string>(this.fileManagerInstance.path.split('/')).where(i => !i.isEmpty()).toArray();

			// 경로가 1 뎁스 경우 (버킷 경로)
			if (pathItems.length === 1) {
				filterPath = '/';
				name = pathItems[pathItems.length - 1];
			}
			// 경로가 2 뎁스 이상인 경우
			else if(pathItems.length > 1) {
				filterPath = pathItems.filter((value, index) => index < pathItems.length - 1).join('/');
				name = pathItems[pathItems.length - 1];
			}
			else
				return;
		}
		// 파일 상세 정보가 존재하는 경우
		else {

			// 첫번째 파일 정보를 가져온다.
			const currentObject: any = (<any>args.fileDetails[0]);

			filterPath = currentObject.filterPath;
			name = currentObject.name;
		}

		let bucketName: string = '';
		let path: string = '';
		let itemName: string = '';

		// 최상위 경로인 경우
		if(filterPath === '/') {
			switch (args.item.text) {
				case 'CORS Settings':
				case 'Website Settings':
				case 'Versioning Settings':
				case 'Bucket Policy':
				case 'Life Cycle':
					bucketName = name;
					break;
				case 'ACL Settings':
				case 'Versions':
					path = filterPath;
					itemName = name;
					break;
			}
		}
		// 최상위 경로가 아닌 경우
		else {
			// 경로를 분해한다.
			const pathItems: string[] = filterPath ? new List<string>(filterPath.split('/')).where(i => !i.isEmpty()).toArray() : [];

			// 버킷 정보가 존재하는 경우
			if(pathItems && pathItems.length > 0) {
				switch (args.item.text) {
					case 'CORS Settings':
					case 'Website Settings':
					case 'Versioning Settings':
					case 'Bucket Policy':
						bucketName = pathItems[0];
						break;
					case 'ACL Settings':
					case 'Versions':
						path = filterPath;
						itemName = name;
						break;
				}
			}
		}

		// 버킷 정보가 존재하는 경우
		if(args.item.text) {
			switch (args.item.text) {
				case 'CORS Settings':
					this.showCors(bucketName);
					break;
				case 'ACL Settings':
					this.showAcl(path, itemName);
					break;
				case 'Versions':
					this.showVersions(path, itemName);
					break;
				case 'Website Settings':
					this.showWebSite(bucketName);
					break;
				case 'Versioning Settings':
					this.showVersioning(bucketName);
					break;
				case 'Bucket Policy':
					this.showBucketPolicy(bucketName);
					break;
				case 'Life Cycle':
					this.showLifeCycle(bucketName);
					break;
			}
		}
	}

	/**
	 * CORS 설정 다이얼로그를 표시한다.
	 * @param bucketName 버킷명
	 */
	showCors(bucketName: string) {
		this.inCommunication = true;

		// CORS 설정을 가져온다.
		this.s3Provider.getCorsSettings(this.ServiceUrl, this.AccessKey, this.AccessSecret, bucketName)
			.pipe(
				finalize(() => {
					this.inCommunication = false;
				})
			)
			.subscribe(response => {

				if (response.Result === EnumResponseResult.Success) {

					// 버킷명을 설정한다.
					this.formGroupCors.controls['BucketName'].setValue(bucketName);

					if(response.Data)
						this.formGroupCors.controls['Cors'].setValue(JSON.stringify(response.Data, null, 4));
					else
						this.formGroupCors.controls['Cors'].setValue('');

					this.dialogOpenedCors = true;
				}
				else if (response.Result === EnumResponseResult.Warning) {
					this.messageService.warning(response.Message);
				}
				else if (response.Result === EnumResponseResult.Error) {
					this.messageService.error(response.Message);
				}
			});
	}

	/**
	 * CORS 설정을 수정한다.
	 * @param value CORS 설정 값 객체
	 */
	updateCors(value: any) {
		this.inCommunication = true;

		// CORS 설정을 수정한다.
		this.s3Provider.updateCorsSettings(this.ServiceUrl, this.AccessKey, this.AccessSecret, value.BucketName, value.Cors)
			.pipe(
				finalize(() => {
					this.inCommunication = false;
				})
			)
			.subscribe(response => {

				if (response.Result === EnumResponseResult.Success) {

					this.dialogOpenedCors = false
				}
				else if (response.Result === EnumResponseResult.Warning) {
					this.messageService.warning(response.Message);
				}
				else if (response.Result === EnumResponseResult.Error) {
					this.messageService.error(response.Message);
				}
			});
	}

	// ACL을 처리 중인 경로
	pathForAcl: string = '';
	// ACL을 처리 중인 아이템명
	itemNameForAcl: string = '';

	/**
	 * ACL 설정 다이얼로그를 표시한다.
	 * @param path 경로
	 * @param itemName 선택한 아이템명
	 */
	showAcl(path: string, itemName: string) {
		// 그리드 세팅
		this.setGridBase();
		this.setGridColums();

		this.inCommunication = true;

		this.aclGrantsForGrid = [];

		// ACL 설정을 가져온다.
		this.s3Provider.getAclSettings(this.ServiceUrl, this.AccessKey, this.AccessSecret, path, itemName)
			.pipe(
				finalize(() => {
					this.inCommunication = false;
				})
			)
			.subscribe(response => {

				if (response.Result === EnumResponseResult.Success) {

					this.pathForAcl = path;
					this.itemNameForAcl = itemName;

					// 응답으로 받은 모든 권한을 List 형태로 저장한다.
					const responseGrants = new List<ResponseS3AclGrant>(response.Data.Items);
					// 권한 대상별로 그룹핑한다.
					const permissionsByTarget = responseGrants.groupBy(i => i.Grantee.Type + "|" + i.Grantee.DisplayName + "|" + i.Grantee.EmailAddress + "|" + i.Grantee.CanonicalUser + "|" + i.Grantee.URI).toArray();
					// 모든 권한 대상에 대해 처리
					const grants: ResponseS3AclGrant[] = [];
					for(const permission of permissionsByTarget) {
						// 응답으로 받은 권한 값 중에 해당 대상의 권한 첫번째 객체를 가져온다.
						const grant: ResponseS3AclGrant = responseGrants.where(i => i.Grantee.Type + "|" + i.Grantee.DisplayName + "|" + i.Grantee.EmailAddress + "|" + i.Grantee.CanonicalUser + "|" + i.Grantee.URI === permission.key).firstOrDefault();
						// 객체가 존재하는 경우
						if(grant) {
							// 권한 목록이 1개인 경우, 첫번째 권한 문자열을 저장한다.
							if(permission.value.count() == 1)
								grant.Permission = permission.value.select(i => i.Permission).firstOrDefault();
							// 권한 목록이 1개를 초과하는 경우, 모든 권한 문자열을 ","로 연결하여 저장한다.
							else
								grant.Permission = permission.value.select(i => i.Permission).aggregate((cur, next)=> cur ? cur + "," + next : next);

							// 처리할 권한 목록에 추가
							grants.push(grant);
						}
					}

					// 모든 권한 결과를 그리드에 표시하기 편한 객체로 변환하여 추가한다.
					for(const grant of grants) {
						this.aclGrantsForGrid.push(new ResponseS3AclGrantForGrid(grant));
					}

					this.dialogOpenedAcl = true
				}
				else if (response.Result === EnumResponseResult.Warning) {
					this.messageService.warning(response.Message);
				}
				else if (response.Result === EnumResponseResult.Error) {
					this.messageService.error(response.Message);
				}
			});
	}

	/**
	 * 버전 목록 다이얼로그를 표시한다.
	 * @param path 경로
	 * @param itemName 선택한 아이템명
	 */
	showVersions(path: string, itemName: string) {
		// 그리드 세팅
		this.setGridVersions(path, itemName);
		this.setGridVersionsColums();

		this.inCommunication = true;

		// 버전 목록을 가져온다.
		this.s3Provider.getVersions(this.ServiceUrl, this.AccessKey, this.AccessSecret, path, itemName)
			.pipe(
				finalize(() => {
					this.inCommunication = false;
				})
			)
			.subscribe(response => {

				if (response.Result === EnumResponseResult.Success) {

					// 데이터 업데이트
					this.gridVersions.items = new List<ResponseS3VersioningInfo>(response.Data.Items)
						.orderBy(i => i.ParentPath)
						.thenBy(i => i.Name)
						.toArray();
					this.gridVersions.clearSelection();

					this.dialogOpenedVersions = true;
				}
				else if (response.Result === EnumResponseResult.Warning) {
					this.messageService.warning(response.Message);
				}
				else if (response.Result === EnumResponseResult.Error) {
					this.messageService.error(response.Message);
				}
			});
	}

	/**
	 * ACL 설정을 수정한다.
	 * @param value ACL 설정 값 객체
	 */
	updateAcl(value: ResponseS3AclGrantForGrid[]) {
		// ACL 권한 목록이 유효한 경우
		if(value) {

			this.inCommunication = true;

			const grants: RequestS3AclGrant[] = [];

			// 모든 권한에 대해서 처리
			for(const grant of this.aclGrantsForGrid) {
				const items: string[] = grant.Id.split('|');
				if(items.length == 2) {
					const requestGrant: RequestS3AclGrant = new RequestS3AclGrant();
					switch(items[0]) {
						case 'CanonicalUser':
							requestGrant.Grantee.CanonicalUser = items[1];
							break;
						case 'Group':
							requestGrant.Grantee.URI = items[1];
							break;
						case 'EmailAddress':
							requestGrant.Grantee.EmailAddress = items[1];
							break;
					}
					if(grant.Read && grant.Write)
						requestGrant.Permission = "FULL_CONTROL";
					else if(grant.Read)
						requestGrant.Permission = "READ";
					else if(grant.Write)
						requestGrant.Permission = "WRITE";

					grants.push(requestGrant);
				}
			}

			const request: RequestS3AclConfigUpdate = new RequestS3AclConfigUpdate();
			request.Path = this.pathForAcl;
			request.Name = this.itemNameForAcl;
			request.Grants = grants;

			// ACL 설정을 수정한다.
			this.s3Provider.updateAclSettings(this.ServiceUrl, this.AccessKey, this.AccessSecret, request)
				.pipe(
					finalize(() => {
						this.inCommunication = false;
					})
				)
				.subscribe(response => {

					if (response.Result === EnumResponseResult.Success) {

						this.dialogOpenedAcl = false
					}
					else if (response.Result === EnumResponseResult.Warning) {
						this.messageService.warning(response.Message);
					}
					else if (response.Result === EnumResponseResult.Error) {
						this.messageService.error(response.Message);
					}
				});
		}
	}

	/**
	 * WebSite 설정 다이얼로그를 표시한다.
	 * @param bucketName 버킷명
	 */
	showWebSite(bucketName: string) {
		this.inCommunication = true;

		// WebSite 설정을 가져온다.
		this.s3Provider.getWebSiteSettings(this.ServiceUrl, this.AccessKey, this.AccessSecret, bucketName)
			.pipe(
				finalize(() => {
					this.inCommunication = false;
				})
			)
			.subscribe(response => {

				if (response.Result === EnumResponseResult.Success) {

					// 설정 데이터가 존재하는 경우
					if(response.Data.ErrorDocument || response.Data.IndexDocumentSuffix) {
						this.formGroupWebsite.reset(response.Data);
						this.formGroupWebsite.controls['Enable'].setValue(true);
					}
					// 설정데이터가 존재하지 않는 경우
					else {
						this.formGroupWebsite.controls['ErrorDocument'].setValue('');
						this.formGroupWebsite.controls['IndexDocumentSuffix'].setValue('');
						this.formGroupWebsite.controls['Enable'].setValue(false);
					}

					// 버킷명을 설정한다.
					this.formGroupWebsite.controls['BucketName'].setValue(bucketName);

					this.dialogOpenedWebsite = true
				}
				else if (response.Result === EnumResponseResult.Warning) {
					this.messageService.warning(response.Message);
				}
				else if (response.Result === EnumResponseResult.Error) {
					this.messageService.error(response.Message);
				}
			});
	}

	/**
	 * WebSite 설정을 수정한다.
	 */
	updateWebSite() {
		this.inCommunication = true;

		// WebSite 설정을 수정한다.
		this.s3Provider.updateWebSiteSettings(this.ServiceUrl, this.AccessKey, this.AccessSecret, this.formGroupWebsite.controls['BucketName'].value, this.formGroupWebsite.controls['Enable'].value ? this.formGroupWebsite.value : null)
			.pipe(
				finalize(() => {
					this.inCommunication = false;
				})
			)
			.subscribe(response => {

				if (response.Result === EnumResponseResult.Success) {

					this.dialogOpenedWebsite = false
				}
				else if (response.Result === EnumResponseResult.Warning) {
					this.messageService.warning(response.Message);
				}
				else if (response.Result === EnumResponseResult.Error) {
					this.messageService.error(response.Message);
				}
			});
	}

	/**
	 * 웹사이트 설정 활성화 변경 시 발생하는 이벤트
	 * @param value 활성화 값
	 */
	onWebSiteEnableChanged(value: boolean) {
		// 활성화인 경우
		if(value) {
			this.formGroupWebsite.controls['ErrorDocument'].setValidators([Validators.required]);
			this.formGroupWebsite.controls['IndexDocumentSuffix'].setValidators([Validators.required]);
		}
		// 비활성화인 경우
		else {
			this.formGroupWebsite.controls['ErrorDocument'].setValidators([]);
			this.formGroupWebsite.controls['IndexDocumentSuffix'].setValidators([]);
		}
	}

	/**
	 * 버킷 정책 설정 다이얼로그를 표시한다.
	 * @param bucketName 버킷명
	 */
	showBucketPolicy(bucketName: string) {
		this.inCommunication = true;

		// 버킷 정책 설정을 가져온다.
		this.s3Provider.getBucketPolicy(this.ServiceUrl, this.AccessKey, this.AccessSecret, bucketName)
			.pipe(
				finalize(() => {
					this.inCommunication = false;
				})
			)
			.subscribe(response => {

				if (response.Result === EnumResponseResult.Success) {

					// 정책을 설정한다.
					this.formGroupBucketPolicy.controls['BucketName'].setValue(bucketName);

					if(response.Data)
						this.formGroupBucketPolicy.controls['Policy'].setValue(response.Data);
					else
						this.formGroupBucketPolicy.controls['Policy'].setValue('');

					this.dialogOpenedBucketPolicy = true;
				}
				else if (response.Result === EnumResponseResult.Warning) {
					this.messageService.warning(response.Message);
				}
				else if (response.Result === EnumResponseResult.Error) {
					this.messageService.error(response.Message);
				}
			});
	}

	/**
	 * 버킷 정책 설정을 수정한다.
	 * @param value Versioning 설정 값 객체
	 */
	updateBucketPolicy(value: any) {
		this.inCommunication = true;

		const config: RequestS3BucketPolicy = new RequestS3BucketPolicy();
		config.Policy = this.formGroupBucketPolicy.controls['Policy'].value;

		// 버킷 정책 설정을 수정한다.
		this.s3Provider.updateBucketPolicy(this.ServiceUrl, this.AccessKey, this.AccessSecret, this.formGroupBucketPolicy.controls['BucketName'].value, config)
			.pipe(
				finalize(() => {
					this.inCommunication = false;
				})
			)
			.subscribe(response => {

				if (response.Result === EnumResponseResult.Success) {

					this.dialogOpenedBucketPolicy = false
				}
				else if (response.Result === EnumResponseResult.Warning) {
					this.messageService.warning(response.Message);
				}
				else if (response.Result === EnumResponseResult.Error) {
					this.messageService.error(response.Message);
				}
			});
	}

	/**
	 * Versioning 설정 다이얼로그를 표시한다.
	 * @param bucketName 버킷명
	 */
	showVersioning(bucketName: string) {
		this.inCommunication = true;

		// WebSite 설정을 가져온다.
		this.s3Provider.getVersioningSettings(this.ServiceUrl, this.AccessKey, this.AccessSecret, bucketName)
			.pipe(
				finalize(() => {
					this.inCommunication = false;
				})
			)
			.subscribe(response => {

				if (response.Result === EnumResponseResult.Success) {

					if(response.Data.Enable)
						this.formGroupVersioning.controls['Enable'].setValue(true);
					else
						this.formGroupVersioning.controls['Enable'].setValue(false);

					// 버킷명을 설정한다.
					this.formGroupVersioning.controls['BucketName'].setValue(bucketName);

					this.dialogOpenedVersioning = true
				}
				else if (response.Result === EnumResponseResult.Warning) {
					this.messageService.warning(response.Message);
				}
				else if (response.Result === EnumResponseResult.Error) {
					this.messageService.error(response.Message);
				}
			});
	}

	/**
	 * Versioning 설정을 수정한다.
	 * @param value Versioning 설정 값 객체
	 */
	updateVersioning(value: any) {
		this.inCommunication = true;

		const config: RequestS3VersioningConfig = new RequestS3VersioningConfig();

		if(this.formGroupVersioning.controls['Enable'].value)
			config.Enable = true;
		else
			config.Enable = false;

		// WebSite 설정을 수정한다.
		this.s3Provider.updateVersioningSettings(this.ServiceUrl, this.AccessKey, this.AccessSecret, this.formGroupVersioning.controls['BucketName'].value, config)
			.pipe(
				finalize(() => {
					this.inCommunication = false;
				})
			)
			.subscribe(response => {

				if (response.Result === EnumResponseResult.Success) {

					this.dialogOpenedVersioning = false
				}
				else if (response.Result === EnumResponseResult.Warning) {
					this.messageService.warning(response.Message);
				}
				else if (response.Result === EnumResponseResult.Error) {
					this.messageService.error(response.Message);
				}
			});
	}

	// 메타데이터를 처리 중인 경로
	pathForMetadata: string = '';
	// 메타데이터를 처리 중인 아이템명
	itemNameForMetadata: string = '';

	/**
	 * 메타데이터 정보 다이얼로그를 표시한다.
	 * @param path 경로
	 * @param itemName 선택한 아이템명
	 */
	showMetadata(path: string, itemName: string) {

		this.setGridMetadata();
		this.setGridMetadataColums();

		this.inCommunication = true;

		this.metadatas = [];

		// Metadata 정보를 가져온다.
		this.s3Provider.getMetadata(this.ServiceUrl, this.AccessKey, this.AccessSecret, path, itemName)
			.pipe(
				finalize(() => {
					this.inCommunication = false;
				})
			)
			.subscribe(response => {

				if (response.Result === EnumResponseResult.Success) {

					this.pathForMetadata = path;
					this.itemNameForMetadata = itemName;

					for(const item of response.Data.Metadata)
						this.metadatas.push(Object.assign(new ResponseS3MetadataKeyValue(), item));

					this.dialogOpenedMetadata = true
				}
				else if (response.Result === EnumResponseResult.Warning) {
					this.messageService.warning(response.Message);
				}
				else if (response.Result === EnumResponseResult.Error) {
					this.messageService.error(response.Message);
				}
			});
	}

	/**
	 * 메타데이터 정보를 수정한다.
	 */
	updateMetadata() {
		this.inCommunication = true;

		const values: RequestS3MetadataKeyValue[] = [];
		for(const metadata of this.gridMetadata.items)
			values.push(Object.assign(new RequestS3MetadataKeyValue(), metadata));

		// Metadata 정보를 수정한다.
		this.s3Provider.updateMetadata(this.ServiceUrl, this.AccessKey, this.AccessSecret, this.pathForMetadata, this.itemNameForMetadata, values)
			.pipe(
				finalize(() => {
					this.inCommunication = false;
				})
			)
			.subscribe(response => {

				if (response.Result === EnumResponseResult.Success) {

					this.dialogOpenedMetadata = false
				}
				else if (response.Result === EnumResponseResult.Warning) {
					this.messageService.warning(response.Message);
				}
				else if (response.Result === EnumResponseResult.Error) {
					this.messageService.error(response.Message);
				}
			});
	}

	selectedMetadataItem: ResponseS3MetadataKeyValue = null;

	/**
	 * 메타데이터 정책 추가
	 */
	addMetadataItem() {
		this.selectedMetadataItem = null;
		this.formGroupMetadata.reset(new ResponseS3LifeCycleRule());
		this.dialogOpenedMetadataInput = true;
	}

	/**
	 * 메타데이터 정책 수정
	 */
	updateMetadataItem() {
		// 선택된 항목이 존재하는 경우
		if(this.gridMetadata.selectedKeys.length > 0) {
			this.selectedMetadataItem = this.gridMetadata.selectedItems[0];
			this.formGroupMetadata.reset(this.selectedMetadataItem);
			this.dialogOpenedMetadataInput = true;
		}
	}

	/**
	 * 메타데이터 정책 삭제
	 */
	removeMetadataItem() {
		// 선택된 항목이 존재하는 경우
		if(this.gridMetadata.selectedKeys.length > 0) {
			this.gridMetadata.items = this.gridMetadata.items.filter((item) => item.Key !== this.gridMetadata.selectedKeys[0]);
			this.gridMetadata.updateGridView();
			this.gridMetadata.clearSelection();
			this.gridMetadata.selectByIndex(0);
		}
	}

	/**
	 * 메타데이터 항목 저장
	 */
	saveMetadataItem() {
		// 선택된 항목이 존재하는 경우, 업데이트
		if(this.selectedMetadataItem) {
			this.selectedMetadataItem.Key = this.formGroupMetadata.controls['Key'].value;
			this.selectedMetadataItem.Value = this.formGroupMetadata.controls['Value'].value;
		}
		// 선택된 항목이 존재하지 않은 경우, 추가
		else {
			const metadata: ResponseS3MetadataKeyValue = new ResponseS3MetadataKeyValue();
			metadata.Key = this.formGroupMetadata.controls['Key'].value;
			metadata.Value = this.formGroupMetadata.controls['Value'].value;
			this.gridMetadata.items.push(metadata);
		}
		this.gridMetadata.updateGridView();
		this.dialogOpenedMetadataInput = false;
	}

	// 태깅을 처리 중인 경로
	pathForTagging: string = '';
	// 태깅을 처리 중인 아이템명
	itemNameForTagging: string = '';

	/**
	 * 태깅 정보 다이얼로그를 표시한다.
	 * @param path 경로
	 * @param itemName 선택한 아이템명
	 */
	showTagging(path: string, itemName: string) {
		this.setGridTagging();
		this.setGridTaggingColums();

		this.inCommunication = true;

		this.taggings = [];

		// 태깅 정보를 가져온다.
		this.s3Provider.getTagging(this.ServiceUrl, this.AccessKey, this.AccessSecret, path, itemName)
			.pipe(
				finalize(() => {
					this.inCommunication = false;
				})
			)
			.subscribe(response => {

				if (response.Result === EnumResponseResult.Success) {

					this.pathForTagging = path;
					this.itemNameForTagging = itemName;

					for(const item of response.Data.Items)
						this.taggings.push(Object.assign(new ResponseS3ObjectTagging(), item));

					this.dialogOpenedTagging = true
				}
				else if (response.Result === EnumResponseResult.Warning) {
					this.messageService.warning(response.Message);
				}
				else if (response.Result === EnumResponseResult.Error) {
					this.messageService.error(response.Message);
				}
			});
	}

	/**
	 * 태깅 정보를 수정한다.
	 */
	updateTagging() {
		this.inCommunication = true;

		const values: RequestS3OperationTaggingTag[] = [];
		for(const tagging of this.gridTagging.items)
			values.push(Object.assign(new RequestS3OperationTaggingTag(), tagging));

		// 태깅 정보를 수정한다.
		this.s3Provider.updateTagging(this.ServiceUrl, this.AccessKey, this.AccessSecret, this.pathForTagging, this.itemNameForTagging, values)
			.pipe(
				finalize(() => {
					this.inCommunication = false;
				})
			)
			.subscribe(response => {

				if (response.Result === EnumResponseResult.Success) {

					this.dialogOpenedTagging = false
				}
				else if (response.Result === EnumResponseResult.Warning) {
					this.messageService.warning(response.Message);
				}
				else if (response.Result === EnumResponseResult.Error) {
					this.messageService.error(response.Message);
				}
			});
	}

	selectedTaggingItem: ResponseS3ObjectTagging = null;

	/**
	 * 태깅 정책 추가
	 */
	addTaggingItem() {
		this.selectedTaggingItem = null;
		this.formGroupTagging.reset(new ResponseS3ObjectTagging());
		this.dialogOpenedTaggingInput = true;
	}

	/**
	 * 태깅 정책 수정
	 */
	updateTaggingItem() {
		// 선택된 항목이 존재하는 경우
		if(this.gridTagging.selectedKeys.length > 0) {
			this.selectedTaggingItem = this.gridTagging.selectedItems[0];
			this.formGroupTagging.reset(this.selectedTaggingItem);
			this.dialogOpenedTaggingInput = true;
		}
	}

	/**
	 * 태깅 정책 삭제
	 */
	removeTaggingItem() {
		// 선택된 항목이 존재하는 경우
		if(this.gridTagging.selectedKeys.length > 0) {
			this.gridTagging.items = this.gridTagging.items.filter((item) => item.Key !== this.gridTagging.selectedKeys[0]);
			this.gridTagging.updateGridView();
			this.gridTagging.clearSelection();
			this.gridTagging.selectByIndex(0);
		}
	}

	/**
	 * 태깅 항목 저장
	 */
	saveTaggingItem() {
		// 선택된 항목이 존재하는 경우, 업데이트
		if(this.selectedTaggingItem) {
			this.selectedTaggingItem.Key = this.formGroupTagging.controls['Key'].value;
			this.selectedTaggingItem.Value = this.formGroupTagging.controls['Value'].value;
		}
		// 선택된 항목이 존재하지 않은 경우, 추가
		else {
			const tagging: ResponseS3ObjectTagging = new ResponseS3ObjectTagging();
			tagging.Key = this.formGroupTagging.controls['Key'].value;
			tagging.Value = this.formGroupTagging.controls['Value'].value;
			this.gridTagging.items.push(tagging);
		}
		this.gridTagging.updateGridView();
		this.dialogOpenedTaggingInput = false;
	}

	// 라이프사이클을 처리 중인 버킷명
	bucketNameForLifeCycle: string = '';

	/**
	 * 라이프사이클 정보 다이얼로그를 표시한다.
	 * @param bucketName 버킷명
	 */
	showLifeCycle(bucketName: string) {
		this.setGridLifeCycle();
		this.setGridLifeCycleColums();

		this.inCommunication = true;

		this.lifeCycleRules = [];

		// 라이프사이클 정보를 가져온다.
		this.s3Provider.getLifeCycle(this.ServiceUrl, this.AccessKey, this.AccessSecret, bucketName)
			.pipe(
				finalize(() => {
					this.inCommunication = false;
				})
			)
			.subscribe(response => {

				if (response.Result === EnumResponseResult.Success) {

					this.bucketNameForLifeCycle = bucketName;

					for(const item of response.Data.Items)
						this.lifeCycleRules.push(Object.assign(new ResponseS3LifeCycleRule(), item));

					this.dialogOpenedLifeCycle = true
				}
				else if (response.Result === EnumResponseResult.Warning) {
					this.messageService.warning(response.Message);
				}
				else if (response.Result === EnumResponseResult.Error) {
					this.messageService.error(response.Message);
				}
			});
	}

	/**
	 * 라이프사이클 정보를 수정한다.
	 */
	updateLifeCycle() {
		this.inCommunication = true;

		const values: RequestS3LifeCycleRule[] = [];
		for(const rule of this.gridLifeCycle.items)
			values.push(Object.assign(new RequestS3LifeCycleRule(), rule));

		// 라이프사이클 정보를 수정한다.
		this.s3Provider.updateLifeCycle(this.ServiceUrl, this.AccessKey, this.AccessSecret, this.bucketNameForLifeCycle, values)
			.pipe(
				finalize(() => {
					this.inCommunication = false;
				})
			)
			.subscribe(response => {

				if (response.Result === EnumResponseResult.Success) {

					this.dialogOpenedLifeCycle = false
				}
				else if (response.Result === EnumResponseResult.Warning) {
					this.messageService.warning(response.Message);
				}
				else if (response.Result === EnumResponseResult.Error) {
					this.messageService.error(response.Message);
				}
			});
	}

	selectedLifeCycleRule: ResponseS3LifeCycleRule = null;

	/**
	 * 라이프사이클 정책 추가
	 */
	addLifeCycleRule() {
		this.selectedLifeCycleRule = null;
		this.formGroupLifeCycle.reset(new ResponseS3LifeCycleRule());
		this.dialogOpenedLifeCycleInput = true;
	}

	/**
	 * 라이프사이클 정책 수정
	 */
	updateLifeCycleRule() {
		// 선택된 항목이 존재하는 경우
		if(this.gridLifeCycle.selectedKeys.length > 0) {
			this.selectedLifeCycleRule = this.gridLifeCycle.selectedItems[0];
			this.formGroupLifeCycle.reset(this.selectedLifeCycleRule);
			this.dialogOpenedLifeCycleInput = true;
		}
	}

	/**
	 * 라이프사이클 정책 삭제
	 */
	removeLifeCycleRule() {
		// 선택된 항목이 존재하는 경우
		if(this.gridLifeCycle.selectedKeys.length > 0) {
			this.gridLifeCycle.items = this.gridLifeCycle.items.filter((item) => item.Id !== this.gridLifeCycle.selectedKeys[0]);
			this.gridLifeCycle.updateGridView();
			this.gridLifeCycle.clearSelection();
			this.gridLifeCycle.selectByIndex(0);
		}
	}

	/**
	 * 라이프사이클 정책 저장
	 */
	saveLifeCycleRule() {
		// 선택된 항목이 존재하는 경우, 업데이트
		if(this.selectedLifeCycleRule) {
			this.selectedLifeCycleRule.Id = this.formGroupLifeCycle.controls['Id'].value;
			this.selectedLifeCycleRule.Prefix = this.formGroupLifeCycle.controls['Prefix'].value;
			this.selectedLifeCycleRule.Days = this.formGroupLifeCycle.controls['Days'].value;
		}
		// 선택된 항목이 존재하지 않은 경우, 추가
		else {
			const rule: ResponseS3LifeCycleRule = new ResponseS3LifeCycleRule();
			rule.Id = this.formGroupLifeCycle.controls['Id'].value;
			rule.Prefix = this.formGroupLifeCycle.controls['Prefix'].value;
			rule.Days = this.formGroupLifeCycle.controls['Days'].value;
			this.gridLifeCycle.items.push(rule);
		}
		this.gridLifeCycle.updateGridView();
		this.dialogOpenedLifeCycleInput = false;
	}

	/**
	 * 공유 정보 다이얼로그를 표시한다.
	 * @param path 경로
	 * @param itemName 선택한 아이템명
	 */
	showShare(path: string, itemName: string) {
		this.formGroupShare.controls['Path'].setValue(path);
		this.formGroupShare.controls['Name'].setValue(itemName);
		this.formGroupShare.controls['Expiration'].setValue(moment().add(30 + 1, 'days').startOf('day').toDate());
		this.formGroupShare.controls['ShareUrl'].setValue('');
		this.minDateTime = moment().toDate();

		this.dialogOpenedShare = true;
	}

	/**
	 * 메타데이터 정보를 수정한다.
	 */
	getShareUrl() {
		this.inCommunication = true;

		// 공유 URL 정보를 가져온다.
		this.s3Provider.getShare(this.ServiceUrl, this.AccessKey, this.AccessSecret, this.formGroupShare.controls['Path'].value, this.formGroupShare.controls['Name'].value, this.formGroupShare.controls['Expiration'].value)
			.pipe(
				finalize(() => {
					this.inCommunication = false;
				})
			)
			.subscribe(response => {

				if (response.Result === EnumResponseResult.Success) {

					this.formGroupShare.controls['ShareUrl'].setValue(response.Data);
					this.copyShareUrl();
				}
				else if (response.Result === EnumResponseResult.Warning) {
					this.messageService.warning(response.Message);
				}
				else if (response.Result === EnumResponseResult.Error) {
					this.messageService.error(response.Message);
				}
			});
	}

	/**
	 * 공유 URL을 클립보드로 복사한다.
	 */
	copyShareUrl() {
		this.clipboardService.copy(this.formGroupShare.controls['ShareUrl'].value);
		this.messageService.info(this.translateService.instant("SM_COMMON__COPIED_TO_CLIPBOARD"), 1);
	}

	// 그리드 기본 설정
	private setGridBase(): void {
		this.grid.name = 'default';
		this.grid.location = this.router.url;
		this.grid.skip = 0;
		this.grid.pageSize = 100;
		this.grid.gridView.data = [];
		this.grid.gridView.total = 0;
		this.grid.isUseCalcuratePageSize = false;
		this.grid.isUseSequence = true;
		this.grid.isUseCheckboxSelect = false;
		this.grid.isUseFixedHeight = true;
		this.grid.pageable = false;
		this.grid.height = 480;
		this.grid.selectableSettings = {
			enabled: true,
			mode: "single",
			checkboxOnly: false
		};
		this.grid.isUseDetailGrid = false;
	};

	// 그리드 컬럼 설정
	private setGridColums(): void {

		this.grid.keyColumnNames = ['Id'];
		this.grid.columns = [
			{ title: 'Name', field: 'Name', width: '', format: '', pipe: '', pipeEnumTranslateClass: '', class: 'text-left', sortable: false },
			// { title: 'Full Control', field: 'FullControl', width: '160', format: '', pipe: '', pipeEnumTranslateClass: '', class: 'text-center', sortable: false, editable: true, editType: 'checkbox' },
			{ title: 'Write', field: 'Write', width: '120', format: '', pipe: '', pipeEnumTranslateClass: '', class: 'text-center', sortable: false, editable: true, editType: 'checkbox' },
			{ title: 'Read', field: 'Read', width: '120', format: '', pipe: '', pipeEnumTranslateClass: '', class: 'text-center', sortable: false, editable: true, editType: 'checkbox' },
		];

		this.grid.setSortColumns([ { field: 'OrderNo', dir: 'asc' } ]);
	}

	/**
	 * 헤더의 체크 박스 선택이 변경된 경우 발생하는 이벤트
	 * @param args 이벤트 객체
	 */
	onCheckColumnAllChanged(args: any) {
		if(args) {
			for(const grant of this.aclGrantsForGrid) {
				switch(args.field) {
					case 'Read':
						grant.Read = args.checked;
						break;
					case 'Write':
						grant.Write = args.checked;
						break;
				}
			}
		}
	}

	// 메타데이터 그리드 기본 설정
	private setGridMetadata(): void {
		this.gridMetadata.name = 'default';
		this.gridMetadata.location = this.router.url;
		this.gridMetadata.skip = 0;
		this.gridMetadata.pageSize = 100;
		this.gridMetadata.gridView.data = [];
		this.gridMetadata.gridView.total = 0;
		this.gridMetadata.isUseCalcuratePageSize = false;
		this.gridMetadata.isUseSequence = true;
		this.gridMetadata.isUseCheckboxSelect = false;
		this.gridMetadata.isUseFixedHeight = true;
		this.gridMetadata.pageable = false;
		this.gridMetadata.height = 480;
		this.gridMetadata.selectableSettings = {
			enabled: true,
			mode: "single",
			checkboxOnly: false
		};
		this.gridMetadata.isUseDetailGrid = false;
	};

	// 메타데이터 그리드 컬럼 설정
	private setGridMetadataColums(): void {

		this.gridMetadata.keyColumnNames = ['Key'];
		this.gridMetadata.columns = [
			{ title: 'KEY', field: 'Key', width: '', format: '', pipe: '', pipeEnumTranslateClass: '', class: 'text-left', sortable: false },
			{ title: 'VALUE', field: 'Value', width: '', format: '', pipe: '', pipeEnumTranslateClass: '', class: 'text-left', sortable: false },
		];
	}

	// 태깅 그리드 기본 설정
	private setGridTagging(): void {
		this.gridTagging.name = 'default';
		this.gridTagging.location = this.router.url;
		this.gridTagging.skip = 0;
		this.gridTagging.pageSize = 100;
		this.gridTagging.gridView.data = [];
		this.gridTagging.gridView.total = 0;
		this.gridTagging.isUseCalcuratePageSize = false;
		this.gridTagging.isUseSequence = true;
		this.gridTagging.isUseCheckboxSelect = false;
		this.gridTagging.isUseFixedHeight = true;
		this.gridTagging.pageable = false;
		this.gridTagging.height = 480;
		this.gridTagging.selectableSettings = {
			enabled: true,
			mode: "single",
			checkboxOnly: false
		};
		this.gridTagging.isUseDetailGrid = false;
	};

	// 태깅 그리드 컬럼 설정
	private setGridTaggingColums(): void {

		this.gridTagging.keyColumnNames = ['Key'];
		this.gridTagging.columns = [
			{ title: 'KEY', field: 'Key', width: '', format: '', pipe: '', pipeEnumTranslateClass: '', class: 'text-left', sortable: false },
			{ title: 'VALUE', field: 'Value', width: '', format: '', pipe: '', pipeEnumTranslateClass: '', class: 'text-left', sortable: false },
		];
	}

	// 라이프사이클 그리드 기본 설정
	private setGridLifeCycle(): void {
		this.gridLifeCycle.name = 'default';
		this.gridLifeCycle.location = this.router.url;
		this.gridLifeCycle.skip = 0;
		this.gridLifeCycle.pageSize = 100;
		this.gridLifeCycle.gridView.data = [];
		this.gridLifeCycle.gridView.total = 0;
		this.gridLifeCycle.isUseCalcuratePageSize = false;
		this.gridLifeCycle.isUseSequence = true;
		this.gridLifeCycle.isUseCheckboxSelect = false;
		this.gridLifeCycle.isUseFixedHeight = true;
		this.gridLifeCycle.pageable = false;
		this.gridLifeCycle.height = 400;
		this.gridLifeCycle.selectableSettings = {
			enabled: true,
			mode: "single",
			checkboxOnly: false
		};
		this.gridLifeCycle.isUseDetailGrid = false;
	};

	// 라이프사이클 그리드 컬럼 설정
	private setGridLifeCycleColums(): void {

		this.gridLifeCycle.keyColumnNames = ['Id'];
		this.gridLifeCycle.columns = [
			{ title: 'ID', field: 'Id', width: '', format: '', pipe: '', pipeEnumTranslateClass: '', class: 'text-left', sortable: false },
			{ title: 'PREFIX', field: 'Prefix', width: '', format: '', pipe: '', pipeEnumTranslateClass: '', class: 'text-left', sortable: false },
			{ title: 'Days', field: 'Days', width: '120', format: '', pipe: '', pipeEnumTranslateClass: '', class: 'text-right', sortable: false },
		];
	}

	// 버전 목록 그리드 기본 설정
	private setGridVersions(path: string, itemName: string): void {
		this.gridVersions.name = itemName;
		this.gridVersions.location = path;
		this.gridVersions.skip = 0;
		this.gridVersions.pageSize = 100;
		this.gridVersions.gridView.data = [];
		this.gridVersions.gridView.total = 0;
		this.gridVersions.isUseCalcuratePageSize = false;
		this.gridVersions.isUseSequence = true;
		this.gridVersions.isUseCheckboxSelect = false;
		this.gridVersions.isUseFixedHeight = true;
		this.gridVersions.pageable = false;
		this.gridVersions.height = 600;
		this.gridVersions.selectableSettings = {
			enabled: true,
			mode: "single",
			checkboxOnly: false
		};
		this.gridVersions.isUseDetailGrid = false;
	};

	// 버전 목록 그리드 컬럼 설정
	private setGridVersionsColums(): void {

		this.gridVersions.keyColumnNames = ['VersionId', 'ParentPath', 'Name'];
		this.gridVersions.columns = [
			{ title: 'Path', field: 'ParentPath', width: '', format: '', pipe: '', pipeEnumTranslateClass: '', class: 'text-left', sortable: false },
			{ title: 'Name', field: 'Name', width: '300', format: '', pipe: '', pipeEnumTranslateClass: '', class: 'text-left', sortable: false },
			{ title: 'Last Modified', field: 'LastModified', width: '200', format: '', pipe: '', pipeEnumTranslateClass: '', class: 'text-center', sortable: false },
			{ title: 'ETag', field: 'ETag', width: '200', format: '', pipe: '', pipeEnumTranslateClass: '', class: 'text-center', sortable: false },
			{ title: 'Version Id', field: 'VersionId', width: '200', format: '', pipe: '', pipeEnumTranslateClass: '', class: 'text-center', sortable: false },
			{ title: 'Latest', field: 'IsLatest', width: '120', format: '', pipe: '', pipeEnumTranslateClass: '', class: 'text-center', sortable: false },
			{ title: 'Delete Marker', field: 'IsDeleteMarker', width: '140', format: '', pipe: '', pipeEnumTranslateClass: '', class: 'text-center', sortable: false },
		];

		let config = this.gridColumnConfigService.getConfigByGrid(this.gridVersions);
		config.hiddenColumnFields = [ 'ETag' ];
		this.gridVersions.applyColumnsConfig(config);
	}

	// 버전 목록 파일 다운로드
	versionDownload() {
		if(this.gridVersions.selectedItems.length > 0) {
			// 다운로드
			this.s3Provider.downloadVersions(this.ServiceUrl, this.AccessKey, this.AccessSecret, this.gridVersions.location, this.gridVersions.name, this.gridVersions.selectedItems[0].VersionId)
				.pipe(
					finalize(() => {
						this.inCommunication = false;
					})
				)
				.subscribe((data) => {
					saveAs(data, this.gridVersions.name);
					},
					(err: HttpErrorResponse) => {
						this.messageService.error(err.error);
					}
				);
		}
	}

	// 특정 버전 삭제
	showVersionRemove() {
		if(this.gridVersions.selectedItems.length > 0) {
			const message = this.translateService.instant(`UL_CONFIRM_MESSAGE_REMOVE_S3_OBJECT_VERSION`, { VersionId: this.gridVersions.selectedItems[0].VersionId });
			this.commonDialogService.confirm(this.translateService.instant('UL_CONFIRM_TITLE_REMOVE_S3_OBJECT_VERSION'), message, 600, 150)
				.subscribe((result: DialogAction) => {

					if(result.primary) {
						this.inCommunication = true;

						// 삭제
						this.s3Provider.deleteVersions(this.ServiceUrl, this.AccessKey, this.AccessSecret, this.gridVersions.location, this.gridVersions.name, this.gridVersions.selectedItems[0].VersionId)
							.pipe(
								finalize(() => {
									this.inCommunication = false;
								})
							)
							.subscribe(
								(result) => {
									if (result.Result === EnumResponseResult.Success) {
										// 성공 메세지
										if(result.Message)
											this.messageService.info(result.Message);

										// 목록 갱신
										this.versionRefresh();
									}
									else
										this.messageService.error('[' + result.Code + '] ' + result.Message);
								},
								(err: HttpErrorResponse) => {
									this.messageService.error(err.error);
								}
							);
					}
				});
		}
	}

	// 버전 목록 새로고침
	versionRefresh() {

		this.inCommunication = true;

		this.gridVersions.updateData([]);

		// 버전 목록을 가져온다.
		this.s3Provider.getVersions(this.ServiceUrl, this.AccessKey, this.AccessSecret, this.gridVersions.location, this.gridVersions.name)
			.pipe(
				finalize(() => {
					this.inCommunication = false;
				})
			)
			.subscribe(response => {

				if (response.Result === EnumResponseResult.Success) {

					// 데이터 업데이트
					this.gridVersions.updateData(new List<ResponseS3VersioningInfo>(response.Data.Items)
						.orderBy(i => i.ParentPath)
						.thenBy(i => i.Name)
						.toArray());

					this.dialogOpenedVersions = true;
				}
				else if (response.Result === EnumResponseResult.Warning) {
					this.messageService.warning(response.Message);
				}
				else if (response.Result === EnumResponseResult.Error) {
					this.messageService.error(response.Message);
				}
			});
	}
}
