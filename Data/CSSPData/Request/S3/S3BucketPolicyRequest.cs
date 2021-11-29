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
using System;
using System.Collections.Generic;
using CSSPData.Enums;
using MTLib.Core;
using Newtonsoft.Json;

namespace CSSPData.Request.S3
{
	
	// /// <summary>
	// /// S3 버킷 정책 요청 클래스
	// /// </summary>
	// public class S3BucketPolicyRequest
	// {
	// 	/// <summary>
	// 	/// 아이디
	// 	/// </summary>
	// 	public string Id { get; set; } = "";
	//
	// 	/// <summary>
	// 	/// Version
	// 	/// </summary>
	// 	[JsonProperty("Version")]
	// 	public string Version { get; set; } = "";
	//
	// 	/// <summary>
	// 	/// 정책 목록
	// 	/// </summary>
	// 	[JsonProperty("Statement")]
	// 	public List<S3BucketPolicyRequestItem> Statements { get; set; } = new List<S3BucketPolicyRequestItem>();
	//
	// 	/// <summary>
	// 	/// 생성자
	// 	/// </summary>
	// 	/// <param name="bucketName">버킷명</param>
	// 	/// <param name="request">요청 객체</param>
	// 	public S3BucketPolicyRequest(string bucketName, RequestS3BucketPolicy request)
	// 	{
	// 		if (request != null)
	// 		{
	// 			this.Id = request.Id;
	// 			this.Version = request.Version;
	// 			foreach(RequestS3BucketPolicyItem item in request.Statements)
	// 				this.Statements.Add(new S3BucketPolicyRequestItem(bucketName, item));
	// 				
	// 		}
	// 	}
	// 	
	// }
	//
	// /// <summary>
	// /// S3 버킷 정책 항목 클래스
	// /// </summary>
	// public class S3BucketPolicyRequestItem
	// {
	// 	/// <summary>
	// 	/// SID
	// 	/// </summary>
	// 	[JsonProperty("Sid")]
	// 	public string Sid { get; set; } = "";
	// 	
	// 	/// <summary>
	// 	/// S3 버킷 정책 적용 타입
	// 	/// </summary>
	// 	[JsonProperty("Effect")]
	// 	public string Effect { get; set; } = "";
	//
	// 	/// <summary>
	// 	/// 자격 목록
	// 	/// </summary>
	// 	[JsonProperty("Principal")]
	// 	public S3BucketPolicyRequestPrincipal Principal { get; set; } = new S3BucketPolicyRequestPrincipal();
	//
	// 	/// <summary>
	// 	/// Actions
	// 	/// </summary>
	// 	[JsonProperty("Action")]
	// 	public List<string> Actions { get; set; } = new List<string>();
	//
	// 	/// <summary>
	// 	/// 리소스명 목록
	// 	/// </summary>
	// 	[JsonProperty("Resource")]
	// 	public List<string> ResourceNames { get; set; } = new List<string>();
	//
	// 	/// <summary>
	// 	/// 생성자
	// 	/// </summary>
	// 	/// <param name="bucketName">버킷명</param>
	// 	/// <param name="request">요청 객체</param>
	// 	public S3BucketPolicyRequestItem(string bucketName, RequestS3BucketPolicyItem request)
	// 	{
	// 		if (request != null)
	// 		{
	// 			this.Sid = request.Sid;
	// 			this.Effect = request.Effect.ToString();
	//
	// 			// 액션이 존재하지 않는 경우
	// 			if (request.Actions.Count == 0)
	// 				this.Actions.Add("s3:*");
	// 			// 액션이 존재하는 경우
	// 			else
	// 			{
	// 				foreach (EnumS3BucketPolicyActionType action in request.Actions)
	// 					this.Actions.Add("s3:" + action.ToString());
	// 			}
	// 			
	// 			// 자격이 존재하지 않는 경우
	// 			if(request.Principal.IsEmpty())
	// 				Principal.AWS.Add("*");
	// 			else
	// 			{
	// 				string[] principals = request.Principal.Split(new[] {','}, StringSplitOptions.RemoveEmptyEntries);
	// 				foreach (string principal in principals)
	// 					Principal.AWS.Add(principal.Trim());
	// 			}
	// 			
	// 			// 리소스명이 존재하지 않는 경우
	// 			if(request.ResourceName.IsEmpty())
	// 				ResourceNames.Add("arn:aws:s3:::" + bucketName + "/*");
	// 			else
	// 			{
	// 				string[] resourceNames = request.ResourceName.Split(new[] {','}, StringSplitOptions.RemoveEmptyEntries);
	// 				foreach (string resourceName in resourceNames)
	// 					ResourceNames.Add("arn:aws:s3:::" + bucketName + "/" + resourceName.Trim());
	// 			}
	// 		}
	// 	}
	// }
	//
	// /// <summary>
	// /// S3 버킷 정책 자격 증명 클래스
	// /// </summary>
	// public class S3BucketPolicyRequestPrincipal
	// {
	// 	public List<string> AWS { get; set; } = new List<string>();
	// }
	
}