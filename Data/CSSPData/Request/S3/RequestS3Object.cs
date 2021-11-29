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
using CSSPData.Response.S3;
using Newtonsoft.Json;

namespace CSSPData.Request.S3
{
	/// <summary>S3 경로 정보 클래스</summary>
	public class RequestS3Object
	{
		/// <summary>이름</summary>
		[JsonProperty("name")] 
		public string Name { get; set; } = "";

		/// <summary>상위 경로</summary>
		[JsonProperty("filterPath")]
		public string ParentPath { get; set; }

		/// <summary>생성자</summary>
		public RequestS3Object()
		{
		}

		/// <summary>생성자</summary>
		/// <param name="parentPath">상위 경로</param>
		/// <param name="name">이름</param>
		public RequestS3Object(string parentPath, string name)
		{
			this.ParentPath = parentPath;
			this.Name = name;
		}

		/// <summary>생성자</summary>
		/// <param name="response">ResponseS3Object 객체</param>
		public RequestS3Object(ResponseS3Object response)
		{
			if(response == null)
				throw new ArgumentException("Argument ResponseS3Object instance must be not null");
			this.ParentPath = response.ParentPath;
			this.Name = response.Name;
		}

		/// <summary>문자열 변환</summary>
		/// <returns></returns>
		public override string ToString()
		{
			return $"{{ Name : {Name}, ParentPath : {ParentPath} }}";
		}
	}
}