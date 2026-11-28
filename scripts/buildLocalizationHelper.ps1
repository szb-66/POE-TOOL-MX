param([string]$Dotnet = '', [switch]$SkipPublish)
$ErrorActionPreference = 'Stop'
$projectRoot = Split-Path $PSScriptRoot -Parent
$cacheRoot = Join-Path $projectRoot '.cache\localization-build'
$helperRoot = Join-Path $projectRoot 'electron\native\localization-helper'
$runtimeRoot = Join-Path $projectRoot '.runtime\localization-helper'
New-Item -ItemType Directory -Path $cacheRoot,$runtimeRoot -Force | Out-Null
$bundleCommit = '50c2d279b3806366f79e831acc1c03bc35bb6442'
$codecCommit = '05038060aa68f9187ae9923b2388ca8db40e58d1'
$bundleRoot = Join-Path $cacheRoot 'LibGGPK3'
if (!(Test-Path -LiteralPath (Join-Path $bundleRoot '.git'))) {
    & git clone --depth 1 --branch v2.7.5 'https://github.com/aianlinb/LibGGPK3.git' $bundleRoot
    if ($LASTEXITCODE -ne 0) { throw 'LibBundle3 download failed' }
}
if ((& git -C $bundleRoot rev-parse HEAD).Trim() -ne $bundleCommit) { throw 'LibBundle3 source revision mismatch' }
$indexSourcePath = Join-Path $bundleRoot 'LibBundle3\Index.cs'
$indexSource = [IO.File]::ReadAllText($indexSourcePath)
$oldPrefix = 'private const string CUSTOM_BUNDLE_BASE_PATH = "LibGGPK3/";'
$newPrefix = 'public static string CUSTOM_BUNDLE_BASE_PATH = "PoEHelper/";'
if (!$indexSource.Contains($oldPrefix) -and !$indexSource.Contains($newPrefix)) { throw 'LibBundle3 customization boundary changed' }
[IO.File]::WriteAllText($indexSourcePath,$indexSource.Replace($oldPrefix,$newPrefix))
$codecRoot = Join-Path $cacheRoot 'ooz-sources'
New-Item -ItemType Directory -Path $codecRoot -Force | Out-Null
foreach ($sourceName in @('kraken.cpp','stdafx.h','targetver.h','bitknit.cpp','lzna.cpp')) {
    $sourcePath = Join-Path $codecRoot $sourceName
    if (!(Test-Path -LiteralPath $sourcePath)) {
        for ($attempt = 1; $attempt -le 3; $attempt++) {
            try {
                Invoke-WebRequest -UseBasicParsing -Uri "https://raw.githubusercontent.com/powzix/ooz/$codecCommit/$sourceName" -OutFile $sourcePath
                break
            } catch {
                if ($attempt -eq 3) { throw }
                Start-Sleep -Seconds 3
            }
        }
    }
}
$decoderSource = [IO.File]::ReadAllText((Join-Path $codecRoot 'kraken.cpp'))
$decoderEnd = $decoderSource.IndexOf('// The decompressor will write outside')
if ($decoderEnd -lt 0) { throw 'ooz library source boundary changed' }
[IO.File]::WriteAllText((Join-Path $codecRoot 'decoder.cpp'),$decoderSource.Substring(0,$decoderEnd))
$vswhere = Join-Path ${env:ProgramFiles(x86)} 'Microsoft Visual Studio\Installer\vswhere.exe'
if (!(Test-Path -LiteralPath $vswhere)) { throw 'Visual Studio C++ Build Tools are required for the codec build' }
$visualStudio = (& $vswhere -latest -prerelease -products '*' -requires Microsoft.VisualStudio.Component.VC.Tools.x86.x64 -property installationPath | Select-Object -First 1).Trim()
$vcvars = Join-Path $visualStudio 'VC\Auxiliary\Build\vcvars64.bat'
if (!(Test-Path -LiteralPath $vcvars)) { throw 'C++ x64 build tools not found' }
$bridge = Join-Path $helperRoot 'CodecBridge.cpp'
$decoder = Join-Path $codecRoot 'decoder.cpp'
$bitknit = Join-Path $codecRoot 'bitknit.cpp'
$lzna = Join-Path $codecRoot 'lzna.cpp'
$codecDll = Join-Path $cacheRoot 'oo2core.dll'
Push-Location $cacheRoot
try {
    # All paths are locally resolved; no user-provided command text is interpolated.
    $buildCommand = '"' + $vcvars + '" && cl /nologo /std:c++17 /EHsc /O2 /MT /LD /I"' + $codecRoot + '" "' + $bridge + '" "' + $decoder + '" "' + $bitknit + '" "' + $lzna + '" /link /OUT:"' + $codecDll + '"'
    & cmd.exe /d /s /c $buildCommand
    if ($LASTEXITCODE -ne 0) { throw 'Open source codec build failed' }
} finally { Pop-Location }
if (!$Dotnet) {
    $localSdk = Join-Path $cacheRoot 'dotnet\dotnet.exe'
    $Dotnet = if (Test-Path -LiteralPath $localSdk) { $localSdk } else { (Get-Command dotnet -ErrorAction Stop).Source }
}
if ($SkipPublish) {
    & $Dotnet build (Join-Path $helperRoot 'LocalizationHelper.csproj') -c Release --nologo
    if ($LASTEXITCODE -ne 0) { throw 'Helper build failed' }
    Copy-Item -LiteralPath $codecDll -Destination (Join-Path $helperRoot 'bin\Release\net8.0\oo2core.dll')
} else {
    & $Dotnet publish (Join-Path $helperRoot 'LocalizationHelper.csproj') -c Release -r win-x64 --self-contained true -o $runtimeRoot --nologo
    if ($LASTEXITCODE -ne 0) { throw 'Helper publish failed' }
    Copy-Item -LiteralPath $codecDll -Destination (Join-Path $runtimeRoot 'oo2core.dll')
    Copy-Item -LiteralPath (Join-Path $bundleRoot 'LICENSE') -Destination (Join-Path $runtimeRoot 'LibBundle3-LICENSE.txt')
    Copy-Item -LiteralPath (Join-Path $projectRoot 'LICENSE.md') -Destination (Join-Path $runtimeRoot 'ooz-LICENSE.txt')
    $schemaHasher = [Security.Cryptography.SHA256]::Create()
    try {
        $schemaHash = [BitConverter]::ToString($schemaHasher.ComputeHash([IO.File]::ReadAllBytes((Join-Path $helperRoot 'schema.json')))).Replace('-','').ToLowerInvariant()
        $sourceSchemaHash = [BitConverter]::ToString($schemaHasher.ComputeHash([IO.File]::ReadAllBytes((Join-Path $helperRoot 'source-schema-cn.json')))).Replace('-','').ToLowerInvariant()
    }
    finally { $schemaHasher.Dispose() }
    $metadata = @{ protocolVersion=1; engineVersion=1; libBundleCommit=$bundleCommit; codecCommit=$codecCommit; schemaSha256=$schemaHash; sourceSchemaSha256=$sourceSchemaHash; codec='open-source-ooz-with-raw-frame-writer' }
    [IO.File]::WriteAllText((Join-Path $runtimeRoot 'dependencies.json'),($metadata | ConvertTo-Json),[Text.UTF8Encoding]::new($false))
    Write-Output 'Localization helper ready; run its self-test before applying to a game.'
    & (Join-Path $PSScriptRoot 'buildMarketLocalization.ps1')
}
