$root = $PSScriptRoot
$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add('http://127.0.0.1:8765/')
$listener.Start()
Write-Host "listening at $root"
while ($listener.IsListening) {
  $ctx = $listener.GetContext()
  $path = $ctx.Request.Url.LocalPath.TrimStart('/')
  if ([string]::IsNullOrEmpty($path)) { $path = 'index.html' }
  $file = Join-Path $root $path
  if (Test-Path $file -PathType Leaf) {
    $bytes = [System.IO.File]::ReadAllBytes($file)
    $ext = [System.IO.Path]::GetExtension($file).ToLower()
    $ct = switch ($ext) { '.html' { 'text/html' } '.js' { 'application/javascript' } '.css' { 'text/css' } default { 'application/octet-stream' } }
    $ctx.Response.ContentType = $ct
    $ctx.Response.ContentLength64 = $bytes.Length
    $ctx.Response.OutputStream.Write($bytes, 0, $bytes.Length)
  } else {
    $ctx.Response.StatusCode = 404
  }
  $ctx.Response.OutputStream.Close()
}
