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
using MTLib.Core;

namespace CSSPData.Response.S3
{
    /// <summary>S3 버킷 정보 응답 클래스</summary>
    public class ResponseS3Bucket
	{
		/// <summary>버킷명</summary>
		public string Name { get; set; } = "";

		/// <summary>마지막 수정 일시</summary>
		public DateTime? ModDate { get; set; } = null;

		/// <summary>하위 폴더가 존재하는지 여부</summary>
		public bool HasChild { get; set; } = false;

		/// <summary>생성자</summary>
		public ResponseS3Bucket()
		{
		}

		/// <summary>생성자</summary>
		/// <param name="name">버킷 객체명</param>
		/// <param name="modDate">수정일시</param>
		/// <param name="hasChild">하위 폴더가 존재하는지 여</param>
		public ResponseS3Bucket(string name, DateTime modDate, bool hasChild)
		{
			this.Name = name;
			this.ModDate = modDate;
			this.HasChild = hasChild;
		}

		/// <summary>주어진 경로를 버킷명과 나머지 경로로 분리한다.</summary>
		/// <param name="path">분리할 전체 경로</param>
		/// <param name="bucketName">버킷명</param>
		/// <param name="remainPath">버킷명을 제외한 나머지 경</param>
		/// <returns>분리 성공 여부</returns>
		public static bool SplitBucket(string path, out string bucketName, out string remainPath)
		{
			bool result = false;
			bucketName = null;
			remainPath = null;

			try
			{
				if (!path.IsEmpty() && path != Path.DirectorySeparatorChar.ToString())
				{
					string[] pathItems = path.Split(new char[] { Path.DirectorySeparatorChar }, StringSplitOptions.RemoveEmptyEntries);

					bucketName = pathItems[0];
					remainPath = Path.DirectorySeparatorChar.ToString();
					if(pathItems.Length > 1)
						remainPath = remainPath
						             + pathItems
							             .Skip(1)
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