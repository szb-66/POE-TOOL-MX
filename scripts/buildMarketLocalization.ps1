param([switch]$SelfTestOnly,[string]$OutputDirectory = '')
$ErrorActionPreference = 'Stop'
function Get-MarketFileSha256([string]$File) {
    $hasher = [Security.Cryptography.SHA256]::Create()
    $stream = [IO.File]::OpenRead($File)
    try { [BitConverter]::ToString($hasher.ComputeHash($stream)).Replace('-','').ToLowerInvariant() }
    finally { $stream.Dispose(); $hasher.Dispose() }
}
$projectRoot = Split-Path $PSScriptRoot -Parent
$sourceRoot = Join-Path $projectRoot 'electron\native\market-localization'
$cacheRoot = Join-Path $projectRoot '.cache\native-market'
$buildRoot = Join-Path $cacheRoot 'build'
$runtimeRoot = if ($OutputDirectory) { [IO.Path]::GetFullPath($OutputDirectory) } else { Join-Path $projectRoot '.runtime\localization-helper' }
$minhook = Join-Path $cacheRoot 'minhook'
$jsonRoot = Join-Path $cacheRoot 'json'
New-Item -ItemType Directory -Path $buildRoot,$runtimeRoot,$jsonRoot -Force | Out-Null
$commit = 'c3fcafdc10146beb5919319d0683e44e3c30d537'
if (!(Test-Path -LiteralPath (Join-Path $minhook '.git'))) {
    & git clone --depth 1 --branch v1.3.4 'https://github.com/TsudaKageyu/minhook.git' $minhook
    if ($LASTEXITCODE -ne 0) { throw 'MinHook source download failed' }
}
if ((& git -C $minhook rev-parse HEAD).Trim() -ne $commit) { throw 'MinHook source revision mismatch' }
$jsonHeader = Join-Path $jsonRoot 'json.hpp'
if (!(Test-Path -LiteralPath $jsonHeader)) {
    for ($attempt = 1; $attempt -le 3; $attempt++) {
        try {
            Invoke-WebRequest -UseBasicParsing -Uri 'https://raw.githubusercontent.com/nlohmann/json/v3.11.3/single_include/nlohmann/json.hpp' -OutFile $jsonHeader
            break
        } catch {
            if ($attempt -eq 3) { throw }
            Start-Sleep -Seconds 3
        }
    }
}
if ((Get-MarketFileSha256 $jsonHeader) -ne '9bea4c8066ef4a1c206b2be5a36302f8926f7fdc6087af5d20b417d0cf103ea6') { throw 'JSON header revision mismatch' }
$jsonLicense = Join-Path $jsonRoot 'LICENSE.MIT'
if (!(Test-Path -LiteralPath $jsonLicense)) {
    for ($attempt = 1; $attempt -le 3; $attempt++) {
        try {
            Invoke-WebRequest -UseBasicParsing -Uri 'https://raw.githubusercontent.com/nlohmann/json/v3.11.3/LICENSE.MIT' -OutFile $jsonLicense
            break
        } catch {
            if ($attempt -eq 3) { throw }
            Start-Sleep -Seconds 3
        }
    }
}
$profilePath = Join-Path $sourceRoot 'compatibility.json'
$profile = Get-Content -LiteralPath $profilePath -Raw | ConvertFrom-Json
if ($profile.structureVersion -ne 1 -or $profile.abi -ne 'poe1-market-json16-msvc-string32-v1') { throw 'Unknown market ABI family' }
$header = [Collections.Generic.List[string]]::new()
$header.Add('#pragma once')
$header.Add('#include <cstdint>')
$header.Add('#include <cstddef>')
$header.Add('namespace market {')
$header.Add('struct Site { uintptr_t returnRva; const char* section; const char* field; uintptr_t contextRva=0; const unsigned char* contextBytes=nullptr; size_t contextSize=0; };')
$header.Add('struct MethodProfile { uintptr_t rva; const unsigned char* prologue; size_t prologueSize; const unsigned char* body; size_t bodySize; };')
$header.Add('constexpr const char* StructureAbi = "' + $profile.abi + '";')
$header.Add('constexpr uint32_t ImageTimestamp = ' + $profile.image.timeDateStamp + ';')
$header.Add('constexpr uint32_t ImageSize = ' + $profile.image.sizeOfImage + ';')
$methods = @(@('Lookup','lookup'),@('Builder','searchBuilder'),@('StringCtor','stringCtor'),@('StringDtor','stringDtor'),@('ItemsReader','itemsReader'),@('StatsReader','statsReader'),@('FiltersReader','filtersReader'))
foreach ($pair in $methods) {
    $entry = $profile.($pair[1])
    $header.Add('constexpr uintptr_t ' + $pair[0] + 'Rva = ' + $entry.rva + ';')
    $bytes = [regex]::Matches($entry.prologue,'[a-fA-F0-9]{2}') | ForEach-Object { '0x' + $_.Value }
    $header.Add('constexpr unsigned char ' + $pair[0] + 'Prologue[] = {' + ($bytes -join ',') + '};')
    if ($entry.bodyBytes -notmatch '^(?:[a-fA-F0-9]{2})+$') { throw 'Missing complete market function bytes' }
    $bodyBytes = [byte[]]([regex]::Matches($entry.bodyBytes,'[a-fA-F0-9]{2}') | ForEach-Object { [Convert]::ToByte($_.Value,16) })
    $bodyHasher = [Security.Cryptography.SHA256]::Create()
    try { $bodyHash = [BitConverter]::ToString($bodyHasher.ComputeHash($bodyBytes)).Replace('-','').ToLowerInvariant() } finally { $bodyHasher.Dispose() }
    if ($bodyBytes.Length -ne $entry.bodySize -or $bodyHash -ne $entry.bodySha256 -or !$entry.bodyBytes.StartsWith($entry.prologue)) { throw 'Complete market function fingerprint mismatch' }
    $bodyValues = $bodyBytes | ForEach-Object { '0x' + $_.ToString('x2') }
    $header.Add('constexpr unsigned char ' + $pair[0] + 'Body[] = {' + ($bodyValues -join ',') + '};')
}
$header.Add('constexpr MethodProfile Methods[] = {')
foreach ($pair in $methods) { $name = $pair[0]; $header.Add('{' + $name + 'Rva,' + $name + 'Prologue,sizeof(' + $name + 'Prologue),' + $name + 'Body,sizeof(' + $name + 'Body)},') }
$header.Add('};')
$siteIndex = 0
foreach ($site in $profile.sites) {
    $contextBytes = [regex]::Matches($site.contextBytes,'[a-fA-F0-9]{2}') | ForEach-Object { '0x' + $_.Value }
    $header.Add('constexpr unsigned char SiteContext' + $siteIndex + '[] = {' + ($contextBytes -join ',') + '};')
    $siteIndex++
}
$header.Add('constexpr Site Sites[] = {')
$siteIndex = 0
foreach ($site in $profile.sites) {
    $header.Add('{' + $site.returnRva + ',"' + $site.section + '","' + $site.field + '",' + $site.contextRva + ',SiteContext' + $siteIndex + ',sizeof(SiteContext' + $siteIndex + ')},')
    $siteIndex++
}
$header.Add('}; }')
$filterTitles = @($profile.sites | Where-Object { $_.section -eq 'filters' -and $_.field -eq 'title' })
$filterTexts = @($profile.sites | Where-Object { $_.section -eq 'filters' -and $_.field -eq 'text' })
if ($filterTitles.Count -ne 1 -or $filterTexts.Count -ne 2) { throw 'Market filter scope call sites are incomplete' }
$header.Add('namespace market {')
$header.Add('constexpr uintptr_t FilterTitleReturn = ' + $filterTitles[0].returnRva + ';')
$header.Add('constexpr uintptr_t FilterTextReturn = ' + $filterTexts[0].returnRva + ';')
$header.Add('constexpr uintptr_t FilterOptionTextReturn = ' + $filterTexts[1].returnRva + ';')
$header.Add('}')
[IO.File]::WriteAllLines((Join-Path $buildRoot 'SupportedProfile.h'),$header,[Text.UTF8Encoding]::new($false))
$vswhere = Join-Path ${env:ProgramFiles(x86)} 'Microsoft Visual Studio\Installer\vswhere.exe'
$visualStudio = (& $vswhere -latest -prerelease -products '*' -requires Microsoft.VisualStudio.Component.VC.Tools.x86.x64 -property installationPath | Select-Object -First 1).Trim()
$vcvars = Join-Path $visualStudio 'VC\Auxiliary\Build\vcvars64.bat'
if (!(Test-Path -LiteralPath $vcvars)) { throw 'C++ x64 build tools not found' }
$common = '/nologo /std:c++17 /EHsc /O2 /MT /utf-8 /I"' + (Join-Path $minhook 'include') + '" /I"' + $jsonRoot + '" /I"' + $buildRoot + '" "' + (Join-Path $sourceRoot 'MarketHook.cpp') + '" "' + (Join-Path $minhook 'src\buffer.c') + '" "' + (Join-Path $minhook 'src\hook.c') + '" "' + (Join-Path $minhook 'src\trampoline.c') + '" "' + (Join-Path $minhook 'src\hde\hde64.c') + '"'
Push-Location $buildRoot
try {
    $testExe = Join-Path $buildRoot 'MarketLocalizationSelfTest.exe'
    & cmd.exe /d /s /c ('"' + $vcvars + '" && cl ' + $common + ' /DMARKET_SELF_TEST /Fe:"' + $testExe + '"')
    if ($LASTEXITCODE -ne 0) { throw 'Market self-test build failed' }
    & $testExe
    if ($LASTEXITCODE -ne 0) { throw 'Market self-test failed' }
    if (!$SelfTestOnly) {
        $dll = Join-Path $runtimeRoot 'MarketLocalizationHook.dll'
        & cmd.exe /d /s /c ('"' + $vcvars + '" && cl ' + $common + ' /LD /link /OUT:"' + $dll + '"')
        if ($LASTEXITCODE -ne 0) { throw 'Market DLL build failed' }
        Copy-Item -LiteralPath $profilePath -Destination (Join-Path $runtimeRoot 'market-compatibility.json')
        Copy-Item -LiteralPath (Join-Path $minhook 'LICENSE.txt') -Destination (Join-Path $runtimeRoot 'MinHook-LICENSE.txt')
        Copy-Item -LiteralPath $jsonLicense -Destination (Join-Path $runtimeRoot 'nlohmann-json-LICENSE.txt')
        Copy-Item -LiteralPath $testExe -Destination (Join-Path $runtimeRoot 'MarketLocalizationSelfTest.exe')
        $metadata = @{ protocolVersion=1; minhookCommit=$commit; jsonVersion='3.11.3'; dllSha256=(Get-MarketFileSha256 $dll); profileSha256=(Get-MarketFileSha256 $profilePath); selfTestSha256=(Get-MarketFileSha256 $testExe) }
        [IO.File]::WriteAllText((Join-Path $runtimeRoot 'market-dependencies.json'),($metadata | ConvertTo-Json),[Text.UTF8Encoding]::new($false))
    }
} finally { Pop-Location }
