kill -9 $(lsof -t -i:51080)
dotnet WebApp.dll &
