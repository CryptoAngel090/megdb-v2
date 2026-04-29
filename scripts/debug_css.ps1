$m = Get-ChildItem -Recurse -Force -Include *.module.css -ErrorAction SilentlyContinue | Where-Object { $_.FullName -notmatch '\\node_modules\\' -and $_.FullName -notmatch '\\.next\\' } | Sort-Object Length -Descending | Select-Object -First 1
Write-Output "File: $($m.FullName)"
$content = (Get-Content $m.FullName -ErrorAction SilentlyContinue) -join "`n"
$matches = [System.Text.RegularExpressions.Regex]::Matches($content,'\\.([a-zA-Z0-9_-]+)')
$classes = @()
foreach ($mm in $matches) { $classes += $mm.Groups[1].Value }
$classes = $classes | Select-Object -Unique
Write-Output ("classes count: {0}" -f $classes.Count)
$classes | Select-Object -First 20 | ForEach-Object { Write-Output $_ }
