FROM mcr.microsoft.com/dotnet/core/aspnet:3.1 AS base
WORKDIR /app
EXPOSE 52080
EXPOSE 52443

FROM mcr.microsoft.com/dotnet/core/sdk:3.1 AS build
WORKDIR /src
COPY ["WebApi/WebApi.csproj", "WebApi/"]
COPY ["Model/CSSPProviderInterfaces/CSSPProviderInterfaces.csproj", "Model/CSSPProviderInterfaces/"]
COPY ["Data/CSSPData/CSSPData.csproj", "Data/CSSPData/"]
COPY ["Data/CSSPResources/CSSPResources.csproj", "Data/CSSPResources/"]
COPY ["Model/CSSPModels/CSSPModels.csproj", "Model/CSSPModels/"]
COPY ["Model/CSSPLogModels/CSSPLogModels.csproj", "Model/CSSPLogModels/"]
COPY ["Model/CSSPIfsV3Models/CSSPIfsV3Models.csproj", "Model/CSSPIfsV3Models/"]
COPY ["Model/CSSPIfss30Models/CSSPIfss30Models.csproj", "Model/CSSPIfss30Models/"]
COPY ["Model/CSSPProvider/CSSPProvider.csproj", "Model/CSSPProvider/"]
RUN dotnet restore "WebApi/WebApi.csproj"
COPY . .
WORKDIR "/src/WebApi"
RUN dotnet build "WebApi.csproj" -c Release -o /app

FROM build AS publish
RUN dotnet publish "WebApi.csproj" -c Release -o /app

FROM base AS final
WORKDIR /app
COPY --from=publish /app .
ENTRYPOINT ["dotnet", "WebApi.dll"]
