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
using System.Linq;
using System.Text;
using Newtonsoft.Json;

namespace CSSPData.Request.S3
{
	/// <summary>S3 복사 동작 요청 클래스</summary>
	public class RequestS3OperationCopy : RequestS3OperationBase
	{
		/// <summary>복사할 원본 파일명 목록</summary>
		[JsonProperty("names")]
		public string[] Names { get; set; } = null;

		/// <summary>대상 경로</summary>
		[JsonProperty("targetPath")]
		public string TargetPath { get; set; } = "";

		/// <summary>변경된 파일명 목록</summary>
		[JsonProperty("renameFiles")]
		public string[] RenameFiles { get; set; } = null;

		/// <summary>문자열 변환</summary>
		/// <returns>문자열</returns>
		public override string ToString()
		{
			StringBuilder builder = new StringBuilder();
			builder.Append(base.ToString());
			builder.Append($", TargetPath : {TargetPath}, Names : [");
			if (Names.Length > 0)
				builder.Append(Names.Aggregate((cur, next) => cur + ", " + next));
			builder.Append("]");
			builder.Append(", RenameFiles : [");
			if (RenameFiles.Length > 0)
				builder.Append(RenameFiles.Aggregate((cur, next) => cur + ", " + next));
			builder.Append("]");
			return builder.ToString();
		}
	}
}