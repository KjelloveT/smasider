$root = 'c:\Users\88kjebjo\_projects'
$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add('http://localhost:8081/')
$listener.Start()
Write-Host 'Server running on http://localhost:8081'
$mimeTypes = @{
  '.html' = 'text/html; charset=utf-8'
  '.js'   = 'application/javascript'
  '.css'  = 'text/css'
  '.json' = 'application/json; charset=utf-8'
  '.csv'  = 'text/csv; charset=utf-8'
  '.png'  = 'image/png'
  '.xml'  = 'application/xml'
  '.ico'  = 'image/x-icon'
}
while ($listener.IsListening) {
  $ctx = $listener.GetContext()
  $req = $ctx.Request
  $res = $ctx.Response
  $local = $req.Url.LocalPath.TrimStart('/')
  if ($local -eq '') { $local = 'index.html' }
  $path = Join-Path $root $local
  if ([System.IO.File]::Exists($path)) {
    $ext = [System.IO.Path]::GetExtension($path)
    $res.ContentType = if ($mimeTypes[$ext]) { $mimeTypes[$ext] } else { 'application/octet-stream' }
    $bytes = [System.IO.File]::ReadAllBytes($path)
    $res.ContentLength64 = $bytes.Length
    $res.OutputStream.Write($bytes, 0, $bytes.Length)
  } else {
    $res.StatusCode = 404
    $bytes = [System.Text.Encoding]::UTF8.GetBytes('Not found')
    $res.OutputStream.Write($bytes, 0, $bytes.Length)
  }
  $res.Close()
}
