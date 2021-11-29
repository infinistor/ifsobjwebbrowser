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
using CSSPProvider.Providers.S3;
using CSSPProviderInterfaces;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Http.Connections;
using Microsoft.AspNetCore.HttpOverrides;
using Microsoft.AspNetCore.Localization;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Microsoft.Net.Http.Headers;
using Microsoft.OpenApi.Models;
using MTLib.AspNetCore;
using MTLib.Core;

namespace WebApi
{
    /// <summary>시작 클래스</summary>
    public class Startup
    {

        /// <summary>설정 객체</summary>
        public IConfiguration Configuration { get; }

        /// <summary>설정 옵션 객체</summary>
        public NNConfigurationOptions ConfigurationOptions { get; }

        /// <summary>생성자</summary>
        /// <param name="env">호스팅 환경 객체</param>
        /// <param name="configuration">환경 설정 객체</param>
        public Startup(IWebHostEnvironment env, IConfiguration configuration)
        {
            try
            {
                Configuration = configuration;

                // 기본 설정 옵션 생성
                ConfigurationOptions = new NNConfigurationOptions(env, "CSSPApi"
                    , Configuration["AppSettings:Domain"]
                    , Configuration["AppSettings:SharedAuthTicketKeyPath"]
                    , Configuration.GetValue<int>("AppSettings:ExpireMinutes")
                );

                IList<CultureInfo> supportedCultures = new[]
                {
                    new CultureInfo("ko"),
                };

                ConfigurationOptions.Localization.DefaultRequestCulture = new RequestCulture("ko");
                ConfigurationOptions.Localization.SupportedCultures = supportedCultures;
                ConfigurationOptions.Localization.SupportedUICultures = supportedCultures;
            }
            catch (Exception ex)
            {
                NNException.Log(ex);
            }
        }

        /// <summary>컨테이너에 서비스들을 추가한다.</summary>
        /// <param name="services">서비스 집합 객체</param>
        public void ConfigureServices(IServiceCollection services)
        {
			try
			{
				// 컨테이너에 기본 서비스들을 추가한다.
				services.ConfigureServices(true, ConfigurationOptions);

				// 프로바이더 객체 DI 설정
				services.AddTransient<IS3Provider, S3Provider>();

				// Swagger 생성기 등록, 하나 이상의 Swagger 문서 등록
				services.AddSwaggerGen(c =>
				{
					c.SwaggerDoc("v1", new OpenApiInfo
					{
						Title = $"S3 Browswer - {Configuration["AppSettings:Host"]}",
						Version = "v1",
						Description = "S3 Browswer"
					});

					// Swagger JSON and UI에서 사용할 코멘트 경로를 설정한다.
					c.IncludeXmlComments(Path.Combine(AppContext.BaseDirectory, "WebApi.xml"));
					c.IncludeXmlComments(Path.Combine(AppContext.BaseDirectory, "CSSPData.xml"));
				});

				// SignalR 추가
				services.AddSignalR(options =>
						{
						})
						.AddJsonProtocol(options =>
						{
							options.PayloadSerializerOptions.PropertyNamingPolicy = null;
						})
						;
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
        public void Configure(IApplicationBuilder app, IWebHostEnvironment env, ILoggerFactory loggerFactory, IPathProvider pathProvider)
        {
			try
			{
				// 생성 된 Swagger를 JSON 끝점으로 제공 할 수 있게 미들웨어를 활성화한다.
				app.UseSwagger();

				// swagger-ui 제공을 위해 Swagger JSON 끝점을 명시하여 미들웨어를 활성화한다.
				app.UseSwaggerUI(c =>
				{
					c.RoutePrefix = "api";
					c.SwaggerEndpoint("/swagger/v1/swagger.json", "CSSP API V1");
				});

				// 개발 환경인 경우
				if (env.IsDevelopment())
				{
					// 개발자 Exception 페이지 사용
					app.UseDeveloperExceptionPage();
					//app.UseDatabaseErrorPage();
				}
				// 운영 환경인 경우
				else
				{
					app.UseHsts();
				}

				// 정적 파일 사용
				app.UseStaticFiles(new StaticFileOptions
				{
					OnPrepareResponse = ctx =>
					{
						const int durationInSeconds = 60 * 60 * 24;
						ctx.Context.Response.Headers[HeaderNames.CacheControl] =
							"public,max-age=" + durationInSeconds;
					}
				});

				// 역방향 프록시 세팅 (For Nginx : Nginx로 헤더 및 프로토콜 전달)
				app.UseForwardedHeaders(new ForwardedHeadersOptions
				{
					ForwardedHeaders = ForwardedHeaders.XForwardedFor | ForwardedHeaders.XForwardedProto
				});

				//SignalR 대안
				app.UseRouting();

				app.UseEndpoints(endpoints =>{
					var desiredTransports =
						HttpTransportType.ServerSentEvents |
						HttpTransportType.LongPolling;
				});

				// MVC 사용 설정
				app.UseMvc(routes =>
				{
					routes.MapRoute("signin", "/api/v1/signin-*", "/api/v1/Account/ExternalLoginCallback");
					routes.MapRoute("areaRoute", "{area:exists}/{controller=Home}/{action=Index}/{id?}");
					routes.MapRoute("default", "{controller=Home}/{action=Index}/{id?}");
				});
			}
			catch (Exception ex)
			{
				NNException.Log(ex);
			}
        }
    }
}