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
using System.IO;
using System.Linq;
using Amazon.S3.Model;
using MTLib.Core;

namespace CSSPData.Response.S3
{
    /// <summary>Versioning 정보 응답 클래스</summary>
    public class ResponseS3VersioningInfo
	{
		/// <summary>버전 아이디</summary>
		public string VersionId { get; set; } = "";

		/// <summary>버킷명</summary>
		public string BucketName { get; set; } = "";

		/// <summary>키</summary>
		public string Key { get; set; } = "";

		/// <summary>상위 폴더 경로</summary>
		public string ParentPath { get; set; } = "";
		
		/// <summary>객체명</summary>
		public string Name { get; set; } = "";
		
		/// <summary>최종 수정 일시</summary>
		public DateTime LastModified { get; set; }

		/// <summary>ETag</summary>
		public string ETag { get; set; } = "";

		/// <summary>최종본 인지 여부</summary>
		public bool IsLatest { get; set; } = false;

		/// <summary>삭제 표시인지 여부</summary>
		public bool IsDeleteMarker { get; set; } = false;

		/// <summary>생성자</summary>
		/// <param name="version">버전 정보 객체</param>
		public ResponseS3VersioningInfo(S3ObjectVersion version)
		{
			this.VersionId = version.VersionId == "null" ? null : version.VersionId;
			this.BucketName = version.BucketName;
			this.Key = version.Key;
			List<string> keyItems = new List<string>();
			if (!version.Key.IsEmpty())
			{
				string[] items = version.Key.Split(Path.DirectorySeparatorChar.ToString());
				foreach (string item in items)
					keyItems.Add(item);
			}

			if (keyItems.Count > 0)
			{
				if (keyItems.Count >= 2)
					this.ParentPath = keyItems.Take(keyItems.Count - 1).Aggregate((cur, next) => Path.Combine(cur, next));
				this.Name = keyItems.Last();
			}

			this.LastModified = version.LastModified;
			this.ETag = version.ETag.Replace("\"", "");
			this.IsLatest = version.IsLatest;
			this.IsDeleteMarker = version.IsDeleteMarker;
		}
	}
}