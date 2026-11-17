param(
    [Parameter(Mandatory=$true)][string]$GameDirectory,
    [Parameter(Mandatory=$true)][string]$OutputPath,
    [string]$HelperDirectory
)
$ErrorActionPreference = 'Stop'
$projectRoot = Split-Path $PSScriptRoot -Parent
if (!$HelperDirectory) { $HelperDirectory = Join-Path $projectRoot '.runtime\localization-helper' }
if ($PSVersionTable.PSVersion.Major -lt 7 -or [Environment]::Version.Major -lt 8) { throw 'Use PowerShell 7 with .NET 8 or later for this read-only exporter.' }
$gameRoot = [IO.Path]::GetFullPath($GameDirectory)
$helperRoot = [IO.Path]::GetFullPath($HelperDirectory)
$indexPath = Join-Path $gameRoot 'Bundles2\_.index.bin'
$indexHash = (Get-FileHash -Algorithm SHA256 -LiteralPath $indexPath).Hash.ToLowerInvariant()
$manifestPath = Join-Path (Split-Path (Split-Path $gameRoot -Parent) -Parent) 'appmanifest_238960.acf'
$manifest = [IO.File]::ReadAllText($manifestPath)
if ([regex]::Match($manifest,'"appid"\s+"([^"]+)"').Groups[1].Value -ne '238960') { throw 'Select the Steam POE1 game directory.' }
$buildId = [regex]::Match($manifest,'"buildid"\s+"([^"]+)"').Groups[1].Value
Add-Type -TypeDefinition 'using System.Runtime.InteropServices; public static class MarketStatExportNative { [DllImport("kernel32", CharSet=CharSet.Unicode)] public static extern bool SetDllDirectory(string path); }'
[MarketStatExportNative]::SetDllDirectory($helperRoot) | Out-Null
[Reflection.Assembly]::LoadFrom((Join-Path $helperRoot 'SystemExtensions.dll')) | Out-Null
$assembly = [Reflection.Assembly]::LoadFrom((Join-Path $helperRoot 'LocalizationHelper.dll'))
$open = $assembly.GetType('LocalizationHelper.Program').GetMethod('Open',[Reflection.BindingFlags]'NonPublic,Static')
$index = $open.Invoke($null,@($gameRoot,$true,$null))
$templates = [Collections.Generic.List[object]]::new()
$sources = [Collections.Generic.List[object]]::new()
$type = $assembly.GetType('LocalizationHelper.StatDescriptions')
$descriptions = $type.GetField('descriptions',[Reflection.BindingFlags]'NonPublic,Instance')
$sameShape = $type.GetMethod('SameShape',[Reflection.BindingFlags]'NonPublic,Static')
try {
    foreach ($file in @($index.Files.Values | Where-Object { $_.Path -like 'metadata/statdescriptions/*.csd' } | Sort-Object Path)) {
        $bytes = $file.Read().ToArray()
        $parsed = [Activator]::CreateInstance($type,@(,[byte[]]$bytes))
        $count = 0
        foreach ($description in $descriptions.GetValue($parsed)) {
            $languages = $description.GetType().GetProperty('Languages').GetValue($description)
            if (!$languages.ContainsKey('French')) { continue }
            $english = $languages['English']; $french = $languages['French']
            if (!$sameShape.Invoke($null,@($english,$french))) { continue }
            for ($variant=0; $variant -lt $english.Count; $variant++) {
                $en=$english[$variant].GetType().GetProperty('Text').GetValue($english[$variant])
                $fr=$french[$variant].GetType().GetProperty('Text').GetValue($french[$variant])
                if ([string]::IsNullOrWhiteSpace($en) -or [string]::IsNullOrWhiteSpace($fr)) { continue }
                $templates.Add(@{table=$file.Path;id=$description.GetType().GetProperty('Id').GetValue($description);variant=$variant;en=$en;fr=$fr})
                $count++
            }
        }
        $sources.Add(@{table=$file.Path;sha256=[Convert]::ToHexString([Security.Cryptography.SHA256]::HashData($bytes)).ToLowerInvariant();templates=$count})
    }
} finally { $index.Dispose() }
if ((Get-FileHash -Algorithm SHA256 -LiteralPath $indexPath).Hash.ToLowerInvariant() -ne $indexHash -or [IO.File]::ReadAllText($manifestPath) -ne $manifest) { throw 'The game resource index or manifest changed during extraction.' }
$result = @{schemaVersion=1;game='poe1';locale='fr';buildId=$buildId;indexSha256=$indexHash;sources=@($sources);entries=@($templates)}
$output = [IO.Path]::GetFullPath($OutputPath)
[IO.Directory]::CreateDirectory([IO.Path]::GetDirectoryName($output)) | Out-Null
[IO.File]::WriteAllText($output,($result | ConvertTo-Json -Depth 8),[Text.UTF8Encoding]::new($false))
@{templates=$templates.Count;tables=$sources.Count;output=$output} | ConvertTo-Json -Compress
