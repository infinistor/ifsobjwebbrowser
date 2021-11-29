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
using System.IO.Compression;
using System.Linq;
using System.Net;
using System.Text.RegularExpressions;
using System.Threading.Tasks;
using System.Web;
using Amazon.S3;
using Amazon.S3.Model;
using Amazon.S3.Transfer;
using CSSPData;
using CSSPData.Request.S3;
using CSSPData.Response.S3;
using CSSPProviderInterfaces;
using CSSPResources;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using MTLib.CommonData;
using MTLib.Core;
using MTLib.EntityFramework;
using MTLib.NetworkData;
using MTLib.Reflection;

namespace CSSPProvider.Providers.S3
{
    /// <summary>S3 프로바이더 클래스</summary>
    public class S3Provider : BaseProvider, IS3Provider
	{
		/// <summary>생성자</summary>
		/// <param name="dbContext">DB 컨텍스트</param>
		/// <param name="configuration">역할 정보</param>
		/// <param name="userManager">사용자 관리자</param>
		/// <param name="systemLogProvider">시스템 로그 프로바이더</param>
		/// <param name="userActionLogProvider">사용자 동작 로그 프로바이더</param>
		/// <param name="logger">로거</param>
		/// <param name="systemInformationProvider">시스템 정보 프로바이더</param>
		public S3Provider(ILogger<S3Provider> logger) : base(logger){}

		/// <summary>S3 클라이언트를 가져온다.</summary>
		/// <param name="serviceUrl">서비스 URL</param>
		/// <param name="accessKey">엑세스 키</param>
		/// <param name="accessSecret">엑세스 시크릿</param>
		/// <returns>ResponseData&lt;IAmazonS3&gt; 객체</returns>
		private ResponseData<IAmazonS3> GetS3Client(string serviceUrl = null, string accessKey = null, string accessSecret = null)
		{
			ResponseData<IAmazonS3> result = new ResponseData<IAmazonS3>();
			try
			{
				// 관련 요청이 유효하지 않은 경우
				if (serviceUrl.IsEmpty() || accessKey.IsEmpty() || accessSecret.IsEmpty())
				{
					result.Code = Resource.EC_COMMON__INVALID_REQUEST;
					result.Message = Resource.EM_COMMON__INVALID_REQUEST;
				}
				// 관련 요청이 유효한 경우
				else
				{
					// URL을 디코드 한다.
					serviceUrl = HttpUtility.UrlDecode(serviceUrl);
				
					// 클라이언트 생성
					AmazonS3Config clientConfig = new AmazonS3Config
					{
						UseHttp = true,
						ServiceURL = serviceUrl,
						ForcePathStyle = true
					};
					result.Data = new AmazonS3Client(accessKey, accessSecret, clientConfig);

					result.Result = EnumResponseResult.Success;
				}					
			}
			catch (Exception ex)
			{
				NNException.Log(ex);

				result.Code = Resource.EC_COMMON__EXCEPTION;
				result.Message = Resource.EM_COMMON__EXCEPTION;
			}

			return result;
		}

		/// <summary>주어진 경로를 S3에서 사용하는 경로 표기법으로 변환한다.</summary>
		/// <param name="path">원본 경로</param>
		/// <param name="isFile">파일인지 여부</param>
		/// <returns>S3에서 사용할 경로</returns>
		private string ConvertToS3Path(string path, bool isFile = false)
		{
			string result = path;

			// 폴더이고, 빈문자열, '/'가 아닌 경우
			if (!isFile && !result.IsEmpty() && result != Path.DirectorySeparatorChar.ToString())
			{
				// 경로가 Path.DirectorySeparatorChar로 끝나지 않는 경우, 추가
				if (!result.EndsWith(Path.DirectorySeparatorChar.ToString()))
					result = result + Path.DirectorySeparatorChar.ToString();
			}
		
			// 경로가 Path.DirectorySeparatorChar로 시작하는 경우 삭제
			if (result.StartsWith(Path.DirectorySeparatorChar.ToString()))
				result = result.Substring(1);
			
			return result;
		}

		/// <summary>경로와 이름을 합쳐서 경로를 만든다.</summary>
		/// <param name="path">경로</param>
		/// <param name="name">폴더 및 파일명</param>
		/// <param name="isFile">파일인지 여부</param>
		/// <returns>합쳐진 경로</returns>
		private string BuildPath(string path, string name, bool isFile = false)
		{
			string result;

			if (path.EndsWith(Path.DirectorySeparatorChar))
				result = path + name;
			else
				result = path + Path.DirectorySeparatorChar + name;

			if (!isFile && !result.EndsWith(Path.DirectorySeparatorChar))
				result = result + Path.DirectorySeparatorChar;
			
			return result;
		}

		/// <summary>하위 폴더를 갖는지 여부를 반환한다.</summary>
		/// <param name="client">S3 클라이언트</param>
		/// <param name="bucketName">버킷명</param>
		/// <param name="path">경로 (구분자 '/' 사용)</param>
		/// <param name="includeFile">파일까지 포함하여 검사할지 여부</param>
		/// <returns>하위 폴더를 갖는지 여부</returns>
		private async Task<bool> HasChild(IAmazonS3 client, string bucketName, string path, bool includeFile = false)
		{
			bool result = false;
			try
			{
				if (client != null && !bucketName.IsEmpty())
				{
					// 경로 URL 디코드
					if(!path.IsEmpty())
						path = HttpUtility.UrlDecode(path);

					// S3 경로로 변환
					path = ConvertToS3Path(path);
					
					// 객체 요청 정보
					ListObjectsRequest request = new ListObjectsRequest
					{
						BucketName = bucketName
						, Delimiter = Path.DirectorySeparatorChar.ToString()
						, Prefix = path
						, MaxKeys = int.MaxValue
						, Encoding = EncodingType.FindValue("utf8")
					};
				
					try
					{
						// 객체 목록을 가져온다.
						ListObjectsResponse responseObjects = await client.ListObjectsAsync(request);

						if (responseObjects != null)
						{
							if(responseObjects.CommonPrefixes.Count > 0 || (includeFile && responseObjects.S3Objects.Count > 0))
								result = true;
						}
					}
					catch (Exception ex)
					{
						NNException.Log(ex);
					}
				}
			}
			catch (Exception ex)
			{
				NNException.Log(ex);
			}

			return result;
		}

		/// <summary>모든 버킷 목록을 가져온다.</summary>
		/// <param name="client">S3 클라이언트 객체</param>
		/// <returns>버킷 목록 객체</returns>
		private async Task<ResponseList<ResponseS3Bucket>> GetBuckets(IAmazonS3 client)
		{
			ResponseList<ResponseS3Bucket> result = new ResponseList<ResponseS3Bucket>();

			try
			{
				// S3 클라이언트가 유효하지 않은 경우
				if (client == null)
				{
					result.Code = Resource.EC_COMMON__INVALID_REQUEST;
					result.Message = Resource.EM_COMMON__INVALID_REQUEST;
				}
				// S3 클라이언트가 유효한 경우
				else
				{
					// 버킷 목록을 가져온다.
					ListBucketsResponse responseBucketList = await client.ListBucketsAsync();
					
					// 버킷 목록을 가져오는데 실패한 경우
					if (responseBucketList == null)
					{
						result.Code = Resource.EC_S3_CANNOT_RETRIEVE_BUCKET_LIST;
						result.Message = Resource.EM_S3_CANNOT_RETRIEVE_BUCKET_LIST;
					}
					// 버킷 목록을 가져오는데 성공한 경우
					else
					{
						// 모든 버킷 목록에 대해서 처리
						foreach (S3Bucket bucket in responseBucketList.Buckets)
							result.Data.Items.Add(new ResponseS3Bucket(bucket.BucketName, bucket.CreationDate, await this.HasChild(client, bucket.BucketName, Path.DirectorySeparatorChar.ToString())));
						
						result.Data.ResetWithItems();
						result.Result = EnumResponseResult.Success;
					}
				}
			}
			catch (Exception ex)
			{
				NNException.Log(ex);

				result.Code = Resource.EC_COMMON__EXCEPTION;
				result.Message = Resource.EM_COMMON__EXCEPTION;
			}

			return result;
		}

		/// <summary>버킷 이름을 검사한다.</summary>
		/// <param name="name">버킷명</param>
		/// <returns>검사 결과 객체</returns>
		private ResponseData CheckBucketName(string name)
		{
			ResponseData result = new ResponseData();
			try
			{
				// 버킷 이름이 없거나 3자 미만인 경우
				if (name.IsEmpty() || name.Length < 3)
				{
					result.Code = Resource.EC_S3_BUCKET_NAME_MUST_BE_3_CHAR_LENGTH;
					result.Message = Resource.EM_S3_BUCKET_NAME_MUST_BE_3_CHAR_LENGTH;
				}
				// 버킷이름이 63자를 초과하는 경우
				else if(name.Length > 63)
				{
					result.Code = Resource.EC_S3_BUCKET_NAME_CANNOT_EXCEED_63_CHAR_LENGTH;
					result.Message = Resource.EM_S3_BUCKET_NAME_CANNOT_EXCEED_63_CHAR_LENGTH;
				}
				// 버킷명이 유효하지 않은 경우
				else if (!Regex.IsMatch(name,"(?=^.{3,63}$)(?!^(\\d+\\.?)+$)(^(([a-z0-9]|[a-z0-9][a-z0-9\\-]*[a-z0-9])\\.)*([a-z0-9]|[a-z0-9][a-z0-9\\-]*[a-z0-9])$)")
				)
				{
					result.Code = Resource.EC_S3_BUCKET_NAME_INVALID;
					result.Message = Resource.EM_S3_BUCKET_NAME_INVALID;
				}
				// 버킷명이 유효한 경우
				else
					result.Result = EnumResponseResult.Success;
			}
			catch (Exception ex)
			{
				NNException.Log(ex);

				result.Code = Resource.EC_COMMON__EXCEPTION;
				result.Message = Resource.EM_COMMON__EXCEPTION;
			}

			return result;
		}

		/// <summary>업로드 파일에 대한 파일 스트림을 가져온다.</summary>
		/// <param name="uploadFile">업로드 파일 객체</param>
		/// <param name="fileName">파일명</param>
		/// <returns>업로드 파일에 대한 파일 스트림 객체</returns>
		private FileStream GetUploadFileStream(IFormFile uploadFile, string fileName)
		{
			FileStream result;

			try
			{
				// 업로드 파일 객체가 존재하지 않은 경우
				if(uploadFile == null)
					throw new FileNotFoundException(Resource.EM_COMMON__FILE_NOT_FOUND);
				
				// 파일명이 유효하지 않은 경우
				if(fileName.IsEmpty())
					throw new ArgumentException(Resource.EM_S3_SOURCE_FILE_INFO_NOT_FOUND);
				
				// 파일 정보를 생성한다.
				FileInfo fileInfo = new FileInfo(fileName);

				// 임시 파일명을 생성한다.
				string tempFileName = Guid.NewGuid().ToString() + fileInfo.Extension;
				
				// 임시 폴더에 파일 생성
				using (FileStream fsTemp = new FileStream(Path.Combine(Path.GetTempPath(), tempFileName), FileMode.Create))
				{
					uploadFile.CopyTo(fsTemp);
					fsTemp.Close();
				}

				// 임시 폴더 내의 파일
				result = new FileStream(Path.Combine(Path.GetTempPath(), tempFileName), FileMode.Open, FileAccess.Read);
			}
			catch (Exception ex)
			{
				NNException.Log(ex);
				throw;
			}

			return result;
		}

		/// <summary>모든 버킷 목록을 가져온다.</summary>
		/// <param name="serviceUrl">서비스 URL</param>
		/// <param name="accessKey">엑세스 키</param>
		/// <param name="accessSecret">엑세스 시크릿</param>
		/// <returns>버킷 목록 객체</returns>
		public async Task<ResponseList<ResponseS3Bucket>> GetBuckets(string serviceUrl, string accessKey, string accessSecret)
		{
			ResponseList<ResponseS3Bucket> result = new ResponseList<ResponseS3Bucket>();

			try
			{
				// S3 클라이언트를 가져온다.
				ResponseData<IAmazonS3> responseClient = this.GetS3Client(serviceUrl, accessKey, accessSecret);

				// S3 클라이언트를 가져오는데 실패한 경우
				if (responseClient.Result != EnumResponseResult.Success)
				{
					result.Code = responseClient.Code;
					result.Message = responseClient.Message;
				}
				// S3 클라이언트를 가져오는데 성공한 경우
				else
				{
					result = await this.GetBuckets(responseClient.Data);
				}
			}
			catch (Exception ex)
			{
				NNException.Log(ex);

				result.Code = Resource.EC_COMMON__EXCEPTION;
				result.Message = Resource.EM_COMMON__EXCEPTION;
			}

			return result;
		}

		/// <summary>버킷을 생성한다.</summary>
		/// <param name="client">S3 클라이언트 객체</param>
		/// <param name="name">생성할 버킷명</param>
		/// <returns>버킷 생성 결과 객체</returns>
		private async Task<ResponseData> CreateBucket(IAmazonS3 client, string name)
		{
			ResponseData result = new ResponseData();

			try
			{
				// S3 클라이언트가 유효하지 않은 경우
				if (client == null)
				{
					result.Code = Resource.EC_COMMON__INVALID_REQUEST;
					result.Message = Resource.EM_COMMON__INVALID_REQUEST;
				}
				// S3 클라이언트가 유효한 경우
				else
				{
					// 버킷명 유효성 검사
					ResponseData responseBucketName = CheckBucketName(name);
					
					// 버킷명이 유효하지 않은 경우
					if (responseBucketName.Result != EnumResponseResult.Success)
					{
						result.Code = responseBucketName.Code;
						result.Message = responseBucketName.Message;
					}
					// 버킷명이 유효한 경우
					else
					{
						PutBucketRequest request = new PutBucketRequest
						{
							BucketName = name,
							UseClientRegion = true
						};

						try
						{
							// 버킷을 생성한다.
							await client.PutBucketAsync(request);

							result.Result = EnumResponseResult.Success;
						}
						catch (Exception ex)
						{
							NNException.Log(ex);

							result.Code = Resource.EC_S3_FAIL_TO_CREATE_BUCKET;
							result.Message = Resource.EM_S3_FAIL_TO_CREATE_BUCKET;
						}
					}
				}				
			}
			catch (Exception ex)
			{
				NNException.Log(ex);

				result.Code = Resource.EC_COMMON__EXCEPTION;
				result.Message = Resource.EM_COMMON__EXCEPTION;
			}

			return result;
		}

		/// <summary>버킷을 생성한다.</summary>
		/// <param name="serviceUrl">서비스 URL</param>
		/// <param name="accessKey">엑세스 키</param>
		/// <param name="accessSecret">엑세스 시크릿</param>
		/// <param name="name">생성할 버킷명</param>
		/// <returns>버킷 생성 결과 객체</returns>
		public async Task<ResponseData> CreateBucket(string serviceUrl, string accessKey, string accessSecret, string name)
		{
			ResponseData result = new ResponseData();

			try
			{
				// S3 클라이언트를 가져온다.
				ResponseData<IAmazonS3> responseClient = this.GetS3Client(serviceUrl, accessKey, accessSecret);

				// S3 클라이언트를 가져오는데 실패한 경우
				if (responseClient.Result != EnumResponseResult.Success)
				{
					result.Code = responseClient.Code;
					result.Message = responseClient.Message;
				}
				// S3 클라이언트를 가져오는데 성공한 경우
				else
				{
					// 버킷을 생성한다.
					result = await this.CreateBucket(responseClient.Data, name);
				}
			}
			catch (Exception ex)
			{
				NNException.Log(ex);

				result.Code = Resource.EC_COMMON__EXCEPTION;
				result.Message = Resource.EM_COMMON__EXCEPTION;
			}

			return result;
		}

		/// <summary>버킷을 삭제한다.</summary>
		/// <param name="client">S3 클라이언트 객체</param>
		/// <param name="name">삭제할 버킷명</param>
		/// <returns>버킷 삭제 결과 객체</returns>
		private async Task<ResponseData> DeleteBucket(IAmazonS3 client, string name)
		{
			ResponseData result = new ResponseData();

			try
			{
				// S3 클라이언트가 유효하지 않은 경우
				if (client == null)
				{
					result.Code = Resource.EC_COMMON__INVALID_REQUEST;
					result.Message = Resource.EM_COMMON__INVALID_REQUEST;
				}
				// S3 클라이언트가 유효한 경우
				else
				{
					// 버킷명이 유효하지 않은 경우
					if (name.IsEmpty())
					{
						result.Code = Resource.EC_COMMON__INVALID_REQUEST;
						result.Message = Resource.EM_COMMON__INVALID_REQUEST;
					}
					// 버킷명이 유효한 경우
					else
					{
						// 버킷 삭제 요청
						DeleteBucketRequest request = new DeleteBucketRequest
						{
							BucketName = name,
							UseClientRegion = true
						};

						try
						{
							// 버킷을 삭제한다.
							await client.DeleteBucketAsync(request);
					
							result.Result = EnumResponseResult.Success;
						}
						catch (Exception ex)
						{
							NNException.Log(ex);

							result.Code = Resource.EC_S3_FAIL_TO_DELETE_BUCKET;
							result.Message = Resource.EM_S3_FAIL_TO_DELETE_BUCKET;
						}
					}
				}
			}
			catch (Exception ex)
			{
				NNException.Log(ex);

				result.Code = Resource.EC_COMMON__EXCEPTION;
				result.Message = Resource.EM_COMMON__EXCEPTION;
			}

			return result;
		}

		/// <summary>버킷을 삭제한다.</summary>
		/// <param name="serviceUrl">서비스 URL</param>
		/// <param name="accessKey">엑세스 키</param>
		/// <param name="accessSecret">엑세스 시크릿</param>
		/// <param name="name">삭제할 버킷명</param>
		/// <returns>버킷 삭제 결과 객체</returns>
		public async Task<ResponseData> DeleteBucket(string serviceUrl, string accessKey, string accessSecret, string name)
		{
			ResponseData result = new ResponseData();

			try
			{
				// 버킷명이 유효하지 않은 경우
				if (name.IsEmpty())
				{
					result.Code = Resource.EC_COMMON__INVALID_REQUEST;
					result.Message = Resource.EM_COMMON__INVALID_REQUEST;
				}
				// 버킷명이 유효한 경우
				else
				{
					// S3 클라이언트를 가져온다.
					ResponseData<IAmazonS3> responseClient = this.GetS3Client(serviceUrl, accessKey, accessSecret);

					// S3 클라이언트를 가져오는데 실패한 경우
					if (responseClient.Result != EnumResponseResult.Success)
					{
						result.Code = responseClient.Code;
						result.Message = responseClient.Message;
					}
					// S3 클라이언트를 가져오는데 성공한 경우
					else
					{
						DeleteBucketRequest request = new DeleteBucketRequest
						{
							BucketName = name,
							UseClientRegion = true
						};

						try
						{
							// 버킷을 삭제한다.
							await responseClient.Data.DeleteBucketAsync(request);
					
							result.Result = EnumResponseResult.Success;
						}
						catch (Exception ex)
						{
							NNException.Log(ex);

							result.Code = Resource.EC_S3_FAIL_TO_DELETE_BUCKET;
							result.Message = Resource.EM_S3_FAIL_TO_DELETE_BUCKET;
						}
					}
				}
			}
			catch (Exception ex)
			{
				NNException.Log(ex);

				result.Code = Resource.EC_COMMON__EXCEPTION;
				result.Message = Resource.EM_COMMON__EXCEPTION;
			}

			return result;
		}
		
		/// <summary>특정 경로의 객체 목록을 반환한다.</summary>
		/// <param name="client">S3 클라이언트 객체</param>
		/// <param name="path">경로 (구분자 Path.DirectorySeparatorChar 사용)</param>
		/// <param name="maxData">페이지당 레코드 수</param>
		/// <returns>객체 목록</returns>
		private async Task<ResponseData<ResponseS3Read>> Read(IAmazonS3 client, string path, int maxData = int.MaxValue)
		{
			ResponseData<ResponseS3Read> result = new ResponseData<ResponseS3Read>();
			try
			{
				// S3 클라이언트가 유효하지 않은 경우
				if (client == null)
				{
					result.Code = Resource.EC_COMMON__INVALID_REQUEST;
					result.Message = Resource.EM_COMMON__INVALID_REQUEST;
				}
				// S3 클라이언트가 유효한 경우
				else
				{
					// 경로 URL 디코드
					if(!path.IsEmpty())
						path = HttpUtility.UrlDecode(path);

					// 루트 경로인 경우, 버킷 목록을 반환한다.
					if (path.IsEmpty() || path == Path.DirectorySeparatorChar.ToString())
					{
						// 버킷 목록을 가져온다.
						ResponseList<ResponseS3Bucket> responseBuckets = await GetBuckets(client);

						// 버킷 목록을 가져오는데 성공한 경우
						if (responseBuckets.Result == EnumResponseResult.Success)
						{
							List<ResponseS3Object> objects = new List<ResponseS3Object>();

							foreach(ResponseS3Bucket bucket in responseBuckets.Data.Items)
								objects.Add(new ResponseS3Object(bucket.Name, "", bucket.HasChild));
							
							result.Data.Current = new ResponseS3Object("", "", responseBuckets.Data.Items.Count > 0);
							result.Data.Current.Name = client.Config.ServiceURL;
							result.Data.Current.Extension = "ROOT";
							result.Data.Files = objects.ToArray();
							result.Result = EnumResponseResult.Success;
						}
						// 버킷 목록을 가져오는데 실패한 경우
						else
						{
							result.Code = responseBuckets.Code;
							result.Message = responseBuckets.Message;
						}
					}
					// 루트 경로가 아닌 경우
					else
					{
						// 버킷명과 나머지 경로를 분리한다.
						ResponseS3Bucket.SplitBucket(path, out string bucketName, out string remainPath);

						// S3 경로로 변환
						remainPath = ConvertToS3Path(remainPath);
						
						// 객체 요청 정보
						ListObjectsRequest request = new ListObjectsRequest
						{
							BucketName = bucketName
							, Delimiter = Path.DirectorySeparatorChar.ToString()
							, Prefix = remainPath
							, MaxKeys = maxData
							, Encoding = EncodingType.FindValue("utf8")
						};
						
						try
						{
							// 객체 목록을 가져온다.
							ListObjectsResponse responseObjects = await client.ListObjectsAsync(request);
						
							List<ResponseS3Object> objects = new List<ResponseS3Object>();
							
							// 폴더 목록을 추가한다.
							foreach (string commonPrefix in responseObjects.CommonPrefixes)
								objects.Add(new ResponseS3Object(bucketName, commonPrefix, await HasChild(client, bucketName, commonPrefix)));
						
							// 객체 목록을 추가한다.
							foreach (S3Object s3object in responseObjects.S3Objects)
							{
								if(remainPath != s3object.Key)
									objects.Add(new ResponseS3Object(bucketName, s3object));
							}
						
							result.Data.Current = new ResponseS3Object(bucketName, remainPath, responseObjects.CommonPrefixes.Count > 0);
							result.Data.Files = objects.ToArray();
						
							result.Result = EnumResponseResult.Success;
						}
						catch (Exception ex)
						{
							NNException.Log(ex);

							result.Code = Resource.EC_COMMON__EXCEPTION;
							result.Message = ex.Message;
						}
					}
				}
			}
			catch (Exception ex)
			{
				NNException.Log(ex);
		
				result.Code = Resource.EC_COMMON__EXCEPTION;
				result.Message = Resource.EM_COMMON__EXCEPTION;
			}
		
			return result;
		}

		/// <summary>특정 경로의 객체 목록을 반환한다.</summary>
		/// <param name="serviceUrl">서비스 URL</param>
		/// <param name="accessKey">엑세스 키</param>
		/// <param name="accessSecret">엑세스 시크릿</param>
		/// <param name="path">경로 (구분자 Path.DirectorySeparatorChar 사용)</param>
		/// <param name="maxData">페이지당 레코드 수</param>
		/// <returns>객체 목록</returns>
		public async Task<ResponseData<ResponseS3Read>> Read(string serviceUrl, string accessKey, string accessSecret, string path, int maxData = int.MaxValue)
		{
			ResponseData<ResponseS3Read> result = new ResponseData<ResponseS3Read>();
			try
			{
				// S3 클라이언트를 가져온다.
				ResponseData<IAmazonS3> responseClient = this.GetS3Client(serviceUrl, accessKey, accessSecret);

				// S3 클라이언트를 가져오는데 실패한 경우
				if (responseClient.Result != EnumResponseResult.Success)
				{
					result.Code = responseClient.Code;
					result.Message = responseClient.Message;
				}
				// S3 클라이언트를 가져오는데 성공한 경우
				else
				{
					// 특정 경로의 객체 목록을 반환한다.
					result = await this.Read(responseClient.Data, path, maxData);
				}
			}
			catch (Exception ex)
			{
				NNException.Log(ex);
		
				result.Code = Resource.EC_COMMON__EXCEPTION;
				result.Message = Resource.EM_COMMON__EXCEPTION;
			}
		
			return result;
		}

		/// <summary>특정 경로에 폴더를 생성한다.</summary>
		/// <param name="client">S3 클라이언트 객체</param>
		/// <param name="path">경로 (구분자 '/' 사용)</param>
		/// <param name="name">생성할 폴더명</param>
		/// <returns>생성 결과 객체</returns>
		private async Task<ResponseData<ResponseS3Create>> Create(IAmazonS3 client, string path, string name)
		{
			ResponseData<ResponseS3Create> result = new ResponseData<ResponseS3Create>();
			try
			{

				// S3 클라이언트가 유효하지 않은 경우
				if (client == null)
				{
					result.Code = Resource.EC_COMMON__INVALID_REQUEST;
					result.Message = Resource.EM_COMMON__INVALID_REQUEST;
				}
				// S3 클라이언트가 유효한 경우
				else
				{
					// 경로 URL 디코드
					if(!path.IsEmpty())
						path = HttpUtility.UrlDecode(path);

					// 루트 경로인 경우, 버킷 목록을 반환한다.
					if (path.IsEmpty() || path == Path.DirectorySeparatorChar.ToString())
					{
						// 버킷을 생성한다.
						ResponseData response = await CreateBucket(client, name);
					
						// 버킷을 생성하는데 성공한 경우
						if (response.Result == EnumResponseResult.Success)
						{
							result.Data.Files = new[] { new ResponseS3Object("", name, false) };
							result.Result = EnumResponseResult.Success;
						}
						// 버킷을 생성하는데 실패한 경우
						else
						{
							result.Code = response.Code;
							result.Message = response.Message;
						}
					}
					// 루트 경로가 아닌 경우
					else
					{
						// 폴더를 생성할 상위 폴더의 객체 목록을 가져온다.
						ResponseData<ResponseS3Read> responseChildObjects = await this.Read(client, path);

						// 목록을 가져오는데 성공한 경우
						if (responseChildObjects.Result == EnumResponseResult.Success)
						{
							// 동일한 이름의 객체를 가져온다.
							ResponseS3Object duplicatedObject = responseChildObjects.Data.Files.FirstOrDefault(i => i.Name == name);
							
							// 동일한 이름의 객체가 존재하지 않는 경우
							if (duplicatedObject == null)
							{
								// 버킷명과 나머지 경로를 분리한다.
								ResponseS3Bucket.SplitBucket(path, out string bucketName, out string remainPath);

								// S3 경로로 변환
								remainPath = ConvertToS3Path(remainPath);
					
								// 객체 생성 요청 정보
								PutObjectRequest request = new PutObjectRequest
								{
									BucketName = bucketName
									, Key = remainPath + name + Path.DirectorySeparatorChar.ToString()
								};
					
								try
								{
									// 객체 생성
									await client.PutObjectAsync(request);
					
									result.Data.Files = new[] { new ResponseS3Object(bucketName, request.Key, false) };
									result.Result = EnumResponseResult.Success;
								}
								catch (Exception ex)
								{
									NNException.Log(ex);

									result.Code = Resource.EC_COMMON__EXCEPTION;
									result.Message = ex.Message;
								}
							}
							// 동일한 이름의 객체가 존재하는 경우
							else
							{
								// 동일한 이름의 객체가 파일인 경우
								if (duplicatedObject.IsFile)
								{
									result.Code = Resource.EC_S3_FILE_WITH_TARGET_NAME_IS_ALREADY_EXIST;
									result.Message = Resource.EM_S3_FILE_WITH_TARGET_NAME_IS_ALREADY_EXIST;
								}
								// 동일한 이름의 객체가 폴더인 경우
								else
								{
									result.Code = Resource.EC_S3_FOLDER_WITH_TARGET_NAME_IS_ALREADY_EXIST;
									result.Message = Resource.EM_S3_FOLDER_WITH_TARGET_NAME_IS_ALREADY_EXIST;
								}
							}
						}
						// 목록을 가져오는데 실패한 경우
						else
						{
							result.Code = responseChildObjects.Code;
							result.Message = responseChildObjects.Message;
						}
					}
				}
			}
			catch (Exception ex)
			{
				NNException.Log(ex);
		
				result.Code = Resource.EC_COMMON__EXCEPTION;
				result.Message = Resource.EM_COMMON__EXCEPTION;
			}
		
			return result;
		}

		/// <summary>특정 경로에 폴더를 생성한다.</summary>
		/// <param name="serviceUrl">서비스 URL</param>
		/// <param name="accessKey">엑세스 키</param>
		/// <param name="accessSecret">엑세스 시크릿</param>
		/// <param name="path">경로 (구분자 '/' 사용)</param>
		/// <param name="name">생성할 폴더명</param>
		/// <returns>생성 결과 객체</returns>
		public async Task<ResponseData<ResponseS3Create>> Create(string serviceUrl, string accessKey, string accessSecret, string path, string name)
		{
			ResponseData<ResponseS3Create> result = new ResponseData<ResponseS3Create>();
			try
			{
				// S3 클라이언트를 가져온다.
				ResponseData<IAmazonS3> responseClient = this.GetS3Client(serviceUrl, accessKey, accessSecret);

				// S3 클라이언트를 가져오는데 실패한 경우
				if (responseClient.Result != EnumResponseResult.Success)
				{
					result.Code = responseClient.Code;
					result.Message = responseClient.Message;
				}
				// S3 클라이언트를 가져오는데 성공한 경우
				else
				{
					// 객체를 생성한다.
					result = await this.Create(responseClient.Data, path, name);
				}
			}
			catch (Exception ex)
			{
				NNException.Log(ex);
		
				result.Code = Resource.EC_COMMON__EXCEPTION;
				result.Message = Resource.EM_COMMON__EXCEPTION;
			}
		
			return result;
		}

		/// <summary>특정 경로에서 폴더 혹은 파일을 삭제한다.</summary>
		/// <param name="client">S3 클라이언트 객체</param>
		/// <param name="path">경로 (구분자 '/' 사용)</param>
		/// <param name="names">삭제할 폴더/파일명 목록</param>
		/// <returns>삭제 결과 객체</returns>
		public async Task<ResponseData<ResponseS3Delete>> Delete(IAmazonS3 client, string path, string[] names)
		{
			ResponseData<ResponseS3Delete> result = new ResponseData<ResponseS3Delete>();
			try
			{
				// S3 클라이언트가 유효하지 않은 경우
				if (client == null)
				{
					result.Code = Resource.EC_COMMON__INVALID_REQUEST;
					result.Message = Resource.EM_COMMON__INVALID_REQUEST;
				}
				// S3 클라이언트가 유효한 경우
				else
				{
					// 경로 URL 디코드
					if(!path.IsEmpty())
						path = HttpUtility.UrlDecode(path);

					// 루트 경로인 경우, 버킷 목록을 반환한다.
					if (path.IsEmpty() || path == Path.DirectorySeparatorChar.ToString())
					{
						// 모든 삭제할 버킷명에 대해서 하위 폴더 혹은 파일이 존재하는지 확인
						foreach (string name in names)
						{
							// 버킷명이 유효하고, 하위 폴더 혹은 파일이 존재하는 경우
							if (!name.IsEmpty() && await this.HasChild(client, name, Path.DirectorySeparatorChar.ToString(), true))
							{
								result.Code = Resource.EC_S3_FAIL_TO_DELETE_BUCKET;
								result.Message = Resource.EM_S3_FAIL_TO_DELETE_BUCKET;
								return result;
							}
						}

						List<ResponseS3Object> deletedObjects = new List<ResponseS3Object>();
						
						// 모든 삭제할 버킷명에 대해서 처리
						foreach (string name in names)
						{
							// 버킷명이 유효한 경우
							if (!name.IsEmpty())
							{
								// 버킷을 삭제한다.
								ResponseData response = await DeleteBucket(client, name);
						
								// 버킷을 삭제하는데 성공한 경우
								if (response.Result == EnumResponseResult.Success)
									deletedObjects.Add(new ResponseS3Object("", Path.DirectorySeparatorChar.ToString() + name, false));
								// 버킷을 삭제하는데 실패한 경우
								else
								{
									result.Code = response.Code;
									result.Message = response.Message;
									break;
								}
							}
						}

						result.Data.Files = deletedObjects.ToArray();
						if(result.Code.IsEmpty() && result.Message.IsEmpty())
							result.Result = EnumResponseResult.Success;
					}
					// 루트 경로가 아닌 경우
					else
					{
						// 해당 경로의 모든 파일 목록을 가져온다.
						ResponseData<ResponseS3Read> responseObjects = await this.Read(client, path);

						// 목록을 가져오는데 성공한 경우
						if (responseObjects.Result == EnumResponseResult.Success)
						{
							// 삭제할 파일 목록을 가져온다. 
							List<ResponseS3Object> deleteObjects = responseObjects.Data.Files.Where(i => names.Contains(i.Name)).ToList();

							// 버킷명과 나머지 경로를 분리한다.
							ResponseS3Bucket.SplitBucket(path, out string bucketName, out string remainPath);
							
							try
							{
								// 모든 삭제할 폴더 및 파일명에 대해서 처리
								List<ResponseS3Object> deletedObjects = new List<ResponseS3Object>();
								foreach (ResponseS3Object deleteObject in deleteObjects)
								{
									// 삭제할 객체가 폴더인 경우
									if (!deleteObject.IsFile)
									{
										// 하위의 모든 폴더 및 객체를 가져와서 삭제한다.
										ResponseData<ResponseS3Read> responseChildObjects = await this.Read(client, BuildPath(deleteObject.ParentPath, deleteObject.Name));
										if (responseChildObjects.Result == EnumResponseResult.Success && responseChildObjects.Data.Files.Length > 0)
										{
											// 하위 객체들을 삭제
											await this.Delete(client, BuildPath(deleteObject.ParentPath, deleteObject.Name), responseChildObjects.Data.Files.Select(i => i.Name).ToArray());
										}
									}
									
									// 객체 삭제 요청 정보
									DeleteObjectRequest request = new DeleteObjectRequest()
									{
										BucketName = bucketName,
										Key = ConvertToS3Path(BuildPath(remainPath, deleteObject.Name, deleteObject.IsFile), deleteObject.IsFile)
									};
									
									// 객체 삭제
									await client.DeleteObjectAsync(request);
									
									// 삭제된 객체 추가
									deletedObjects.Add(deleteObject);
								}
							
								result.Data.Files = deletedObjects.ToArray();
								result.Result = EnumResponseResult.Success;
							}
							catch (Exception ex)
							{
								NNException.Log(ex);
							
								result.Code = Resource.EC_COMMON__EXCEPTION;
								result.Message = ex.Message;
							}
						}
						// 목록을 가져오는데 실패한 경우
						else
						{
							result.Code = responseObjects.Code;
							result.Message = responseObjects.Message;
						}
					}
				}
			}
			catch (Exception ex)
			{
				NNException.Log(ex);
		
				result.Code = Resource.EC_COMMON__EXCEPTION;
				result.Message = Resource.EM_COMMON__EXCEPTION;
			}
		
			return result;
		}

		/// <summary>특정 경로에서 폴더 혹은 파일을 삭제한다.</summary>
		/// <param name="serviceUrl">서비스 URL</param>
		/// <param name="accessKey">엑세스 키</param>
		/// <param name="accessSecret">엑세스 시크릿</param>
		/// <param name="path">경로 (구분자 '/' 사용)</param>
		/// <param name="names">삭제할 폴더/파일명 목록</param>
		/// <returns>삭제 결과 객체</returns>
		public async Task<ResponseData<ResponseS3Delete>> Delete(string serviceUrl, string accessKey, string accessSecret, string path, string[] names)
		{
			ResponseData<ResponseS3Delete> result = new ResponseData<ResponseS3Delete>();
			try
			{
				// S3 클라이언트를 가져온다.
				ResponseData<IAmazonS3> responseClient = this.GetS3Client(serviceUrl, accessKey, accessSecret);

				// S3 클라이언트를 가져오는데 실패한 경우
				if (responseClient.Result != EnumResponseResult.Success)
				{
					result.Code = responseClient.Code;
					result.Message = responseClient.Message;
				}
				// S3 클라이언트를 가져오는데 성공한 경우
				else
				{
					// 객체를 삭제한다.
					result = await this.Delete(responseClient.Data, path, names);
				}
			}
			catch (Exception ex)
			{
				NNException.Log(ex);
		
				result.Code = Resource.EC_COMMON__EXCEPTION;
				result.Message = Resource.EM_COMMON__EXCEPTION;
			}
		
			return result;
		}

		/// <summary>특정 파일/폴더를 대상 폴더에 복사한다.</summary>
		/// <param name="client">S3 클라이언트 객체</param>
		/// <param name="sourcePath">원본 폴더</param>
		/// <param name="sources">원본 폴더/파일 목록</param>
		/// <param name="targetPath">대상 폴더</param>
		/// <param name="targetNames">저장 폴더/파일명</param>
		/// <returns>복사 결과 객체</returns>
		public async Task<ResponseData<ResponseS3Copy>> Copy(IAmazonS3 client, string sourcePath, RequestS3Object[] sources, string targetPath, string[] targetNames)
		{
			ResponseData<ResponseS3Copy> result = new ResponseData<ResponseS3Copy>();
			try
			{
				// S3 클라이언트가 유효하지 않은 경우
				if (client == null)
				{
					result.Code = Resource.EC_COMMON__INVALID_REQUEST;
					result.Message = Resource.EM_COMMON__INVALID_REQUEST;
				}
				// 원본이 존재하지 않는 경우
				else if (sources == null || sources.Length == 0)
				{
					result.Code = Resource.EC_S3_SOURCE_FILE_INFO_NOT_FOUND;
					result.Message = Resource.EM_S3_SOURCE_FILE_INFO_NOT_FOUND;
				}
				// 대상 폴더가 존재하지 않는 경우
				else if (targetPath.IsEmpty())
				{
					result.Code = Resource.EC_S3_TARGET_PATH_NOT_FOUND;
					result.Message = Resource.EM_S3_TARGET_PATH_NOT_FOUND;
				}
				// 요청이 모두 유효한 경우
				else
				{
					// 버킷명과 나머지 경로를 분리한다.
					ResponseS3Bucket.SplitBucket(targetPath, out string targetBucketName, out string targetRemainPath);

					// 원본 폴더의 객체 목록을 가져온다. 
					ResponseData<ResponseS3Read> responseSourceObjects = await this.Read(client, sourcePath);
					// 목록을 가져오는데 성공한 경우
					if (responseSourceObjects.Result == EnumResponseResult.Success)
					{
						// 대상 원본 객체를 찾아 목록에 저장한다.
						List<ResponseS3Object> sourceObjects = new List<ResponseS3Object>();
						foreach (RequestS3Object source in sources)
						{
							ResponseS3Object s3Object = responseSourceObjects.Data.Files.FirstOrDefault(i => i.Name == source.Name);
							if(s3Object != null)
								sourceObjects.Add(s3Object);
						} 
						
						try
						{
							// 복사된 객체 목록
							List<ResponseS3Object> copiedObjects = new List<ResponseS3Object>();
							
							// 모든 원본 객체에 대해서 처리
							for (int index = 0; index < sourceObjects.Count; index++)
							{
								ResponseS3Object source = sourceObjects[index];

								// 버킷명과 나머지 경로를 분리한다.
								ResponseS3Bucket.SplitBucket(source.ParentPath, out string sourceBucketName, out string sourceRemainPath);

								string sourceBucket = sourceBucketName;
								string sourceKey = ConvertToS3Path(BuildPath(sourceRemainPath, source.Name, source.IsFile), source.IsFile);
								string destinationBucket = targetBucketName;
								string destinationKey = ConvertToS3Path(BuildPath(targetRemainPath, targetNames[index], source.IsFile), source.IsFile);
								
								// 복사할 객체가 폴더인 경우
								if (!source.IsFile)
								{
									// 원본과 대상 이름이 동일한 경우, 대상 이름에 사본 추가
									if (sourceBucketName == targetBucketName && sourceKey == destinationKey)
										targetNames[index] = targetNames[index] + Resource.UL_S3_DUPLICATE_FILE_WORD;
									
									// 대상 폴더에 동일한 이름의 폴더 생성
									ResponseData<ResponseS3Create> responseCreate = await this.Create(client, targetPath, targetNames[index]);

									// 생성에 성공하였거나 동일한 이름의 폴더가 존재하는 경우
									if (responseCreate.Result == EnumResponseResult.Success || (responseCreate.Code == Resource.EC_S3_FOLDER_WITH_TARGET_NAME_IS_ALREADY_EXIST))
									{
										// 하위의 모든 폴더 및 객체를 가져와서 복사한다.
										ResponseData<ResponseS3Read> responseChildObjects = await this.Read(client, BuildPath(source.ParentPath, source.Name));
										if (responseChildObjects.Result == EnumResponseResult.Success && responseChildObjects.Data.Files.Length > 0)
										{
											// 하위 객체들을 복사
											await this.Copy(client, 
												BuildPath(source.ParentPath, source.Name), responseChildObjects.Data.Files.Select(i => new RequestS3Object(i)).ToArray(),
												BuildPath(targetPath, targetNames[index]), responseChildObjects.Data.Files.Select(i => i.Name).ToArray()
											);
										}

										// 저장된 파일의 경로와 이름을 분리
										ResponseS3Object.SplitPath(BuildPath(targetPath, targetNames[index], source.IsFile), out string destinationParentPath, out string destinationName);
								
										// 상위 폴더 변경
										source.Name = destinationName;
										source.ParentPath = destinationParentPath;
										copiedObjects.Add(source);
									}
									// 그 외 생성에 실패한 경우
									else
									{
										result.Code = responseCreate.Code;
										result.Message = responseCreate.Message;
										return result;
									}
								}
								// 폴더가 아닌 경우
								else
								{
									// 복사 요청 객체 생성
									CopyObjectRequest request = new CopyObjectRequest()
									{
										SourceBucket = sourceBucket,
										SourceKey = sourceKey,
										DestinationBucket = destinationBucket,
										DestinationKey = destinationKey,
										MetadataDirective = S3MetadataDirective.REPLACE
									};

									// 원본과 대상 이름이 동일한 경우, 대상 이름에 사본 추가
									if (request.SourceBucket == request.DestinationBucket && request.SourceKey == request.DestinationKey)
									{
										string nameWithoutExt = targetNames[index].Replace(source.Extension, "");
										request.DestinationKey = ConvertToS3Path(BuildPath(targetRemainPath, nameWithoutExt + Resource.UL_S3_DUPLICATE_FILE_WORD + source.Extension, source.IsFile), source.IsFile);
									}
								
									// 복사
									await client.CopyObjectAsync(request);

									// 저장된 파일의 경로와 이름을 분리
									ResponseS3Object.SplitPath(request.DestinationBucket + Path.DirectorySeparatorChar + request.DestinationKey, out string destinationParentPath, out string destinationName);
								
									// 상위 폴더 변경
									source.Name = destinationName;
									source.ParentPath = destinationParentPath;
									copiedObjects.Add(source);
								}
							}
			
							result.Data.Current = new ResponseS3Object(targetBucketName, targetRemainPath, true);
							result.Data.Files = copiedObjects.ToArray();
							result.Result = EnumResponseResult.Success;
						}
						catch (Exception ex)
						{
							NNException.Log(ex);
			
							result.Code = Resource.EC_COMMON__EXCEPTION;
							result.Message = ex.Message;
						}
					}
					// 목록을 가져오는데 실패한 경우
					else
					{
						result.Code = responseSourceObjects.Code;
						result.Message = responseSourceObjects.Message;
					}
					
				}
			}
			catch (Exception ex)
			{
				NNException.Log(ex);
		
				result.Code = Resource.EC_COMMON__EXCEPTION;
				result.Message = Resource.EM_COMMON__EXCEPTION;
			}
		
			return result;
		}

		/// <summary>특정 파일/폴더를 대상 폴더에 복사한다.</summary>
		/// <param name="serviceUrl">서비스 URL</param>
		/// <param name="accessKey">엑세스 키</param>
		/// <param name="accessSecret">엑세스 시크릿</param>
		/// <param name="sourcePath">원본 폴더</param>
		/// <param name="sources">원본 폴더/파일 목록</param>
		/// <param name="targetPath">대상 폴더</param>
		/// <param name="targetNames">저장 폴더/파일명</param>
		/// <returns>복사 결과 객체</returns>
		public async Task<ResponseData<ResponseS3Copy>> Copy(string serviceUrl, string accessKey, string accessSecret, string sourcePath, RequestS3Object[] sources, string targetPath, string[] targetNames)
		{
			ResponseData<ResponseS3Copy> result = new ResponseData<ResponseS3Copy>();
			try
			{
				// S3 클라이언트를 가져온다.
				ResponseData<IAmazonS3> responseClient = this.GetS3Client(serviceUrl, accessKey, accessSecret);

				// S3 클라이언트를 가져오는데 실패한 경우
				if (responseClient.Result != EnumResponseResult.Success)
				{
					result.Code = responseClient.Code;
					result.Message = responseClient.Message;
				}
				// S3 클라이언트를 가져오는데 성공한 경우
				else
				{
					// 객체를 복사한다.
					result = await this.Copy(responseClient.Data, sourcePath, sources, targetPath, targetNames);
				}
			}
			catch (Exception ex)
			{
				NNException.Log(ex);
		
				result.Code = Resource.EC_COMMON__EXCEPTION;
				result.Message = Resource.EM_COMMON__EXCEPTION;
			}
		
			return result;
		}

		/// <summary>특정 파일/폴더를 대상 폴더로 이동한다.</summary>
		/// <param name="client">S3 클라이언트 객체</param>
		/// <param name="sourcePath">원본 폴더</param>
		/// <param name="sources">원본 폴더/파일 목록</param>
		/// <param name="targetPath">대상 폴더</param>
		/// <param name="targetNames">저장 폴더/파일명</param>
		/// <returns>복사 결과 객체</returns>
		public async Task<ResponseData<ResponseS3Move>> Move(IAmazonS3 client, string sourcePath, RequestS3Object[] sources, string targetPath, string[] targetNames)
		{
			ResponseData<ResponseS3Move> result = new ResponseData<ResponseS3Move>();
			try
			{
				// S3 클라이언트가 유효하지 않은 경우
				if (client == null)
				{
					result.Code = Resource.EC_COMMON__INVALID_REQUEST;
					result.Message = Resource.EM_COMMON__INVALID_REQUEST;
				}
				// 원본이 존재하지 않는 경우
				else if (sources == null || sources.Length == 0)
				{
					result.Code = Resource.EC_S3_SOURCE_FILE_INFO_NOT_FOUND;
					result.Message = Resource.EM_S3_SOURCE_FILE_INFO_NOT_FOUND;
				}
				// 대상 폴더가 존재하지 않는 경우
				else if (targetPath.IsEmpty() || targetNames.Length != sources.Length)
				{
					result.Code = Resource.EC_S3_TARGET_PATH_NOT_FOUND;
					result.Message = Resource.EM_S3_TARGET_PATH_NOT_FOUND;
				}
				// 요청이 모두 유효한 경우
				else
				{
					// 원본 폴더와 대상 폴더가 같은 경우
					if (sourcePath == targetPath)
					{
						// 파일명들이 모두 같은 경우
						if(sources.Select(i => i.Name).Aggregate((cur, next) => cur + "," + next)
						== targetNames.Aggregate((cur, next) => cur + "," + next))
						{
							result.Code = Resource.EC_S3_MOVE_MUST_NOT_SAME_TARGET_PATH_AND_SOURCE_PATH;
							result.Message = Resource.EM_S3_MOVE_MUST_NOT_SAME_TARGET_PATH_AND_SOURCE_PATH;
							return result;
						}
					}
					
					// 객체들을 복사
					ResponseData<ResponseS3Copy> responseCopy = await this.Copy(client, sourcePath, sources, targetPath, targetNames);

					// 복사하는데 성공한 경우
					if (responseCopy.Result == EnumResponseResult.Success)
					{
						// 객체 삭제
						ResponseData<ResponseS3Delete> responseDelete = await this.Delete(client, sourcePath, sources.Select(i => i.Name).ToArray());
						
						if (responseDelete.Result == EnumResponseResult.Success)
						{
							result.Data.Current = responseCopy.Data.Current;
							result.Data.Files = responseCopy.Data.Files;
							result.Result = EnumResponseResult.Success;
						}
						else
						{
							result.Code = responseDelete.Code;
							result.Message = responseDelete.Message;
						}

						result.Data.Current = responseCopy.Data.Current;
						result.Data.Files = responseCopy.Data.Files;
						result.Result = EnumResponseResult.Success;
					}
					else
					{
						result.Code = responseCopy.Code;
						result.Message = responseCopy.Message;
					}
				}
			}
			catch (Exception ex)
			{
				NNException.Log(ex);
		
				result.Code = Resource.EC_COMMON__EXCEPTION;
				result.Message = Resource.EM_COMMON__EXCEPTION;
			}
		
			return result;
		}

		/// <summary>특정 파일/폴더를 대상 폴더로 이동한다.</summary>
		/// <param name="serviceUrl">서비스 URL</param>
		/// <param name="accessKey">엑세스 키</param>
		/// <param name="accessSecret">엑세스 시크릿</param>
		/// <param name="sourcePath">원본 폴더</param>
		/// <param name="sources">원본 폴더/파일 목록</param>
		/// <param name="targetPath">대상 폴더</param>
		/// <param name="targetNames">저장 폴더/파일명</param>
		/// <returns>복사 결과 객체</returns>
		public async Task<ResponseData<ResponseS3Move>> Move(string serviceUrl, string accessKey, string accessSecret, string sourcePath, RequestS3Object[] sources, string targetPath, string[] targetNames)
		{
			ResponseData<ResponseS3Move> result = new ResponseData<ResponseS3Move>();
			try
			{
				// S3 클라이언트를 가져온다.
				ResponseData<IAmazonS3> responseClient = this.GetS3Client(serviceUrl, accessKey, accessSecret);

				// S3 클라이언트를 가져오는데 실패한 경우
				if (responseClient.Result != EnumResponseResult.Success)
				{
					result.Code = responseClient.Code;
					result.Message = responseClient.Message;
				}
				// S3 클라이언트를 가져오는데 성공한 경우
				else
				{
					// 객체를 복사한다.
					result = await this.Move(responseClient.Data, sourcePath, sources, targetPath, targetNames);
				}
			}
			catch (Exception ex)
			{
				NNException.Log(ex);
		
				result.Code = Resource.EC_COMMON__EXCEPTION;
				result.Message = Resource.EM_COMMON__EXCEPTION;
			}
		
			return result;
		}

		/// <summary>특정 파일/폴더의 이름을 변경한다.</summary>
		/// <param name="serviceUrl">서비스 URL</param>
		/// <param name="accessKey">엑세스 키</param>
		/// <param name="accessSecret">엑세스 시크릿</param>
		/// <param name="sourcePath">원본 폴더</param>
		/// <param name="source">원본 파일/폴더 객체</param>
		/// <param name="targetName">변경할 폴더/파일명</param>
		/// <returns>이름 변경 결과 객체</returns>
		public async Task<ResponseData<ResponseS3Rename>> Rename(string serviceUrl, string accessKey, string accessSecret, string sourcePath, RequestS3Object source, string targetName)
		{
			ResponseData<ResponseS3Rename> result = new ResponseData<ResponseS3Rename>();
			try
			{
				// S3 클라이언트를 가져온다.
				ResponseData<IAmazonS3> responseClient = this.GetS3Client(serviceUrl, accessKey, accessSecret);

				// S3 클라이언트를 가져오는데 실패한 경우
				if (responseClient.Result != EnumResponseResult.Success)
				{
					result.Code = responseClient.Code;
					result.Message = responseClient.Message;
				}
				// S3 클라이언트를 가져오는데 성공한 경우
				else
				{
					// 파일 이동
					ResponseData<ResponseS3Move> response = await this.Move(responseClient.Data, sourcePath, new[] { source }, sourcePath, new[] { targetName });
					
					// 결과 복사
					result.CopyValueFrom(response);
					if (result.Result == EnumResponseResult.Success)
						result.Data.Files = response.Data.Files;
				}
			}
			catch (Exception ex)
			{
				NNException.Log(ex);
		
				result.Code = Resource.EC_COMMON__EXCEPTION;
				result.Message = Resource.EM_COMMON__EXCEPTION;
			}
		
			return result;
		}

		/// <summary>해당 경로에서 파일 및 폴더를 검색한다.</summary>
		/// <param name="serviceUrl">서비스 URL</param>
		/// <param name="accessKey">엑세스 키</param>
		/// <param name="accessSecret">엑세스 시크릿</param>
		/// <param name="sourcePath">원본 폴더</param>
		/// <param name="searchString">검색어</param>
		/// <param name="caseSensitive">대소문자 구분 여부</param>
		/// <returns>검색 결과 객체</returns>
		public async Task<ResponseData<ResponseS3Search>> Search(string serviceUrl, string accessKey, string accessSecret, string sourcePath, string searchString, bool caseSensitive)
		{
			ResponseData<ResponseS3Search> result = new ResponseData<ResponseS3Search>();
			try
			{
				// S3 클라이언트를 가져온다.
				ResponseData<IAmazonS3> responseClient = this.GetS3Client(serviceUrl, accessKey, accessSecret);

				// S3 클라이언트를 가져오는데 실패한 경우
				if (responseClient.Result != EnumResponseResult.Success)
				{
					result.Code = responseClient.Code;
					result.Message = responseClient.Message;
				}
				// S3 클라이언트를 가져오는데 성공한 경우
				else
				{
					// 해당 폴더의 목록을 가져온다.
					ResponseData<ResponseS3Read> response = await this.Read(responseClient.Data, sourcePath);
					
					// 목록을 가져오는데 성공한 경우
					if (response.Result == EnumResponseResult.Success)
					{
						// 현재 디렉토리 정보 저장
						result.Data.Current = response.Data.Current;

						// 검색어에서 '*' 제거
						searchString = searchString.Replace("*", "");
						
						// 검색어가 존재하지 않는 경우
						if (searchString.IsEmpty())
						{
							result.Data.Files = response.Data.Files;
						}
						// 검색어가 존재하는 경우
						else
						{
							// 대소문자 구분인 경우
							if (caseSensitive)
								result.Data.Files = response.Data.Files.Where(i => i.Name.Contains(searchString)).ToArray();
							// 대소문자 구분이 아닌 경우
							else
							{
								searchString = searchString.ToLower();
								result.Data.Files = response.Data.Files.Where(i => i.Name.ToLower().Contains(searchString)).ToArray();
							}
						}
						//
						// if (result.Data.Files.Length == 0)
						// 	result.Data.Files = null;
						
						result.Result = EnumResponseResult.Success;
					}
					// 목록을 가져오는데 실패한 경우
					else
					{
						result.Code = response.Code;
						result.Message = response.Message;
					}
				}
			}
			catch (Exception ex)
			{
				NNException.Log(ex);
		
				result.Code = Resource.EC_COMMON__EXCEPTION;
				result.Message = Resource.EM_COMMON__EXCEPTION;
			}
		
			return result;
		}

		/// <summary>특정 파일들에 대한 상세 정보를 반환한다.</summary>
		/// <param name="serviceUrl">서비스 URL</param>
		/// <param name="accessKey">엑세스 키</param>
		/// <param name="accessSecret">엑세스 시크릿</param>
		/// <param name="sourcePath">원본 폴더</param>
		/// <param name="names">상세 정보를 요청하는 파일/폴더명</param>
		/// <returns>상세 정보 결과 객체</returns>
		public async Task<ResponseData<ResponseS3Details>> GetDetails(string serviceUrl, string accessKey, string accessSecret, string sourcePath, string[] names)
		{
			ResponseData<ResponseS3Details> result = new ResponseData<ResponseS3Details>();
			try
			{
				// S3 클라이언트를 가져온다.
				ResponseData<IAmazonS3> responseClient = this.GetS3Client(serviceUrl, accessKey, accessSecret);

				// S3 클라이언트를 가져오는데 실패한 경우
				if (responseClient.Result != EnumResponseResult.Success)
				{
					result.Code = responseClient.Code;
					result.Message = responseClient.Message;
				}
				// 원본이 존재하지 않는 경우
				else if (names == null || names.Length == 0)
				{
					result.Code = Resource.EC_S3_SOURCE_FILE_INFO_NOT_FOUND;
					result.Message = Resource.EM_S3_SOURCE_FILE_INFO_NOT_FOUND;
				}
				// S3 클라이언트를 가져오는데 성공한 경우
				else
				{
					// 해당 폴더의 목록을 가져온다.
					ResponseData<ResponseS3Read> response = await this.Read(responseClient.Data, sourcePath);
					
					// 목록을 가져오는데 성공한 경우
					if (response.Result == EnumResponseResult.Success)
					{
						// 원본 파일이 하나인 경우
						if (names.Length == 1)
						{
							ResponseS3Object s3Object = response.Data.Files.FirstOrDefault(i => i.Name == names[0]);
							if (s3Object != null)
							{
								// 상세 정보 생성
								result.Data.Details = new ResponseS3ObjectDetail()
								{
									Name = s3Object.Name,
									Location = s3Object.ParentPath,
									IsFile = s3Object.IsFile,
									Size = s3Object.Size,
									DateCreated = s3Object.DateCreated,
									DateModified = s3Object.DateModified,
									IsMultipleFileDetail = false
								};
							}
						}
						// 원본 파일이 하나가 아닌 경우
						else
						{
							// 상세 정보 생성
							result.Data.Details = new ResponseS3ObjectDetail()
							{
								Name = names.Aggregate((cur, next) => cur + ", " + next),
								Location = Resource.UL_S3_VARIOUS_FILES_OR_FOLDERS,
								IsFile = response.Data.Files.Any(i => i.IsFile),
								Size = response.Data.Files.Sum(i => i.Size),
								DateCreated = response.Data.Files.Max(i => i.DateCreated),
								DateModified = response.Data.Files.Max(i => i.DateModified),
								IsMultipleFileDetail = true
							};
						}

						result.Result = EnumResponseResult.Success;
					}
					// 목록을 가져오는데 실패한 경우
					else
					{
						result.Code = response.Code;
						result.Message = response.Message;
					}
				}
			}
			catch (Exception ex)
			{
				NNException.Log(ex);
		
				result.Code = Resource.EC_COMMON__EXCEPTION;
				result.Message = Resource.EM_COMMON__EXCEPTION;
			}
		
			return result;
		}

		/// <summary>파일 업로드</summary>
		/// <param name="client">S3 클라이언트 객체</param>
		/// <param name="action">동작 명령</param>
		/// <param name="uploadFiles">업로드 파일 목록</param>
		/// <param name="targetPath">대상 폴더 경로</param>
		/// <returns>업로드 결과 객체</returns>
		private async Task<ResponseData<ResponseS3Create>> Upload(IAmazonS3 client, string action, IList<IFormFile> uploadFiles, string targetPath)
		{
			ResponseData<ResponseS3Create> result = new ResponseData<ResponseS3Create>();

			try
			{
				// S3 클라이언트가 유효하지 않은 경우
				if (client == null)
				{
					result.Code = Resource.EC_COMMON__INVALID_REQUEST;
					result.Message = Resource.EM_COMMON__INVALID_REQUEST;
				}
				// 동작이 존재하지 않는 경우
				else if (action.IsEmpty())
				{
					result.Code = Resource.EC_COMMON__INVALID_REQUEST;
					result.Message = Resource.EM_COMMON__INVALID_REQUEST;
				}
				// 원본이 존재하지 않는 경우
				else if (uploadFiles == null || uploadFiles.Count == 0)
				{
					result.Code = Resource.EC_S3_SOURCE_FILE_INFO_NOT_FOUND;
					result.Message = Resource.EM_S3_SOURCE_FILE_INFO_NOT_FOUND;
				}
				// 대상 폴더가 존재하지 않는 경우
				else if (targetPath.IsEmpty())
				{
					result.Code = Resource.EC_S3_TARGET_PATH_NOT_FOUND;
					result.Message = Resource.EM_S3_TARGET_PATH_NOT_FOUND;
				}
				// 요청이 모두 유효한 경우
				else
				{
					// 파일 전송 유틸리티 생성
					TransferUtility fileTransferUtility = new TransferUtility(client);
					
					// 버킷명과 나머지 경로를 분리한다.
					ResponseS3Bucket.SplitBucket(targetPath, out string targetBucketName, out string targetRemainPath);

					// S3 경로로 변경
					targetRemainPath = ConvertToS3Path(targetRemainPath);
					
					// 동작에 따라서 처리
					switch (action)
					{
						case "save":			// 일반 업로드
						case "replace":			// 덮어쓰기
						case "keepboth":		// 기존파일 유지하고 업로드
						{
							// 업로드한 파일 목록
							List<ResponseS3Object> uploadedFiles = new List<ResponseS3Object>();
							
							// 모든 업로드 파일에 대해서 처리
							foreach (IFormFile file in uploadFiles)
							{
								// 임시 폴더 내의 파일에 대한 파일 스트림을 가져온다.
								await using (FileStream fsTemp = GetUploadFileStream(file, file.FileName))
								{
									// 파일 업로드
									await fileTransferUtility.UploadAsync(fsTemp, targetBucketName, targetRemainPath + file.FileName);
									
									// 파일 닫기
									fsTemp.Close();
								}

								// 업로드한 파일 객체 생성
								ResponseS3Object uploadFile = new ResponseS3Object(targetBucketName, targetRemainPath + file.FileName, false);
								uploadedFiles.Add(uploadFile);
							}

							result.Data.Files = uploadedFiles.ToArray();
							result.Result = EnumResponseResult.Success;
						}
							break;
						case "remove":			// 업로드 파일 삭제
						{
							
						}
							break;
					}
				}				
			}
			catch (Exception ex)
			{
				NNException.Log(ex);
		
				result.Code = Resource.EC_COMMON__EXCEPTION;
				result.Message = Resource.EM_COMMON__EXCEPTION;
			}
		
			return result;
		}

		/// <summary>파일 업로드</summary>
		/// <param name="serviceUrl">서비스 URL</param>
		/// <param name="accessKey">엑세스 키</param>
		/// <param name="accessSecret">엑세스 시크릿</param>
		/// <param name="action">동작 명령</param>
		/// <param name="uploadFiles">업로드 파일 목록</param>
		/// <param name="targetPath">대상 폴더 경로</param>
		/// <returns>업로드 결과 객체</returns>
		public async Task<ResponseData<ResponseS3Create>> Upload(string serviceUrl, string accessKey, string accessSecret, string action, IList<IFormFile> uploadFiles, string targetPath)
		{
			ResponseData<ResponseS3Create> result = new ResponseData<ResponseS3Create>();
			try
			{
				// S3 클라이언트를 가져온다.
				ResponseData<IAmazonS3> responseClient = this.GetS3Client(serviceUrl, accessKey, accessSecret);

				// S3 클라이언트를 가져오는데 실패한 경우
				if (responseClient.Result != EnumResponseResult.Success)
				{
					result.Code = responseClient.Code;
					result.Message = responseClient.Message;
				}
				// S3 클라이언트를 가져오는데 성공한 경우
				else
				{
					// 업로드
					result = await this.Upload(responseClient.Data, action, uploadFiles, targetPath);
				}
			}
			catch (Exception ex)
			{
				NNException.Log(ex);
		
				result.Code = Resource.EC_COMMON__EXCEPTION;
				result.Message = Resource.EM_COMMON__EXCEPTION;
			}
		
			return result;
		}

		/// <summary>파일 다운로드</summary>
		/// <param name="client">S3 클라이언트 객체</param>
		/// <param name="sourcePath">다운로드할 파일이 존재하는 폴더 경로</param>
		/// <param name="sources">원본 파일/폴더 목록</param>
		/// <param name="targetPath">다운로드 대상 폴더 경로</param>
		/// <param name="names">저장 시 사용할 파일/폴더명 목록</param>
		/// <returns>다운로드 스트림 결과 객체</returns>
		private async Task<ResponseData> Download(IAmazonS3 client, string sourcePath, RequestS3Object[] sources, string targetPath, string[] names)
		{
			ResponseData result = new ResponseData();

			try
			{
				// S3 클라이언트가 유효하지 않은 경우
				if (client == null)
				{
					result.Code = Resource.EC_COMMON__INVALID_REQUEST;
					result.Message = Resource.EM_COMMON__INVALID_REQUEST;
				}
				// 원본 폴더가 존재하지 않는 경우
				else if (sourcePath.IsEmpty())
				{
					result.Code = Resource.EC_S3_SOURCE_FILE_INFO_NOT_FOUND;
					result.Message = Resource.EM_S3_SOURCE_FILE_INFO_NOT_FOUND;
				}
				// 원본이 존재하지 않는 경우
				else if (sources == null || sources.Length == 0)
				{
					result.Code = Resource.EC_S3_SOURCE_FILE_INFO_NOT_FOUND;
					result.Message = Resource.EM_S3_SOURCE_FILE_INFO_NOT_FOUND;
				}
				// 대상 폴더가 존재하지 않는 경우
				else if (names == null || names.Length == 0 || sources.Length != names.Length)
				{
					result.Code = Resource.EC_S3_TARGET_PATH_NOT_FOUND;
					result.Message = Resource.EM_S3_TARGET_PATH_NOT_FOUND;
				}
				// 요청이 모두 유효한 경우
				else
				{
					// 해당 경로의 파일 목록을 가져온다.
					ResponseData<ResponseS3Read> responseRead = await this.Read(client, sourcePath);

					// 해당 경로의 파일 목록을 가져오는데 성공한 경우
					if (responseRead.Result == EnumResponseResult.Success)
					{
						// 파일 전송 유틸리티 생성
						TransferUtility fileTransferUtility = new TransferUtility(client);
						
						// 대상 원본 객체를 찾아 목록에 저장한다.
						List<ResponseS3Object> sourceObjects = new List<ResponseS3Object>();
						foreach (RequestS3Object source in sources)
						{
							ResponseS3Object s3Object = responseRead.Data.Files.FirstOrDefault(i => i.Name == source.Name);
							if(s3Object != null)
								sourceObjects.Add(s3Object);
						} 
						
						// 모든 원본 파일/폴더 객체에 대해서 처리
						for (int index = 0; index < sourceObjects.Count; index++)
						{
							ResponseS3Object sourceObject = sourceObjects[index];
							
							// 버킷명과 나머지 경로를 분리한다.
							ResponseS3Bucket.SplitBucket(sourceObject.ParentPath, out string sourceObjectBucketName, out string sourceObjectRemainPath);
							
							// 해당 객체가 파일인 경우
							if (sourceObject.IsFile)
							{
								string sourceObjectPath = ConvertToS3Path(BuildPath(sourceObjectRemainPath, sourceObject.Name, sourceObject.IsFile), sourceObject.IsFile); 
								string savePath = Path.Combine(targetPath, names[index]);
								
								this.m_logger.LogInformation($"File Download : {sourceObjectBucketName}:{sourceObjectPath} => {savePath}");

								// 파일 다운로드
								await fileTransferUtility.DownloadAsync(savePath, sourceObjectBucketName, sourceObjectPath);
							}
							// 해당 객체가 폴더인 경우
							else
							{
								string sourceObjectPath = Path.DirectorySeparatorChar + sourceObjectBucketName + BuildPath(sourceObjectRemainPath, sourceObject.Name, sourceObject.IsFile); 
								string savePath = Path.Combine(targetPath, names[index]);

								// 해당 폴더의 파일 목록을 가져온다.
								ResponseData<ResponseS3Read> responseChildRead = await this.Read(client, sourceObjectPath);

								// 해당 폴더의 파일 목록을 가져오는데 성공한 경우
								if (responseRead.Result == EnumResponseResult.Success)
								{
									// 폴더 생성
									Directory.CreateDirectory(savePath);
									
									// 폴더 내의 모든 객체를 다운로드 한다.
									await this.Download(client, sourceObjectPath, responseChildRead.Data.Files.Select(i => new RequestS3Object(i)).ToArray(),
										savePath, responseChildRead.Data.Files.Select(i => i.Name).ToArray());
								}
							}
						}

						result.Result = EnumResponseResult.Success;
					}
					// 해당 경로의 파일 목록을 가져오는데 실패한 경우¶
					else
					{
						result.Code = responseRead.Code;
						result.Message = responseRead.Message;
					}
				}
			}
			catch (Exception ex)
			{
				NNException.Log(ex);
		
				result.Code = Resource.EC_COMMON__EXCEPTION;
				result.Message = Resource.EM_COMMON__EXCEPTION;
			}
			
			return result;
		}

		/// <summary>파일 다운로드</summary>
		/// <param name="serviceUrl">서비스 URL</param>
		/// <param name="accessKey">엑세스 키</param>
		/// <param name="accessSecret">엑세스 시크릿</param>
		/// <param name="sourcePath">다운로드할 파일이 존재하는 폴더 경로</param>
		/// <param name="sources">원본 파일/폴더 목록</param>
		/// <param name="names">저장 시 사용할 파일/폴더명 목록</param>
		/// <returns>다운로드 스트림 결과 객체</returns>
		public async Task<ResponseData<FileStreamResult>> Download(string serviceUrl, string accessKey, string accessSecret, string sourcePath, RequestS3Object[] sources, string[] names)
		{
			ResponseData<FileStreamResult> result = new ResponseData<FileStreamResult>();

			try
			{
				// S3 클라이언트를 가져온다.
				ResponseData<IAmazonS3> responseClient = this.GetS3Client(serviceUrl, accessKey, accessSecret);

				// S3 클라이언트를 가져오는데 실패한 경우
				if (responseClient.Result != EnumResponseResult.Success)
				{
					result.Code = responseClient.Code;
					result.Message = responseClient.Message;
				}
				// S3 클라이언트를 가져오는데 성공한 경우
				else
				{
					// 다운로드 파일을 저장할 상위 경로 생성
					string downloadRootPath = Path.Combine(Path.GetTempPath(), Guid.NewGuid().ToString());
					// 해당 상위 경로 생성
					if (!Directory.Exists(downloadRootPath))
						Directory.CreateDirectory(downloadRootPath);

					// 다운로드 처리
					ResponseData responseDownload = await this.Download(responseClient.Data, sourcePath, sources, downloadRootPath, names);
					
					// 다운로드에 성공한 경우
					if (responseDownload.Result == EnumResponseResult.Success)
					{
						// 다운로드 폴더의 파일/폴더 목록을 가져온다.
						string[] downloadFilesAndFolders = Directory.GetFileSystemEntries(downloadRootPath);
						
						// 파일/폴더가 존재하는 경우
						if (downloadFilesAndFolders != null && downloadFilesAndFolders.Length > 0)
						{
							// 단일 파일인 경우
							if (downloadFilesAndFolders.Length == 1)
							{
								FileInfo fileInfo = new FileInfo(downloadFilesAndFolders[0]);
								
								FileStream fileStreamInput = new FileStream(fileInfo.FullName, FileMode.Open, FileAccess.Read, FileShare.Delete);
								result.Data = new FileStreamResult(fileStreamInput, "application/octet-stream");
								result.Data.FileDownloadName = fileInfo.Name;
							}
							// 여러 파일인 경우
							else
							{
								string tempPath = Path.Combine(Path.GetTempPath(), Guid.NewGuid().ToString() + ".zip");
								ZipFile.CreateFromDirectory(downloadRootPath, tempPath);
							
								FileStream fileStreamInput = new FileStream(tempPath, FileMode.Open, FileAccess.Read, FileShare.Delete);
								result.Data = new FileStreamResult(fileStreamInput, "application/octet-stream");
								result.Data.FileDownloadName = "Files.zip";
							}

							result.Result = EnumResponseResult.Success;
						}
						// 파일이 존재하지 않은 경우
						else
						{
							result.Code = Resource.EC_COMMON__FILE_NOT_FOUND;
							result.Message = Resource.EM_COMMON__FILE_NOT_FOUND;
						}
					}
					else
					{
						result.Code = responseDownload.Code;
						result.Message = responseDownload.Message;
					}
				}
			}
			catch (Exception ex)
			{
				NNException.Log(ex);
		
				result.Code = Resource.EC_COMMON__EXCEPTION;
				result.Message = Resource.EM_COMMON__EXCEPTION;
			}
			
			return result;
		}

		/// <summary>파일 다운로드</summary>
		/// <param name="serviceUrl">서비스 URL</param>
		/// <param name="accessKey">엑세스 키</param>
		/// <param name="accessSecret">엑세스 시크릿</param>
		/// <param name="path">이미지 경로</param>
		/// <returns>다운로드 스트림 결과 객체</returns>
		public ResponseData<FileStreamResult> GetImage(string serviceUrl, string accessKey, string accessSecret, string path)
		{
			ResponseData<FileStreamResult> result = new ResponseData<FileStreamResult>();

			try
			{
				// S3 클라이언트를 가져온다.
				ResponseData<IAmazonS3> responseClient = this.GetS3Client(serviceUrl, accessKey, accessSecret);

				// S3 클라이언트를 가져오는데 실패한 경우
				if (responseClient.Result != EnumResponseResult.Success)
				{
					result.Code = responseClient.Code;
					result.Message = responseClient.Message;
				}
				// S3 클라이언트를 가져오는데 성공한 경우
				else
				{
					// 파일 전송 유틸리티 생성
					TransferUtility fileTransferUtility = new TransferUtility(responseClient.Data);

					// 버킷명과 나머지 경로를 분리한다.
					ResponseS3Bucket.SplitBucket(path, out string bucketName, out string remainPath);

					try
					{
						string key = ConvertToS3Path(remainPath, true);
						// 해당 파일에 대한 스트림을 가져온다.
						Stream stream = fileTransferUtility.OpenStream(bucketName, key);
						result.Data = new FileStreamResult(stream, "application/octet-stream");
						result.Result = EnumResponseResult.Success;
					}
					catch (Exception ex)
					{
						NNException.Log(ex);
				
						result.Code = Resource.EC_COMMON__FILE_NOT_FOUND;
						result.Message = Resource.EM_COMMON__FILE_NOT_FOUND;
					}
				}
			}
			catch (Exception ex)
			{
				NNException.Log(ex);
		
				result.Code = Resource.EC_COMMON__EXCEPTION;
				result.Message = Resource.EM_COMMON__EXCEPTION;
			}
			
			return result;
		}

		/// <summary>버킷의 CORS 설정을 가져온다.</summary>
		/// <param name="client">S3 클라이언트 객체</param>
		/// <param name="bucketName">버킷명</param>
		/// <returns>CORS 설정 정보 객체</returns>
		private async Task<ResponseData<CORSConfiguration>> GetCorsConfig(IAmazonS3 client, string bucketName)
		{
			ResponseData<CORSConfiguration> result = new ResponseData<CORSConfiguration>();

			try
			{
				// S3 클라이언트가 유효하지 않은 경우
				if (client == null)
				{
					result.Code = Resource.EC_COMMON__INVALID_REQUEST;
					result.Message = Resource.EM_COMMON__INVALID_REQUEST;
				}
				// 버킷이 존재하지 않는 경우
				else if (bucketName.IsEmpty())
				{
					result.Code = Resource.EC_COMMON__INVALID_REQUEST;
					result.Message = Resource.EM_COMMON__INVALID_REQUEST;
				}
				// 요청이 모두 유효한 경우
				else
				{
					try
					{
						// 버킷의 CORS 설정을 가져온다.
						GetCORSConfigurationResponse response = await client.GetCORSConfigurationAsync(bucketName);

						// 설정이 존재하는 경우
						result.Data = response.Configuration;

						result.Result = EnumResponseResult.Success;
					}
					catch (Exception ex)
					{
						NNException.Log(ex);
				
						result.Code = Resource.EC_S3_SUCH_BUCKET_NOT_FOUND;
						result.Message = Resource.EM_S3_SUCH_BUCKET_NOT_FOUND;
					}
				}				
			}
			catch (Exception ex)
			{
				NNException.Log(ex);
		
				result.Code = Resource.EC_COMMON__EXCEPTION;
				result.Message = Resource.EM_COMMON__EXCEPTION;
			}
		
			return result;
		}

		/// <summary>버킷의 CORS 설정을 저장한다.</summary>
		/// <param name="client">S3 클라이언트 객체</param>
		/// <param name="bucketName">버킷명</param>
		/// <param name="config">CORS 설정 객체</param>
		/// <returns>저장 결과</returns>
		private async Task<ResponseData> SetCorsConfig(IAmazonS3 client, string bucketName, CORSConfiguration config)
		{
			ResponseData result = new ResponseData();

			try
			{
				// S3 클라이언트가 유효하지 않은 경우
				if (client == null)
				{
					result.Code = Resource.EC_COMMON__INVALID_REQUEST;
					result.Message = Resource.EM_COMMON__INVALID_REQUEST;
				}
				// 버킷이 존재하지 않는 경우
				else if (bucketName.IsEmpty())
				{
					result.Code = Resource.EC_COMMON__INVALID_REQUEST;
					result.Message = Resource.EM_COMMON__INVALID_REQUEST;
				}
				// 요청이 모두 유효한 경우
				else
				{
					try
					{
						HttpStatusCode statusCode;
						
						// 설정할 룰이 존재하지 않는 경우, 삭제처리
						if (config == null)
						{
							DeleteCORSConfigurationResponse response = await client.DeleteCORSConfigurationAsync(bucketName);
							statusCode = response.HttpStatusCode;
						}
						// 설정할 룰이 존재하는 경우, 저장
						else
						{
							// 요청 정보 생성
							PutCORSConfigurationRequest request = new PutCORSConfigurationRequest();
							request.BucketName = bucketName;
							request.Configuration = config;
						
							// 버킷의 CORS 설정 결과를 가져온다.
							PutCORSConfigurationResponse response = await client.PutCORSConfigurationAsync(request);
							statusCode = response.HttpStatusCode;
						}
							
						// 결과가 OK인 경우
						if (statusCode == HttpStatusCode.OK)
							result.Result = EnumResponseResult.Success;
						// 결과가 OK가 아닌 경우
						else
						{
							result.Code = ((int) statusCode).ToString();
							result.Message = statusCode.ToString();
						}
					}
					catch (Exception ex)
					{
						NNException.Log(ex);
				
						result.Code = Resource.EC_S3_SUCH_BUCKET_NOT_FOUND;
						result.Message = Resource.EM_S3_SUCH_BUCKET_NOT_FOUND;
					}
				}				
			}
			catch (Exception ex)
			{
				NNException.Log(ex);
		
				result.Code = Resource.EC_COMMON__EXCEPTION;
				result.Message = Resource.EM_COMMON__EXCEPTION;
			}
		
			return result;
		}

		/// <summary>버킷의 CORS 설정을 가져온다.</summary>
		/// <param name="serviceUrl">서비스 URL</param>
		/// <param name="accessKey">엑세스 키</param>
		/// <param name="accessSecret">엑세스 시크릿</param>
		/// <param name="bucketName">버킷명</param>
		/// <returns>CORS 룰 목록 객체</returns>
		public async Task<ResponseData<CORSConfiguration>> GetCorsConfig(string serviceUrl, string accessKey, string accessSecret, string bucketName)
		{
			ResponseData<CORSConfiguration> result = new ResponseData<CORSConfiguration>();

			try
			{
				// S3 클라이언트를 가져온다.
				ResponseData<IAmazonS3> responseClient = this.GetS3Client(serviceUrl, accessKey, accessSecret);

				// S3 클라이언트를 가져오는데 실패한 경우
				if (responseClient.Result != EnumResponseResult.Success)
				{
					result.Code = responseClient.Code;
					result.Message = responseClient.Message;
				}
				// S3 클라이언트를 가져오는데 성공한 경우
				else
				{
					// 버킷의 CORS 설정을 가져온다.
					result = await this.GetCorsConfig(responseClient.Data, bucketName);
				}
			}
			catch (Exception ex)
			{
				NNException.Log(ex);
		
				result.Code = Resource.EC_COMMON__EXCEPTION;
				result.Message = Resource.EM_COMMON__EXCEPTION;
			}
			
			return result;
		}

		/// <summary>버킷의 CORS 설정을 저장한다.</summary>
		/// <param name="serviceUrl">서비스 URL</param>
		/// <param name="accessKey">엑세스 키</param>
		/// <param name="accessSecret">엑세스 시크릿</param>
		/// <param name="bucketName">버킷명</param>
		/// <param name="config">CORS 설정 객체</param>
		/// <returns>저장 결과</returns>
		public async Task<ResponseData> SetCorsConfig(string serviceUrl, string accessKey, string accessSecret, string bucketName, CORSConfiguration config)
		{
			ResponseData result = new ResponseData();

			try
			{
				// S3 클라이언트를 가져온다.
				ResponseData<IAmazonS3> responseClient = this.GetS3Client(serviceUrl, accessKey, accessSecret);

				// S3 클라이언트를 가져오는데 실패한 경우
				if (responseClient.Result != EnumResponseResult.Success)
				{
					result.Code = responseClient.Code;
					result.Message = responseClient.Message;
				}
				// S3 클라이언트를 가져오는데 성공한 경우
				else
				{
					// 버킷의 CORS 설정을 가져온다.
					result = await this.SetCorsConfig(responseClient.Data, bucketName, config);
				}
			}
			catch (Exception ex)
			{
				NNException.Log(ex);
		
				result.Code = Resource.EC_COMMON__EXCEPTION;
				result.Message = Resource.EM_COMMON__EXCEPTION;
			}
			
			return result;
		}

		/// <summary>버킷의 웹사이트 설정을 가져온다.</summary>
		/// <param name="client">S3 클라이언트 객체</param>
		/// <param name="bucketName">버킷명</param>
		/// <returns>웹사이트 설정 정보 객체</returns>
		private async Task<ResponseData<WebsiteConfiguration>> GetWebSiteConfig(IAmazonS3 client, string bucketName)
		{
			ResponseData<WebsiteConfiguration> result = new ResponseData<WebsiteConfiguration>();

			try
			{
				// S3 클라이언트가 유효하지 않은 경우
				if (client == null)
				{
					result.Code = Resource.EC_COMMON__INVALID_REQUEST;
					result.Message = Resource.EM_COMMON__INVALID_REQUEST;
				}
				// 버킷이 존재하지 않는 경우
				else if (bucketName.IsEmpty())
				{
					result.Code = Resource.EC_COMMON__INVALID_REQUEST;
					result.Message = Resource.EM_COMMON__INVALID_REQUEST;
				}
				// 요청이 모두 유효한 경우
				else
				{
					try
					{
						// 버킷의 웹사이트 설정을 가져온다.
						GetBucketWebsiteResponse response = await client.GetBucketWebsiteAsync(bucketName);

						// 설정이 존재하는 경우
						result.Data = response.WebsiteConfiguration;

						result.Result = EnumResponseResult.Success;
					}
					catch (Exception ex)
					{
						NNException.Log(ex);
				
						result.Code = Resource.EC_S3_SUCH_BUCKET_NOT_FOUND;
						result.Message = Resource.EM_S3_SUCH_BUCKET_NOT_FOUND;
					}
				}				
			}
			catch (Exception ex)
			{
				NNException.Log(ex);
		
				result.Code = Resource.EC_COMMON__EXCEPTION;
				result.Message = Resource.EM_COMMON__EXCEPTION;
			}
		
			return result;
		}

		/// <summary>버킷의 웹사이트 설정을 저장한다.</summary>
		/// <param name="client">S3 클라이언트 객체</param>
		/// <param name="bucketName">버킷명</param>
		/// <param name="config">웹사이트 설정 객체</param>
		/// <returns>저장 결과</returns>
		private async Task<ResponseData> SetWebSiteConfig(IAmazonS3 client, string bucketName, WebsiteConfiguration config)
		{
			ResponseData result = new ResponseData();

			try
			{
				// S3 클라이언트가 유효하지 않은 경우
				if (client == null)
				{
					result.Code = Resource.EC_COMMON__INVALID_REQUEST;
					result.Message = Resource.EM_COMMON__INVALID_REQUEST;
				}
				// 버킷이 존재하지 않는 경우
				else if (bucketName.IsEmpty())
				{
					result.Code = Resource.EC_COMMON__INVALID_REQUEST;
					result.Message = Resource.EM_COMMON__INVALID_REQUEST;
				}
				// 요청이 모두 유효한 경우
				else
				{
					try
					{
						HttpStatusCode statusCode;
						
						// 설정할 룰이 존재하지 않는 경우, 삭제처리
						if (config == null)
						{
							DeleteBucketWebsiteResponse response = await client.DeleteBucketWebsiteAsync(bucketName);
							statusCode = response.HttpStatusCode;
						}
						// 설정할 룰이 존재하는 경우, 저장
						else
						{
							// 요청 정보 생성
							PutBucketWebsiteRequest request = new PutBucketWebsiteRequest();
							request.BucketName = bucketName;
							request.WebsiteConfiguration = config;
						
							// 버킷의 웹사이트 설정 결과를 가져온다.
							PutBucketWebsiteResponse response = await client.PutBucketWebsiteAsync(request);
							statusCode = response.HttpStatusCode;
						}
							
						// 결과가 OK인 경우
						if (statusCode == HttpStatusCode.OK)
							result.Result = EnumResponseResult.Success;
						// 결과가 OK가 아닌 경우
						else
						{
							result.Code = ((int) statusCode).ToString();
							result.Message = statusCode.ToString();
						}
					}
					catch (Exception ex)
					{
						NNException.Log(ex);
				
						result.Code = Resource.EC_S3_SUCH_BUCKET_NOT_FOUND;
						result.Message = Resource.EM_S3_SUCH_BUCKET_NOT_FOUND;
					}
				}				
			}
			catch (Exception ex)
			{
				NNException.Log(ex);
		
				result.Code = Resource.EC_COMMON__EXCEPTION;
				result.Message = Resource.EM_COMMON__EXCEPTION;
			}
		
			return result;
		}

		/// <summary>버킷의 웹사이트 설정을 가져온다.</summary>
		/// <param name="serviceUrl">서비스 URL</param>
		/// <param name="accessKey">엑세스 키</param>
		/// <param name="accessSecret">엑세스 시크릿</param>
		/// <param name="bucketName">버킷명</param>
		/// <returns>웹사이트 룰 목록 객체</returns>
		public async Task<ResponseData<WebsiteConfiguration>> GetWebSiteConfig(string serviceUrl, string accessKey, string accessSecret, string bucketName)
		{
			ResponseData<WebsiteConfiguration> result = new ResponseData<WebsiteConfiguration>();

			try
			{
				// S3 클라이언트를 가져온다.
				ResponseData<IAmazonS3> responseClient = this.GetS3Client(serviceUrl, accessKey, accessSecret);

				// S3 클라이언트를 가져오는데 실패한 경우
				if (responseClient.Result != EnumResponseResult.Success)
				{
					result.Code = responseClient.Code;
					result.Message = responseClient.Message;
				}
				// S3 클라이언트를 가져오는데 성공한 경우
				else
				{
					// 버킷의 웹사이트 설정을 가져온다.
					result = await this.GetWebSiteConfig(responseClient.Data, bucketName);
				}
			}
			catch (Exception ex)
			{
				NNException.Log(ex);
		
				result.Code = Resource.EC_COMMON__EXCEPTION;
				result.Message = Resource.EM_COMMON__EXCEPTION;
			}
			
			return result;
		}

		/// <summary>버킷의 웹사이트 설정을 저장한다.</summary>
		/// <param name="serviceUrl">서비스 URL</param>
		/// <param name="accessKey">엑세스 키</param>
		/// <param name="accessSecret">엑세스 시크릿</param>
		/// <param name="bucketName">버킷명</param>
		/// <param name="config">웹사이트 설정 객체</param>
		/// <returns>저장 결과</returns>
		public async Task<ResponseData> SetWebSiteConfig(string serviceUrl, string accessKey, string accessSecret, string bucketName, WebsiteConfiguration config)
		{
			ResponseData result = new ResponseData();

			try
			{
				// S3 클라이언트를 가져온다.
				ResponseData<IAmazonS3> responseClient = this.GetS3Client(serviceUrl, accessKey, accessSecret);

				// S3 클라이언트를 가져오는데 실패한 경우
				if (responseClient.Result != EnumResponseResult.Success)
				{
					result.Code = responseClient.Code;
					result.Message = responseClient.Message;
				}
				// S3 클라이언트를 가져오는데 성공한 경우
				else
				{
					// 버킷의 웹사이트 설정을 가져온다.
					result = await this.SetWebSiteConfig(responseClient.Data, bucketName, config);
				}
			}
			catch (Exception ex)
			{
				NNException.Log(ex);
		
				result.Code = Resource.EC_COMMON__EXCEPTION;
				result.Message = Resource.EM_COMMON__EXCEPTION;
			}
			
			return result;
		}

		/// <summary>객체의 Version 목록을 가져온다.</summary>
		/// <param name="client">S3 클라이언트 객체</param>
		/// <param name="request">S3 요청 객체</param>
		/// <returns>Versioning 목록 객체</returns>
		private async Task<ResponseList<ResponseS3VersioningInfo>> GetVersioningList(IAmazonS3 client, RequestS3VersionList request)
		{
			ResponseList<ResponseS3VersioningInfo> result = new ResponseList<ResponseS3VersioningInfo>();

			try
			{
				// S3 클라이언트가 유효하지 않은 경우
				if (client == null)
				{
					result.Code = Resource.EC_COMMON__INVALID_REQUEST;
					result.Message = Resource.EM_COMMON__INVALID_REQUEST;
				}
				//  존재하지 않는 경우
				else if (request == null || request.Name.IsEmpty())
				{
					result.Code = Resource.EC_COMMON__INVALID_REQUEST;
					result.Message = Resource.EM_COMMON__INVALID_REQUEST;
				}
				// 요청이 모두 유효한 경우
				else
				{
					// 경로 URL 디코드
					if(!request.ParentPath.IsEmpty())
						request.ParentPath = HttpUtility.UrlDecode(request.ParentPath);
				
					// 루트 경로인 경우, 버킷에 대한 처리
					if (request.ParentPath.IsEmpty() || request.ParentPath == Path.DirectorySeparatorChar.ToString())
					{
						try
						{
							// 요청 생성
							ListVersionsRequest versionsRequest = new ListVersionsRequest()
							{
								BucketName = request.Name
							};

							// 버전 목록을 가져온다.
							ListVersionsResponse response = await client.ListVersionsAsync(versionsRequest);

							// 결과가 OK인 경우
							if (response.HttpStatusCode == HttpStatusCode.OK)
							{
								// 모든 버전 객체에 대해서 처리
								foreach (S3ObjectVersion version in response.Versions)
									result.Data.Items.Add(new ResponseS3VersioningInfo(version));
								result.Data.ResetWithItems();
								result.Result = EnumResponseResult.Success;
							}
							// 결과가 OK가 아닌 경우
							else
							{
								result.Code = ((int) response.HttpStatusCode).ToString();
								result.Message = response.HttpStatusCode.ToString();
							}
						}
						catch (Exception ex)
						{
							NNException.Log(ex);
				
							result.Code = Resource.EC_S3_SUCH_BUCKET_NOT_FOUND;
							result.Message = Resource.EM_S3_SUCH_BUCKET_NOT_FOUND;
						}
					}
					// 루트 경로가 아닌 경우, 객체에 대한 처리
					else
					{
						// 버킷명과 나머지 경로를 분리한다.
						ResponseS3Bucket.SplitBucket(request.ParentPath, out string bucketName, out string remainPath);

						// S3 경로로 변환
						remainPath = ConvertToS3Path(remainPath);
						
						try
						{
							// 요청 생성
							ListVersionsRequest versionsRequest = new ListVersionsRequest()
							{
								BucketName = bucketName,
								Prefix = Path.Combine(remainPath, request.Name)
							};

							// 버전 목록을 가져온다.
							ListVersionsResponse response = await client.ListVersionsAsync(versionsRequest);

							// 결과가 OK인 경우
							if (response.HttpStatusCode == HttpStatusCode.OK)
							{
								// 모든 버전 객체에 대해서 처리
								foreach (S3ObjectVersion version in response.Versions)
									result.Data.Items.Add(new ResponseS3VersioningInfo(version));
								result.Data.ResetWithItems();
								result.Result = EnumResponseResult.Success;
							}
							// 결과가 OK가 아닌 경우
							else
							{
								result.Code = ((int) response.HttpStatusCode).ToString();
								result.Message = response.HttpStatusCode.ToString();
							}
						}
						catch (Exception ex)
						{
							NNException.Log(ex);
				
							result.Code = Resource.EC_S3_SUCH_OBJECT_NOT_FOUND;
							result.Message = Resource.EM_S3_SUCH_OBJECT_NOT_FOUND;
						}
					}
				}				
			}
			catch (Exception ex)
			{
				NNException.Log(ex);
		
				result.Code = Resource.EC_COMMON__EXCEPTION;
				result.Message = Resource.EM_COMMON__EXCEPTION;
			}
		
			return result;
		}

		/// <summary>객체의 특정 버전들을 삭제한다.</summary>
		/// <param name="client">S3 클라이언트 객체</param>
		/// <param name="request">S3 버전 삭제 요청 객체</param>
		/// <returns>웹사이트 룰 목록 객체</returns>
		public async Task<ResponseData> DeleteVersion(IAmazonS3 client, RequestS3VersionDelete request)
		{
			ResponseData result = new ResponseData();

			try
			{
				// S3 클라이언트가 유효하지 않은 경우
				if (client == null)
				{
					result.Code = Resource.EC_COMMON__INVALID_REQUEST;
					result.Message = Resource.EM_COMMON__INVALID_REQUEST;
				}
				//  존재하지 않는 경우
				else if (request == null || request.Name.IsEmpty() || request.VersionIds == null || request.VersionIds.Count == 0)
				{
					result.Code = Resource.EC_COMMON__INVALID_REQUEST;
					result.Message = Resource.EM_COMMON__INVALID_REQUEST;
				}
				// 요청이 모두 유효한 경우
				else
				{
					// 버전 목록을 가져온다.
					ResponseList<ResponseS3VersioningInfo> responseVersions = await this.GetVersioningList(client, new RequestS3VersionList() {ParentPath = request.ParentPath, Name = request.Name});

					// 버전 목록을 가져오는데 성공한 경우
					if (responseVersions.Result == EnumResponseResult.Success)
					{
						// 삭제할 버전 정보 목록을 가져온다.
						List<ResponseS3VersioningInfo> willDeleteVersions = responseVersions.Data.Items
							.Where(i => request.VersionIds.Contains(i.VersionId))
							.OrderByDescending(i => i.LastModified)
							.ToList();

						// 삭제할 버전을 모두 삭제한다.
						foreach (ResponseS3VersioningInfo version in willDeleteVersions)
						{
							// 해당 버전 삭제
							await client.DeleteObjectAsync(new DeleteObjectRequest()
							{
								BucketName = version.BucketName,
								Key = version.Key,
								VersionId = version.VersionId
							});
						}

						result.Result = EnumResponseResult.Success;
					}
					// 버전 목록을 가져오는데 실패한 경우
					else
					{
						result.Code = responseVersions.Code;
						result.Message = responseVersions.Message;
					}
				}
			}
			catch (Exception ex)
			{
				NNException.Log(ex);
		
				result.Code = Resource.EC_COMMON__EXCEPTION;
				result.Message = Resource.EM_COMMON__EXCEPTION;
			}
			
			return result;
		}

		/// <summary>객체의 특정 버전을 다운로드 한다.</summary>
		/// <param name="client">S3 클라이언트 객체</param>
		/// <param name="request">S3 버전 다운로드 요청 객체</param>
		/// <param name="downloadRootPath">파일을 저장할 경로</param>
		/// <returns>웹사이트 룰 목록 객체</returns>
		public async Task<ResponseData> DownloadVersion(IAmazonS3 client, RequestS3VersionDownload request, string downloadRootPath)
		{
			ResponseData result = new ResponseData();

			try
			{
				// S3 클라이언트가 유효하지 않은 경우
				if (client == null)
				{
					result.Code = Resource.EC_COMMON__INVALID_REQUEST;
					result.Message = Resource.EM_COMMON__INVALID_REQUEST;
				}
				//  존재하지 않는 경우
				else if (request == null || request.Name.IsEmpty() || request.VersionId.IsEmpty())
				{
					result.Code = Resource.EC_COMMON__INVALID_REQUEST;
					result.Message = Resource.EM_COMMON__INVALID_REQUEST;
				}
				// 요청이 모두 유효한 경우
				else
				{
					// 버전 목록을 가져온다.
					ResponseList<ResponseS3VersioningInfo> responseVersions = await this.GetVersioningList(client, new RequestS3VersionList() {ParentPath = request.ParentPath, Name = request.Name});

					// 버전 목록을 가져오는데 성공한 경우
					if (responseVersions.Result == EnumResponseResult.Success)
					{
						// 다운로드할 버전 정보 목록을 가져온다.
						ResponseS3VersioningInfo downloadVersion = responseVersions.Data.Items
							.FirstOrDefault(i => request.VersionId == i.VersionId);

						// 해당 버전이 존재하는 경우
						if (downloadVersion != null)
						{
							// 파일 전송 유틸리티 생성
							TransferUtility fileTransferUtility = new TransferUtility(client);
							
							string sourceObjectPath = ConvertToS3Path(BuildPath(downloadVersion.ParentPath, downloadVersion.Name, true), true); 
							string savePath = Path.Combine(downloadRootPath, downloadVersion.Name);
								
							this.m_logger.LogInformation($"File Download : {downloadVersion.BucketName}:{sourceObjectPath} => {savePath}");

							TransferUtilityDownloadRequest downloadRequest = new TransferUtilityDownloadRequest()
							{
								BucketName = downloadVersion.BucketName,
								Key = downloadVersion.Key,
								VersionId = downloadVersion.VersionId,
								FilePath = savePath
							};
							// 파일 다운로드
							await fileTransferUtility.DownloadAsync(downloadRequest);

							result.Result = EnumResponseResult.Success;
						}
						// 해당 버전이 존재하지 않는 경우
						else
						{
							result.Code = Resource.EC_S3_SUCH_OBJECT_NOT_FOUND;
							result.Message = Resource.EM_S3_SUCH_OBJECT_NOT_FOUND;
						}
					}
					// 버전 목록을 가져오는데 실패한 경우
					else
					{
						result.Code = responseVersions.Code;
						result.Message = responseVersions.Message;
					}
				}
			}
			catch (Exception ex)
			{
				NNException.Log(ex);
		
				result.Code = Resource.EC_COMMON__EXCEPTION;
				result.Message = Resource.EM_COMMON__EXCEPTION;
			}
			
			return result;
		}

		/// <summary>객체의 Version 목록을 가져온다.</summary>
		/// <param name="serviceUrl">서비스 URL</param>
		/// <param name="accessKey">엑세스 키</param>
		/// <param name="accessSecret">엑세스 시크릿</param>
		/// <param name="request">S3 요청 객체</param>
		/// <returns>Versioning 목록 객체</returns>
		public async Task<ResponseList<ResponseS3VersioningInfo>> GetVersioningList(string serviceUrl, string accessKey, string accessSecret, RequestS3VersionList request)
		{
			ResponseList<ResponseS3VersioningInfo> result = new ResponseList<ResponseS3VersioningInfo>();

			try
			{
				// S3 클라이언트를 가져온다.
				ResponseData<IAmazonS3> responseClient = this.GetS3Client(serviceUrl, accessKey, accessSecret);

				// S3 클라이언트를 가져오는데 실패한 경우
				if (responseClient.Result != EnumResponseResult.Success)
				{
					result.Code = responseClient.Code;
					result.Message = responseClient.Message;
				}
				// S3 클라이언트를 가져오는데 성공한 경우
				else
				{
					// 버킷의 웹사이트 설정을 가져온다.
					result = await this.GetVersioningList(responseClient.Data, request);
				}
			}
			catch (Exception ex)
			{
				NNException.Log(ex);
		
				result.Code = Resource.EC_COMMON__EXCEPTION;
				result.Message = Resource.EM_COMMON__EXCEPTION;
			}
			
			return result;
		}

		/// <summary>객체의 특정 버전들을 삭제한다.</summary>
		/// <param name="serviceUrl">서비스 URL</param>
		/// <param name="accessKey">엑세스 키</param>
		/// <param name="accessSecret">엑세스 시크릿</param>
		/// <param name="request">S3 버전 삭제 요청 객체</param>
		/// <returns>웹사이트 룰 목록 객체</returns>
		public async Task<ResponseData> DeleteVersion(string serviceUrl, string accessKey, string accessSecret, RequestS3VersionDelete request)
		{
			ResponseData result = new ResponseData();

			try
			{
				// S3 클라이언트를 가져온다.
				ResponseData<IAmazonS3> responseClient = this.GetS3Client(serviceUrl, accessKey, accessSecret);

				// S3 클라이언트를 가져오는데 실패한 경우
				if (responseClient.Result != EnumResponseResult.Success)
				{
					result.Code = responseClient.Code;
					result.Message = responseClient.Message;
				}
				// S3 클라이언트를 가져오는데 성공한 경우
				else
				{
					// 객체의 특정 버전들을 삭제한다.
					result = await this.DeleteVersion(responseClient.Data, request);
				}
			}
			catch (Exception ex)
			{
				NNException.Log(ex);
		
				result.Code = Resource.EC_COMMON__EXCEPTION;
				result.Message = Resource.EM_COMMON__EXCEPTION;
			}
			
			return result;
		}

		/// <summary>객체의 특정 버전을 다운로드 한다.</summary>
		/// <param name="serviceUrl">서비스 URL</param>
		/// <param name="accessKey">엑세스 키</param>
		/// <param name="accessSecret">엑세스 시크릿</param>
		/// <param name="request">S3 버전 다운로드 요청 객체</param>
		/// <returns>웹사이트 룰 목록 객체</returns>
		public async Task<ResponseData<FileStreamResult>> DownloadVersion(string serviceUrl, string accessKey, string accessSecret, RequestS3VersionDownload request)
		{
			ResponseData<FileStreamResult> result = new ResponseData<FileStreamResult>();

			try
			{
				// S3 클라이언트를 가져온다.
				ResponseData<IAmazonS3> responseClient = this.GetS3Client(serviceUrl, accessKey, accessSecret);

				// S3 클라이언트를 가져오는데 실패한 경우
				if (responseClient.Result != EnumResponseResult.Success)
				{
					result.Code = responseClient.Code;
					result.Message = responseClient.Message;
				}
				// S3 클라이언트를 가져오는데 성공한 경우
				else
				{
					// 다운로드 파일을 저장할 상위 경로 생성
					string downloadRootPath = Path.Combine(Path.GetTempPath(), Guid.NewGuid().ToString());
					// 해당 상위 경로 생성
					if (!Directory.Exists(downloadRootPath))
						Directory.CreateDirectory(downloadRootPath);

					// 다운로드 처리
					ResponseData responseDownload = await this.DownloadVersion(responseClient.Data, request, downloadRootPath);
					
					
					// 다운로드에 성공한 경우
					if (responseDownload.Result == EnumResponseResult.Success)
					{
						// 다운로드 폴더의 파일/폴더 목록을 가져온다.
						string[] downloadFilesAndFolders = Directory.GetFileSystemEntries(downloadRootPath);
						
						// 파일/폴더가 존재하는 경우
						if (downloadFilesAndFolders != null && downloadFilesAndFolders.Length > 0)
						{
							// 단일 파일인 경우
							if (downloadFilesAndFolders.Length == 1)
							{
								FileInfo fileInfo = new FileInfo(downloadFilesAndFolders[0]);
								
								FileStream fileStreamInput = new FileStream(fileInfo.FullName, FileMode.Open, FileAccess.Read, FileShare.Delete);
								result.Data = new FileStreamResult(fileStreamInput, "application/octet-stream");
								result.Data.FileDownloadName = fileInfo.Name;
							}
							// 여러 파일인 경우
							else
							{
								string tempPath = Path.Combine(Path.GetTempPath(), Guid.NewGuid().ToString() + ".zip");
								ZipFile.CreateFromDirectory(downloadRootPath, tempPath);
							
								FileStream fileStreamInput = new FileStream(tempPath, FileMode.Open, FileAccess.Read, FileShare.Delete);
								result.Data = new FileStreamResult(fileStreamInput, "application/octet-stream");
								result.Data.FileDownloadName = "Files.zip";
							}

							result.Result = EnumResponseResult.Success;
						}
						// 파일이 존재하지 않은 경우
						else
						{
							result.Code = Resource.EC_COMMON__FILE_NOT_FOUND;
							result.Message = Resource.EM_COMMON__FILE_NOT_FOUND;
						}
					}
					// 다운로드에 실패한 경우
					else
					{
						result.Code = responseDownload.Code;
						result.Message = responseDownload.Message;
					}
				}
			}
			catch (Exception ex)
			{
				NNException.Log(ex);
		
				result.Code = Resource.EC_COMMON__EXCEPTION;
				result.Message = Resource.EM_COMMON__EXCEPTION;
			}
			
			return result;
		}

		/// <summary>버킷의 Versioning 설정을 가져온다.</summary>
		/// <param name="client">S3 클라이언트 객체</param>
		/// <param name="bucketName">버킷명</param>
		/// <returns>Versioning 설정 정보 객체</returns>
		private async Task<ResponseData<ResponseS3VersioningConfig>> GetVersioningConfig(IAmazonS3 client, string bucketName)
		{
			ResponseData<ResponseS3VersioningConfig> result = new ResponseData<ResponseS3VersioningConfig>();

			try
			{
				// S3 클라이언트가 유효하지 않은 경우
				if (client == null)
				{
					result.Code = Resource.EC_COMMON__INVALID_REQUEST;
					result.Message = Resource.EM_COMMON__INVALID_REQUEST;
				}
				// 버킷이 존재하지 않는 경우
				else if (bucketName.IsEmpty())
				{
					result.Code = Resource.EC_COMMON__INVALID_REQUEST;
					result.Message = Resource.EM_COMMON__INVALID_REQUEST;
				}
				// 요청이 모두 유효한 경우
				else
				{
					try
					{
						// 버킷의 웹사이트 설정을 가져온다.
						GetBucketVersioningResponse response = await client.GetBucketVersioningAsync(bucketName);

						// 결과가 OK인 경우
						if (response.HttpStatusCode == HttpStatusCode.OK)
						{
							result.Data.Status = response.VersioningConfig.Status.Value;
							result.Data.EnableMfaDelete = response.VersioningConfig.EnableMfaDelete;
							result.Result = EnumResponseResult.Success;
						}
						// 결과가 OK가 아닌 경우
						else
						{
							result.Code = ((int) response.HttpStatusCode).ToString();
							result.Message = response.HttpStatusCode.ToString();
						}
					}
					catch (Exception ex)
					{
						NNException.Log(ex);
				
						result.Code = Resource.EC_S3_SUCH_BUCKET_NOT_FOUND;
						result.Message = Resource.EM_S3_SUCH_BUCKET_NOT_FOUND;
					}
				}				
			}
			catch (Exception ex)
			{
				NNException.Log(ex);
		
				result.Code = Resource.EC_COMMON__EXCEPTION;
				result.Message = Resource.EM_COMMON__EXCEPTION;
			}
		
			return result;
		}

		/// <summary>버킷의 Versioning 설정을 저장한다.</summary>
		/// <param name="client">S3 클라이언트 객체</param>
		/// <param name="bucketName">버킷명</param>
		/// <param name="config">Versioning 설정 객체</param>
		/// <returns>저장 결과</returns>
		private async Task<ResponseData> SetVersioningConfig(IAmazonS3 client, string bucketName, RequestS3VersioningConfig config)
		{
			ResponseData result = new ResponseData();

			try
			{
				// S3 클라이언트가 유효하지 않은 경우
				if (client == null)
				{
					result.Code = Resource.EC_COMMON__INVALID_REQUEST;
					result.Message = Resource.EM_COMMON__INVALID_REQUEST;
				}
				// 버킷이 존재하지 않는 경우
				else if (bucketName.IsEmpty())
				{
					result.Code = Resource.EC_COMMON__INVALID_REQUEST;
					result.Message = Resource.EM_COMMON__INVALID_REQUEST;
				}
				// 요청이 모두 유효한 경우
				else
				{
					try
					{
						// 요청 정보 생성
						PutBucketVersioningRequest request = new PutBucketVersioningRequest
						{
							BucketName = bucketName,
							VersioningConfig = new S3BucketVersioningConfig
							{
								Status = new VersionStatus(config.Status),
								EnableMfaDelete = config.EnableMfaDelete
							}
						};
						
						// 버킷의 Versioning 설정 결과를 가져온다.
						PutBucketVersioningResponse response = await client.PutBucketVersioningAsync(request);
							
						// 결과가 OK인 경우
						if (response.HttpStatusCode == HttpStatusCode.OK)
							result.Result = EnumResponseResult.Success;
						// 결과가 OK가 아닌 경우
						else
						{
							result.Code = ((int) response.HttpStatusCode).ToString();
							result.Message = response.HttpStatusCode.ToString();
						}
					}
					catch (Exception ex)
					{
						NNException.Log(ex);
				
						result.Code = Resource.EC_S3_SUCH_BUCKET_NOT_FOUND;
						result.Message = Resource.EM_S3_SUCH_BUCKET_NOT_FOUND;
					}
				}				
			}
			catch (Exception ex)
			{
				NNException.Log(ex);
		
				result.Code = Resource.EC_COMMON__EXCEPTION;
				result.Message = Resource.EM_COMMON__EXCEPTION;
			}
		
			return result;
		}

		/// <summary>버킷의 Versioning 설정을 가져온다.</summary>
		/// <param name="serviceUrl">서비스 URL</param>
		/// <param name="accessKey">엑세스 키</param>
		/// <param name="accessSecret">엑세스 시크릿</param>
		/// <param name="bucketName">버킷명</param>
		/// <returns>Versioning 설정 정보 객체</returns>
		public async Task<ResponseData<ResponseS3VersioningConfig>> GetVersioningConfig(string serviceUrl, string accessKey, string accessSecret, string bucketName)
		{
			ResponseData<ResponseS3VersioningConfig> result = new ResponseData<ResponseS3VersioningConfig>();

			try
			{
				// S3 클라이언트를 가져온다.
				ResponseData<IAmazonS3> responseClient = this.GetS3Client(serviceUrl, accessKey, accessSecret);

				// S3 클라이언트를 가져오는데 실패한 경우
				if (responseClient.Result != EnumResponseResult.Success)
				{
					result.Code = responseClient.Code;
					result.Message = responseClient.Message;
				}
				// S3 클라이언트를 가져오는데 성공한 경우
				else
				{
					// 버킷의 웹사이트 설정을 가져온다.
					result = await this.GetVersioningConfig(responseClient.Data, bucketName);
				}
			}
			catch (Exception ex)
			{
				NNException.Log(ex);
		
				result.Code = Resource.EC_COMMON__EXCEPTION;
				result.Message = Resource.EM_COMMON__EXCEPTION;
			}
			
			return result;
		}

		/// <summary>버킷의 Versioning 설정을 저장한다.</summary>
		/// <param name="serviceUrl">서비스 URL</param>
		/// <param name="accessKey">엑세스 키</param>
		/// <param name="accessSecret">엑세스 시크릿</param>
		/// <param name="bucketName">버킷명</param>
		/// <param name="config">Versioning 설정 객체</param>
		/// <returns>저장 결과</returns>
		public async Task<ResponseData> SetVersioningConfig(string serviceUrl, string accessKey, string accessSecret, string bucketName, RequestS3VersioningConfig config)
		{
			ResponseData result = new ResponseData();

			try
			{
				// S3 클라이언트를 가져온다.
				ResponseData<IAmazonS3> responseClient = this.GetS3Client(serviceUrl, accessKey, accessSecret);

				// S3 클라이언트를 가져오는데 실패한 경우
				if (responseClient.Result != EnumResponseResult.Success)
				{
					result.Code = responseClient.Code;
					result.Message = responseClient.Message;
				}
				// S3 클라이언트를 가져오는데 성공한 경우
				else
				{
					// 버킷의 웹사이트 설정을 가져온다.
					result = await this.SetVersioningConfig(responseClient.Data, bucketName, config);
				}
			}
			catch (Exception ex)
			{
				NNException.Log(ex);
		
				result.Code = Resource.EC_COMMON__EXCEPTION;
				result.Message = Resource.EM_COMMON__EXCEPTION;
			}
			
			return result;
		}

		/// <summary>버킷의 정책 설정을 가져온다.</summary>
		/// <param name="client">S3 클라이언트 객체</param>
		/// <param name="bucketName">버킷명</param>
		/// <returns>버킷 정책 설정 정보 객체</returns>
		private async Task<ResponseData<ResponseS3BucketPolicy>> GetBucketPolicy(IAmazonS3 client, string bucketName)
		{
			ResponseData<ResponseS3BucketPolicy> result = new ResponseData<ResponseS3BucketPolicy>();

			try
			{
				// S3 클라이언트가 유효하지 않은 경우
				if (client == null)
				{
					result.Code = Resource.EC_COMMON__INVALID_REQUEST;
					result.Message = Resource.EM_COMMON__INVALID_REQUEST;
				}
				// 버킷이 존재하지 않는 경우
				else if (bucketName.IsEmpty())
				{
					result.Code = Resource.EC_COMMON__INVALID_REQUEST;
					result.Message = Resource.EM_COMMON__INVALID_REQUEST;
				}
				// 요청이 모두 유효한 경우
				else
				{
					try
					{
						// 버킷 정책 설정을 가져온다.
						GetBucketPolicyResponse response = await client.GetBucketPolicyAsync(bucketName);
						
						// 결과가 OK인 경우
						if (response.HttpStatusCode == HttpStatusCode.OK)
						{
							result.Data.Policy = response.Policy;
							result.Result = EnumResponseResult.Success;
						}
						// 결과가 OK가 아닌 경우
						else
						{
							result.Code = ((int) response.HttpStatusCode).ToString();
							result.Message = response.HttpStatusCode.ToString();
						}
					}
					catch (Exception ex)
					{
						NNException.Log(ex);
				
						result.Code = Resource.EC_S3_SUCH_BUCKET_NOT_FOUND;
						result.Message = Resource.EM_S3_SUCH_BUCKET_NOT_FOUND;
					}
				}				
			}
			catch (Exception ex)
			{
				NNException.Log(ex);
		
				result.Code = Resource.EC_COMMON__EXCEPTION;
				result.Message = Resource.EM_COMMON__EXCEPTION;
			}
		
			return result;
		}

		/// <summary>버킷의 정책 설정을 저장한다.</summary>
		/// <param name="client">S3 클라이언트 객체</param>
		/// <param name="bucketName">버킷명</param>
		/// <param name="config">버킷 정책 설정 객체</param>
		/// <returns>저장 결과</returns>
		private async Task<ResponseData> SetBucketPolicy(IAmazonS3 client, string bucketName, RequestS3BucketPolicy config)
		{
			ResponseData result = new ResponseData();

			try
			{
				// S3 클라이언트가 유효하지 않은 경우
				if (client == null)
				{
					result.Code = Resource.EC_COMMON__INVALID_REQUEST;
					result.Message = Resource.EM_COMMON__INVALID_REQUEST;
				}
				// 버킷이 존재하지 않는 경우
				else if (bucketName.IsEmpty())
				{
					result.Code = Resource.EC_COMMON__INVALID_REQUEST;
					result.Message = Resource.EM_COMMON__INVALID_REQUEST;
				}
				// 요청이 모두 유효한 경우
				else
				{
					try
					{
						// // S3 요청객체 생성
						// S3BucketPolicyRequest request = new S3BucketPolicyRequest(bucketName, config);
						
						// // 문자열로 변환
						// string policy = JsonConvert.SerializeObject(request);
						// m_logger.LogInformation("REQUEST POLICY : \n{0}", policy);
						
						PutBucketPolicyResponse response = await client.PutBucketPolicyAsync(bucketName, config.Policy);


						// 결과가 OK인 경우
						if (response.HttpStatusCode == HttpStatusCode.OK)
							result.Result = EnumResponseResult.Success;
						// 결과가 OK가 아닌 경우
						else
						{
							result.Code = ((int) response.HttpStatusCode).ToString();
							result.Message = response.HttpStatusCode.ToString();
						}
					}
					catch (Exception ex)
					{
						NNException.Log(ex);
				
						result.Code = Resource.EC_S3_SUCH_BUCKET_NOT_FOUND;
						result.Message = Resource.EM_S3_SUCH_BUCKET_NOT_FOUND;
					}
				}				
			}
			catch (Exception ex)
			{
				NNException.Log(ex);
		
				result.Code = Resource.EC_COMMON__EXCEPTION;
				result.Message = Resource.EM_COMMON__EXCEPTION;
			}
		
			return result;
		}

		/// <summary>버킷의 정책 설정을 가져온다.</summary>
		/// <param name="serviceUrl">서비스 URL</param>
		/// <param name="accessKey">엑세스 키</param>
		/// <param name="accessSecret">엑세스 시크릿</param>
		/// <param name="bucketName">버킷명</param>
		/// <returns>버킷 정책 설정 정보 객체</returns>
		public async Task<ResponseData<ResponseS3BucketPolicy>> GetBucketPolicy(string serviceUrl, string accessKey, string accessSecret, string bucketName)
		{
			ResponseData<ResponseS3BucketPolicy> result = new ResponseData<ResponseS3BucketPolicy>();

			try
			{
				// S3 클라이언트를 가져온다.
				ResponseData<IAmazonS3> responseClient = this.GetS3Client(serviceUrl, accessKey, accessSecret);

				// S3 클라이언트를 가져오는데 실패한 경우
				if (responseClient.Result != EnumResponseResult.Success)
				{
					result.Code = responseClient.Code;
					result.Message = responseClient.Message;
				}
				// S3 클라이언트를 가져오는데 성공한 경우
				else
				{
					// 버킷의 웹사이트 설정을 가져온다.
					result = await this.GetBucketPolicy(responseClient.Data, bucketName);
				}
			}
			catch (Exception ex)
			{
				NNException.Log(ex);
		
				result.Code = Resource.EC_COMMON__EXCEPTION;
				result.Message = Resource.EM_COMMON__EXCEPTION;
			}
			
			return result;
		}

		/// <summary>버킷의 정책 설정을 저장한다.</summary>
		/// <param name="serviceUrl">서비스 URL</param>
		/// <param name="accessKey">엑세스 키</param>
		/// <param name="accessSecret">엑세스 시크릿</param>
		/// <param name="bucketName">버킷명</param>
		/// <param name="config">Versioning 설정 객체</param>
		/// <returns>저장 결과</returns>
		public async Task<ResponseData> SetBucketPolicy(string serviceUrl, string accessKey, string accessSecret, string bucketName, RequestS3BucketPolicy config)
		{
			ResponseData result = new ResponseData();

			try
			{
				// S3 클라이언트를 가져온다.
				ResponseData<IAmazonS3> responseClient = this.GetS3Client(serviceUrl, accessKey, accessSecret);

				// S3 클라이언트를 가져오는데 실패한 경우
				if (responseClient.Result != EnumResponseResult.Success)
				{
					result.Code = responseClient.Code;
					result.Message = responseClient.Message;
				}
				// S3 클라이언트를 가져오는데 성공한 경우
				else
				{
					// 버킷의 웹사이트 설정을 가져온다.
					result = await this.SetBucketPolicy(responseClient.Data, bucketName, config);
				}
			}
			catch (Exception ex)
			{
				NNException.Log(ex);
		
				result.Code = Resource.EC_COMMON__EXCEPTION;
				result.Message = Resource.EM_COMMON__EXCEPTION;
			}
			
			return result;
		}

		/// <summary>버킷의 ACL 설정을 가져온다.</summary>
		/// <param name="client">S3 클라이언트 객체</param>
		/// <param name="request">ACL 설정 요청 객체</param>
		/// <returns>ACL 설정 정보 객체</returns>
		private async Task<ResponseData<S3AccessControlList>> GetAclConfigEx(IAmazonS3 client, RequestS3AclConfig request)
		{
			ResponseData<S3AccessControlList> result = new ResponseData<S3AccessControlList>();

			try
			{
				// S3 클라이언트가 유효하지 않은 경우
				if (client == null)
				{
					result.Code = Resource.EC_COMMON__INVALID_REQUEST;
					result.Message = Resource.EM_COMMON__INVALID_REQUEST;
				}
				// 요청이 유효하지 않은 경우
				else if (!request.IsValid())
				{
					result.Code = request.GetErrorCode();
					result.Message = request.GetErrorMessage();
				}
				// 요청이 모두 유효한 경우
				else
				{
					// 버킷명과 나머지 경로를 분리한다.
					ResponseS3Bucket.SplitBucket(Path.Combine(request.Path, request.Name), out string bucketName, out string remainPath);

					// 남은 경로가 루트 경로인 경우, 버킷에 대해서 처리한다.
					if (remainPath.IsEmpty() || remainPath == Path.DirectorySeparatorChar.ToString())
					{
						try
						{
							// 버킷의 웹사이트 설정을 가져온다.
							GetACLResponse response = await client.GetACLAsync(bucketName);

							// 설정이 존재하는 경우
							result.Data = response.AccessControlList;

							result.Result = EnumResponseResult.Success;
						}
						catch (Exception ex)
						{
							NNException.Log(ex);
				
							result.Code = Resource.EC_S3_SUCH_BUCKET_NOT_FOUND;
							result.Message = Resource.EM_S3_SUCH_BUCKET_NOT_FOUND;
						}
					}
					// 남은 경로가 루트 경로가 아닌 경우, 객체에 대해서 처리한다.
					else
					{
						// 해당 폴더의 목록을 가져온다.
						ResponseData<ResponseS3Read> responseRead = await this.Read(client, request.Path);
					
						// 목록을 가져오는데 성공한 경우
						if (responseRead.Result == EnumResponseResult.Success)
						{
							// 해당 이름의 객체를 찾는다.
							ResponseS3Object s3Object = responseRead.Data.Files.FirstOrDefault(i => i.Name == request.Name);

							// 해당 이름의 객체가 존재하는 경우
							if (s3Object != null)
							{
								string key = ConvertToS3Path(remainPath, s3Object.IsFile);

								try
								{
									GetACLRequest aclRequest = new GetACLRequest();
									aclRequest.BucketName = bucketName;
									aclRequest.Key = key;
							
									// 버킷의 웹사이트 설정을 가져온다.
									GetACLResponse response = await client.GetACLAsync(aclRequest);

									// 설정이 존재하는 경우
									result.Data = response.AccessControlList;

									result.Result = EnumResponseResult.Success;
								}
								catch (Exception ex)
								{
									NNException.Log(ex);
				
									result.Code = Resource.EC_S3_SUCH_BUCKET_NOT_FOUND;
									result.Message = Resource.EM_S3_SUCH_BUCKET_NOT_FOUND;
								}
							}
						}
					}
				}				
			}
			catch (Exception ex)
			{
				NNException.Log(ex);
		
				result.Code = Resource.EC_COMMON__EXCEPTION;
				result.Message = Resource.EM_COMMON__EXCEPTION;
			}
		
			return result;
		}

		/// <summary>버킷의 ACL 설정을 가져온다.</summary>
		/// <param name="client">S3 클라이언트 객체</param>
		/// <param name="request">ACL 설정 요청 객체</param>
		/// <returns>ACL 설정 정보 객체</returns>
		private async Task<ResponseList<ResponseS3AclConfig>> GetAclConfig(IAmazonS3 client, RequestS3AclConfig request)
		{
			ResponseList<ResponseS3AclConfig> result = new ResponseList<ResponseS3AclConfig>();

			try
			{
				// S3 클라이언트가 유효하지 않은 경우
				if (client == null)
				{
					result.Code = Resource.EC_COMMON__INVALID_REQUEST;
					result.Message = Resource.EM_COMMON__INVALID_REQUEST;
				}
				// 요청이 유효하지 않은 경우
				else if (!request.IsValid())
				{
					result.Code = request.GetErrorCode();
					result.Message = request.GetErrorMessage();
				}
				// 요청이 모두 유효한 경우
				else
				{
					// 버킷명과 나머지 경로를 분리한다.
					ResponseS3Bucket.SplitBucket(Path.Combine(request.Path, request.Name), out string bucketName, out string remainPath);

					// 남은 경로가 루트 경로인 경우, 버킷에 대해서 처리한다.
					if (remainPath.IsEmpty() || remainPath == Path.DirectorySeparatorChar.ToString())
					{
						try
						{
							// 버킷의 웹사이트 설정을 가져온다.
							GetACLResponse response = await client.GetACLAsync(bucketName);

							// 결과가 OK인 경우
							if (response.HttpStatusCode == HttpStatusCode.OK)
							{
								foreach (S3Grant grant in response.AccessControlList.Grants)
								{
									result.Data.Items.Add(new ResponseS3AclConfig()
									{
										Grantee = new ResponseS3Grantee()
										{
											Type = grant.Grantee.Type.Value,
											DisplayName = grant.Grantee.DisplayName,
											EmailAddress = grant.Grantee.EmailAddress,
											CanonicalUser = grant.Grantee.CanonicalUser,
											URI = grant.Grantee.URI,
										},
										Permission = grant.Permission.Value
									});
								}

								result.Data.ResetWithItems();
								result.Result = EnumResponseResult.Success;
							}
							// 결과가 OK가 아닌 경우
							else
							{
								result.Code = ((int) response.HttpStatusCode).ToString();
								result.Message = response.HttpStatusCode.ToString();
							}
						}
						catch (Exception ex)
						{
							NNException.Log(ex);
				
							result.Code = Resource.EC_S3_SUCH_BUCKET_NOT_FOUND;
							result.Message = Resource.EM_S3_SUCH_BUCKET_NOT_FOUND;
						}
					}
					// 남은 경로가 루트 경로가 아닌 경우, 객체에 대해서 처리한다.
					else
					{
						// 해당 폴더의 목록을 가져온다.
						ResponseData<ResponseS3Read> responseRead = await this.Read(client, request.Path);
					
						// 목록을 가져오는데 성공한 경우
						if (responseRead.Result == EnumResponseResult.Success)
						{
							// 해당 이름의 객체를 찾는다.
							ResponseS3Object s3Object = responseRead.Data.Files.FirstOrDefault(i => i.Name == request.Name);

							// 해당 이름의 객체가 존재하는 경우
							if (s3Object != null)
							{
								string key = ConvertToS3Path(remainPath, s3Object.IsFile);

								try
								{
									GetACLRequest aclRequest = new GetACLRequest();
									aclRequest.BucketName = bucketName;
									aclRequest.Key = key;
							
									// 버킷의 웹사이트 설정을 가져온다.
									GetACLResponse response = await client.GetACLAsync(aclRequest);

									// 결과가 OK인 경우
									if (response.HttpStatusCode == HttpStatusCode.OK)
									{
										foreach (S3Grant grant in response.AccessControlList.Grants)
										{
											result.Data.Items.Add(new ResponseS3AclConfig()
											{
												Grantee = new ResponseS3Grantee()
												{
													Type = grant.Grantee.Type.Value,
													DisplayName = grant.Grantee.DisplayName,
													EmailAddress = grant.Grantee.EmailAddress,
													CanonicalUser = grant.Grantee.CanonicalUser,
													URI = grant.Grantee.URI,
												},
												Permission = grant.Permission.Value
											});
										}

										result.Data.ResetWithItems();
										result.Result = EnumResponseResult.Success;
									}
									// 결과가 OK가 아닌 경우
									else
									{
										result.Code = ((int) response.HttpStatusCode).ToString();
										result.Message = response.HttpStatusCode.ToString();
									}
								}
								catch (Exception ex)
								{
									NNException.Log(ex);
				
									result.Code = Resource.EC_S3_SUCH_BUCKET_NOT_FOUND;
									result.Message = Resource.EM_S3_SUCH_BUCKET_NOT_FOUND;
								}
							}
						}
					}
				}				
			}
			catch (Exception ex)
			{
				NNException.Log(ex);
		
				result.Code = Resource.EC_COMMON__EXCEPTION;
				result.Message = Resource.EM_COMMON__EXCEPTION;
			}
		
			return result;
		}

		/// <summary>버킷의 ACL 설정을 가져온다.</summary>
		/// <param name="serviceUrl">서비스 URL</param>
		/// <param name="accessKey">엑세스 키</param>
		/// <param name="accessSecret">엑세스 시크릿</param>
		/// <param name="request">ACL 설정 요청 객체</param>
		/// <returns>웹사이트 룰 목록 객체</returns>
		public async Task<ResponseList<ResponseS3AclConfig>> GetAclConfig(string serviceUrl, string accessKey, string accessSecret, RequestS3AclConfig request)
		{
			ResponseList<ResponseS3AclConfig> result = new ResponseList<ResponseS3AclConfig>();

			try
			{
				// S3 클라이언트를 가져온다.
				ResponseData<IAmazonS3> responseClient = this.GetS3Client(serviceUrl, accessKey, accessSecret);

				// S3 클라이언트를 가져오는데 실패한 경우
				if (responseClient.Result != EnumResponseResult.Success)
				{
					result.Code = responseClient.Code;
					result.Message = responseClient.Message;
				}
				// S3 클라이언트를 가져오는데 성공한 경우
				else
				{
					// 버킷의 웹사이트 설정을 가져온다.
					result = await this.GetAclConfig(responseClient.Data, request);
				}
			}
			catch (Exception ex)
			{
				NNException.Log(ex);
		
				result.Code = Resource.EC_COMMON__EXCEPTION;
				result.Message = Resource.EM_COMMON__EXCEPTION;
			}
			
			return result;
		}

		/// <summary>버킷의 웹사이트 설정을 저장한다.</summary>
		/// <param name="client">S3 클라이언트 객체</param>
		/// <param name="request">ACL 설정 수정 요청 객체</param>
		/// <returns>저장 결과</returns>
		private async Task<ResponseData> SetAclConfig(IAmazonS3 client, RequestS3AclConfigUpdate request)
		{
			ResponseData result = new ResponseData();

			try
			{
				// S3 클라이언트가 유효하지 않은 경우
				if (client == null)
				{
					result.Code = Resource.EC_COMMON__INVALID_REQUEST;
					result.Message = Resource.EM_COMMON__INVALID_REQUEST;
				}
				// 요청이 유효하지 않은 경우
				else if (!request.IsValid())
				{
					result.Code = request.GetErrorCode();
					result.Message = request.GetErrorMessage();
				}
				// 요청이 모두 유효한 경우
				else
				{
					// 기존 ACL 설정을 가져온다.
					ResponseData<S3AccessControlList> responseAcl = await this.GetAclConfigEx(client, request);
					// 기존 ACL 설정을 가져오는데 성공한 경우
					if (responseAcl.Result == EnumResponseResult.Success)
					{
						string key = null;
						
						// 버킷명과 나머지 경로를 분리한다.
						ResponseS3Bucket.SplitBucket(Path.Combine(request.Path, request.Name), out string bucketName, out string remainPath);

						// 남은 경로가 루트 경로가 아닌 경우, 객체에 대해서 처리한다.
						if (!remainPath.IsEmpty() && remainPath != Path.DirectorySeparatorChar.ToString())
						{
							// 해당 폴더의 목록을 가져온다.
							ResponseData<ResponseS3Read> responseRead = await this.Read(client, request.Path);
					
							// 목록을 가져오는데 성공한 경우
							if (responseRead.Result == EnumResponseResult.Success)
							{
								// 해당 이름의 객체를 찾는다.
								ResponseS3Object s3Object = responseRead.Data.Files.FirstOrDefault(i => i.Name == request.Name);

								// 해당 이름의 객체가 존재하는 경우
								if (s3Object != null)
								{
									// 키 값을 가져온다.
									key = ConvertToS3Path(remainPath, s3Object.IsFile);

								}
							}
						}
						
						try
						{
							// 요청 정보 생성
							PutACLRequest putAclRequest = new PutACLRequest();
							putAclRequest.BucketName = bucketName;
							putAclRequest.Key = key;
							putAclRequest.AccessControlList = new S3AccessControlList();
							putAclRequest.AccessControlList.Owner = responseAcl.Data.Owner;
							putAclRequest.AccessControlList.Grants = new List<S3Grant>();
							foreach (RequestS3AclGrant grant in request.Grants)
							{
								S3Grant s3grant = new S3Grant
								{
									Grantee = new S3Grantee()
									{
										DisplayName = grant.Grantee.DisplayName,
										CanonicalUser = grant.Grantee.CanonicalUser,
										// EmailAddress = grant.Grantee.EmailAddress,
										// URI = grant.Grantee.URI,
										
									},
									Permission = new S3Permission(grant.Permission)
								};

								putAclRequest.AccessControlList.Grants.Add(s3grant);
							}
						
							// 버킷의 ACL 설정 결과를 가져온다.
							PutACLResponse response = await client.PutACLAsync(putAclRequest);
							
							// 결과가 OK인 경우
							if (response.HttpStatusCode == HttpStatusCode.OK)
								result.Result = EnumResponseResult.Success;
							// 결과가 OK가 아닌 경우
							else
							{
								result.Code = ((int) response.HttpStatusCode).ToString();
								result.Message = response.HttpStatusCode.ToString();
							}
						}
						catch (Exception ex)
						{
							NNException.Log(ex);
				
							result.Code = Resource.EC_COMMON__EXCEPTION;
							result.Message = Resource.EM_COMMON__EXCEPTION;
						}
					}
					// 기존 ACL 설정을 가져오는데 실패한 경우
					else
					{
						result.Code = responseAcl.Code;
						result.Message = responseAcl.Message;
					}
				}				
			}
			catch (Exception ex)
			{
				NNException.Log(ex);
		
				result.Code = Resource.EC_COMMON__EXCEPTION;
				result.Message = Resource.EM_COMMON__EXCEPTION;
			}
		
			return result;
		}

		/// <summary>버킷의 ACL 설정을 저장한다.</summary>
		/// <param name="serviceUrl">서비스 URL</param>
		/// <param name="accessKey">엑세스 키</param>
		/// <param name="accessSecret">엑세스 시크릿</param>
		/// <param name="request">ACL 설정 수정 요청 객체</param>
		/// <returns>저장 결과</returns>
		public async Task<ResponseData> SetAclConfig(string serviceUrl, string accessKey, string accessSecret, RequestS3AclConfigUpdate request)
		{
			ResponseData result = new ResponseData();

			try
			{
				// S3 클라이언트를 가져온다.
				ResponseData<IAmazonS3> responseClient = this.GetS3Client(serviceUrl, accessKey, accessSecret);

				// S3 클라이언트를 가져오는데 실패한 경우
				if (responseClient.Result != EnumResponseResult.Success)
				{
					result.Code = responseClient.Code;
					result.Message = responseClient.Message;
				}
				// S3 클라이언트를 가져오는데 성공한 경우
				else
				{
					// 버킷의 웹사이트 설정을 가져온다.
					result = await this.SetAclConfig(responseClient.Data, request);
				}
			}
			catch (Exception ex)
			{
				NNException.Log(ex);
		
				result.Code = Resource.EC_COMMON__EXCEPTION;
				result.Message = Resource.EM_COMMON__EXCEPTION;
			}
			
			return result;
		}

		/// <summary>특정 객체의 메타데이터를 가져온다.</summary>
		/// <param name="client">S3 클라이언트 객체</param>
		/// <param name="request">메타데이터 요청 객체</param>
		/// <returns>메타데이터 정보 객체</returns>
		private async Task<ResponseData<GetObjectMetadataResponse>> GetMetadata(IAmazonS3 client, RequestS3OperationMetadata request)
		{
			ResponseData<GetObjectMetadataResponse> result = new ResponseData<GetObjectMetadataResponse>();

			try
			{
				// S3 클라이언트가 유효하지 않은 경우
				if (client == null)
				{
					result.Code = Resource.EC_COMMON__INVALID_REQUEST;
					result.Message = Resource.EM_COMMON__INVALID_REQUEST;
				}
				// 요청이 유효하지 않은 경우
				else if (!request.IsValid())
				{
					result.Code = request.GetErrorCode();
					result.Message = request.GetErrorMessage();
				}
				// 요청이 모두 유효한 경우
				else
				{
					// 해당 폴더의 목록을 가져온다.
					ResponseData<ResponseS3Read> response = await this.Read(client, request.Path);
					
					// 목록을 가져오는데 성공한 경우
					if (response.Result == EnumResponseResult.Success)
					{
						// 해당 이름의 객체를 찾는다.
						ResponseS3Object s3Object = response.Data.Files.FirstOrDefault(i => i.Name == request.Name);
						
						// 해당 이름의 객체가 존재하는 경우
						if (s3Object != null)
						{
							// 버킷명과 나머지 경로를 분리한다.
							ResponseS3Bucket.SplitBucket(Path.Combine(request.Path, request.Name), out string bucketName, out string remainPath);
						
							string key = ConvertToS3Path(remainPath, s3Object.IsFile);
							
							try
							{
								// 메타데이터 정보를 가져온다.
								result.Data = await client.GetObjectMetadataAsync(bucketName, key);
								
								result.Result = EnumResponseResult.Success;
							}
							catch (Exception ex)
							{
								NNException.Log(ex);
				
								result.Code = Resource.EC_S3_TARGET_PATH_NOT_FOUND;
								result.Message = Resource.EM_S3_TARGET_PATH_NOT_FOUND;
							}
						}
						// 해당 이름의 객체가 존재하지 않는 경우
						else
						{
							result.Code = Resource.EC_S3_TARGET_PATH_NOT_FOUND;
							result.Message = Resource.EM_S3_TARGET_PATH_NOT_FOUND;
						}
					}
					// 목록을 가져오는데 실패한 경우
					else
					{
						result.Code = response.Code;
						result.Message = response.Message;
					}
				}				
			}
			catch (Exception ex)
			{
				NNException.Log(ex);
		
				result.Code = Resource.EC_COMMON__EXCEPTION;
				result.Message = Resource.EM_COMMON__EXCEPTION;
			}
		
			return result;
		}

		/// <summary>특정 객체의 메타데이터를 가져온다.</summary>
		/// <param name="serviceUrl">서비스 URL</param>
		/// <param name="accessKey">엑세스 키</param>
		/// <param name="accessSecret">엑세스 시크릿</param>
		/// <param name="request">메타데이터 요청 객체</param>
		/// <returns>메타데이터 정보 객체</returns>
		public async Task<ResponseData<ResponseS3ObjectMetadata>> GetMetadata(string serviceUrl, string accessKey, string accessSecret, RequestS3OperationMetadata request)
		{
			ResponseData<ResponseS3ObjectMetadata> result = new ResponseData<ResponseS3ObjectMetadata>();

			try
			{
				// 요청이 유효하지 않은 경우
				if (!request.IsValid())
					return new ResponseData<ResponseS3ObjectMetadata>(EnumResponseResult.Success, request.GetErrorCode(), request.GetErrorMessage());
				
				// S3 클라이언트를 가져온다.
				ResponseData<IAmazonS3> responseClient = this.GetS3Client(serviceUrl, accessKey, accessSecret);

				// S3 클라이언트를 가져오는데 실패한 경우
				if (responseClient.Result != EnumResponseResult.Success)
				{
					result.Code = responseClient.Code;
					result.Message = responseClient.Message;
				}
				// S3 클라이언트를 가져오는데 성공한 경우
				else
				{
					// 객체의 메타데이터를 가져온다.
					ResponseData<GetObjectMetadataResponse> response = await this.GetMetadata(responseClient.Data, request);

					// 결과가 성공인 경우
					if (response.Result == EnumResponseResult.Success)
					{
						result.Data.ContentLength = response.Data.Headers.ContentLength;
						result.Data.ContentType = response.Data.Headers.ContentType;
						result.Data.CacheControl = response.Data.Headers.CacheControl;
						result.Data.ContentDisposition = response.Data.Headers.ContentDisposition;
						result.Data.ContentEncoding = response.Data.Headers.ContentEncoding;
						result.Data.ExpiresUtc = response.Data.Headers.ExpiresUtc;
						result.Data.ContentMD5 = response.Data.Headers.ContentMD5;
						foreach (string metadataKey in response.Data.Metadata.Keys)
						{
							try
							{
								result.Data.Metadata.Add(new ResponseS3MetadataKeyValue(metadataKey, response.Data.Metadata[metadataKey]));
							}
							catch (Exception e)
							{
								m_logger.LogInformation(e.ToString());
							}
						}

						result.Result = EnumResponseResult.Success;
					}
					else
						result.CopyValueFrom(response);
				}
			}
			catch (Exception ex)
			{
				NNException.Log(ex);

				result.Code = Resource.EC_COMMON__EXCEPTION;
				result.Message = Resource.EM_COMMON__EXCEPTION;
			}
			
			return result;
		}

		/// <summary>특정 객체의 메타데이터를 저장한다.</summary>
		/// <param name="client">S3 클라이언트 객체</param>
		/// <param name="request">메타데이터 수정요청 객체</param>
		/// <returns>저장 결과</returns>
		private async Task<ResponseData> SetMetadata(IAmazonS3 client, RequestS3Metadata request)
		{
			ResponseData result = new ResponseData();
		
			try
			{
				// S3 클라이언트가 유효하지 않은 경우
				if (client == null)
				{
					result.Code = Resource.EC_COMMON__INVALID_REQUEST;
					result.Message = Resource.EM_COMMON__INVALID_REQUEST;
				}
				// 요청이 유효하지 않은 경우
				else if (!request.IsValid())
				{
					result.Code = request.GetErrorCode();
					result.Message = request.GetErrorMessage();
				}
				// 요청이 모두 유효한 경우
				else
				{
					// 해당 폴더의 목록을 가져온다.
					ResponseData<ResponseS3Read> response = await this.Read(client, request.Path);
					
					// 목록을 가져오는데 성공한 경우
					if (response.Result == EnumResponseResult.Success)
					{
						// 해당 이름의 객체를 찾는다.
						ResponseS3Object s3Object = response.Data.Files.FirstOrDefault(i => i.Name == request.Name);
						
						// 해당 이름의 객체가 존재하는 경우
						if (s3Object != null)
						{
							// 버킷명과 나머지 경로를 분리한다.
							ResponseS3Bucket.SplitBucket(Path.Combine(request.Path, request.Name), out string bucketName, out string remainPath);
						
							string key = ConvertToS3Path(remainPath, s3Object.IsFile);
							
							// 해당 오브젝트에 대한 정보를 가져온다.
							GetObjectResponse objectResponse = await client.GetObjectAsync(bucketName, key);
								
							// 해당 오브젝트 정보가 존재하는 경우
							if (objectResponse != null)
							{
								// 복사 요청 객체 생성
								CopyObjectRequest requestCopyObject = new CopyObjectRequest()
								{
									SourceBucket = bucketName,
									SourceKey = key,
									DestinationBucket = bucketName,
									DestinationKey = key,
									MetadataDirective = S3MetadataDirective.REPLACE
								};

								foreach(RequestS3MetadataKeyValue metadata in request.Metadatas)
									requestCopyObject.Metadata.Add(metadata.Key, metadata.Value);

								// 복사
								await client.CopyObjectAsync(requestCopyObject);

								result.Result = EnumResponseResult.Success;
							}
							// 해당 오브젝트 정보가 존재하지 않는 경우
							else
							{
								result.Code = Resource.EC_S3_TARGET_PATH_NOT_FOUND;
								result.Message = Resource.EM_S3_TARGET_PATH_NOT_FOUND;
							}
						}
						// 해당 이름의 객체가 존재하지 않는 경우
						else
						{
							result.Code = Resource.EC_S3_TARGET_PATH_NOT_FOUND;
							result.Message = Resource.EM_S3_TARGET_PATH_NOT_FOUND;
						}
					}
					// 목록을 가져오는데 실패한 경우
					else
					{
						result.Code = response.Code;
						result.Message = response.Message;
					}
				}				
			}
			catch (Exception ex)
			{
				NNException.Log(ex);
		
				result.Code = Resource.EC_COMMON__EXCEPTION;
				result.Message = Resource.EM_COMMON__EXCEPTION;
			}
		
			return result;
		}
		
		/// <summary>특정 객체의 메타데이터를 저장한다.</summary>
		/// <param name="serviceUrl">서비스 URL</param>
		/// <param name="accessKey">엑세스 키</param>
		/// <param name="accessSecret">엑세스 시크릿</param>
		/// <param name="request">메타데이터 수정요청 객체</param>
		/// <returns>저장 결과</returns>
		public async Task<ResponseData> SetMetadata(string serviceUrl, string accessKey, string accessSecret, RequestS3Metadata request)
		{
			ResponseData result = new ResponseData();
		
			try
			{
				// 요청이 유효하지 않은 경우
				if (!request.IsValid())
					return new ResponseData(EnumResponseResult.Error, request.GetErrorCode(), request.GetErrorMessage());
				
				// S3 클라이언트를 가져온다.
				ResponseData<IAmazonS3> responseClient = this.GetS3Client(serviceUrl, accessKey, accessSecret);
		
				// S3 클라이언트를 가져오는데 실패한 경우
				if (responseClient.Result != EnumResponseResult.Success)
				{
					result.Code = responseClient.Code;
					result.Message = responseClient.Message;
				}
				// S3 클라이언트를 가져오는데 성공한 경우
				else
				{
					// 객체의 메타데이터를 저장한다.
					result = await this.SetMetadata(responseClient.Data, request);
				}
			}
			catch (Exception ex)
			{
				NNException.Log(ex);
		
				result.Code = Resource.EC_COMMON__EXCEPTION;
				result.Message = Resource.EM_COMMON__EXCEPTION;
			}
		
			return result;
		}

		/// <summary>특정 객체의 태그를 가져온다.</summary>
		/// <param name="client">S3 클라이언트 객체</param>
		/// <param name="request">태그 요청 객체</param>
		/// <returns>태그 정보 객체</returns>
		private async Task<ResponseList<ResponseS3ObjectTagging>> GetTagging(IAmazonS3 client, RequestS3Tagging request)
		{
			ResponseList<ResponseS3ObjectTagging> result = new ResponseList<ResponseS3ObjectTagging>();

			try
			{
				// S3 클라이언트가 유효하지 않은 경우
				if (client == null)
				{
					result.Code = Resource.EC_COMMON__INVALID_REQUEST;
					result.Message = Resource.EM_COMMON__INVALID_REQUEST;
				}
				// 요청이 유효하지 않은 경우
				else if (!request.IsValid())
				{
					result.Code = request.GetErrorCode();
					result.Message = request.GetErrorMessage();
				}
				// 요청이 모두 유효한 경우
				else
				{
					// 버킷명과 나머지 경로를 분리한다.
					ResponseS3Bucket.SplitBucket(Path.Combine(request.Path, request.Name), out string bucketName, out string remainPath);

					// 남은 경로가 루트 경로인 경우, 버킷에 대해서 처리한다.
					if (remainPath.IsEmpty() || remainPath == Path.DirectorySeparatorChar.ToString())
					{
						try
						{
							// 태그 정보를 가져온다.
							GetBucketTaggingResponse response = await client.GetBucketTaggingAsync(new GetBucketTaggingRequest()
							{
								BucketName = bucketName
							});
							
							// 모든 태그 정보에 대해서 처리
							foreach (Tag tag in response.TagSet)
							{
								result.Data.Items.Add(new ResponseS3ObjectTagging()
								{
									Key = tag.Key,
									Value = tag.Value
								});
							}

							result.Result = EnumResponseResult.Success;
						}
						catch (Exception ex)
						{
							NNException.Log(ex);
				
							result.Code = Resource.EC_S3_TARGET_PATH_NOT_FOUND;
							result.Message = Resource.EM_S3_TARGET_PATH_NOT_FOUND;
						}
					}
					// 남은 경로가 루트 경로가 아닌 경우, 객체에 대해서 처리한다.
					else
					{
						// 해당 폴더의 목록을 가져온다.
						ResponseData<ResponseS3Read> responseRead = await this.Read(client, request.Path);
					
						// 목록을 가져오는데 성공한 경우
						if (responseRead.Result == EnumResponseResult.Success)
						{
							// 해당 이름의 객체를 찾는다.
							ResponseS3Object s3Object = responseRead.Data.Files.FirstOrDefault(i => i.Name == request.Name);
						
							// 해당 이름의 객체가 존재하는 경우
							if (s3Object != null)
							{
								string key = ConvertToS3Path(remainPath, s3Object.IsFile);
							
								try
								{
									// 태그 정보를 가져온다.
									GetObjectTaggingResponse response = await client.GetObjectTaggingAsync(new GetObjectTaggingRequest()
									{
										BucketName = bucketName,
										Key = key
									});

									// 모든 태그 정보에 대해서 처리
									foreach (Tag tag in response.Tagging)
									{
										result.Data.Items.Add(new ResponseS3ObjectTagging()
										{
											Key = tag.Key,
											Value = tag.Value
										});
									}
								
									result.Result = EnumResponseResult.Success;
								}
								catch (Exception ex)
								{
									NNException.Log(ex);
				
									result.Code = Resource.EC_S3_TARGET_PATH_NOT_FOUND;
									result.Message = Resource.EM_S3_TARGET_PATH_NOT_FOUND;
								}
							}
							// 해당 이름의 객체가 존재하지 않는 경우
							else
							{
								result.Code = Resource.EC_S3_TARGET_PATH_NOT_FOUND;
								result.Message = Resource.EM_S3_TARGET_PATH_NOT_FOUND;
							}
						}
						// 목록을 가져오는데 실패한 경우
						else
						{
							result.Code = responseRead.Code;
							result.Message = responseRead.Message;
						}
					}
				}				
			}
			catch (Exception ex)
			{
				NNException.Log(ex);
		
				result.Code = Resource.EC_COMMON__EXCEPTION;
				result.Message = Resource.EM_COMMON__EXCEPTION;
			}
		
			return result;
		}
		
		/// <summary>특정 객체의 태그를 가져온다.</summary>
		/// <param name="serviceUrl">서비스 URL</param>
		/// <param name="accessKey">엑세스 키</param>
		/// <param name="accessSecret">엑세스 시크릿</param>
		/// <param name="request">태그 요청 객체</param>
		/// <returns>태그 목록 객체</returns>
		public async Task<ResponseList<ResponseS3ObjectTagging>> GetTagging(string serviceUrl, string accessKey, string accessSecret, RequestS3Tagging request)
		{
			ResponseList<ResponseS3ObjectTagging> result = new ResponseList<ResponseS3ObjectTagging>();
		
			try
			{
				// 요청이 유효하지 않은 경우
				if (!request.IsValid())
					return new ResponseList<ResponseS3ObjectTagging>(EnumResponseResult.Success, request.GetErrorCode(), request.GetErrorMessage());
				
				// S3 클라이언트를 가져온다.
				ResponseData<IAmazonS3> responseClient = this.GetS3Client(serviceUrl, accessKey, accessSecret);
		
				// S3 클라이언트를 가져오는데 실패한 경우
				if (responseClient.Result != EnumResponseResult.Success)
				{
					result.Code = responseClient.Code;
					result.Message = responseClient.Message;
				}
				// S3 클라이언트를 가져오는데 성공한 경우
				else
				{
					// 객체의 태그를 가져온다.
					result = await this.GetTagging(responseClient.Data, request);
				}
			}
			catch (Exception ex)
			{
				NNException.Log(ex);
		
				result.Code = Resource.EC_COMMON__EXCEPTION;
				result.Message = Resource.EM_COMMON__EXCEPTION;
			}
			
			return result;
		}
		
		/// <summary>특정 객체의 태그를 저장한다.</summary>
		/// <param name="client">S3 클라이언트 객체</param>
		/// <param name="request">태그 수정요청 객체</param>
		/// <returns>저장 결과</returns>
		private async Task<ResponseData> SetTagging(IAmazonS3 client, RequestS3OperationTagging request)
		{
			ResponseData result = new ResponseData();
		
			try
			{
				// S3 클라이언트가 유효하지 않은 경우
				if (client == null)
				{
					result.Code = Resource.EC_COMMON__INVALID_REQUEST;
					result.Message = Resource.EM_COMMON__INVALID_REQUEST;
				}
				// 요청이 유효하지 않은 경우
				else if (!request.IsValid())
				{
					result.Code = request.GetErrorCode();
					result.Message = request.GetErrorMessage();
				}
				// 요청이 모두 유효한 경우
				else
				{
					// 태그 목록이 존재하지 않는 경우, 태그 삭제
					if (request.Tagging == null || request.Tagging.Count == 0)
					{
						result = await this.DeleteTagging(client, request);
					}
					// 태그 목록이 존재하는 경우
					else
					{
						// 버킷명과 나머지 경로를 분리한다.
						ResponseS3Bucket.SplitBucket(Path.Combine(request.Path, request.Name), out string bucketName, out string remainPath);

						// 남은 경로가 루트 경로인 경우, 버킷에 대해서 처리한다.
						if (remainPath.IsEmpty() || remainPath == Path.DirectorySeparatorChar.ToString())
						{
							// 태그를 저장한다.
							List<Tag> tags = new List<Tag>();
							foreach (RequestS3OperationTaggingTag tag in request.Tagging)
							{
								tags.Add(new Tag()
								{
									Key = tag.Key,
									Value = tag.Value
								});
							}
							
							try
							{
								// 버킷의 태그를 수정한다.
								await client.PutBucketTaggingAsync(bucketName, tags);
									
								result.Result = EnumResponseResult.Success;
							}
							catch (Exception ex)
							{
								NNException.Log(ex);
					
								result.Code = Resource.EC_S3_TARGET_PATH_NOT_FOUND;
								result.Message = Resource.EM_S3_TARGET_PATH_NOT_FOUND;
							}
						}
						// 남은 경로가 루트 경로가 아닌 경우, 객체에 대해서 처리한다.
						else
						{
							// 해당 폴더의 목록을 가져온다.
							ResponseData<ResponseS3Read> response = await this.Read(client, request.Path);
						
							// 목록을 가져오는데 성공한 경우
							if (response.Result == EnumResponseResult.Success)
							{
								// 해당 이름의 객체를 찾는다.
								ResponseS3Object s3Object = response.Data.Files.FirstOrDefault(i => i.Name == request.Name);
							
								// 해당 이름의 객체가 존재하는 경우
								if (s3Object != null)
								{
									// 키를 가져온다.
									string key = ConvertToS3Path(remainPath, s3Object.IsFile);
								
									// 태그를 저장한다.
									Tagging tagging = new Tagging();
									foreach (RequestS3OperationTaggingTag tag in request.Tagging)
									{
										tagging.TagSet.Add(new Tag()
										{
											Key = tag.Key,
											Value = tag.Value
										});
									}
							
									try
									{
										// 태그 정보를 수정한다.
										await client.PutObjectTaggingAsync(new PutObjectTaggingRequest()
										{
											BucketName = bucketName,
											Key = key,
											Tagging = tagging
										});
									
										result.Result = EnumResponseResult.Success;
									}
									catch (Exception ex)
									{
										NNException.Log(ex);
					
										result.Code = Resource.EC_S3_TARGET_PATH_NOT_FOUND;
										result.Message = Resource.EM_S3_TARGET_PATH_NOT_FOUND;
									}
								}
								// 해당 이름의 객체가 존재하지 않는 경우
								else
								{
									result.Code = Resource.EC_S3_TARGET_PATH_NOT_FOUND;
									result.Message = Resource.EM_S3_TARGET_PATH_NOT_FOUND;
								}
							}
							// 목록을 가져오는데 실패한 경우
							else
							{
								result.Code = response.Code;
								result.Message = response.Message;
							}
						}
					}
				}				
			}
			catch (Exception ex)
			{
				NNException.Log(ex);
		
				result.Code = Resource.EC_COMMON__EXCEPTION;
				result.Message = Resource.EM_COMMON__EXCEPTION;
			}
		
			return result;
		}
		
		/// <summary>특정 객체의 태그를 저장한다.</summary>
		/// <param name="serviceUrl">서비스 URL</param>
		/// <param name="accessKey">엑세스 키</param>
		/// <param name="accessSecret">엑세스 시크릿</param>
		/// <param name="request">태그 수정요청 객체</param>
		/// <returns>저장 결과</returns>
		public async Task<ResponseData> SetTagging(string serviceUrl, string accessKey, string accessSecret, RequestS3OperationTagging request)
		{
			ResponseData result = new ResponseData();
		
			try
			{
				// 요청이 유효하지 않은 경우
				if (!request.IsValid())
					return new ResponseData(EnumResponseResult.Error, request.GetErrorCode(), request.GetErrorMessage());
				
				// S3 클라이언트를 가져온다.
				ResponseData<IAmazonS3> responseClient = this.GetS3Client(serviceUrl, accessKey, accessSecret);
		
				// S3 클라이언트를 가져오는데 실패한 경우
				if (responseClient.Result != EnumResponseResult.Success)
				{
					result.Code = responseClient.Code;
					result.Message = responseClient.Message;
				}
				// S3 클라이언트를 가져오는데 성공한 경우
				else
				{
					// 객체의 태그를 저장한다.
					result = await this.SetTagging(responseClient.Data, request);
				}
			}
			catch (Exception ex)
			{
				NNException.Log(ex);
		
				result.Code = Resource.EC_COMMON__EXCEPTION;
				result.Message = Resource.EM_COMMON__EXCEPTION;
			}
		
			return result;
		}
		
		/// <summary>특정 객체의 태그를 삭제한다.</summary>
		/// <param name="client">S3 클라이언트 객체</param>
		/// <param name="request">태그 삭제요청 객체</param>
		/// <returns>저장 결과</returns>
		private async Task<ResponseData> DeleteTagging(IAmazonS3 client, RequestS3Tagging request)
		{
			ResponseData result = new ResponseData();
		
			try
			{
				// S3 클라이언트가 유효하지 않은 경우
				if (client == null)
				{
					result.Code = Resource.EC_COMMON__INVALID_REQUEST;
					result.Message = Resource.EM_COMMON__INVALID_REQUEST;
				}
				// 요청이 유효하지 않은 경우
				else if (!request.IsValid())
				{
					result.Code = request.GetErrorCode();
					result.Message = request.GetErrorMessage();
				}
				// 요청이 모두 유효한 경우
				else
				{
					// 버킷명과 나머지 경로를 분리한다.
					ResponseS3Bucket.SplitBucket(Path.Combine(request.Path, request.Name), out string bucketName, out string remainPath);

					// 남은 경로가 루트 경로인 경우, 버킷에 대해서 처리한다.
					if (remainPath.IsEmpty() || remainPath == Path.DirectorySeparatorChar.ToString())
					{
						try
						{
							// 버킷의 태그를 삭제한다.
							await client.DeleteBucketTaggingAsync(bucketName);
								
							result.Result = EnumResponseResult.Success;
						}
						catch (Exception ex)
						{
							NNException.Log(ex);
				
							result.Code = Resource.EC_S3_TARGET_PATH_NOT_FOUND;
							result.Message = Resource.EM_S3_TARGET_PATH_NOT_FOUND;
						}
					}
					// 남은 경로가 루트 경로가 아닌 경우, 객체에 대해서 처리한다.
					else
					{
						// 해당 폴더의 목록을 가져온다.
						ResponseData<ResponseS3Read> response = await this.Read(client, request.Path);
					
						// 목록을 가져오는데 성공한 경우
						if (response.Result == EnumResponseResult.Success)
						{
							// 해당 이름의 객체를 찾는다.
							ResponseS3Object s3Object = response.Data.Files.FirstOrDefault(i => i.Name == request.Name);
						
							// 해당 이름의 객체가 존재하는 경우
							if (s3Object != null)
							{
								// 키를 가져온다.
								string key = ConvertToS3Path(remainPath, s3Object.IsFile);
						
								try
								{
									// 태그 정보를 삭제한다.
									await client.DeleteObjectTaggingAsync(new DeleteObjectTaggingRequest()
									{
										BucketName = bucketName,
										Key = key
									});
							
									result.Result = EnumResponseResult.Success;
								}
								catch (Exception ex)
								{
									NNException.Log(ex);
				
									result.Code = Resource.EC_S3_TARGET_PATH_NOT_FOUND;
									result.Message = Resource.EM_S3_TARGET_PATH_NOT_FOUND;
								}
							}
							// 해당 이름의 객체가 존재하지 않는 경우
							else
							{
								result.Code = Resource.EC_S3_TARGET_PATH_NOT_FOUND;
								result.Message = Resource.EM_S3_TARGET_PATH_NOT_FOUND;
							}
						}
						// 목록을 가져오는데 실패한 경우
						else
						{
							result.Code = response.Code;
							result.Message = response.Message;
						}
					}
				}				
			}
			catch (Exception ex)
			{
				NNException.Log(ex);
		
				result.Code = Resource.EC_COMMON__EXCEPTION;
				result.Message = Resource.EM_COMMON__EXCEPTION;
			}
		
			return result;
		}

		/// <summary>특정 버킷의 라이프사이클 설정을 가져온다.</summary>
		/// <param name="client">S3 클라이언트 객체</param>
		/// <param name="bucketName">버킷명</param>
		/// <returns>라이프사이클 설정 정보 객체</returns>
		private async Task<ResponseData<GetLifecycleConfigurationResponse>> GetLifeCycle(IAmazonS3 client, string bucketName)
		{
			ResponseData<GetLifecycleConfigurationResponse> result = new ResponseData<GetLifecycleConfigurationResponse>();

			try
			{
				// S3 클라이언트가 유효하지 않은 경우
				if (client == null || bucketName.IsEmpty())
				{
					result.Code = Resource.EC_COMMON__INVALID_REQUEST;
					result.Message = Resource.EM_COMMON__INVALID_REQUEST;
				}
				// 요청이 모두 유효한 경우
				else
				{
					try
					{
						// 라이프사이클 설정을 가져온다.
						result.Data = await client.GetLifecycleConfigurationAsync(bucketName);

						result.Result = EnumResponseResult.Success;
					}
					catch (Exception ex)
					{
						NNException.Log(ex);
				
						result.Code = Resource.EC_S3_TARGET_PATH_NOT_FOUND;
						result.Message = Resource.EM_S3_TARGET_PATH_NOT_FOUND;
					}
				}				
			}
			catch (Exception ex)
			{
				NNException.Log(ex);
		
				result.Code = Resource.EC_COMMON__EXCEPTION;
				result.Message = Resource.EM_COMMON__EXCEPTION;
			}
		
			return result;
		}
	
		/// <summary>특정 버킷의 라이프사이클 설정을 가져온다.</summary>
		/// <param name="serviceUrl">서비스 URL</param>
		/// <param name="accessKey">엑세스 키</param>
		/// <param name="accessSecret">엑세스 시크릿</param>
		/// <param name="bucketName">버킷명</param>
		/// <returns>라이프사이클 설정 정보 객체</returns>
		public async Task<ResponseList<ResponseS3LifeCycleRule>> GetLifeCycle(string serviceUrl, string accessKey, string accessSecret, string bucketName)
		{
			ResponseList<ResponseS3LifeCycleRule> result = new ResponseList<ResponseS3LifeCycleRule>();
		
			try
			{
				// S3 클라이언트를 가져온다.
				ResponseData<IAmazonS3> responseClient = this.GetS3Client(serviceUrl, accessKey, accessSecret);
		
				// S3 클라이언트를 가져오는데 실패한 경우
				if (responseClient.Result != EnumResponseResult.Success)
				{
					result.Code = responseClient.Code;
					result.Message = responseClient.Message;
				}
				// S3 클라이언트를 가져오는데 성공한 경우
				else
				{
					// 객체의 태그를 가져온다.
					ResponseData<GetLifecycleConfigurationResponse> response = await this.GetLifeCycle(responseClient.Data, bucketName);
		
					// 결과가 성공인 경우
					if (response.Result == EnumResponseResult.Success)
					{
						// 모든 정책에 대해서 처리
						foreach (LifecycleRule rule in response.Data.Configuration.Rules)
						{
							ResponseS3LifeCycleRule responseRule = new ResponseS3LifeCycleRule()
							{
								Id = rule.Id,
								Expiration = new ResponseS3LifeCycleRuleExpiration()
							};
							if (rule.Filter?.LifecycleFilterPredicate is LifecyclePrefixPredicate)
								responseRule.Prefix = ((LifecyclePrefixPredicate) rule.Filter.LifecycleFilterPredicate).Prefix;
							responseRule.Expiration.Date = rule.Expiration.DateUtc.Year == DateTime.MinValue.Year ? null : (DateTime?) rule.Expiration.DateUtc;
							responseRule.Expiration.DateUtc = rule.Expiration.DateUtc.Year == DateTime.MinValue.Year ? null : (DateTime?) rule.Expiration.DateUtc;
							responseRule.Expiration.Days = rule.Expiration.Days;
							result.Data.Items.Add(responseRule);
						}
		
						result.Result = EnumResponseResult.Success;
					}
					else
						result.CopyValueFrom(response);
				}
			}
			catch (Exception ex)
			{
				NNException.Log(ex);
		
				result.Code = Resource.EC_COMMON__EXCEPTION;
				result.Message = Resource.EM_COMMON__EXCEPTION;
			}
			
			return result;
		}
		
		/// <summary>특정 버킷의 라이프사이클 설정를 저장한다.</summary>
		/// <param name="client">S3 클라이언트 객체</param>
		/// <param name="bucketName">버킷명</param>
		/// <param name="request">라이프사이클 등록 요청 객체</param>
		/// <returns>저장 결과</returns>
		private async Task<ResponseData> SetLifeCycle(IAmazonS3 client, string bucketName, RequestS3LifeCycle request)
		{
			ResponseData result = new ResponseData();
		
			try
			{
				// S3 클라이언트가 유효하지 않은 경우
				if (client == null || bucketName.IsEmpty())
				{
					result.Code = Resource.EC_COMMON__INVALID_REQUEST;
					result.Message = Resource.EM_COMMON__INVALID_REQUEST;
				}
				// 요청이 유효하지 않은 경우
				else if (!request.IsValid())
				{
					result.Code = request.GetErrorCode();
					result.Message = request.GetErrorMessage();
				}
				// 요청이 모두 유효한 경우
				else
				{
					// 정책이 존재하지 않는 경우, 라이프사이클 삭제
					if (request.Rules == null || request.Rules.Count == 0)
					{
						result = await this.DeleteLifeCycle(client, bucketName);
					}
					// 정책이 존재하는 경우
					else
					{
						// 설정 정보 생성
						LifecycleConfiguration configuration = new LifecycleConfiguration()
						{
							Rules = new List<LifecycleRule>()
						};
							
						// 모든 요청 정책 정보에 대해서 처리
						foreach (RequestS3LifeCycleRule rule in request.Rules)
						{
							LifecycleRule lifecycleRule = new LifecycleRule();
							lifecycleRule.Id = rule.Id;
							lifecycleRule.Expiration = new LifecycleRuleExpiration();
							lifecycleRule.Expiration.CopyValueFrom(rule.Expiration);
							if (!rule.Prefix.IsEmpty())
							{
								lifecycleRule.Filter = new LifecycleFilter()
								{
									LifecycleFilterPredicate = new LifecyclePrefixPredicate()
									{
										Prefix = rule.Prefix,
										
									}
								};
							} 
							lifecycleRule.Status = rule.Enable ? LifecycleRuleStatus.Enabled : LifecycleRuleStatus.Disabled;

							// 정책 추가
							configuration.Rules.Add(lifecycleRule);
						}

						try
						{
							// 라이프사이클 설정 수정
							await client.PutLifecycleConfigurationAsync(new PutLifecycleConfigurationRequest()
							{
								BucketName = bucketName,
								Configuration = configuration
							});
									
							result.Result = EnumResponseResult.Success;
						}
						catch (Exception ex)
						{
							NNException.Log(ex);
					
							result.Code = Resource.EC_S3_TARGET_PATH_NOT_FOUND;
							result.Message = Resource.EM_S3_TARGET_PATH_NOT_FOUND;
						}
					}
					
				}				
			}
			catch (Exception ex)
			{
				NNException.Log(ex);
		
				result.Code = Resource.EC_COMMON__EXCEPTION;
				result.Message = Resource.EM_COMMON__EXCEPTION;
			}
		
			return result;
		}
	
		/// <summary>특정 버킷의 라이프사이클 설정를 저장한다.</summary>
		/// <param name="serviceUrl">서비스 URL</param>
		/// <param name="accessKey">엑세스 키</param>
		/// <param name="accessSecret">엑세스 시크릿</param>
		/// <param name="bucketName">버킷명</param>
		/// <param name="request">라이프사이클 등록 요청 객체</param>
		/// <returns>라이프사이클 설정 정보 객체</returns>
		public async Task<ResponseData> SetLifeCycle(string serviceUrl, string accessKey, string accessSecret, string bucketName, RequestS3LifeCycle request)
		{
			ResponseData result = new ResponseData();
		
			try
			{
				// S3 클라이언트를 가져온다.
				ResponseData<IAmazonS3> responseClient = this.GetS3Client(serviceUrl, accessKey, accessSecret);
		
				// S3 클라이언트를 가져오는데 실패한 경우
				if (responseClient.Result != EnumResponseResult.Success)
				{
					result.Code = responseClient.Code;
					result.Message = responseClient.Message;
				}
				// S3 클라이언트를 가져오는데 성공한 경우
				else
				{
					// 객체의 태그를 저장온다.
					result = await this.SetLifeCycle(responseClient.Data, bucketName, request);
				}
			}
			catch (Exception ex)
			{
				NNException.Log(ex);
		
				result.Code = Resource.EC_COMMON__EXCEPTION;
				result.Message = Resource.EM_COMMON__EXCEPTION;
			}
			
			return result;
		}
		
		/// <summary>특정 버킷의 라이프사이클 설정를 저장한다.</summary>
		/// <param name="client">S3 클라이언트 객체</param>
		/// <param name="bucketName">버킷명</param>
		/// <returns>저장 결과</returns>
		private async Task<ResponseData> DeleteLifeCycle(IAmazonS3 client, string bucketName)
		{
			ResponseData result = new ResponseData();
		
			try
			{
				// S3 클라이언트가 유효하지 않은 경우
				if (client == null || bucketName.IsEmpty())
				{
					result.Code = Resource.EC_COMMON__INVALID_REQUEST;
					result.Message = Resource.EM_COMMON__INVALID_REQUEST;
				}
				// 요청이 모두 유효한 경우
				else
				{
					try
					{
						// 라이프사이클 설정 삭제
						await client.DeleteLifecycleConfigurationAsync(bucketName);
								
						result.Result = EnumResponseResult.Success;
					}
					catch (Exception ex)
					{
						NNException.Log(ex);
				
						result.Code = Resource.EC_S3_TARGET_PATH_NOT_FOUND;
						result.Message = Resource.EM_S3_TARGET_PATH_NOT_FOUND;
					}
				}				
			}
			catch (Exception ex)
			{
				NNException.Log(ex);
		
				result.Code = Resource.EC_COMMON__EXCEPTION;
				result.Message = Resource.EM_COMMON__EXCEPTION;
			}
		
			return result;
		}

		/// <summary>특정 객체의 공유 URL를 가져온다.</summary>
		/// <param name="client">S3 클라이언트 객체</param>
		/// <param name="request">공유 URL 요청 객체</param>
		/// <returns>공유 URL 정보 객체</returns>
		private async Task<ResponseData<string>> GetShareUrl(IAmazonS3 client, RequestS3OperationShareUrl request)
		{
			ResponseData<string> result = new ResponseData<string>();

			try
			{
				// S3 클라이언트가 유효하지 않은 경우
				if (client == null)
				{
					result.Code = Resource.EC_COMMON__INVALID_REQUEST;
					result.Message = Resource.EM_COMMON__INVALID_REQUEST;
				}
				// 요청이 유효하지 않은 경우
				else if (!request.IsValid())
				{
					result.Code = request.GetErrorCode();
					result.Message = request.GetErrorMessage();
				}
				// 요청이 모두 유효한 경우
				else
				{
					// 해당 폴더의 목록을 가져온다.
					ResponseData<ResponseS3Read> response = await this.Read(client, request.Path);
					
					// 목록을 가져오는데 성공한 경우
					if (response.Result == EnumResponseResult.Success)
					{
						// 해당 이름의 객체를 찾는다.
						ResponseS3Object s3Object = response.Data.Files.FirstOrDefault(i => i.Name == request.Name);
						
						// 해당 이름의 객체가 존재하는 경우
						if (s3Object != null)
						{
							// 파일이 아닌 경우
							if (!s3Object.IsFile)
								return new ResponseData<string>(EnumResponseResult.Error, Resource.EC_S3_FOLDER_CANNOT_SHARED, Resource.EM_S3_FOLDER_CANNOT_SHARED);
							
							// 버킷명과 나머지 경로를 분리한다.
							ResponseS3Bucket.SplitBucket(Path.Combine(request.Path, request.Name), out string bucketName, out string remainPath);

							// 키를 분리한다.
							string key = ConvertToS3Path(remainPath, s3Object.IsFile);
							
							try
							{
								// 공유 URL 정보를 가져온다.
								result.Data = client.GetPreSignedURL(new GetPreSignedUrlRequest()
								{
									BucketName = bucketName,
									Key = key,
									Expires = request.Expiration
								});
								
								result.Result = EnumResponseResult.Success;
							}
							catch (Exception ex)
							{
								NNException.Log(ex);
				
								result.Code = Resource.EC_S3_TARGET_PATH_NOT_FOUND;
								result.Message = Resource.EM_S3_TARGET_PATH_NOT_FOUND;
							}
						}
						// 해당 이름의 객체가 존재하지 않는 경우
						else
						{
							result.Code = Resource.EC_S3_TARGET_PATH_NOT_FOUND;
							result.Message = Resource.EM_S3_TARGET_PATH_NOT_FOUND;
						}
					}
					// 목록을 가져오는데 실패한 경우
					else
					{
						result.Code = response.Code;
						result.Message = response.Message;
					}
				}				
			}
			catch (Exception ex)
			{
				NNException.Log(ex);
		
				result.Code = Resource.EC_COMMON__EXCEPTION;
				result.Message = Resource.EM_COMMON__EXCEPTION;
			}
		
			return result;
		}

		/// <summary>특정 객체의 공유 URL를 가져온다.</summary>
		/// <param name="serviceUrl">서비스 URL</param>
		/// <param name="accessKey">엑세스 키</param>
		/// <param name="accessSecret">엑세스 시크릿</param>
		/// <param name="request">공유 URL 요청 객체</param>
		/// <returns>공유 URL 정보 객체</returns>
		public async Task<ResponseData<string>> GetShareUrl(string serviceUrl, string accessKey, string accessSecret, RequestS3OperationShareUrl request)
		{
			ResponseData<string> result = new ResponseData<string>();

			try
			{
				// 요청이 유효하지 않은 경우
				if (!request.IsValid())
					return new ResponseData<string>(EnumResponseResult.Success, request.GetErrorCode(), request.GetErrorMessage());
				
				// S3 클라이언트를 가져온다.
				ResponseData<IAmazonS3> responseClient = this.GetS3Client(serviceUrl, accessKey, accessSecret);

				// S3 클라이언트를 가져오는데 실패한 경우
				if (responseClient.Result != EnumResponseResult.Success)
				{
					result.Code = responseClient.Code;
					result.Message = responseClient.Message;
				}
				// S3 클라이언트를 가져오는데 성공한 경우
				else
				{
					// 객체의 공유 URL 정보를 가져온다.
					result = await this.GetShareUrl(responseClient.Data, request);
				}
			}
			catch (Exception ex)
			{
				NNException.Log(ex);

				result.Code = Resource.EC_COMMON__EXCEPTION;
				result.Message = Resource.EM_COMMON__EXCEPTION;
			}
			
			return result;
		}
    }
}