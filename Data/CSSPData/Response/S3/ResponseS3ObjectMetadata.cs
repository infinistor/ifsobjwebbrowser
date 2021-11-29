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

namespace CSSPData.Response.S3
{
    /// <summary>S3 객체 메타데이터 응답 클래스</summary>
    public class ResponseS3ObjectMetadata
	{
		/// <summary>ContentLength</summary>
		public long ContentLength { get; set; }

		/// <summary>ContentType</summary>
		public string ContentType { get; set; }

		/// <summary>CacheControl</summary>
		public string CacheControl { get; set; }

		/// <summary>ContentDisposition</summary>
		public string ContentDisposition { get; set; }

		/// <summary>ContentEncoding</summary>
		public string ContentEncoding { get; set; }

		/// <summary>ExpiresUtc</summary>
		public DateTime? ExpiresUtc { get; set; }

		/// <summary>ContentMD5</summary>
		public string ContentMD5 { get; set; }

		/// <summary>META 데이터 목록</summary>
		public List<ResponseS3MetadataKeyValue> Metadata { get; } = new List<ResponseS3MetadataKeyValue>();
	}

	/// <summary>메타데이터 키/값 정보 응답 클래스</summary>
	public class ResponseS3MetadataKeyValue
	{
		/// <summary>키</summary>
		public string Key { get; set; } = "";

		/// <summary>값</summary>
		public string Value { get; set; } = "";

		/// <summary>생성자</summary>
		/// <param name="key">키</param>
		/// <param name="value">값</param>
		public ResponseS3MetadataKeyValue(string key, string value)
		{
			this.Key = key;
			this.Value = value;
		}
	}
}