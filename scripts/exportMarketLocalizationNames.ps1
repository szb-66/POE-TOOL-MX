param(
    [Parameter(Mandatory=$true)][string]$GameDirectory,
    [Parameter(Mandatory=$true)][string]$OutputPath,
    [string]$HelperDirectory,
    [string]$InternationalCatalog
)
$ErrorActionPreference = 'Stop'
$projectRoot = Split-Path $PSScriptRoot -Parent
if (!$HelperDirectory) { $HelperDirectory = Join-Path $projectRoot '.runtime\localization-helper' }
if (!$InternationalCatalog) { $InternationalCatalog = Join-Path $projectRoot 'electron\modules\priceCheck\catalog.international.json' }
if ($PSVersionTable.PSVersion.Major -lt 7 -or [Environment]::Version.Major -lt 8) { throw 'Use PowerShell 7 with .NET 8 or later for this read-only exporter.' }
$helperRoot = [IO.Path]::GetFullPath($HelperDirectory)
$gameRoot = [IO.Path]::GetFullPath($GameDirectory)
$steamapps = Split-Path (Split-Path $gameRoot -Parent) -Parent
if ((Split-Path (Split-Path $gameRoot -Parent) -Leaf) -ne 'common' -or (Split-Path $steamapps -Leaf) -ne 'steamapps') { throw 'Select the Steam steamapps/common game directory.' }
$manifestPath = Join-Path $steamapps 'appmanifest_238960.acf'
$manifestText = [IO.File]::ReadAllText($manifestPath)
function Get-MarketManifestValue([string]$Key) { [regex]::Match($manifestText, '"' + [regex]::Escape($Key) + '"\s+"([^"]*)"').Groups[1].Value }
$buildId = Get-MarketManifestValue 'buildid'
if ((Get-MarketManifestValue 'appid') -ne '238960' -or (Get-MarketManifestValue 'installdir') -ne (Split-Path $gameRoot -Leaf) -or $buildId -ne '26694821') { throw 'The official name reader only supports Steam Build 26694821.' }
$executable = Join-Path $gameRoot 'PathOfExileSteam.exe'
$executableHash = (Get-FileHash -Algorithm SHA256 -LiteralPath $executable).Hash.ToLowerInvariant()
if ($executableHash -ne '7f762cadbe0a7315091e105121010d2f35296db8046294e0bf49aacfff67db3c') { throw 'The official name reader is pinned to the known Steam Build 26694821 executable.' }
$indexPath = Join-Path $gameRoot 'Bundles2\_.index.bin'
$indexHash = (Get-FileHash -Algorithm SHA256 -LiteralPath $indexPath).Hash.ToLowerInvariant()
$catalog = [IO.File]::ReadAllText($InternationalCatalog) | ConvertFrom-Json
$needed = [Collections.Generic.HashSet[string]]::new([StringComparer]::Ordinal)
foreach ($item in $catalog.items) {
    if ($item.name) { [void]$needed.Add([string]$item.name) }
    if ($item.baseType) { [void]$needed.Add([string]$item.baseType) }
}
Add-Type -TypeDefinition 'using System.Runtime.InteropServices; public static class MarketNameExportNative { [DllImport("kernel32", CharSet=CharSet.Unicode)] public static extern bool SetDllDirectory(string path); }'
[MarketNameExportNative]::SetDllDirectory($helperRoot) | Out-Null
[Reflection.Assembly]::LoadFrom((Join-Path $helperRoot 'SystemExtensions.dll')) | Out-Null
$assembly = [Reflection.Assembly]::LoadFrom((Join-Path $helperRoot 'LocalizationHelper.dll'))
$open = $assembly.GetType('LocalizationHelper.Program').GetMethod('Open', [Reflection.BindingFlags]'NonPublic,Static')
$index = $open.Invoke($null, @($gameRoot, $true, $null))
$entries = [Collections.Generic.List[object]]::new()
$reports = [Collections.Generic.List[object]]::new()
try {
    $schemas = [System.Text.Json.Nodes.JsonNode]::Parse([IO.File]::ReadAllText((Join-Path $helperRoot 'schema.json')))
    foreach ($definition in @(
        @{table='baseitemtypes'; fields=@('Name')},
        @{table='words'; fields=@('Text2','Text')},
        @{table='achievementitems'; fields=@('Name')}
    )) {
        $name = $definition.table
        $schema = @($schemas['tables'].AsArray() | Where-Object { $_['name'].GetValue[string]().ToLowerInvariant() -eq $name })[0]
        if (!$schema) { throw "Missing known schema: $name" }
        $englishFile=$null; $frenchFile=$null
        if (!$index.TryGetFile("data/$name.datc64", [ref]$englishFile) -or !$index.TryGetFile("data/french/$name.datc64", [ref]$frenchFile)) {
            throw "Missing official name table: $name"
        }
        $english = [LocalizationHelper.DatTable]::new($englishFile.Read().ToArray(), $schema, 2)
        $french = [LocalizationHelper.DatTable]::new($frenchFile.Read().ToArray(), $schema, 2)
        $count = 0
        foreach ($id in $english.RowsById.Keys) {
            if (!$french.RowsById.ContainsKey($id)) { continue }
            foreach ($field in $definition.fields) {
                $en = $english.ReadText($id, $field)
                if (!$needed.Contains($en)) { continue }
                $fr = $french.ReadText($id, $field)
                if ([string]::IsNullOrWhiteSpace($fr)) { continue }
                $entries.Add(@{table=$name; id=$id; field=$field; en=$en; fr=$fr})
                $count++
            }
        }
        $reports.Add(@{table=$name; englishRows=$english.RowCount; frenchRows=$french.RowCount; matchedEntries=$count})
    }
} finally { $index.Dispose() }
if ((Get-FileHash -Algorithm SHA256 -LiteralPath $indexPath).Hash.ToLowerInvariant() -ne $indexHash) { throw 'The game resource index changed during extraction; output was not saved.' }
if ([IO.File]::ReadAllText($manifestPath) -ne $manifestText -or (Get-FileHash -Algorithm SHA256 -LiteralPath $executable).Hash.ToLowerInvariant() -ne $executableHash) { throw 'The Steam manifest or executable changed during extraction; output was not saved.' }
$result = @{
    schemaVersion=1; game='poe1'; gameVersion='3.30.0b'; buildId=$buildId; locale='fr';
    executableSha256=$executableHash; indexSha256=$indexHash;
    entries=@($entries | Sort-Object table,id,field); report=@($reports)
}
$output = [IO.Path]::GetFullPath($OutputPath)
[IO.Directory]::CreateDirectory([IO.Path]::GetDirectoryName($output)) | Out-Null
[IO.File]::WriteAllText($output, ($result | ConvertTo-Json -Depth 8), [Text.UTF8Encoding]::new($false))
@{entries=$entries.Count; tables=@($reports); output=$output} | ConvertTo-Json -Depth 5 -Compress
