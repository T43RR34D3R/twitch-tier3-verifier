# TwitchAnnouncer Plugin Dependencies Download Script
Write-Host "Downloading TwitchAnnouncer Plugin Dependencies..." -ForegroundColor Green

$dependenciesDir = "dependencies"
if (!(Test-Path $dependenciesDir)) {
    New-Item -ItemType Directory -Path $dependenciesDir
}

# Download Paper API
Write-Host "Downloading Paper API..." -ForegroundColor Yellow
$paperUrl = "https://repo.papermc.io/repository/maven-public/io/papermc/paper/paper-api/1.20.4-R0.1-SNAPSHOT/paper-api-1.20.4-R0.1-20240428.134118-183.jar"
$paperFile = "$dependenciesDir\paper-api-1.20.4.jar"
try {
    Invoke-WebRequest -Uri $paperUrl -OutFile $paperFile
    Write-Host "✓ Paper API downloaded" -ForegroundColor Green
} catch {
    Write-Host "✗ Failed to download Paper API" -ForegroundColor Red
}

# Download LuckPerms API
Write-Host "Downloading LuckPerms API..." -ForegroundColor Yellow
$luckpermsUrl = "https://repo.lucko.me/repository/maven-public/net/luckperms/api/5.4/api-5.4.jar"
$luckpermsFile = "$dependenciesDir\luckperms-api-5.4.jar"
try {
    Invoke-WebRequest -Uri $luckpermsUrl -OutFile $luckpermsFile
    Write-Host "✓ LuckPerms API downloaded" -ForegroundColor Green
} catch {
    Write-Host "✗ Failed to download LuckPerms API" -ForegroundColor Red
}

# Download OkHttp
Write-Host "Downloading OkHttp..." -ForegroundColor Yellow
$okhttpUrl = "https://repo1.maven.org/maven2/com/squareup/okhttp3/okhttp/4.12.0/okhttp-4.12.0.jar"
$okhttpFile = "$dependenciesDir\okhttp-4.12.0.jar"
try {
    Invoke-WebRequest -Uri $okhttpUrl -OutFile $okhttpFile
    Write-Host "✓ OkHttp downloaded" -ForegroundColor Green
} catch {
    Write-Host "✗ Failed to download OkHttp" -ForegroundColor Red
}

# Download Okio
Write-Host "Downloading Okio..." -ForegroundColor Yellow
$okioUrl = "https://repo1.maven.org/maven2/com/squareup/okio/okio/3.6.0/okio-3.6.0.jar"
$okioFile = "$dependenciesDir\okio-3.6.0.jar"
try {
    Invoke-WebRequest -Uri $okioUrl -OutFile $okioFile
    Write-Host "✓ Okio downloaded" -ForegroundColor Green
} catch {
    Write-Host "✗ Failed to download Okio" -ForegroundColor Red
}

# Download Gson
Write-Host "Downloading Gson..." -ForegroundColor Yellow
$gsonUrl = "https://repo1.maven.org/maven2/com/google/code/gson/gson/2.10.1/gson-2.10.1.jar"
$gsonFile = "$dependenciesDir\gson-2.10.1.jar"
try {
    Invoke-WebRequest -Uri $gsonUrl -OutFile $gsonFile
    Write-Host "✓ Gson downloaded" -ForegroundColor Green
} catch {
    Write-Host "✗ Failed to download Gson" -ForegroundColor Red
}

Write-Host ""
Write-Host "Download complete!" -ForegroundColor Green
Write-Host "Next: Run .\build-plugin.ps1 to compile" -ForegroundColor Cyan
