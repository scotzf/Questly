param([string]$DeviceId = '')
$ErrorActionPreference = 'Stop'

# winget adds scrcpy to PATH only for shells started after the install.
$scrcpy = (Get-Command scrcpy -ErrorAction SilentlyContinue).Source
if (-not $scrcpy) {
  $scrcpy = Get-ChildItem "$env:LOCALAPPDATA\Microsoft\WinGet\Packages\Genymobile.scrcpy*" -Recurse -Filter scrcpy.exe |
    Select-Object -First 1 -ExpandProperty FullName
}
$adb = "$env:LOCALAPPDATA\Android\Sdk\platform-tools\adb.exe"
$env:ADB = $adb

$args = @('--window-title', 'FocusPal phone', '--stay-awake', '--max-size', '1600')
if ($DeviceId) { $args += @('--serial', $DeviceId) }
& $scrcpy @args
