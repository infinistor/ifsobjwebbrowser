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
using CSSPProviderInterfaces;
using Microsoft.Extensions.Logging;
using MTLib.Core;

namespace CSSPProvider
{
    /// <summary>프로바이더 기본 클래스</summary>
    public class BaseProvider : IBaseProvider
	{
		/// <summary>로거</summary>
		protected readonly ILogger m_logger;

		/// <summary>생성자</summary>
		/// <param name="dbContext">DB 컨텍스트</param>
		/// <param name="configuration">설정 정보</param>
		/// <param name="userManager">사용자 관리자</param>
		/// <param name="systemLogProvider">시스템 로그 프로바이더</param>
		/// <param name="userActionLogProvider">사용자 동작 로그 프로바이더</param>
		/// <param name="logger">로거</param>
		public BaseProvider(
			ILogger logger
			)
		{
			m_logger = logger;
		}

		/// <summary>검색어 필드를 초기화한다.</summary>
		/// <param name="searchFields">검색어 필드 목록</param>
		protected void InitSearchFields(ref List<string> searchFields)
		{
			// 검색 필드 목록을 모두 소문자로 변환
			if (searchFields != null)
				searchFields = searchFields.ToLower();
		}

		/// <summary>기본 정렬 필드</summary>
		protected List<string> DefaultOrderFields { get; } = new List<string>();

		/// <summary>기본 정렬 방향</summary>
		protected List<string> DefaultOrderDirections { get; } = new List<string>();

		/// <summary>기본 정렬 정보를 모두 삭제한다.</summary>
		protected void ClearDefaultOrders()
		{
			DefaultOrderFields.Clear();
			DefaultOrderDirections.Clear();
		}

		/// <summary>기본 정렬 정보를 추가한다.</summary>
		/// <param name="field">필드명</param>
		/// <param name="direction">정렬방향</param>
		protected void AddDefaultOrders(string field, string direction)
		{
			DefaultOrderFields.Add(field);
			DefaultOrderDirections.Add(direction);
		}

		/// <summary>정렬 필드를 초기화한다.</summary>
		/// <param name="orderFields">정렬 필드 목록</param>
		/// <param name="orderDirections">정렬 필드 목록</param>
		protected void InitOrderFields(ref List<string> orderFields, ref List<string> orderDirections)
		{
			if (orderFields == null) orderFields = new List<string>();
			if (orderDirections == null) orderDirections = new List<string>();

			// 정렬 필드가 지정되지 않은 경우, 기본 정렬 필드 설정
			if (orderFields.Count == 0)
			{
				if(DefaultOrderFields.Count > 0)
				{
					orderFields.AddRange(DefaultOrderFields);
					orderDirections.Clear();
				}
			}

			// 정렬방향목록이 지정되지 않은 경우, 기본 정렬방향목록 설정
			if (orderDirections.Count == 0)
			{
				if (DefaultOrderDirections.Count > 0 && orderFields != null && orderFields.TrueForAll(i => DefaultOrderFields.Contains(i)))
					orderDirections.AddRange(DefaultOrderDirections);
			}
		}
	}
}
