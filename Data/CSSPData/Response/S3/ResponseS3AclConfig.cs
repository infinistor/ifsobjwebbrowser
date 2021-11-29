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
namespace CSSPData.Response.S3
{
	/// <summary>ACL 설정 응답 클래스</summary>
	public class ResponseS3AclConfig
	{
		/// <summary>ACL 대상자 정보</summary>
		public ResponseS3Grantee Grantee { get; set; } = new ResponseS3Grantee();
		
		/// <summary>권한</summary>
		public string Permission { get; set; } = "";
	}

	/// <summary>ACL 대상자 응답 정보 클래스</summary>
	public class ResponseS3Grantee
	{
		/// <summary>타입</summary>
		public string Type { get; set; } = "";
		/// <summary>표시명</summary>
		public string DisplayName { get; set; } = "";
		/// <summary>이메일 주</summary>
		public string EmailAddress { get; set; } = "";
		/// <summary>정식 사용자</summary>
		public string CanonicalUser { get; set; } = "";
		/// <summary>URI</summary>
		public string URI { get; set; } = "";
	}
}