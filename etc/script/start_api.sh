kill -9 $(lsof -t -i:52080)
dotnet WebApi.dll &
