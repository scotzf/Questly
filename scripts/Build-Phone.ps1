param([string]$DeviceId = '')
# Builds a standalone release APK from a short-path copy (C:\fp) — Windows
# native builds fail on this project's long real path — then installs it.
$ErrorActionPreference = 'Stop'
$src = Split-Path -Parent $PSScriptRoot
$dst = 'C:\fp'
$sdk = "$env:LOCALAPPDATA\Android\Sdk"
$jdk = Get-ChildItem "$env:LOCALAPPDATA\Programs\Java" -Directory | Where-Object Name -like 'jdk-17*' | Select-Object -First 1
$env:JAVA_HOME = $jdk.FullName
$env:Path = "$env:JAVA_HOME\bin;$sdk\platform-tools;$env:Path"

robocopy $src $dst /E /XD node_modules .git dist .expo android /NFL /NDL /NJH /NJS /NP | Out-Null
if ($LASTEXITCODE -ge 8) { throw "copy failed" }
Set-Location $dst
npm ci --no-audit --no-fund
if ($LASTEXITCODE) { throw "npm ci failed" }
npx.cmd expo prebuild --platform android --no-install --clean
if ($LASTEXITCODE) { throw "prebuild failed" }

# CMake 3.31+ ships a ninja that handles long Windows paths.
$esc = { param($p) $p -replace '\\', '\\' -replace ':', '\:' }
Set-Content android\local.properties -Encoding ascii -Value @(
  "sdk.dir=$(& $esc $sdk)",
  "cmake.dir=$(& $esc "$sdk\cmake\3.31.6")"
)
Set-Location android
.\gradlew.bat app:assembleRelease -x lint -x test --build-cache -PreactNativeArchitectures=arm64-v8a
if ($LASTEXITCODE) { throw "gradle failed" }

$apk = (Get-ChildItem app\build\outputs\apk\release\*.apk | Select-Object -First 1).FullName
$app = (Get-Content "$dst\app.json" -Raw | ConvertFrom-Json).expo
$copy = Join-Path ([Environment]::GetFolderPath('Desktop')) "$($app.name)-$($app.version).apk"
Copy-Item $apk $copy -Force
"APK: $copy"

$target = if ($DeviceId) { @('-s', $DeviceId) } else { @() }
$state = try { adb @target get-state 2>$null } catch { $null }
if ($state -ne 'device') { "No phone connected - skipped install"; return }
adb @target install -r $apk
if ($LASTEXITCODE) { throw "Install failed" }
adb @target shell monkey -p $app.android.package -c android.intent.category.LAUNCHER 1 | Out-Null
"Installed on phone"
