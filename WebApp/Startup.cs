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
using System.Globalization;
using System.IO;
using System.Resources;
using CSSPResources;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SpaServices.AngularCli;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Microsoft.Net.Http.Headers;
using MTLib.AspNetCore;
using MTLib.Core;

namespace WebApp
{
	/// <summary>WEB APP 시작 관련 클래스</summary>
	public class Startup
	{
		/// <summary>생성자</summary>
		/// <param name="env">호스팅 환경 객체</param>
		/// <param name="configuration">환경 설정 객체</param>
		public Startup(IWebHostEnvironment env, IConfiguration configuration)
		{
			try
			{
				Configuration = configuration;

				// 기본 설정 옵션 생성
				ConfigurationOptions = new NNConfigurationOptions(env, "CSSPFront"
																	, Configuration["AppSettings:Domain"]
																	, Configuration["AppSettings:SharedAuthTicketKeyPath"]
																	, Configuration.GetValue<int>("AppSettings:ExpireMinutes")
																	);
			}
			catch (Exception ex)
			{
				NNException.Log(ex);
			}
		}

		/// <summary>설정 객체</summary>
		public IConfiguration Configuration { get; }

		/// <summary>설정 옵션 객체</summary>
		public NNConfigurationOptions ConfigurationOptions { get; }

		/// <summary>컨테이너에 서비스들을 추가한다.</summary>
		/// <param name="services">서비스 집합 객체</param>
		public void ConfigureServices(IServiceCollection services)
		{
			try
			{
				services.AddMvc().SetCompatibilityVersion(CompatibilityVersion.Version_3_0);

				// 컨테이너에 기본 서비스들을 추가한다.
				services.ConfigureServices(false, ConfigurationOptions);

				//response cache 테스트
				services.AddResponseCaching();

				//Production용
				services.AddSpaStaticFiles(configuration =>
				{
					configuration.RootPath = "ClientApp/dist";
				});
			}
			catch (Exception ex)
			{
				NNException.Log(ex);
			}
		}

		/// <summary>HTTP 요청 파이프 라인을 구성한다.</summary>
		/// <param name="app">어플리케이션 빌더 객체</param>
		/// <param name="env">호스팅 환경 객체</param>
		/// <param name="loggerFactory">로거 팩토리</param>
		/// <param name="pathProvider">경로 도우미 객체</param>
		/// <param name="configuration">환경 설정 객체</param>
		public void Configure(IApplicationBuilder app, IWebHostEnvironment env, ILoggerFactory loggerFactory, IPathProvider pathProvider, IConfiguration configuration)
		{
			try
			{
				// 개발 환경인 경우
				if (env.IsDevelopment())
				{
					// 개발자 Exception 페이지 사용
					app.UseDeveloperExceptionPage();
					app.UseStatusCodePagesWithRedirects("/Error/{0}");
				}
				else
				{
					//app.UseExceptionHandler("/Error");
					app.UseStatusCodePagesWithRedirects("/Error/{0}");
					// The default HSTS value is 30 days. You may want to change this for production scenarios, see https://aka.ms/aspnetcore-hsts.
					app.UseHsts();
				}

				// 정적 파일 사용
				app.UseSpaStaticFiles(new StaticFileOptions
				{
					//캐시 설정 위치
					OnPrepareResponse = ctx =>
					{
						if (ctx.Context.Request.Path.Value.Contains(Configuration["AppSettings:assetsPath"]))
						{
							var secondsOneDay = 3600;
							ctx.Context.Response.Headers[HeaderNames.CacheControl] = "public,max-age=" + secondsOneDay;
						}
						else
						{
							var secondsOneYear = 31536000;
							ctx.Context.Response.Headers[HeaderNames.CacheControl] = "public,max-age=" + secondsOneYear;
						}
					}
				});

				// 기본 설정을 처리한다.
				app.Configure(env, loggerFactory, Configuration, ConfigurationOptions, null);

				app.UseSpa(spa =>
				{
					spa.Options.SourcePath = "./ClientApp";
					spa.Options.StartupTimeout = new TimeSpan(0, 5, 0);

					//개발환경인 경우 npm start를 호출해서 ng serve를 실행
					if (env.IsDevelopment())
					{
						if (Environment.GetEnvironmentVariables().Contains("USE_SPA_PROXY") && Environment.GetEnvironmentVariable("USE_SPA_PROXY")?.ToUpper() == "TRUE")
							spa.UseProxyToSpaDevelopmentServer("http://localhost:5100");
						else
							spa.UseAngularCliServer(npmScript: "start-from-aspnet");
					}
				});

				// 모든 리소스 매니저를 리스트로 생성
				List<ResourceManager> resourceManagers = new List<ResourceManager>()
				{
					Resource.ResourceManager
				};

				// 리소스 파일 루트 경로를 가져온다.
				//string i18nRootPath = pathProvider.MapPath(Configuration["AppSettings:I18nPath"]);
				//if (env.IsDevelopment())
				//	i18nRootPath = string.Format("{0}{1}", Path.Combine(env.ContentRootPath, "ClientApp"), Configuration["AppSettings:I18nPath"].Replace('/', Path.DirectorySeparatorChar));
				Console.WriteLine(Path.Combine(env.ContentRootPath, "ClientApp"));
				string i18nRootPath = $"{Path.Combine(env.ContentRootPath, "ClientApp")}{Configuration["AppSettings:I18nPath"].Replace('/', Path.DirectorySeparatorChar)}";

				// 모든 언어에 대해서 리소스 파일 내용을 Json으로 저장
				foreach (CultureInfo culture in ConfigurationOptions.Localization.SupportedUICultures)
					resourceManagers.Save(culture, Path.Combine(i18nRootPath, string.Format("{0}.json", culture.Name)));
			}
			catch (Exception ex)
			{
				NNException.Log(ex);
			}
		}
	}
}
