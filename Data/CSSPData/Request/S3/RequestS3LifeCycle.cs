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
using MTLib.CommonData;

namespace CSSPData.Request.S3
{
    /// <summary>S3 라이브사이클 정보 등록 요청 클래스</summary>
    public class RequestS3LifeCycle : CommonRequestData
	{
		/// <summary>정책 목록</summary>
		public List<RequestS3LifeCycleRule> Rules { get; set; } = new List<RequestS3LifeCycleRule>();
	}
	
	/// <summary>S3 라이프사이클 등록 정책 클래스</summary>
	public class RequestS3LifeCycleRule : CommonRequestData
	{
		/// <summary>아이디</summary>
		public string Id { get; set; } = "";

		/// <summary>접두사</summary>
		public string Prefix { get; set; } = "";

		/// <summary>만료일 정보</summary>
		public RequestS3LifeCycleRuleExpiration Expiration { get; set; } = null;

		// /// <summary>
		// /// 태그 목록
		// /// </summary>
		// public List<string> Tags { get; set; } = new List<string>();

		/// <summary>활성화 여부</summary>
		public bool Enable { get; set; } = true;
	}
}