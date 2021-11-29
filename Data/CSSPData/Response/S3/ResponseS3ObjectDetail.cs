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
using Newtonsoft.Json;

namespace CSSPData.Response.S3
{
    /// <summary>S3 객체 상세 응답 클래스</summary>
    public class ResponseS3ObjectDetail
	{
		/// <summary>이름</summary>
		[JsonProperty("name")] 
		public string Name { get; set; } = "";

		/// <summary>상위 경로</summary>
		[JsonProperty("location")]
		public string Location { get; set; } = "";

		/// <summary>파일인지 여</summary>
		[JsonProperty("isFile")]
		public bool IsFile { get; set; } = false;

		/// <summary>파일 크</summary>
		[JsonProperty("size")]
		public long Size { get; set; } = 0;

		/// <summary>생성일시</summary>
		[JsonProperty("created")]
		// public DateTime? DateCreated { get; set; } = null;
		public string DateCreated { get; set; } = null;

		/// <summary>수정일시</summary>
		[JsonProperty("modified")]
		// public DateTime? DateModified { get; set; } = null;
		public string DateModified { get; set; } = null;

		/// <summary>다중 파일에 대한 상세 정보인지 여부</summary>
		[JsonProperty("multipleFiles")]
		public bool IsMultipleFileDetail { get; set; } = false;

	}
}