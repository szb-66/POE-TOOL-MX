param([Parameter(Mandatory=$true)][string]$SteamGameDirectory,[string]$CnGameDirectory,[Parameter(Mandatory=$true)][string]$OutputPath)
$ErrorActionPreference = 'Stop'
$projectRoot = Split-Path $PSScriptRoot -Parent
$helper = Join-Path $projectRoot '.runtime\localization-helper\LocalizationHelper.exe'
if (!(Test-Path -LiteralPath $helper)) { throw 'Run scripts/buildLocalizationHelper.ps1 first' }
$request = @{ protocolVersion=1; operation='export'; gameDirectory=[IO.Path]::GetFullPath($SteamGameDirectory); outputPath=[IO.Path]::GetFullPath($OutputPath) }
if ($CnGameDirectory) { $request.cnGameDirectory=[IO.Path]::GetFullPath($CnGameDirectory) }
$previousEncoding = $OutputEncoding
try { $OutputEncoding=[Text.UTF8Encoding]::new($false); $request | ConvertTo-Json -Compress | & $helper; if ($LASTEXITCODE -ne 0) { throw 'Official resource export failed; game files were not modified' } }
finally { $OutputEncoding=$previousEncoding }
