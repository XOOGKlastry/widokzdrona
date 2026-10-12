$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Windows.Forms
if (-not (Get-Command exiftool -ErrorAction SilentlyContinue)) { throw 'ExifTool is not in PATH.' }
$index = Join-Path $PSScriptRoot 'index.html'
if (-not (Test-Path $index)) { throw 'Put Start-Widok.ps1 next to index.html.' }
$origin = 'http://localhost:8765'
$token = [Guid]::NewGuid().ToString('N')
$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add("$origin/")
$listener.Start()
$videoPath = $null
$videoId = $null
function Send-Json($context, $data, $code = 200) {
    $bytes = [Text.Encoding]::UTF8.GetBytes((ConvertTo-Json -InputObject $data -Depth 12 -Compress))
    $context.Response.StatusCode = $code
    $context.Response.ContentType = 'application/json; charset=utf-8'
    $context.Response.ContentLength64 = $bytes.Length
    $context.Response.OutputStream.Write($bytes,0,$bytes.Length)
}
function Read-Telemetry([string]$path) {
    $lines = & exiftool -ee -n -j -G3 -SampleTime -SampleDuration -GPSLatitude -GPSLongitude -GimbalYaw -GimbalPitch -Protocol -- $path
    if ($LASTEXITCODE -ne 0) { throw 'ExifTool could not read this film.' }
    $raw = ($lines -join [Environment]::NewLine) | ConvertFrom-Json
    $groups = @{}
    foreach ($p in $raw[0].PSObject.Properties) {
        $parts = $p.Name -split ':'
        if ($parts.Length -lt 2) { continue }
        $tag = $parts[-1]
        $doc = ($parts[0..($parts.Length-2)] -join ':')
        if (-not $groups.ContainsKey($doc)) { $groups[$doc] = @{} }
        $groups[$doc][$tag] = $p.Value
    }
    $rows = @()
    foreach ($g in $groups.Values) {
        if (-not $g.ContainsKey('SampleTime')) { continue }
        $row = @{start=[double]$g.SampleTime; end=$null; lat=$null; lon=$null; yaw=$null; pitch=$null}
        if ($g.ContainsKey('SampleDuration')) { $row.end = $row.start + [double]$g.SampleDuration }
        if ($g.ContainsKey('GPSLatitude')) { $row.lat = [double]$g.GPSLatitude }
        if ($g.ContainsKey('GPSLongitude')) { $row.lon = [double]$g.GPSLongitude }
        if ($g.ContainsKey('GimbalYaw')) { $row.yaw = (([double]$g.GimbalYaw % 360)+360)%360 }
        if ($g.ContainsKey('GimbalPitch')) { $row.pitch = [double]$g.GimbalPitch }
        $rows += [PSCustomObject]$row
    }
    $rows = @($rows | Sort-Object start)
    for ($i=0; $i -lt $rows.Count; $i++) {
        if ($null -eq $rows[$i].end -or $rows[$i].end -le $rows[$i].start) {
            if ($i+1 -lt $rows.Count -and ($rows[$i+1].start-$rows[$i].start) -le 1) { $rows[$i].end=$rows[$i+1].start }
            else { $rows[$i].end=$rows[$i].start+0.1 }
        }
    }
    return ,$rows
}
Write-Host "Widok z drona: $origin - close this window to stop."
Start-Process "$origin/?token=$token"
try {
while ($listener.IsListening) {
    $ctx=$listener.GetContext()
    try {
        $req=$ctx.Request
        if ($req.Headers['Host'] -ne 'localhost:8765') { Send-Json $ctx @{error='Invalid host'} 403; continue }
        $route=$req.Url.AbsolutePath
        if ($route -eq '/' -and $req.HttpMethod -eq 'GET') {
            $bytes=[IO.File]::ReadAllBytes($index)
            $ctx.Response.ContentType='text/html; charset=utf-8'
            $ctx.Response.ContentLength64=$bytes.Length
            $ctx.Response.OutputStream.Write($bytes,0,$bytes.Length)
        } elseif ($route -eq '/open' -and $req.HttpMethod -eq 'POST') {
            if ($req.Headers['Origin'] -ne $origin -or $req.Headers['X-Widok-Token'] -ne $token) { Send-Json $ctx @{error='Invalid session'} 403; continue }
            $dialog=New-Object System.Windows.Forms.OpenFileDialog
            $dialog.Filter='Drone films|*.mp4;*.mov'
            $dialog.Title='Select an original DJI film'
            if ($dialog.ShowDialog() -ne 'OK') { $dialog.Dispose(); Send-Json $ctx @{cancelled=$true}; continue }
            $chosen=$dialog.FileName
            $dialog.Dispose()
            $rows=Read-Telemetry $chosen
            $videoPath=$chosen
            $videoId=[Guid]::NewGuid().ToString('N')
            Send-Json $ctx @{name=[IO.Path]::GetFileName($chosen);url="/video/$videoId";samples=@($rows)}
        } elseif ($route -eq "/video/$videoId" -and $videoPath -and $req.HttpMethod -eq 'GET') {
            $stream=[IO.File]::OpenRead($videoPath)
            try {
                [long]$start=0; [long]$end=$stream.Length-1
                $range=$req.Headers['Range']
                if ($range) {
                    if ($range -notmatch '^bytes=(\d+)-(\d*)$') { $ctx.Response.StatusCode=416; continue }
                    $start=[long]$Matches[1]
                    if ($Matches[2]) { $end=[Math]::Min([long]$Matches[2],$end) }
                    if ($start -gt $end) { $ctx.Response.StatusCode=416; $ctx.Response.Headers['Content-Range']="bytes */$($stream.Length)"; continue }
                    $ctx.Response.StatusCode=206
                    $ctx.Response.Headers['Content-Range']="bytes $start-$end/$($stream.Length)"
                }
                $ctx.Response.ContentType='video/mp4'
                $ctx.Response.Headers['Accept-Ranges']='bytes'
                [long]$remaining=$end-$start+1
                $ctx.Response.ContentLength64=$remaining
                $stream.Position=$start
                $buffer=New-Object byte[] 262144
                while ($remaining -gt 0) {
                    $count=$stream.Read($buffer,0,[int][Math]::Min($remaining,$buffer.Length))
                    if ($count -le 0) { break }
                    $ctx.Response.OutputStream.Write($buffer,0,$count)
                    $remaining-=$count
                }
            } finally { $stream.Dispose() }
        } else { Send-Json $ctx @{error='Not found'} 404 }
    } catch {
        Write-Warning $_.Exception.Message
        try { Send-Json $ctx @{error=$_.Exception.Message} 500 } catch { Write-Warning 'Request disconnected.' }
    } finally { $ctx.Response.Close() }
}
} finally { $listener.Stop(); $listener.Close() }
