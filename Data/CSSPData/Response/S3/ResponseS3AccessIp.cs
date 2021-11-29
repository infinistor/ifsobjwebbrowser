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

namespace CSSPData.Response.S3
{
	/// <summary>접근 아이피 주소 정보 응답 클래스</summary>
	public class ResponseS3AccessIp
	{
		/// <summary>허용주소 아이디</summary>
		public string AddressId { get; set; }

		/// <summary>사용자 아이디</summary>
		public string UserId { get; set; }

		/// <summary>TENENT 아이디</summary>
		public string TenantId { get; set; }
		
		/// <summary>Bucket 이름</summary>
		public string BucketName { get; set; }

		/// <summary>허용 시작 아이피 값</summary>
		public long StartIpNo { get; set; }

		/// <summary>허용 시작 아이피 주소</summary>
		public string StartIpAddress { get; set; }

		/// <summary>허용 종료 아이피 값</summary>
		public long EndIpNo { get; set; }

		/// <summary>허용 종료 아이피 주소</summary>
		public string EndIpAddress { get; set; }

		/// <summary>입력 아이피 주소</summary>
		public string IpAddress { get; set; }

		/// <summary>등록일시</summary>
		public DateTime RegDate { get; set; }

		/// <summary>등록자명</summary>
		public string RegName { get; set; }

		/// <summary>등록 아이디</summary>
		public string RegId { get; set; }
	}
}