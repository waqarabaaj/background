# Registers a silent Windows startup entry for the Homepage Telemetry Helper
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$projectRoot = Split-Path -Parent $scriptDir
$serverScript = Join-Path $projectRoot "helper\server.mjs"
$nodePath = (Get-Command node).Source

$startupFolder = [Environment]::GetFolderPath("Startup")
$vbsPath = Join-Path $startupFolder "WaqarHomepageHelper.vbs"

$vbsContent = @"
Set WshShell = CreateObject("WScript.Shell")
WshShell.Run """$nodePath"" ""$serverScript""", 0, False
"@

Set-Content -Path $vbsPath -Value $vbsContent -Encoding ASCII
Write-Host "Installed silent startup launcher at: $vbsPath"
Write-Host "Starting helper now..."
Start-Process -WindowStyle Hidden -FilePath $nodePath -ArgumentList "`"$serverScript`""
Write-Host "Done! Telemetry server is live at http://127.0.0.1:4789/api/metrics"
