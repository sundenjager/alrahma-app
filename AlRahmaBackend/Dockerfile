FROM mcr.microsoft.com/dotnet/sdk:9.0 AS build
WORKDIR /src
COPY ["AlRahmaBackend.csproj", "."]
RUN dotnet restore "AlRahmaBackend.csproj"
COPY . .
RUN dotnet build "AlRahmaBackend.csproj" -c Release -o /app/build

FROM build AS publish
RUN dotnet publish "AlRahmaBackend.csproj" -c Release -o /app/publish /p:UseAppHost=false

FROM mcr.microsoft.com/dotnet/aspnet:9.0 AS final
WORKDIR /app
COPY --from=publish /app/publish .

# Railway provides PORT as an environment variable
ENV ASPNETCORE_URLS=http://0.0.0.0:${PORT}
ENV ASPNETCORE_ENVIRONMENT=Production

EXPOSE ${PORT}
ENTRYPOINT ["dotnet", "AlRahmaBackend.dll"]