$mods = Get-ChildItem -Recurse -Force -Include *.module.css -ErrorAction SilentlyContinue | Select-Object FullName,Length | Sort-Object Length -Descending
$modsCount = ($mods | Measure-Object).Count
Write-Output "module.css files: $modsCount"
$mods | Select-Object -First 20 | ForEach-Object { "{0:N0} bytes`t{1}" -f $_.Length,$_.FullName }
