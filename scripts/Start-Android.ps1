param([string]$DeviceId = '')
$ErrorActionPreference = 'Stop'
Set-Location -LiteralPath (Split-Path -Parent $PSScriptRoot)

# Prefer the compatible local JDK without changing machine-wide Java settings.
$jdk = Get-ChildItem -LiteralPath "$env:LOCALAPPDATA\Programs\Java" -Directory -ErrorAction SilentlyContinue |
  Where-Object { $_.Name -like 'jdk-17*' } | Select-Object -First 1
if ($jdk) {
  $env:JAVA_HOME = $jdk.FullName
  $env:Path = "$env:JAVA_HOME\bin;$env:Path"
}
$env:REACT_NATIVE_PACKAGER_HOSTNAME = '127.0.0.1'
if ($DeviceId) {
  adb -s $DeviceId reverse tcp:8081 tcp:8081
  npx.cmd expo run:android --device $DeviceId --port 8081
} else {
  adb reverse tcp:8081 tcp:8081
  npx.cmd expo run:android --device --port 8081
}
