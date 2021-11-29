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
using System.Collections.Generic;
using System.Threading.Tasks;
using Amazon.S3.Model;
using CSSPData;
using CSSPData.Request.S3;
using CSSPData.Response.S3;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

namespace CSSPProviderInterfaces
{
	/// <summary>S3 프로바이더 인터페이스</summary>
	public interface IS3Provider : IBaseProvider
	{
		/// <summary>모든 버킷 목록을 가져온다.</summary>
		/// <param name="serviceUrl">서비스 URL</param>
		/// <param name="accessKey">엑세스 키</param>
		/// <param name="accessSecret">엑세스 시크릿</param>
		/// <returns>버킷 목록 객체</returns>
		Task<ResponseList<ResponseS3Bucket>> GetBuckets(string serviceUrl, string accessKey, string accessSecret);
		
		/// <summary>버킷을 생성한다.</summary>
		/// <param name="serviceUrl">서비스 URL</param>
		/// <param name="accessKey">엑세스 키</param>
		/// <param name="accessSecret">엑세스 시크릿</param>
		/// <param name="name">생성할 버킷명</param>
		/// <returns>버킷 생성 결과 객체</returns>
		Task<ResponseData> CreateBucket(string serviceUrl, string accessKey, string accessSecret, string name);

		/// <summary>버킷을 삭제한다.</summary>
		/// <param name="serviceUrl">서비스 URL</param>
		/// <param name="accessKey">엑세스 키</param>
		/// <param name="accessSecret">엑세스 시크릿</param>
		/// <param name="name">삭제할 버킷명</param>
		/// <returns>버킷 삭제 결과 객체</returns>
		Task<ResponseData> DeleteBucket(string serviceUrl, string accessKey, string accessSecret, string name);

		/// <summary>특정 경로의 객체 목록을 반환한다.</summary>
		/// <param name="serviceUrl">서비스 URL</param>
		/// <param name="accessKey">엑세스 키</param>
		/// <param name="accessSecret">엑세스 시크릿</param>
		/// <param name="path">경로 (구분자 '/' 사용)</param>
		/// <param name="maxData">페이지당 레코드 수</param>
		/// <returns>객체 목록</returns>
		Task<ResponseData<ResponseS3Read>> Read(string serviceUrl, string accessKey, string accessSecret, string path, int maxData = int.MaxValue);

		/// <summary>특정 경로에 폴더를 생성한다.</summary>
		/// <param name="serviceUrl">서비스 URL</param>
		/// <param name="accessKey">엑세스 키</param>
		/// <param name="accessSecret">엑세스 시크릿</param>
		/// <param name="path">경로 (구분자 '/' 사용)</param>
		/// <param name="name">생성할 폴더명</param>
		/// <returns>생성 결과 객체</returns>
		Task<ResponseData<ResponseS3Create>> Create(string serviceUrl, string accessKey, string accessSecret, string path, string name);

		/// <summary>특정 경로에서 폴더 혹은 파일을 삭제한다.</summary>
		/// <param name="serviceUrl">서비스 URL</param>
		/// <param name="accessKey">엑세스 키</param>
		/// <param name="accessSecret">엑세스 시크릿</param>
		/// <param name="path">경로 (구분자 '/' 사용)</param>
		/// <param name="names">삭제할 폴더/파일명 목록</param>
		/// <returns>삭제 결과 객체</returns>
		Task<ResponseData<ResponseS3Delete>> Delete(string serviceUrl, string accessKey, string accessSecret, string path, string[] names);

		/// <summary>특정 파일을 대상 폴더로 복사한다.</summary>
		/// <param name="serviceUrl">서비스 URL</param>
		/// <param name="accessKey">엑세스 키</param>
		/// <param name="accessSecret">엑세스 시크릿</param>
		/// <param name="sourcePath">원본 폴더</param>
		/// <param name="sources">원본 파일/폴더 목록</param>
		/// <param name="targetPath">대상 폴더</param>
		/// <param name="targetNames">저장 폴더/파일명</param>
		/// <returns>복사 결과 객체</returns>
		Task<ResponseData<ResponseS3Copy>> Copy(string serviceUrl, string accessKey, string accessSecret, string sourcePath, RequestS3Object[] sources, string targetPath, string[] targetNames);

		/// <summary>특정 파일을 대상 폴더로 이동한다.</summary>
		/// <param name="serviceUrl">서비스 URL</param>
		/// <param name="accessKey">엑세스 키</param>
		/// <param name="accessSecret">엑세스 시크릿</param>
		/// <param name="sourcePath">원본 폴더</param>
		/// <param name="sources">원본 파일/폴더 목록</param>
		/// <param name="targetPath">대상 폴더</param>
		/// <param name="targetNames">저장 폴더/파일명</param>
		/// <returns>복사 결과 객체</returns>
		Task<ResponseData<ResponseS3Move>> Move(string serviceUrl, string accessKey, string accessSecret, string sourcePath, RequestS3Object[] sources, string targetPath, string[] targetNames);

		/// <summary>특정 파일을 대상 폴더로 이동한다.</summary>
		/// <param name="serviceUrl">서비스 URL</param>
		/// <param name="accessKey">엑세스 키</param>
		/// <param name="accessSecret">엑세스 시크릿</param>
		/// <param name="sourcePath">원본 폴더</param>
		/// <param name="source">원본 파일/폴더 객체</param>
		/// <param name="targetName">변경할 폴더/파일명</param>
		/// <returns>이름 변경 결과 객체</returns>
		Task<ResponseData<ResponseS3Rename>> Rename(string serviceUrl, string accessKey, string accessSecret, string sourcePath, RequestS3Object source, string targetName);

		/// <summary>해당 경로에서 파일 및 폴더를 검색한다.</summary>
		/// <param name="serviceUrl">서비스 URL</param>
		/// <param name="accessKey">엑세스 키</param>
		/// <param name="accessSecret">엑세스 시크릿</param>
		/// <param name="sourcePath">원본 폴더</param>
		/// <param name="searchString">검색어</param>
		/// <param name="caseSensitive">대소문자 구분 여부</param>
		/// <returns>검색 결과 객체</returns>
		Task<ResponseData<ResponseS3Search>> Search(string serviceUrl, string accessKey, string accessSecret, string sourcePath, string searchString, bool caseSensitive);

		/// <summary>특정 파일들에 대한 상세 정보를 반환한다.</summary>
		/// <param name="serviceUrl">서비스 URL</param>
		/// <param name="accessKey">엑세스 키</param>
		/// <param name="accessSecret">엑세스 시크릿</param>
		/// <param name="sourcePath">원본 폴더</param>
		/// <param name="names">상세 정보를 요청하는 파일/폴더명</param>
		/// <returns>상세 정보 결과 객체</returns>
		Task<ResponseData<ResponseS3Details>> GetDetails(string serviceUrl, string accessKey, string accessSecret, string sourcePath, string[] names);

		/// <summary>파일 업로드</summary>
		/// <param name="serviceUrl">서비스 URL</param>
		/// <param name="accessKey">엑세스 키</param>
		/// <param name="accessSecret">엑세스 시크릿</param>
		/// <param name="action">동작 명령</param>
		/// <param name="uploadFiles">업로드 파일 목록</param>
		/// <param name="targetPath">대상 폴더 경로</param>
		/// <returns>업로드 결과 객체</returns>
		Task<ResponseData<ResponseS3Create>> Upload(string serviceUrl, string accessKey, string accessSecret, string action, IList<IFormFile> uploadFiles, string targetPath);

		/// <summary>파일 다운로드</summary>
		/// <param name="serviceUrl">서비스 URL</param>
		/// <param name="accessKey">엑세스 키</param>
		/// <param name="accessSecret">엑세스 시크릿</param>
		/// <param name="sourcePath">다운로드할 파일이 존재하는 폴더 경로</param>
		/// <param name="sources">원본 파일/폴더 목록</param>
		/// <param name="names">저장 시 사용할 파일/폴더명 목록</param>
		/// <returns>다운로드 스트림 결과 객체</returns>
		Task<ResponseData<FileStreamResult>> Download(string serviceUrl, string accessKey, string accessSecret, string sourcePath, RequestS3Object[] sources, string[] names);

		/// <summary>파일 다운로드</summary>
		/// <param name="serviceUrl">서비스 URL</param>
		/// <param name="accessKey">엑세스 키</param>
		/// <param name="accessSecret">엑세스 시크릿</param>
		/// <param name="path">이미지 경로</param>
		/// <returns>다운로드 스트림 결과 객체</returns>
		ResponseData<FileStreamResult> GetImage(string serviceUrl, string accessKey, string accessSecret, string path);

		/// <summary>버킷의 CORS 설정을 가져온다.</summary>
		/// <param name="serviceUrl">서비스 URL</param>
		/// <param name="accessKey">엑세스 키</param>
		/// <param name="accessSecret">엑세스 시크릿</param>
		/// <param name="bucketName">버킷명</param>
		/// <returns>CORS 룰 목록 객체</returns>
		Task<ResponseData<CORSConfiguration>> GetCorsConfig(string serviceUrl, string accessKey, string accessSecret, string bucketName);

		/// <summary>버킷의 CORS 설정을 저장한다.</summary>
		/// <param name="serviceUrl">서비스 URL</param>
		/// <param name="accessKey">엑세스 키</param>
		/// <param name="accessSecret">엑세스 시크릿</param>
		/// <param name="bucketName">버킷명</param>
		/// <param name="config">CORS 설정 객체</param>
		/// <returns>저장 결과</returns>
		Task<ResponseData> SetCorsConfig(string serviceUrl, string accessKey, string accessSecret, string bucketName, CORSConfiguration config);

		/// <summary>버킷의 웹사이트 설정을 가져온다.</summary>
		/// <param name="serviceUrl">서비스 URL</param>
		/// <param name="accessKey">엑세스 키</param>
		/// <param name="accessSecret">엑세스 시크릿</param>
		/// <param name="bucketName">버킷명</param>
		/// <returns>웹사이트 룰 목록 객체</returns>
		Task<ResponseData<WebsiteConfiguration>> GetWebSiteConfig(string serviceUrl, string accessKey, string accessSecret, string bucketName);

		/// <summary>버킷의 웹사이트 설정을 저장한다.</summary>
		/// <param name="serviceUrl">서비스 URL</param>
		/// <param name="accessKey">엑세스 키</param>
		/// <param name="accessSecret">엑세스 시크릿</param>
		/// <param name="bucketName">버킷명</param>
		/// <param name="config">웹사이트 설정 객체</param>
		/// <returns>저장 결과</returns>
		Task<ResponseData> SetWebSiteConfig(string serviceUrl, string accessKey, string accessSecret, string bucketName, WebsiteConfiguration config);

		/// <summary>버킷의 ACL 설정을 가져온다.</summary>
		/// <param name="serviceUrl">서비스 URL</param>
		/// <param name="accessKey">엑세스 키</param>
		/// <param name="accessSecret">엑세스 시크릿</param>
		/// <param name="request">ACL 설정 요청 객체</param>
		/// <returns>웹사이트 룰 목록 객체</returns>
		Task<ResponseList<ResponseS3AclConfig>> GetAclConfig(string serviceUrl, string accessKey, string accessSecret, RequestS3AclConfig request);

		/// <summary>버킷의 ACL 설정을 저장한다.</summary>
		/// <param name="serviceUrl">서비스 URL</param>
		/// <param name="accessKey">엑세스 키</param>
		/// <param name="accessSecret">엑세스 시크릿</param>
		/// <param name="request">ACL 설정 수정 요청 객체</param>
		/// <returns>저장 결과</returns>
		Task<ResponseData> SetAclConfig(string serviceUrl, string accessKey, string accessSecret, RequestS3AclConfigUpdate request);

		/// <summary>객체의 Version 목록을 가져온다.</summary>
		/// <param name="serviceUrl">서비스 URL</param>
		/// <param name="accessKey">엑세스 키</param>
		/// <param name="accessSecret">엑세스 시크릿</param>
		/// <param name="request">S3 버전 목록 요청 객체</param>
		/// <returns>웹사이트 룰 목록 객체</returns>
		Task<ResponseList<ResponseS3VersioningInfo>> GetVersioningList(string serviceUrl, string accessKey, string accessSecret, RequestS3VersionList request);

		/// <summary>객체의 특정 버전들을 삭제한다.</summary>
		/// <param name="serviceUrl">서비스 URL</param>
		/// <param name="accessKey">엑세스 키</param>
		/// <param name="accessSecret">엑세스 시크릿</param>
		/// <param name="request">S3 버전 삭제 요청 객체</param>
		/// <returns>웹사이트 룰 목록 객체</returns>
		Task<ResponseData> DeleteVersion(string serviceUrl, string accessKey, string accessSecret, RequestS3VersionDelete request);

		/// <summary>객체의 특정 버전을 다운로드 한다.</summary>
		/// <param name="serviceUrl">서비스 URL</param>
		/// <param name="accessKey">엑세스 키</param>
		/// <param name="accessSecret">엑세스 시크릿</param>
		/// <param name="request">S3 버전 다운로드 요청 객체</param>
		/// <returns>웹사이트 룰 목록 객체</returns>
		Task<ResponseData<FileStreamResult>> DownloadVersion(string serviceUrl, string accessKey, string accessSecret, RequestS3VersionDownload request);

		/// <summary>버킷의 Versioning 설정을 가져온다.</summary>
		/// <param name="serviceUrl">서비스 URL</param>
		/// <param name="accessKey">엑세스 키</param>
		/// <param name="accessSecret">엑세스 시크릿</param>
		/// <param name="bucketName">버킷명</param>
		/// <returns>웹사이트 룰 목록 객체</returns>
		Task<ResponseData<ResponseS3VersioningConfig>> GetVersioningConfig(string serviceUrl, string accessKey, string accessSecret, string bucketName);

		/// <summary>버킷의 Versioning 설정을 저장한다.</summary>
		/// <param name="serviceUrl">서비스 URL</param>
		/// <param name="accessKey">엑세스 키</param>
		/// <param name="accessSecret">엑세스 시크릿</param>
		/// <param name="bucketName">버킷명</param>
		/// <param name="config">Versioning 설정 객체</param>
		/// <returns>저장 결과</returns>
		Task<ResponseData> SetVersioningConfig(string serviceUrl, string accessKey, string accessSecret, string bucketName, RequestS3VersioningConfig config);

		/// <summary>버킷의 정책 설정을 가져온다.</summary>
		/// <param name="serviceUrl">서비스 URL</param>
		/// <param name="accessKey">엑세스 키</param>
		/// <param name="accessSecret">엑세스 시크릿</param>
		/// <param name="bucketName">버킷명</param>
		/// <returns>버킷 정책 설정 정보 객체</returns>
		Task<ResponseData<ResponseS3BucketPolicy>> GetBucketPolicy(string serviceUrl, string accessKey, string accessSecret, string bucketName);

		/// <summary>버킷의 정책 설정을 저장한다.</summary>
		/// <param name="serviceUrl">서비스 URL</param>
		/// <param name="accessKey">엑세스 키</param>
		/// <param name="accessSecret">엑세스 시크릿</param>
		/// <param name="bucketName">버킷명</param>
		/// <param name="config">Versioning 설정 객체</param>
		/// <returns>저장 결과</returns>
		Task<ResponseData> SetBucketPolicy(string serviceUrl, string accessKey, string accessSecret, string bucketName, RequestS3BucketPolicy config);

		/// <summary>특정 객체의 메타데이터를 가져온다.</summary>
		/// <param name="serviceUrl">서비스 URL</param>
		/// <param name="accessKey">엑세스 키</param>
		/// <param name="accessSecret">엑세스 시크릿</param>
		/// <param name="request">메타데이터 요청 객체</param>
		/// <returns>메타데이터 정보 객체</returns>
		Task<ResponseData<ResponseS3ObjectMetadata>> GetMetadata(string serviceUrl, string accessKey, string accessSecret, RequestS3OperationMetadata request);

		/// <summary>특정 객체의 메타데이터를 저장한다.</summary>
		/// <param name="serviceUrl">서비스 URL</param>
		/// <param name="accessKey">엑세스 키</param>
		/// <param name="accessSecret">엑세스 시크릿</param>
		/// <param name="request">메타데이터 수정요청 객체</param>
		/// <returns>저장 결과</returns>
		Task<ResponseData> SetMetadata(string serviceUrl, string accessKey, string accessSecret, RequestS3Metadata request);

		/// <summary>특정 객체의 태그를 가져온다.</summary>
		/// <param name="serviceUrl">서비스 URL</param>
		/// <param name="accessKey">엑세스 키</param>
		/// <param name="accessSecret">엑세스 시크릿</param>
		/// <param name="request">태그 요청 객체</param>
		/// <returns>태그 목록 객체</returns>
		Task<ResponseList<ResponseS3ObjectTagging>> GetTagging(string serviceUrl, string accessKey, string accessSecret, RequestS3Tagging request);

		/// <summary>특정 객체의 태그를 저장한다.</summary>
		/// <param name="serviceUrl">서비스 URL</param>
		/// <param name="accessKey">엑세스 키</param>
		/// <param name="accessSecret">엑세스 시크릿</param>
		/// <param name="request">태그 수정요청 객체</param>
		/// <returns>저장 결과</returns>
		Task<ResponseData> SetTagging(string serviceUrl, string accessKey, string accessSecret, RequestS3OperationTagging request);
	
		/// <summary>특정 버킷의 라이프사이클 설정을 가져온다.</summary>
		/// <param name="serviceUrl">서비스 URL</param>
		/// <param name="accessKey">엑세스 키</param>
		/// <param name="accessSecret">엑세스 시크릿</param>
		/// <param name="bucketName">버킷명</param>
		/// <returns>라이프사이클 설정 정보 객체</returns>
		Task<ResponseList<ResponseS3LifeCycleRule>> GetLifeCycle(string serviceUrl, string accessKey, string accessSecret, string bucketName);

		/// <summary>특정 버킷의 라이프사이클 설정를 저장한다.</summary>
		/// <param name="serviceUrl">서비스 URL</param>
		/// <param name="accessKey">엑세스 키</param>
		/// <param name="accessSecret">엑세스 시크릿</param>
		/// <param name="bucketName">버킷명</param>
		/// <param name="request">라이프사이클 등록 요청 객체</param>
		/// <returns>라이프사이클 설정 정보 객체</returns>
		Task<ResponseData> SetLifeCycle(string serviceUrl, string accessKey, string accessSecret, string bucketName, RequestS3LifeCycle request);

		/// <summary>특정 객체의 공유 URL를 가져온다.</summary>
		/// <param name="serviceUrl">서비스 URL</param>
		/// <param name="accessKey">엑세스 키</param>
		/// <param name="accessSecret">엑세스 시크릿</param>
		/// <param name="request">공유 URL 요청 객체</param>
		/// <returns>공유 URL 정보 객체</returns>
		Task<ResponseData<string>> GetShareUrl(string serviceUrl, string accessKey, string accessSecret, RequestS3OperationShareUrl request);
	}
}