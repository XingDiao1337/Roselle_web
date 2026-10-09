$ErrorActionPreference = 'Stop'
$webRoot = Split-Path -Parent $PSScriptRoot
$pidFile = Join-Path $webRoot 'logs/web.pid'
if (!(Test-Path -LiteralPath $pidFile)) { Write-Output 'No recorded frontend process.'; exit 0 }
$recordedPid = [int](Get-Content -LiteralPath $pidFile)
$running = Get-CimInstance Win32_Process -Filter "ProcessId=$recordedPid"
if ($running.CommandLine -like '*vite/bin/vite.js*') { Stop-Process -Id $recordedPid; Write-Output 'Frontend stopped.' }
