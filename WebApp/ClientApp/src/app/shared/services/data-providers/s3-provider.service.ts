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
import {Injectable} from '@angular/core';
import {HttpClient, HttpHeaders} from '@angular/common/http';
import {catchError, map} from 'rxjs/operators';
import 'rxjs/add/operator/map';
import {environment} from '../../../../environments/environment';

import {Observable, throwError} from 'rxjs';
import {ResponseS3CorsConfig} from "../../../_model/response/s3/response-s3-cors-config.model";
import {ResponseData} from "../../../_model/response-data.model";
import {ResponseS3WebsiteConfig} from "../../../_model/response/s3/response-s3-website-config.model";
import {ResponseS3AclGrant} from "../../../_model/response/s3/response-s3-acl-grant.model";
import {ResponseList} from "../../../_model/response-list.model";
import {RequestS3CorsConfig} from "../../../_model/request/s3/request-s3-cors-config.model";
import {RequestS3WebsiteConfig} from "../../../_model/request/s3/request-s3-website-config.model";
import {ResponseS3VersioningConfig} from "../../../_model/response/s3/response-s3-versioning-config.model";
import {RequestS3VersioningConfig} from "../../../_model/request/s3/request-s3-versioning-config.model";
import {RequestS3OperationMetadata} from "../../../_model/request/s3/request-s3-operation-metadata.model";
import {ResponseS3ObjectMetadata} from "../../../_model/response/s3/response-s3-object-metadata.model";
import {RequestS3Metadata, RequestS3MetadataKeyValue} from "../../../_model/request/s3/request-s3-metadata.model";
import {RequestS3Tagging} from "../../../_model/request/s3/request-s3-tagging.model";
import {RequestS3OperationTagging, RequestS3OperationTaggingTag} from "../../../_model/request/s3/request-s3-operation-tagging.model";
import {ResponseS3ObjectTagging} from "../../../_model/response/s3/response-s3-object-tagging.model";
import {ResponseS3LifeCycleRule} from "../../../_model/response/s3/response-s3-lifecycle-rule.model";
import {RequestS3LifeCycleRule} from "../../../_model/request/s3/request-s3-lifecycle-rule.model";
import {RequestS3LifeCycle} from "../../../_model/request/s3/request-s3-lifecycle.model";
import {RequestS3AclConfigUpdate} from "../../../_model/request/s3/request-s3-acl-config-update.model";
import {RequestS3AclConfig} from "../../../_model/request/s3/request-s3-acl-config.model";
import {RequestS3OperationShareUrl} from "../../../_model/request/s3/request-s3-operation-share-url.model";
import {RequestS3AccessIp} from "../../../_model/request/s3/request-s3-access-ip.model";
import {ResponseS3AccessIp} from "../../../_model/response/s3/response-s3-access-ip.model";
import {ResponseS3VersioningInfo} from "../../../_model/response/s3/response-s3-versioning-info.model";
import {RequestS3VersionList} from "../../../_model/request/s3/request-s3-version-list.model";
import {RequestS3VersionDelete} from "../../../_model/request/s3/request-s3-version-delete.model";
import {RequestS3VersionDownload} from "../../../_model/request/s3/request-s3-version-download.model";
import {ResponseS3BucketPolicy} from "../../../_model/response/s3/response-s3-bucket-policy.model";
import {RequestS3BucketPolicy} from "../../../_model/request/s3/request-s3-bucket-policy.model";

@Injectable()

export class S3ProviderService {
	// S3 URL
	private S3_URL = `${environment.apiUrl}/S3`;

	// 생성자
	constructor(
		private httpClient: HttpClient
	) {
	}

	/**
	 * CORS 설정을 가져온다.
	 * @param serviceUrl 서비스 URL
	 * @param accessKey Access Key
	 * @param accessSecret Access Secret
	 * @param bucketName 버킷명
	 */
	getCorsSettings(serviceUrl: string, accessKey: string, accessSecret: string, bucketName: string): Observable<ResponseData<ResponseS3CorsConfig>> {

		const headers = new HttpHeaders({
			's3-service-url':serviceUrl,
			's3-access-key':accessKey,
			's3-access-secret':accessSecret
		});

		return this.httpClient.get<ResponseData<ResponseS3CorsConfig>>(`${this.S3_URL}/Configs/CORS/${bucketName}`, { headers: headers })
			.pipe(
				map((result) => {
					return result;
				}),
				catchError((err) => {
					return throwError(err);
				})
			);
	}

	/**
	 * CORS 설정을 수정한다.
	 * @param serviceUrl 서비스 URL
	 * @param accessKey Access Key
	 * @param accessSecret Access Secret
	 * @param bucketName 버킷명
	 * @param corsConfig CORS 설정 객체
	 */
	updateCorsSettings(serviceUrl: string, accessKey: string, accessSecret: string, bucketName: string, corsConfig: RequestS3CorsConfig): Observable<ResponseData> {

		const headers = new HttpHeaders({
			's3-service-url':serviceUrl,
			's3-access-key':accessKey,
			's3-access-secret':accessSecret
		});

		return this.httpClient.put<ResponseData>(`${this.S3_URL}/Configs/CORS/${bucketName}`, corsConfig, { headers: headers })
			.pipe(
				map((result) => {
					return result;
				}),
				catchError((err) => {
					return throwError(err);
				})
			);
	}

	/**
	 * 버전 목록을 가져온다.
	 * @param serviceUrl 서비스 URL
	 * @param accessKey Access Key
	 * @param accessSecret Access Secret
	 * @param path 경로
	 * @param itemName 선택한 아이템명
	 */
	getVersions(serviceUrl: string, accessKey: string, accessSecret: string, path: string, itemName: string): Observable<ResponseList<ResponseS3VersioningInfo>> {

		const headers = new HttpHeaders({
			's3-service-url':serviceUrl,
			's3-access-key':accessKey,
			's3-access-secret':accessSecret
		});

		const request: RequestS3VersionList = new RequestS3VersionList(path, itemName);

		return this.httpClient.post<ResponseList<ResponseS3VersioningInfo>>(`${this.S3_URL}/Versions`, request, { headers: headers })
			.pipe(
				map((result) => {
					return result;
				}),
				catchError((err) => {
					return throwError(err);
				})
			);
	}

	/**
	 * 객체의 특정 버전들을 삭제한다.
	 * @param serviceUrl 서비스 URL
	 * @param accessKey Access Key
	 * @param accessSecret Access Secret
	 * @param path 경로
	 * @param itemName 선택한 아이템명
	 * @param versionId 버전 아이디
	 */
	deleteVersions(serviceUrl: string, accessKey: string, accessSecret: string, path: string, itemName: string, versionId: string): Observable<ResponseData> {

		const headers = new HttpHeaders({
			's3-service-url':serviceUrl,
			's3-access-key':accessKey,
			's3-access-secret':accessSecret
		});

		const request: RequestS3VersionDelete = new RequestS3VersionDelete(path, itemName, [versionId]);

		return this.httpClient.post<ResponseData>(`${this.S3_URL}/Versions/Delete`, request, { headers: headers })
			.pipe(
				map((result) => {
					return result;
				}),
				catchError((err) => {
					return throwError(err);
				})
			);
	}

	/**
	 * 객체의 특정 버전을 다운로드 한다.
	 * @param serviceUrl 서비스 URL
	 * @param accessKey Access Key
	 * @param accessSecret Access Secret
	 * @param path 경로
	 * @param itemName 선택한 아이템명
	 * @param versionId 버전 아이디
	 */
	downloadVersions(serviceUrl: string, accessKey: string, accessSecret: string, path: string, itemName: string, versionId: string): Observable<any> {

		const headers = new HttpHeaders({
			's3-service-url':serviceUrl,
			's3-access-key':accessKey,
			's3-access-secret':accessSecret
		});

		const request: RequestS3VersionDownload = new RequestS3VersionDownload(path, itemName, versionId);

		return this.httpClient.post(`${this.S3_URL}/Versions/Download`, request, {
			responseType: 'blob',
			headers: headers,
		});
	}

	/**
	 * ACL 설정을 가져온다.
	 * @param serviceUrl 서비스 URL
	 * @param accessKey Access Key
	 * @param accessSecret Access Secret
	 * @param path 경로
	 * @param itemName 선택한 아이템명
	 */
	getAclSettings(serviceUrl: string, accessKey: string, accessSecret: string, path: string, itemName: string): Observable<ResponseList<ResponseS3AclGrant>> {

		const headers = new HttpHeaders({
			's3-service-url':serviceUrl,
			's3-access-key':accessKey,
			's3-access-secret':accessSecret
		});

		const request: RequestS3AclConfig = new RequestS3AclConfig(path, itemName);

		return this.httpClient.post<ResponseList<ResponseS3AclGrant>>(`${this.S3_URL}/Configs/ACL`, request, { headers: headers })
			.pipe(
				map((result) => {
					return result;
				}),
				catchError((err) => {
					return throwError(err);
				})
			);
	}

	/**
	 * ACL 설정을 수정한다.
	 * @param serviceUrl 서비스 URL
	 * @param accessKey Access Key
	 * @param accessSecret Access Secret
	 * @param request ACL 설정 정보 수정 요청 객체
	 */
	updateAclSettings(serviceUrl: string, accessKey: string, accessSecret: string, request: RequestS3AclConfigUpdate): Observable<ResponseData> {

		const headers = new HttpHeaders({
			's3-service-url':serviceUrl,
			's3-access-key':accessKey,
			's3-access-secret':accessSecret
		});

		return this.httpClient.put<ResponseData>(`${this.S3_URL}/Configs/ACL`, request, { headers: headers })
			.pipe(
				map((result) => {
					return result;
				}),
				catchError((err) => {
					return throwError(err);
				})
			);
	}

	/**
	 * WebSite 설정을 가져온다.
	 * @param serviceUrl 서비스 URL
	 * @param accessKey Access Key
	 * @param accessSecret Access Secret
	 * @param bucketName 버킷명
	 */
	getWebSiteSettings(serviceUrl: string, accessKey: string, accessSecret: string, bucketName: string): Observable<ResponseData<ResponseS3WebsiteConfig>> {

		const headers = new HttpHeaders({
			's3-service-url':serviceUrl,
			's3-access-key':accessKey,
			's3-access-secret':accessSecret
		});

		return this.httpClient.get<ResponseData<ResponseS3WebsiteConfig>>(`${this.S3_URL}/Configs/WebSite/${bucketName}`, { headers: headers })
			.pipe(
				map((result) => {
					return result;
				}),
				catchError((err) => {
					return throwError(err);
				})
			);
	}

	/**
	 * WebSite 설정을 수정한다.
	 * @param serviceUrl 서비스 URL
	 * @param accessKey Access Key
	 * @param accessSecret Access Secret
	 * @param bucketName 버킷명
	 * @param websiteConfig CORS 설정 객체
	 */
	updateWebSiteSettings(serviceUrl: string, accessKey: string, accessSecret: string, bucketName: string, websiteConfig: RequestS3WebsiteConfig): Observable<ResponseData> {

		const headers = new HttpHeaders({
			's3-service-url':serviceUrl,
			's3-access-key':accessKey,
			's3-access-secret':accessSecret
		});

		return this.httpClient.put<ResponseData>(`${this.S3_URL}/Configs/WebSite/${bucketName}`, websiteConfig, { headers: headers })
			.pipe(
				map((result) => {
					return result;
				}),
				catchError((err) => {
					return throwError(err);
				})
			);
	}

	/**
	 * Versioning 설정을 가져온다.
	 * @param serviceUrl 서비스 URL
	 * @param accessKey Access Key
	 * @param accessSecret Access Secret
	 * @param bucketName 버킷명
	 */
	getVersioningSettings(serviceUrl: string, accessKey: string, accessSecret: string, bucketName: string): Observable<ResponseData<ResponseS3VersioningConfig>> {

		const headers = new HttpHeaders({
			's3-service-url':serviceUrl,
			's3-access-key':accessKey,
			's3-access-secret':accessSecret
		});

		return this.httpClient.get<ResponseData<ResponseS3VersioningConfig>>(`${this.S3_URL}/Configs/Versioning/${bucketName}`, { headers: headers })
			.pipe(
				map((result) => {
					return result;
				}),
				catchError((err) => {
					return throwError(err);
				})
			);
	}

	/**
	 * Versioning 설정을 수정한다.
	 * @param serviceUrl 서비스 URL
	 * @param accessKey Access Key
	 * @param accessSecret Access Secret
	 * @param bucketName 버킷명
	 * @param config Versioning 설정 객체
	 */
	updateVersioningSettings(serviceUrl: string, accessKey: string, accessSecret: string, bucketName: string, config: RequestS3VersioningConfig): Observable<ResponseData> {

		const headers = new HttpHeaders({
			's3-service-url':serviceUrl,
			's3-access-key':accessKey,
			's3-access-secret':accessSecret
		});

		return this.httpClient.put<ResponseData>(`${this.S3_URL}/Configs/Versioning/${bucketName}`, config, { headers: headers })
			.pipe(
				map((result) => {
					return result;
				}),
				catchError((err) => {
					return throwError(err);
				})
			);
	}

	/**
	 * Versioning 설정을 가져온다.
	 * @param serviceUrl 서비스 URL
	 * @param accessKey Access Key
	 * @param accessSecret Access Secret
	 * @param bucketName 버킷명
	 */
	getBucketPolicy(serviceUrl: string, accessKey: string, accessSecret: string, bucketName: string): Observable<ResponseData<ResponseS3BucketPolicy>> {

		const headers = new HttpHeaders({
			's3-service-url':serviceUrl,
			's3-access-key':accessKey,
			's3-access-secret':accessSecret
		});

		return this.httpClient.get<ResponseData<ResponseS3BucketPolicy>>(`${this.S3_URL}/Configs/BucketPolicy/${bucketName}`, { headers: headers })
			.pipe(
				map((result) => {
					return result;
				}),
				catchError((err) => {
					return throwError(err);
				})
			);
	}

	/**
	 * Versioning 설정을 수정한다.
	 * @param serviceUrl 서비스 URL
	 * @param accessKey Access Key
	 * @param accessSecret Access Secret
	 * @param bucketName 버킷명
	 * @param config Versioning 설정 객체
	 */
	updateBucketPolicy(serviceUrl: string, accessKey: string, accessSecret: string, bucketName: string, config: RequestS3BucketPolicy): Observable<ResponseData> {

		const headers = new HttpHeaders({
			's3-service-url':serviceUrl,
			's3-access-key':accessKey,
			's3-access-secret':accessSecret
		});

		return this.httpClient.put<ResponseData>(`${this.S3_URL}/Configs/BucketPolicy/${bucketName}`, config, { headers: headers })
			.pipe(
				map((result) => {
					return result;
				}),
				catchError((err) => {
					return throwError(err);
				})
			);
	}

	/**
	 * 메타데이터 정보를 가져온다.
	 * @param serviceUrl 서비스 URL
	 * @param accessKey Access Key
	 * @param accessSecret Access Secret
	 * @param path 경로
	 * @param itemName 선택한 아이템명
	 */
	getMetadata(serviceUrl: string, accessKey: string, accessSecret: string, path: string, itemName: string): Observable<ResponseData<ResponseS3ObjectMetadata>> {

		const headers = new HttpHeaders({
			's3-service-url':serviceUrl,
			's3-access-key':accessKey,
			's3-access-secret':accessSecret
		});

		const request = new RequestS3OperationMetadata(path, itemName);

		return this.httpClient.post<ResponseData<ResponseS3ObjectMetadata>>(`${this.S3_URL}/Operations/Metadata`, request, { headers: headers })
			.pipe(
				map((result) => {
					return result;
				}),
				catchError((err) => {
					return throwError(err);
				})
			);
	}

	/**
	 * 메타데이터 정보를 수정한다.
	 * @param serviceUrl 서비스 URL
	 * @param accessKey Access Key
	 * @param accessSecret Access Secret
	 * @param path 경로
	 * @param itemName 선택한 아이템명
	 * @param datas 수정할 메타데이터 목록
	 */
	updateMetadata(serviceUrl: string, accessKey: string, accessSecret: string, path: string, itemName: string, datas: RequestS3MetadataKeyValue[]): Observable<ResponseData> {

		const headers = new HttpHeaders({
			's3-service-url':serviceUrl,
			's3-access-key':accessKey,
			's3-access-secret':accessSecret
		});

		const request = new RequestS3Metadata(path, itemName);
		request.Metadatas = datas;

		return this.httpClient.put<ResponseData>(`${this.S3_URL}/Operations/Metadata`, request, { headers: headers })
			.pipe(
				map((result) => {
					return result;
				}),
				catchError((err) => {
					return throwError(err);
				})
			);
	}

	/**
	 * 태깅 정보를 가져온다.
	 * @param serviceUrl 서비스 URL
	 * @param accessKey Access Key
	 * @param accessSecret Access Secret
	 * @param path 경로
	 * @param itemName 선택한 아이템명
	 */
	getTagging(serviceUrl: string, accessKey: string, accessSecret: string, path: string, itemName: string): Observable<ResponseList<ResponseS3ObjectTagging>> {

		const headers = new HttpHeaders({
			's3-service-url':serviceUrl,
			's3-access-key':accessKey,
			's3-access-secret':accessSecret
		});

		const request = new RequestS3Tagging(path, itemName);

		return this.httpClient.post<ResponseList<ResponseS3ObjectTagging>>(`${this.S3_URL}/Operations/Tagging`, request, { headers: headers })
			.pipe(
				map((result) => {
					return result;
				}),
				catchError((err) => {
					return throwError(err);
				})
			);
	}

	/**
	 * 태깅 정보를 수정한다.
	 * @param serviceUrl 서비스 URL
	 * @param accessKey Access Key
	 * @param accessSecret Access Secret
	 * @param path 경로
	 * @param itemName 선택한 아이템명
	 * @param datas 수정할 메타데이터 목록
	 */
	updateTagging(serviceUrl: string, accessKey: string, accessSecret: string, path: string, itemName: string, datas: RequestS3OperationTaggingTag[]): Observable<ResponseData> {

		const headers = new HttpHeaders({
			's3-service-url':serviceUrl,
			's3-access-key':accessKey,
			's3-access-secret':accessSecret
		});

		const request = new RequestS3OperationTagging(path, itemName);
		request.Tagging = datas;

		return this.httpClient.put<ResponseData>(`${this.S3_URL}/Operations/Tagging`, request, { headers: headers })
			.pipe(
				map((result) => {
					return result;
				}),
				catchError((err) => {
					return throwError(err);
				})
			);
	}

	/**
	 * 라이프사이클 정보를 가져온다.
	 * @param serviceUrl 서비스 URL
	 * @param accessKey Access Key
	 * @param accessSecret Access Secret
	 * @param bucketName 버킷명
	 */
	getLifeCycle(serviceUrl: string, accessKey: string, accessSecret: string, bucketName: string): Observable<ResponseList<ResponseS3LifeCycleRule>> {

		const headers = new HttpHeaders({
			's3-service-url':serviceUrl,
			's3-access-key':accessKey,
			's3-access-secret':accessSecret
		});

		return this.httpClient.get<ResponseList<ResponseS3LifeCycleRule>>(`${this.S3_URL}/Buckets/${bucketName}/LifeCycle`, { headers: headers })
			.pipe(
				map((result) => {
					return result;
				}),
				catchError((err) => {
					return throwError(err);
				})
			);
	}

	/**
	 * 라이프사이클 정보를 수정한다.
	 * @param serviceUrl 서비스 URL
	 * @param accessKey Access Key
	 * @param accessSecret Access Secret
	 * @param bucketName 버킷명
	 * @param rules 수정할 라이프사이클 정책 목록
	 */
	updateLifeCycle(serviceUrl: string, accessKey: string, accessSecret: string, bucketName: string, rules: RequestS3LifeCycleRule[]): Observable<ResponseData> {

		const headers = new HttpHeaders({
			's3-service-url':serviceUrl,
			's3-access-key':accessKey,
			's3-access-secret':accessSecret
		});

		const request = new RequestS3LifeCycle();
		request.Rules = rules;

		return this.httpClient.put<ResponseData>(`${this.S3_URL}/Buckets/${bucketName}/LifeCycle`, request, { headers: headers })
			.pipe(
				map((result) => {
					return result;
				}),
				catchError((err) => {
					return throwError(err);
				})
			);
	}

	/**
	 * 공유 정보를 가져온다.
	 * @param serviceUrl 서비스 URL
	 * @param accessKey Access Key
	 * @param accessSecret Access Secret
	 * @param path 경로
	 * @param itemName 선택한 아이템명
	 * @param expiration 만료일시
	 */
	getShare(serviceUrl: string, accessKey: string, accessSecret: string, path: string, itemName: string, expiration: Date): Observable<ResponseData<string>> {

		const headers = new HttpHeaders({
			's3-service-url':serviceUrl,
			's3-access-key':accessKey,
			's3-access-secret':accessSecret
		});

		const request = new RequestS3OperationShareUrl(path, itemName, expiration);

		return this.httpClient.post<ResponseData<string>>(`${this.S3_URL}/Operations/ShareUrl`, request, { headers: headers })
			.pipe(
				map((result) => {
					return result;
				}),
				catchError((err) => {
					return throwError(err);
				})
			);
	}

	/**
	 * 접근 아이피를 추가한다.
	 * @param userId 사용자 아이디
	 * @param tenantId 테넌트 아이디
	 * @param BucketName 버킷 이름
	 * @param ipAddress 아이피 주소
	 */
	addAccessIp(userId: string, tenantId: string, BucketName: string, ipAddress: string): Observable<ResponseData> {

		const request: RequestS3AccessIp = new RequestS3AccessIp(userId, tenantId, BucketName, ipAddress);

		return this.httpClient.post<ResponseData>(`${this.S3_URL}/AccessIps`, request)
			.pipe(
				map((result) => {
					return result;
				}),
				catchError((err) => {
					return throwError(err);
				})
			);
	}

	/**
	 * 접근 아이피를 수정한다.
	 * @param addressId 접근 아이피 아이디
	 * @param userId 사용자 아이디
	 * @param tenantId 테넌트 아이디
	 * @param BucketName 버킷 이름
	 * @param ipAddress 아이피 주소
	 */
	updateAccessIp(addressId: string, userId: string, tenantId: string, BucketName: string, ipAddress: string): Observable<ResponseData> {

		const request: RequestS3AccessIp = new RequestS3AccessIp(userId, tenantId, BucketName, ipAddress);

		return this.httpClient.put<ResponseData>(`${this.S3_URL}/AccessIps/${addressId}`, request)
			.pipe(
				map((result) => {
					return result;
				}),
				catchError((err) => {
					return throwError(err);
				})
			);
	}

	/**
	 * 접근 아이피를 삭제한다.
	 * @param addressId 접근 아이피 아이디
	 */
	removeAccessIp(addressId: string): Observable<ResponseData> {

		return this.httpClient.delete<ResponseData>(`${this.S3_URL}/AccessIps/${addressId}`)
			.pipe(
				map((result) => {
					return result;
				}),
				catchError((err) => {
					return throwError(err);
				})
			);
	}

	/**
	 * 접근 아이피 상세 정보를 가져온다.
	 * @param addressId 접근 아이피 아이디
	 */
	getAccessIp(addressId: string): Observable<ResponseData<ResponseS3AccessIp>> {

		return this.httpClient.get<ResponseData>(`${this.S3_URL}/AccessIps/${addressId}`)
			.pipe(
				map((result) => {
					return result;
				}),
				catchError((err) => {
					return throwError(err);
				})
			);
	}

}
