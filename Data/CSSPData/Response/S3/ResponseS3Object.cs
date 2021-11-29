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
using System.IO;
using System.Linq;
using Amazon.S3.Model;
using MTLib.Core;
using Newtonsoft.Json;

namespace CSSPData.Response.S3
{
	/// <summary>S3 객체 응답 클래스</summary>
	public class ResponseS3Object
	{
		/// <summary>이름</summary>
		[JsonProperty("name")] 
		public string Name { get; set; } = "";

		/// <summary>상위 경로</summary>
		[JsonProperty("filterPath")]
		public string ParentPath { get; set; } = "";

		/// <summary>확장자</summary>
		[JsonProperty("type")]
		public string Extension { get; set; } = "";

		/// <summary>파일 크</summary>
		[JsonProperty("size")]
		public long Size { get; set; } = 0;

		/// <summary>파일인지 여</summary>
		[JsonProperty("isFile")]
		public bool IsFile { get; set; } = false;

		/// <summary>하위 폴더가 존재하는지 여부</summary>
		[JsonProperty("hasChild")]
		public bool HasChild { get; set; } = false;

		/// <summary>생성일시</summary>
		[JsonProperty("dateCreated")]
		// public DateTime? DateCreated { get; set; } = null;
		public string DateCreated { get; set; } = null;

		/// <summary>수정일시</summary>
		[JsonProperty("dateModified")]
		// public DateTime? DateModified { get; set; } = null;
		public string DateModified { get; set; } = null;

		/// <summary>다중 파일에 대한 상세 정보인지 여부</summary>
		[JsonProperty("multipleFiles")]
		public bool IsMultipleFileDetail { get; set; } = false;

		/// <summary>생성자 (폴더)</summary>
		/// <param name="bucketName">버킷명</param>
		/// <param name="hasChild">하위 폴더 존재 여부</param>
		public ResponseS3Object(string bucketName, bool hasChild)
		{
			Name = bucketName;
			ParentPath = Path.DirectorySeparatorChar.ToString();
			Extension = "";
			Size = 0;
			IsFile = false;
			HasChild = hasChild;
			DateCreated = null;
			DateModified = null;
		}

		/// <summary>생성자 (폴더)</summary>
		/// <param name="bucketName">버킷명</param>
		/// <param name="name">폴더</param>
		/// <param name="hasChild">하위 폴더 존재 여부</param>
		public ResponseS3Object(string bucketName, string name, bool hasChild)
		{
			if (name.IsEmpty() || name == Path.DirectorySeparatorChar.ToString()) {
				name = bucketName;
				bucketName = "";
			}
			// 상위 폴더와 현재 폴더/파일을 분리한다.
			SplitPath(name, out string parentPath, out string currentPath);

			Name = currentPath;
			// 버킷명과 상위 폴더명이 없는 경우
			if (bucketName.IsEmpty() && parentPath.IsEmpty())
				ParentPath = null;
			// 버킷명 혹은 상위 폴더명이 없는 경우
			else
			{
				ParentPath = Path.DirectorySeparatorChar.ToString() + bucketName + parentPath;
				if (ParentPath.EndsWith(Path.DirectorySeparatorChar.ToString() + Path.DirectorySeparatorChar.ToString()))
					ParentPath = ParentPath.Replace(Path.DirectorySeparatorChar.ToString() + Path.DirectorySeparatorChar.ToString(), Path.DirectorySeparatorChar.ToString());
				if (!ParentPath.EndsWith(Path.DirectorySeparatorChar.ToString()))
					ParentPath = ParentPath + Path.DirectorySeparatorChar.ToString();
			}
			//ParentPath = bucketName.IsEmpty() && parentPath.IsEmpty() ? null : bucketName.IsEmpty() ? parentPath : Path.DirectorySeparatorChar.ToString() + bucketName + parentPath;
			Extension = "";
			Size = 0;
			IsFile = false;
			HasChild = hasChild;
			DateCreated = "-";
			DateModified = "-";
		}

		/// <summary>생성자 (파일)</summary>
		/// <param name="bucketName">버킷명</param>
		/// <param name="s3Object">S3 파일 정보 객체</param>
		public ResponseS3Object(string bucketName, S3Object s3Object)
		{
			if (s3Object != null)
			{
				// 상위 폴더와 현재 폴더/파일을 분리한다.
				SplitPath(s3Object.Key, out string parentPath, out string currentPath);
				
				Name = currentPath;
				ParentPath = Path.DirectorySeparatorChar.ToString() + bucketName + parentPath;
				if (ParentPath.EndsWith(Path.DirectorySeparatorChar.ToString() + Path.DirectorySeparatorChar.ToString()))
					ParentPath = ParentPath.Replace(Path.DirectorySeparatorChar.ToString() + Path.DirectorySeparatorChar.ToString(), Path.DirectorySeparatorChar.ToString());
				if (!ParentPath.EndsWith(Path.DirectorySeparatorChar.ToString()))
					ParentPath = ParentPath + Path.DirectorySeparatorChar.ToString();
				Extension = Path.GetExtension(currentPath);
				Size = s3Object.Size;
				IsFile = true;
				HasChild = false;
				DateCreated = s3Object.LastModified.ToString("yyyy-MM-dd hh:mm:ss");
				DateModified = s3Object.LastModified.ToString("yyyy-MM-dd hh:mm:ss");
			}
		}

		/// <summary>주어진 경로를 현재 경로와 상위 경로로 분리한다.</summary>
		/// <param name="path">분리할 전체 경로</param>
		/// <param name="parent">상위 경로</param>
		/// <param name="current">현재 폴더/파일명</param>
		/// <returns>분리 성공 여부</returns>
		public static bool SplitPath(string path, out string parent, out string current)
		{
			bool result = false;
			parent = null;
			current = null;

			try
			{
				if (!path.IsEmpty() && path != Path.DirectorySeparatorChar.ToString())
				{
					string[] pathItems = path.Split(new char[] { Path.DirectorySeparatorChar }, StringSplitOptions.RemoveEmptyEntries);

					current = pathItems[pathItems.Length - 1];
					parent = Path.DirectorySeparatorChar.ToString();
					if(pathItems.Length > 1)
						parent = parent
						         + pathItems
							         .Take(pathItems.Length - 1)
							         .Aggregate((cur, next) => cur + Path.DirectorySeparatorChar.ToString() + next);
				}

				result = true;
			}
			catch (Exception ex)
			{
				NNException.Log(ex);
			}

			return result;
		}
	}
}