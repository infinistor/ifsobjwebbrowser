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
using System.Net;
using System.Threading.Tasks;
using Amazon.S3.Model;
using CSSPData;
using CSSPData.Request.S3;
using CSSPData.Response.S3;
using CSSPProviderInterfaces;
using CSSPResources;
using Microsoft.AspNetCore.Cors;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using MTLib.CommonData;
using MTLib.Core;
using Newtonsoft.Json;
using Newtonsoft.Json.Linq;
using Swashbuckle.AspNetCore.Annotations;

namespace WebApi.Controllers.S3
{
    /// <summary>S3 관련 컨트롤러</summary>
    [EnableCors("CorsPolicy")]
	[Produces("application/json")]
	[Route("api/v1/[controller]")]
	public class S3Controller : BaseController
	{
		/// <summary>데이터 프로바이더</summary>
		private readonly IS3Provider m_provider;

		/// <summary>생성자</summary>
		/// <param name="logger">로거</param>
		/// <param name="provider">데이터 프로바이더</param>
		public S3Controller(
			ILogger<S3Controller> logger,
			IS3Provider provider
		)
			: base(logger)
		{
			m_provider = provider;
		}
		
		/// <summary>모든 버킷 목록을 가져온다.</summary>
		/// <param name="serviceUrl">서비스 URL</param>
		/// <param name="accessKey">엑세스 키</param>
		/// <param name="accessSecret">엑세스 시크릿</param>
		/// <returns>결과 JSON 문자열</returns>
		[SwaggerResponse((int)HttpStatusCode.OK, null, typeof(ResponseList<ResponseS3Bucket>))]
		[HttpGet("Buckets")]
		public async Task<ActionResult> GetBuckets(
			[FromHeader(Name = "S3-Service-Url")] string serviceUrl
			, [FromHeader(Name = "S3-Access-Key")] string accessKey
			, [FromHeader(Name = "S3-Access-Secret")] string accessSecret)
		{
			return Json(await m_provider.GetBuckets(serviceUrl, accessKey, accessSecret));
		}

		/// <summary>S3 읽기 동작 요청</summary>
		/// <param name="serviceUrl">서비스 URL</param>
		/// <param name="accessKey">엑세스 키</param>
		/// <param name="accessSecret">엑세스 시크릿</param>
		/// <param name="request">동작 요청 객체</param>
		/// <returns>결과 JSON 문자열</returns>
		[SwaggerResponse((int)HttpStatusCode.OK, null, typeof(ResponseS3))]
		[HttpPost("Operations")]
		public async Task<ActionResult> Operations(
			[FromHeader(Name="s3-service-url")] string serviceUrl, [FromHeader(Name="s3-access-key")] string accessKey, [FromHeader(Name="s3-access-secret")] string accessSecret,
			[FromBody] JObject request)
		{
			ResponseS3 result = new ResponseS3() { IsNeedLogin = false, Error = new ResponseS3Error() { Code = Resource.EC_COMMON__INVALID_REQUEST, Message = Resource.EM_COMMON__INVALID_REQUEST } };

			try
			{
					RequestS3OperationBase operationBase = null;
					try
					{
						if (request != null)
							operationBase = request.ToObject<RequestS3OperationBase>();
					}
					catch (Exception /*ex*/)
					{
						operationBase = null;
					}

					// 요청이 유효한 경우
					if (operationBase != null)
					{
						switch (operationBase.Action)
						{
							case "read":
							{
								// 객체 변환
								RequestS3OperationRead operation = request.ToObject<RequestS3OperationRead>();

								// 해당 경로의 객체를 읽어온다.
								if (operation != null)
								{
									ResponseData<ResponseS3Read> response = await m_provider.Read(
										serviceUrl, accessKey, accessSecret,
										operation.Path
									);

									// 결과가 성공인 경우
									if (response.Result == EnumResponseResult.Success)
										result = response.Data;
									// 결과가 실패인 경우
									else
									{
										result.Error.Code = response.Code;
										result.Error.Message = response.Message;
									}
								}
							}
								break;
							case "create":
							{
								// 객체 변환
								RequestS3OperationCreate operation = request.ToObject<RequestS3OperationCreate>();

								// 해당 경로에 폴더를 생성한다.
								if (operation != null)
								{
									ResponseData<ResponseS3Create> response = await m_provider.Create(
										serviceUrl, accessKey, accessSecret,
										operation.Path, operation.FolderName
									);

									// 결과가 성공인 경우
									if (response.Result == EnumResponseResult.Success)
										result = response.Data;
									// 결과가 실패인 경우
									else
									{
										result.Error.Code = response.Code;
										result.Error.Message = response.Message;
									}
								}
							}
								break;
							case "delete":
							{
								// 객체 변환
								RequestS3OperationDelete operation = request.ToObject<RequestS3OperationDelete>();

								// 해당 경로에서 지정된 폴더 및 파일을 삭제한다.
								if (operation != null)
								{
									ResponseData<ResponseS3Delete> response = await m_provider.Delete(
										serviceUrl, accessKey, accessSecret,
										operation.Path, operation.Names
									);

									// 결과가 성공인 경우
									if (response.Result == EnumResponseResult.Success)
										result = response.Data;
									// 결과가 실패인 경우
									else
									{
										result.Error.Code = response.Code;
										result.Error.Message = response.Message;
									}
								}
							}
								break;
							case "copy":
							{
								// 객체 변환
								RequestS3OperationCopy operation = request.ToObject<RequestS3OperationCopy>();
								if (operation != null)
								{
									this.m_logger.LogInformation("OPERATION : {0}", operation.ToString());

									// 해당 경로에서 지정된 폴더 및 파일을 복사한다.
									ResponseData<ResponseS3Copy> response = await m_provider.Copy(
										serviceUrl, accessKey, accessSecret,
										operation.Path, operation.Current, operation.TargetPath, operation.Names
									);

									// 결과가 성공인 경우
									if (response.Result == EnumResponseResult.Success)
										result = response.Data;
									// 결과가 실패인 경우
									else
									{
										result.Error.Code = response.Code;
										result.Error.Message = response.Message;
									}
								}
							}
								break;
							case "move":
							{
								// 객체 변환
								RequestS3OperationMove operation = request.ToObject<RequestS3OperationMove>();
								if (operation != null)
								{
									this.m_logger.LogInformation("OPERATION : {0}", operation.ToString());

									// 해당 경로에서 지정된 폴더 및 파일을 이동한다.
									ResponseData<ResponseS3Move> response = await m_provider.Move(
										serviceUrl, accessKey, accessSecret,
										operation.Path, operation.Current, operation.TargetPath, operation.Names
									);

									// 결과가 성공인 경우
									if (response.Result == EnumResponseResult.Success)
										result = response.Data;
									// 결과가 실패인 경우
									else
									{
										result.Error.Code = response.Code;
										result.Error.Message = response.Message;
									}
								}
							}
								break;
							case "rename":
							{
								// 객체 변환
								RequestS3OperationRename operation = request.ToObject<RequestS3OperationRename>();
								if (operation != null)
								{
									this.m_logger.LogInformation("OPERATION : {0}", operation.ToString());

									// 해당 경로에서 지정된 폴더 및 파일의 이름을 변경한다.
									ResponseData<ResponseS3Rename> response = await m_provider.Rename(
										serviceUrl, accessKey, accessSecret,
										operation.Path, operation.Current[0], operation.NewName
									);

									// 결과가 성공인 경우
									if (response.Result == EnumResponseResult.Success)
										result = response.Data;
									// 결과가 실패인 경우
									else
									{
										result.Error.Code = response.Code;
										result.Error.Message = response.Message;
									}
								}
							}
								break;
							case "search":
							{
								// 객체 변환
								RequestS3OperationSearch operation = request.ToObject<RequestS3OperationSearch>();
								if (operation != null)
								{
									this.m_logger.LogInformation("OPERATION : {0}", operation.ToString());

									// 해당 경로에서 폴더 및 파일의 이름을 검색한다.
									ResponseData<ResponseS3Search> response = await m_provider.Search(
										serviceUrl, accessKey, accessSecret,
										operation.Path, operation.SearchString, operation.CaseSensitive
									);

									// 결과가 성공인 경우
									if (response.Result == EnumResponseResult.Success)
										result = response.Data;
									// 결과가 실패인 경우
									else
									{
										result.Error.Code = response.Code;
										result.Error.Message = response.Message;
									}
								}
							}
								break;
							case "details":
							{
								// 객체 변환
								RequestS3OperationDetails operation = request.ToObject<RequestS3OperationDetails>();
								if (operation != null)
								{
									this.m_logger.LogInformation("OPERATION : {0}", operation.ToString());

									// 상세 정보를 가져온다.
									ResponseData<ResponseS3Details> response = await m_provider.GetDetails(
										serviceUrl, accessKey, accessSecret,
										operation.Path, operation.Names
									);

									// 결과가 성공인 경우
									if (response.Result == EnumResponseResult.Success)
										result = response.Data;
									// 결과가 실패인 경우
									else
									{
										result.Error.Code = response.Code;
										result.Error.Message = response.Message;
									}
								}
							}
								break;
						}
					}
			}
			catch (Exception ex)
			{
				NNException.Log(ex);

				result.Error.Code = Resource.EC_COMMON__EXCEPTION;
				result.Error.Message = Resource.EM_COMMON__EXCEPTION;
			}

			return Json(result);
		}

		/// <summary>S3 업로드 요청</summary>
		/// <param name="serviceUrl">서비스 URL</param>
		/// <param name="accessKey">엑세스 키</param>
		/// <param name="accessSecret">엑세스 시크릿</param>
		/// <param name="action">명령 문자열</param>
		/// <param name="uploadFiles">업로드 파일 목록 객체</param>
		/// <param name="path">저장할 경로</param>
		/// <returns>결과 JSON 문자열</returns>
		[SwaggerResponse((int) HttpStatusCode.OK, null, typeof(ResponseS3Create))]
		[HttpPost("Upload")]
		public async Task<ActionResult> Upload(
			[FromHeader(Name="s3-service-url")] string serviceUrl, [FromHeader(Name="s3-access-key")] string accessKey, [FromHeader(Name="s3-access-secret")] string accessSecret,
			string action, IList<IFormFile> uploadFiles, string path
		)
		{
			ResponseS3Create result = new ResponseS3Create() { IsNeedLogin = false, Error = new ResponseS3Error() { Code = Resource.EC_COMMON__INVALID_REQUEST, Message = Resource.EM_COMMON__INVALID_REQUEST } };
			
			try
			{
				// 업로드
				ResponseData<ResponseS3Create> response = await m_provider.Upload(
					serviceUrl, accessKey, accessSecret,
					action, uploadFiles, path
				);
				
				// 결과가 성공인 경우
				if (response.Result == EnumResponseResult.Success)
					result = response.Data;
				// 결과가 실패인 경우
				else
				{
					result.Error.Code = response.Code;
					result.Error.Message = response.Message;
				}
			}
			catch (Exception ex)
			{
				NNException.Log(ex);
		
				result.Error.Code = Resource.EC_COMMON__EXCEPTION;
				result.Error.Message = Resource.EM_COMMON__EXCEPTION;
			}
			
			return Content("");
		}

		/// <summary>파일을 다운로드 한다.</summary>
		/// <param name="downloadInput">다운로드 요청 문자열</param>
		/// <returns>다운로드 스트림</returns>
		[HttpPost("Download")]
		public async Task<IActionResult> Download(string downloadInput)
		{
			IActionResult response;
			try
			{
				// 다운로드 요청 문자열이 존재하지 않는 경우
				if (downloadInput.IsEmpty())
				{
					response = new BadRequestResult();
				}
				// 다운로드 요청 문자열이 존재하는 경우
				else
				{
					RequestS3OperationDownload request = JsonConvert.DeserializeObject<RequestS3OperationDownload>(downloadInput);

					// 요청이 유효한 않은 경우
					if (request != null)
					{
						// 파일 다운로드
						ResponseData<FileStreamResult> responseDownload = await this.m_provider.Download(request.ServiceUrl, request.AccessKey, request.AccessSecret, request.Path, request.Current, request.Names);

						// 파일 다운로드에 성공한 경우
						if (responseDownload.Result == EnumResponseResult.Success)
						{
							response = responseDownload.Data;
						}
						// 파일 다운로드에 실패한 경우
						else if(responseDownload.Code == Resource.EC_COMMON__FILE_NOT_FOUND)
						{
							response = new NotFoundResult();
						}
						// 그외 실패
						else
						{
							response = StatusCode(500);
						}
					}
					// 요청이 유효하지 않은 경우
					else
						response = new BadRequestResult();
				}
			}
			catch (Exception ex)
			{
				NNException.Log(ex);

				response = StatusCode(500);
			}
			return response;
		}

		/// <summary>이미지를 다운로드 한다.</summary>
		/// <param name="serviceUrl">서비스 URL</param>
		/// <param name="accessKey">엑세스 키</param>
		/// <param name="accessSecret">엑세스 시크릿</param>
		/// <param name="path">이미지 경로</param>
		/// <returns>결과 JSON 문자열</returns>
		[HttpGet("GetImage")]
		public IActionResult ImageDownload(string serviceUrl, string accessKey, string accessSecret, string path)
		{
			IActionResult response;
			try
			{
				// 요청 정보가 존재하지 않는 경우
				if (serviceUrl.IsEmpty() || accessKey.IsEmpty() || accessSecret.IsEmpty() || path.IsEmpty())
				{
					response = new BadRequestResult();
				}
				// 요청 정보가 존재하는 경우
				else
				{
					// 파일 다운로드
					ResponseData<FileStreamResult> responseDownload = this.m_provider.GetImage(serviceUrl, accessKey, accessSecret, path);

					// 파일 다운로드에 성공한 경우
					if (responseDownload.Result == EnumResponseResult.Success)
					{
						response = responseDownload.Data;
					}
					// 파일 다운로드에 실패한 경우
					else if(responseDownload.Code == Resource.EC_COMMON__FILE_NOT_FOUND)
					{
						response = new NotFoundResult();
					}
					// 그외 실패
					else
					{
						response = StatusCode(500);
					}
				}
			}
			catch (Exception ex)
			{
				NNException.Log(ex);

				response = StatusCode(500);
			}
			return response;
		}

		/// <summary>버킷의 CORS 설정을 가져온다.</summary>
		/// <param name="serviceUrl">서비스 URL</param>
		/// <param name="accessKey">엑세스 키</param>
		/// <param name="accessSecret">엑세스 시크릿</param>
		/// <param name="bucketName">버킷명</param>
		/// <returns>결과 JSON 문자열</returns>
		[SwaggerResponse((int) HttpStatusCode.OK, null, typeof(ResponseData<CORSConfiguration>))]
		[HttpGet("Configs/CORS/{bucketName}")]
		public async Task<IActionResult> GetCorsConfig([FromHeader(Name="s3-service-url")] string serviceUrl, [FromHeader(Name="s3-access-key")] string accessKey, [FromHeader(Name="s3-access-secret")] string accessSecret,
			[FromRoute] string bucketName)
		{
			return Json(await m_provider.GetCorsConfig(serviceUrl, accessKey, accessSecret, bucketName));
		}

		/// <summary>버킷의 CORS 설정을 가져온다.</summary>
		/// <param name="serviceUrl">서비스 URL</param>
		/// <param name="accessKey">엑세스 키</param>
		/// <param name="accessSecret">엑세스 시크릿</param>
		/// <param name="bucketName">버킷명</param>
		/// <param name="config">CORS 설정 객체</param>
		/// <returns>결과 JSON 문자열</returns>
		[SwaggerResponse((int) HttpStatusCode.OK, null, typeof(ResponseData))]
		[HttpPut("Configs/CORS/{bucketName}")]
		public async Task<IActionResult> SetCorsConfig([FromHeader(Name="s3-service-url")] string serviceUrl, [FromHeader(Name="s3-access-key")] string accessKey, [FromHeader(Name="s3-access-secret")] string accessSecret,
			[FromRoute] string bucketName, [FromBody] CORSConfiguration config)
		{
			return Json(await m_provider.SetCorsConfig(serviceUrl, accessKey, accessSecret, bucketName, config));
		}

		/// <summary>버킷의 웹사이트 설정을 가져온다.</summary>
		/// <param name="serviceUrl">서비스 URL</param>
		/// <param name="accessKey">엑세스 키</param>
		/// <param name="accessSecret">엑세스 시크릿</param>
		/// <param name="bucketName">버킷명</param>
		/// <returns>결과 JSON 문자열</returns>
		[SwaggerResponse((int) HttpStatusCode.OK, null, typeof(ResponseData<WebsiteConfiguration>))]
		[HttpGet("Configs/WebSite/{bucketName}")]
		public async Task<IActionResult> GetWebSiteConfig([FromHeader(Name="s3-service-url")] string serviceUrl, [FromHeader(Name="s3-access-key")] string accessKey, [FromHeader(Name="s3-access-secret")] string accessSecret,
			[FromRoute] string bucketName)
		{
			return Json(await m_provider.GetWebSiteConfig(serviceUrl, accessKey, accessSecret, bucketName));
		}

		/// <summary>버킷의 웹사이트 설정을 가져온다.</summary>
		/// <param name="serviceUrl">서비스 URL</param>
		/// <param name="accessKey">엑세스 키</param>
		/// <param name="accessSecret">엑세스 시크릿</param>
		/// <param name="bucketName">버킷명</param>
		/// <param name="config">웹사이트 설정 객체</param>
		/// <returns>결과 JSON 문자열</returns>
		[SwaggerResponse((int) HttpStatusCode.OK, null, typeof(ResponseData))]
		[HttpPut("Configs/WebSite/{bucketName}")]
		public async Task<IActionResult> SetWebSiteConfig([FromHeader(Name="s3-service-url")] string serviceUrl, [FromHeader(Name="s3-access-key")] string accessKey, [FromHeader(Name="s3-access-secret")] string accessSecret,
			[FromRoute] string bucketName, [FromBody] WebsiteConfiguration config)
		{
			return Json(await m_provider.SetWebSiteConfig(serviceUrl, accessKey, accessSecret, bucketName, config));
		}

		/// <summary>객체의 Version 목록을 가져온다.</summary>
		/// <param name="serviceUrl">서비스 URL</param>
		/// <param name="accessKey">엑세스 키</param>
		/// <param name="accessSecret">엑세스 시크릿</param>
		/// <param name="request">S3 버전 목록 요청 객체</param>
		/// <returns>결과 JSON 문자열</returns>
		[SwaggerResponse((int) HttpStatusCode.OK, null, typeof(ResponseData<ResponseS3VersioningInfo>))]
		[HttpPost("Versions")]
		public async Task<IActionResult> GetVersionList([FromHeader(Name="s3-service-url")] string serviceUrl, [FromHeader(Name="s3-access-key")] string accessKey, [FromHeader(Name="s3-access-secret")] string accessSecret,
			[FromBody] RequestS3VersionList request)
		{
			return Json(await m_provider.GetVersioningList(serviceUrl, accessKey, accessSecret, request));
		}

		/// <summary>객체의 특정 버전들을 삭제한다.</summary>
		/// <param name="serviceUrl">서비스 URL</param>
		/// <param name="accessKey">엑세스 키</param>
		/// <param name="accessSecret">엑세스 시크릿</param>
		/// <param name="request">S3 버전 삭제 요청 객체</param>
		/// <returns>결과 JSON 문자열</returns>
		[SwaggerResponse((int) HttpStatusCode.OK, null, typeof(ResponseData<ResponseData>))]
		[HttpPost("Versions/Delete")]
		public async Task<IActionResult> DeleteVersion([FromHeader(Name="s3-service-url")] string serviceUrl, [FromHeader(Name="s3-access-key")] string accessKey, [FromHeader(Name="s3-access-secret")] string accessSecret,
			[FromBody] RequestS3VersionDelete request)
		{
			return Json(await m_provider.DeleteVersion(serviceUrl, accessKey, accessSecret, request));
		}

		/// <summary>객체의 특정 버전을 다운로드 한다.</summary>
		/// <param name="serviceUrl">서비스 URL</param>
		/// <param name="accessKey">엑세스 키</param>
		/// <param name="accessSecret">엑세스 시크릿</param>
		/// <param name="request">S3 버전 다운로드 요청 객체</param>
		/// <returns>결과 JSON 문자열</returns>
		[SwaggerResponse((int) HttpStatusCode.OK, null, typeof(ResponseData<ResponseData>))]
		[HttpPost("Versions/Download")]
		public async Task<IActionResult> DownloadVersion([FromHeader(Name="s3-service-url")] string serviceUrl, [FromHeader(Name="s3-access-key")] string accessKey, [FromHeader(Name="s3-access-secret")] string accessSecret,
			[FromBody] RequestS3VersionDownload request)
		{
			IActionResult response;
			try
			{
				// 파일 다운로드
				ResponseData<FileStreamResult> responseDownload = await this.m_provider.DownloadVersion(serviceUrl, accessKey, accessSecret, request);

				// 파일 다운로드에 성공한 경우
				if (responseDownload.Result == EnumResponseResult.Success)
				{
					response = responseDownload.Data;
				}
				// 파일 다운로드에 실패한 경우
				else if(responseDownload.Code == Resource.EC_COMMON__FILE_NOT_FOUND)
				{
					response = new NotFoundResult();
				}
				// 그외 실패
				else
				{
					response = StatusCode(500);
				}
			}
			catch (Exception ex)
			{
				NNException.Log(ex);

				response = StatusCode(500);
			}
			return response;
		}

		/// <summary>버킷의 Versioning 설정을 가져온다.</summary>
		/// <param name="serviceUrl">서비스 URL</param>
		/// <param name="accessKey">엑세스 키</param>
		/// <param name="accessSecret">엑세스 시크릿</param>
		/// <param name="bucketName">버킷명</param>
		/// <returns>결과 JSON 문자열</returns>
		[SwaggerResponse((int) HttpStatusCode.OK, null, typeof(ResponseData<ResponseS3VersioningConfig>))]
		[HttpGet("Configs/Versioning/{bucketName}")]
		public async Task<IActionResult> GetVersioningConfig([FromHeader(Name="s3-service-url")] string serviceUrl, [FromHeader(Name="s3-access-key")] string accessKey, [FromHeader(Name="s3-access-secret")] string accessSecret,
			[FromRoute] string bucketName)
		{
			return Json(await m_provider.GetVersioningConfig(serviceUrl, accessKey, accessSecret, bucketName));
		}

		/// <summary>버킷의 Versioning 설정을 가져온다.</summary>
		/// <param name="serviceUrl">서비스 URL</param>
		/// <param name="accessKey">엑세스 키</param>
		/// <param name="accessSecret">엑세스 시크릿</param>
		/// <param name="bucketName">버킷명</param>
		/// <param name="config">Versioning 설정 객체</param>
		/// <returns>결과 JSON 문자열</returns>
		[SwaggerResponse((int) HttpStatusCode.OK, null, typeof(ResponseData))]
		[HttpPut("Configs/Versioning/{bucketName}")]
		public async Task<IActionResult> SetVersioningConfig([FromHeader(Name="s3-service-url")] string serviceUrl, [FromHeader(Name="s3-access-key")] string accessKey, [FromHeader(Name="s3-access-secret")] string accessSecret,
			[FromRoute] string bucketName, [FromBody] RequestS3VersioningConfig config)
		{
			return Json(await m_provider.SetVersioningConfig(serviceUrl, accessKey, accessSecret, bucketName, config));
		}

		/// <summary>버킷의 정책 설정을 가져온다.</summary>
		/// <param name="serviceUrl">서비스 URL</param>
		/// <param name="accessKey">엑세스 키</param>
		/// <param name="accessSecret">엑세스 시크릿</param>
		/// <param name="bucketName">버킷명</param>
		/// <returns>결과 JSON 문자열</returns>
		[SwaggerResponse((int) HttpStatusCode.OK, null, typeof(ResponseData<ResponseS3VersioningConfig>))]
		[HttpGet("Configs/BucketPolicy/{bucketName}")]
		public async Task<IActionResult> GetBucketPolicy([FromHeader(Name="s3-service-url")] string serviceUrl, [FromHeader(Name="s3-access-key")] string accessKey, [FromHeader(Name="s3-access-secret")] string accessSecret,
			[FromRoute] string bucketName)
		{
			return Json(await m_provider.GetBucketPolicy(serviceUrl, accessKey, accessSecret, bucketName));
		}

		/// <summary>버킷의 정책 설정을 저장한다.</summary>
		/// <param name="serviceUrl">서비스 URL</param>
		/// <param name="accessKey">엑세스 키</param>
		/// <param name="accessSecret">엑세스 시크릿</param>
		/// <param name="bucketName">버킷명</param>
		/// <param name="config">Versioning 설정 객체</param>
		/// <returns>결과 JSON 문자열</returns>
		[SwaggerResponse((int) HttpStatusCode.OK, null, typeof(ResponseData))]
		[HttpPut("Configs/BucketPolicy/{bucketName}")]
		public async Task<IActionResult> SetBucketPolicy([FromHeader(Name="s3-service-url")] string serviceUrl, [FromHeader(Name="s3-access-key")] string accessKey, [FromHeader(Name="s3-access-secret")] string accessSecret,
			[FromRoute] string bucketName, [FromBody] RequestS3BucketPolicy config)
		{
			return Json(await m_provider.SetBucketPolicy(serviceUrl, accessKey, accessSecret, bucketName, config));
		}

		/// <summary>버킷의 ACL 설정을 가져온다.</summary>
		/// <param name="serviceUrl">서비스 URL</param>
		/// <param name="accessKey">엑세스 키</param>
		/// <param name="accessSecret">엑세스 시크릿</param>
		/// <param name="request">ACL 설정 요청 객체</param>
		/// <returns>결과 JSON 문자열</returns>
		[SwaggerResponse((int) HttpStatusCode.OK, null, typeof(ResponseList<ResponseS3AclConfig>))]
		[HttpPost("Configs/ACL")]
		public async Task<IActionResult> GetAclConfig([FromHeader(Name="s3-service-url")] string serviceUrl, [FromHeader(Name="s3-access-key")] string accessKey, [FromHeader(Name="s3-access-secret")] string accessSecret,
			[FromBody] RequestS3AclConfig request)
		{
			return Json(await m_provider.GetAclConfig(serviceUrl, accessKey, accessSecret, request));
		}

		/// <summary>버킷의 ACL 설정을 저장한다.</summary>
		/// <param name="serviceUrl">서비스 URL</param>
		/// <param name="accessKey">엑세스 키</param>
		/// <param name="accessSecret">엑세스 시크릿</param>
		/// <param name="request">ACL 설정 수정 요청 객체</param>
		/// <returns>결과 JSON 문자열</returns>
		[SwaggerResponse((int) HttpStatusCode.OK, null, typeof(ResponseData))]
		[HttpPut("Configs/ACL")]
		public async Task<IActionResult> SetAclConfig([FromHeader(Name="s3-service-url")] string serviceUrl, [FromHeader(Name="s3-access-key")] string accessKey, [FromHeader(Name="s3-access-secret")] string accessSecret,
			[FromBody] RequestS3AclConfigUpdate request)
		{
			return Json(await m_provider.SetAclConfig(serviceUrl, accessKey, accessSecret, request));
		}

		/// <summary>객체의 메타데이터 설정을 가져온다.</summary>
		/// <param name="serviceUrl">서비스 URL</param>
		/// <param name="accessKey">엑세스 키</param>
		/// <param name="accessSecret">엑세스 시크릿</param>
		/// <param name="request">메타데이터 요청 객체</param>
		/// <returns>결과 JSON 문자열</returns>
		[SwaggerResponse((int) HttpStatusCode.OK, null, typeof(ResponseData<ResponseS3ObjectMetadata>))]
		[HttpPost("Operations/Metadata")]
		public async Task<IActionResult> GetMetadata([FromHeader(Name="s3-service-url")] string serviceUrl, [FromHeader(Name="s3-access-key")] string accessKey, [FromHeader(Name="s3-access-secret")] string accessSecret,
			[FromBody] RequestS3OperationMetadata request)
		{
			return Json(await m_provider.GetMetadata(serviceUrl, accessKey, accessSecret, request));
		}

		/// <summary>특정 객체의 메타데이터를 저장한다.</summary>
		/// <param name="serviceUrl">서비스 URL</param>
		/// <param name="accessKey">엑세스 키</param>
		/// <param name="accessSecret">엑세스 시크릿</param>
		/// <param name="request">메타데이터 수정요청 객체</param>
		/// <returns>결과 JSON 문자열</returns>
		[SwaggerResponse((int) HttpStatusCode.OK, null, typeof(ResponseData))]
		[HttpPut("Operations/Metadata")]
		public async Task<IActionResult> SetMetadata([FromHeader(Name="s3-service-url")] string serviceUrl, [FromHeader(Name="s3-access-key")] string accessKey, [FromHeader(Name="s3-access-secret")] string accessSecret,
			[FromBody] RequestS3Metadata request)
		{
			return Json(await m_provider.SetMetadata(serviceUrl, accessKey, accessSecret, request));
		}

		/// <summary>특정 객체의 태그를 가져온다.</summary>
		/// <param name="serviceUrl">서비스 URL</param>
		/// <param name="accessKey">엑세스 키</param>
		/// <param name="accessSecret">엑세스 시크릿</param>
		/// <param name="request">태그 요청 객체</param>
		/// <returns>결과 JSON 문자열</returns>
		[SwaggerResponse((int) HttpStatusCode.OK, null, typeof(ResponseData<ResponseS3ObjectTagging>))]
		[HttpPost("Operations/Tagging")]
		public async Task<IActionResult> GetTagging([FromHeader(Name="s3-service-url")] string serviceUrl, [FromHeader(Name="s3-access-key")] string accessKey, [FromHeader(Name="s3-access-secret")] string accessSecret,
			[FromBody] RequestS3Tagging request)
		{
			return Json(await m_provider.GetTagging(serviceUrl, accessKey, accessSecret, request));
		}

		/// <summary>특정 객체의 태그를 저장한다.</summary>
		/// <param name="serviceUrl">서비스 URL</param>
		/// <param name="accessKey">엑세스 키</param>
		/// <param name="accessSecret">엑세스 시크릿</param>
		/// <param name="request">태그 수정요청 객체</param>
		/// <returns>결과 JSON 문자열</returns>
		[SwaggerResponse((int) HttpStatusCode.OK, null, typeof(ResponseData))]
		[HttpPut("Operations/Tagging")]
		public async Task<IActionResult> SetTagging([FromHeader(Name="s3-service-url")] string serviceUrl, [FromHeader(Name="s3-access-key")] string accessKey, [FromHeader(Name="s3-access-secret")] string accessSecret,
			[FromBody] RequestS3OperationTagging request)
		{
			return Json(await m_provider.SetTagging(serviceUrl, accessKey, accessSecret, request));
		}

		/// <summary>특정 버킷의 라이프사이클 설정을 가져온다.</summary>
		/// <param name="serviceUrl">서비스 URL</param>
		/// <param name="accessKey">엑세스 키</param>
		/// <param name="accessSecret">엑세스 시크릿</param>
		/// <param name="bucketName">버킷명</param>
		/// <returns>결과 JSON 문자열</returns>
		[SwaggerResponse((int) HttpStatusCode.OK, null, typeof(ResponseList<ResponseS3LifeCycleRule>))]
		[HttpGet("Buckets/{bucketName}/LifeCycle")]
		public async Task<IActionResult> GetLifeCycle([FromHeader(Name="s3-service-url")] string serviceUrl, [FromHeader(Name="s3-access-key")] string accessKey, [FromHeader(Name="s3-access-secret")] string accessSecret,
			[FromRoute] string bucketName)
		{
			return Json(await m_provider.GetLifeCycle(serviceUrl, accessKey, accessSecret, bucketName));
		}

		/// <summary>특정 버킷의 라이프사이클 설정를 저장한다.</summary>
		/// <param name="serviceUrl">서비스 URL</param>
		/// <param name="accessKey">엑세스 키</param>
		/// <param name="accessSecret">엑세스 시크릿</param>
		/// <param name="bucketName">버킷명</param>
		/// <param name="request">라이프사이클 등록 요청 객체</param>
		/// <returns>결과 JSON 문자열</returns>
		[SwaggerResponse((int) HttpStatusCode.OK, null, typeof(ResponseData))]
		[HttpPut("Buckets/{bucketName}/LifeCycle")]
		public async Task<IActionResult> SetLifeCycle([FromHeader(Name="s3-service-url")] string serviceUrl, [FromHeader(Name="s3-access-key")] string accessKey, [FromHeader(Name="s3-access-secret")] string accessSecret,
			[FromRoute] string bucketName, [FromBody] RequestS3LifeCycle request)
		{
			return Json(await m_provider.SetLifeCycle(serviceUrl, accessKey, accessSecret, bucketName, request));
		}

		/// <summary>특정 객체의 공유 URL를 가져온다.</summary>
		/// <param name="serviceUrl">서비스 URL</param>
		/// <param name="accessKey">엑세스 키</param>
		/// <param name="accessSecret">엑세스 시크릿</param>
		/// <param name="request">공유 URL 요청 객체</param>
		/// <returns>결과 JSON 문자열</returns>
		[SwaggerResponse((int) HttpStatusCode.OK, null, typeof(ResponseData<string>))]
		[HttpPost("Operations/ShareUrl")]
		public async Task<IActionResult> GetShareUrl([FromHeader(Name="s3-service-url")] string serviceUrl, [FromHeader(Name="s3-access-key")] string accessKey, [FromHeader(Name="s3-access-secret")] string accessSecret,
			[FromBody] RequestS3OperationShareUrl request)
		{
			return Json(await m_provider.GetShareUrl(serviceUrl, accessKey, accessSecret, request));
		}
	}
}