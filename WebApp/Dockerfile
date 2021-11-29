FROM mcr.microsoft.com/dotnet/core/aspnet:3.1 AS base
WORKDIR /app
EXPOSE 51080
EXPOSE 51443

FROM pspace/aspnetcore3_for_angular AS build
WORKDIR /src
COPY ["WebApp/WebApp.csproj", "WebApp/"]
COPY ["Data/CSSPResources/CSSPResources.csproj", "Data/CSSPResources/"]
RUN dotnet restore "WebApp/WebApp.csproj"
COPY . .
WORKDIR "/src/WebApp"
RUN dotnet build "WebApp.csproj" -c Release -o /app

FROM build AS publish
RUN dotnet publish "WebApp.csproj" -c Release -o /app

FROM base AS final
WORKDIR /app
COPY --from=publish /app .
ENTRYPOINT ["dotnet", "WebApp.dll"]