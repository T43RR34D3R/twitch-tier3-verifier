# TwitchAnnouncer Plugin Build Script
# This script compiles the Java source code and creates a plugin JAR

Write-Host "Building TwitchAnnouncer Plugin..." -ForegroundColor Green

# Check if dependencies exist
$depsDir = "dependencies"
if (!(Test-Path $depsDir)) {
    Write-Host "Dependencies folder not found! Please run .\download-dependencies.ps1 first" -ForegroundColor Red
    exit 1
}

# Check for Java
try {
    $javaVersion = java -version 2>&1 | Select-String "version"
    Write-Host "Using Java: $javaVersion" -ForegroundColor Green
} catch {
    Write-Host "Java not found! Please install Java JDK 17+ and add it to PATH" -ForegroundColor Red
    exit 1
}

# Create build directory
$buildDir = "build"
if (Test-Path $buildDir) {
    Remove-Item -Recurse -Force $buildDir
}
New-Item -ItemType Directory -Path $buildDir | Out-Null

# Compile Java source files
Write-Host "Compiling Java source files..." -ForegroundColor Yellow

$classpath = @(
    "dependencies\paper-api-1.20.4.jar",
    "dependencies\luckperms-api-5.4.jar", 
    "dependencies\okhttp-4.12.0.jar",
    "dependencies\okio-3.6.0.jar",
    "dependencies\gson-2.10.1.jar"
) -join ";"

$sourceFiles = Get-ChildItem -Path "com" -Filter "*.java" -Recurse | ForEach-Object { $_.FullName }

try {
    & javac -cp $classpath -d $buildDir $sourceFiles
    Write-Host "✓ Compilation successful" -ForegroundColor Green
} catch {
    Write-Host "✗ Compilation failed: $_" -ForegroundColor Red
    exit 1
}

# Copy resources to build directory
Write-Host "Copying plugin resources..." -ForegroundColor Yellow
Copy-Item "plugin.yml" "$buildDir\"
Copy-Item "config.yml" "$buildDir\"

# Extract and copy required dependencies into the JAR
Write-Host "Extracting runtime dependencies..." -ForegroundColor Yellow
$tempDir = "temp_deps"
New-Item -ItemType Directory -Path $tempDir | Out-Null

# Extract OkHttp, Okio, and Gson (Paper and LuckPerms are provided by server)
& jar -xf "dependencies\okhttp-4.12.0.jar" -C $tempDir
& jar -xf "dependencies\okio-3.6.0.jar" -C $tempDir  
& jar -xf "dependencies\gson-2.10.1.jar" -C $tempDir

# Copy extracted classes to build directory (excluding META-INF conflicts)
$tempClasses = Get-ChildItem -Path $tempDir -Exclude "META-INF" -Recurse
foreach ($item in $tempClasses) {
    if ($item.PSIsContainer) {
        $destPath = "$buildDir\" + $item.FullName.Substring($tempDir.Length + 1)
        if (!(Test-Path $destPath)) {
            New-Item -ItemType Directory -Path $destPath -Force | Out-Null
        }
    } else {
        $destPath = "$buildDir\" + $item.FullName.Substring($tempDir.Length + 1)
        $destDir = Split-Path $destPath -Parent
        if (!(Test-Path $destDir)) {
            New-Item -ItemType Directory -Path $destDir -Force | Out-Null
        }
        Copy-Item $item.FullName $destPath -Force
    }
}

# Create the final plugin JAR
Write-Host "Creating plugin JAR..." -ForegroundColor Yellow
$jarName = "TwitchAnnouncer-1.0.0-compiled.jar"

Push-Location $buildDir
try {
    & jar -cvf "..\$jarName" *
    Write-Host "✓ Plugin JAR created: $jarName" -ForegroundColor Green
} catch {
    Write-Host "✗ Failed to create JAR: $_" -ForegroundColor Red
    exit 1
} finally {
    Pop-Location
}

# Cleanup
Remove-Item -Recurse -Force $buildDir
Remove-Item -Recurse -Force $tempDir

Write-Host "`nBuild complete!" -ForegroundColor Green
Write-Host "Plugin JAR: $jarName" -ForegroundColor Cyan
Write-Host "`nNext steps for BisectHosting:" -ForegroundColor Cyan
Write-Host "1. Log into your BisectHosting control panel" -ForegroundColor White
Write-Host "2. Go to File Manager" -ForegroundColor White
Write-Host "3. Navigate to the 'plugins' folder" -ForegroundColor White
Write-Host "4. Upload $jarName" -ForegroundColor White
Write-Host "5. Restart your server" -ForegroundColor White
Write-Host "6. Configure the plugin in plugins/TwitchAnnouncer/config.yml" -ForegroundColor White
