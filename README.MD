# Ifs S3 Browser

## 용도
linux 서버에서 web으로 제공하는 S3 Compatible에 접근하기 위한 솔루션

## 주요 기능
- URL, Credential 정보를 바탕으로 S3 Compatible에 접근 가능
- S3 버킷 생성, 관리, 삭제, 조회
- S3 오브젝트 엑세스 제어
- 버킷 수명주기 관리
- 버전 관리
- CORS 관리
- Tag 관리
- 권한 관리
- 파일 암호화 설정 관리

## 구동 환경
- OS : CentOS 7.5
- .NET : core 3.1
- apache : 2.4.6(CentOS)

## 알려진 이슈
- 한번에 1000개 이상의 오브젝트를 볼 수 없습니다.

## 추가예정
- 오브젝트 목록을 모두 가져오도록 변경

## How TO Build

### .NET Core 3.1 설치
``` shell
sudo rpm -Uvh https://packages.microsoft.com/config/centos/7/packages-microsoft-prod.rpm
sudo yum install -y dotnet-sdk-3.1
```

### API Build
- `build_api.sh` 스크립트를 실행 또는 아래의 명령어를 복사하여 실행
    `dotnet publish ./WebApi/WebApi.csproj -c Release -o ./publish/csspapi`

### APP Build
- `build_app.sh` 스크립트를 실행 또는 아래의 명령어를 복사하여 실행
    `dotnet publish ./WebApp/WebApp.csproj -c Release -o ./publish/csspfront`

## 실행 방법

### 환경 구성
- 프로그램을 실행할 linux 서버에 환경 구축
- ./etc/script/install.sh 스크립트를 실행일괄 구성 가능
- 직접 설정할 경우 아래의 순서 대로 참조하여 구성

#### .NET Core 3.1 설치
``` shell
sudo rpm -Uvh https://packages.microsoft.com/config/centos/7/packages-microsoft-prod.rpm
sudo yum install -y dotnet-sdk-3.1
```

#### Apache 2.6.4 설치
``` shell
yum install -y httpd mod_ssl
```

#### SSL 인증서 구성
``` shell
mkdir /etc/ssl/private
chmod 700 /etc/ssl/private
cp ./etc/cert/pspace.crt /etc/ssl/private/
cp ./etc/cert/pspace.key /etc/ssl/private/
```

#### Apach 설정
``` shell
cp ./etc/apache/conf.d/ssl.conf /etc/httpd/conf.d/
cp ./etc/apache/conf/httpd.conf /etc/httpd/conf/
```

#### Apache 서비스 등록 및 시작
``` shell
systemctl enable httpd.service
systemctl restart httpd.service
```

### 빌드한 경우
1. `./publish` 폴더의 `csspapi`, `csspfront` 폴더를 원하는 경로에 복사
2. `dotnet WebApi.dll &`, `dotnet WebApp.dll &` 명령을 차례대로 실행
3. `https://<ip>:<port>/s3` 로 접속 가능
4. 설정 변경 없이 구성했을 경우 `https://localhost:5443/s3`로 접속

ex>
``` shell
scp -r ./publish/* root@192.168.0.11:/usr/local/portal/
ssh root@192.168.0.11
dotnet /usr/local/portal/csspapi/WebApi.dll &
dotnet /usr/local/portal/csspapi/WebApp.dll &
```
