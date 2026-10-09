param([switch]$SkipBuild)
$ErrorActionPreference = 'Stop'
$webRoot = Split-Path -Parent $PSScriptRoot
Set-Location -LiteralPath $webRoot
New-Item -ItemType Directory -Path logs -Force | Out-Null
if (Test-Path logs/web.pid) {
    $recordedPid = [int](Get-Content logs/web.pid)
    $running = Get-CimInstance Win32_Process -Filter "ProcessId=$recordedPid"
    if ($running.CommandLine -like '*vite/bin/vite.js*') { Write-Output 'Frontend already running: http://127.0.0.1:5173'; exit 0 }
}
if (Get-NetTCPConnection -LocalPort 5173 -State Listen -ErrorAction SilentlyContinue) { throw 'Port 5173 is occupied.' }
if (!(Test-Path node_modules)) { & npm.cmd ci; if ($LASTEXITCODE -ne 0) { throw 'Frontend dependency install failed.' } }
if (!$SkipBuild) { & npm.cmd run build; if ($LASTEXITCODE -ne 0) { throw 'Frontend build failed.' } }
$nodeExe = (Get-Command node.exe).Source
$service = Start-Process -FilePath $nodeExe -ArgumentList 'node_modules/vite/bin/vite.js','--host','127.0.0.1','--port','5173' -WorkingDirectory $webRoot -WindowStyle Hidden -RedirectStandardOutput logs/web.log -RedirectStandardError logs/web-error.log -PassThru
Set-Content -LiteralPath logs/web.pid -Value $service.Id
Write-Output 'Frontend started: http://127.0.0.1:5173'
