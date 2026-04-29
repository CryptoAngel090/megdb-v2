# Check usage of classes in top N largest .module.css files (excluding node_modules and .next)
param([int]$Top=50)
$mods = Get-ChildItem -Recurse -Force -Include *.module.css -ErrorAction SilentlyContinue | Where-Object { $_.FullName -notmatch '\\node_modules\\' -and $_.FullName -notmatch '\\.next\\' } | Select-Object FullName,Length | Sort-Object Length -Descending | Select-Object -First $Top
Write-Output ("Found module.css files to analyze: {0}" -f $mods.Count)
foreach ($m in $mods) {
  Write-Output ("Processing: " + $m.FullName)
  $content = Get-Content $m.FullName -ErrorAction SilentlyContinue | Out-String
  # extract class names: .className {
  $matches = [System.Text.RegularExpressions.Regex]::Matches($content,'\\.([a-zA-Z0-9_-]+)')
  $classes = $matches | ForEach-Object { $_.Groups[1].Value } | Select-Object -Unique
  Write-Output ("  extracted classes: {0}" -f $classes.Count)
  if ($classes.Count -eq 0) { continue }
  $unused = @()
  foreach ($c in $classes) {
    # search for usages: styles.c, className=, class=
    $pattern1 = "styles\.$c"
    $pattern2 = "\b$c\b"
    $found = Select-String -Path **\* -Pattern $pattern1 -SimpleMatch -ErrorAction SilentlyContinue | Where-Object { $_.Path -notmatch '\\node_modules\\' -and $_.Path -notmatch '\\.next\\' } 
    if (-not $found) {
      $found2 = Select-String -Path **\* -Pattern $pattern2 -SimpleMatch -ErrorAction SilentlyContinue | Where-Object { $_.Path -notmatch '\\node_modules\\' -and $_.Path -notmatch '\\.next\\' }
      if (-not $found2) { $unused += $c }
    }
  }
  Write-Output ('File: ' + $m.FullName + ' — classes: ' + $classes.Count + ', unused candidates: ' + $unused.Count)
  if ($unused.Count -gt 0) { $unused | ForEach-Object { Write-Output ('  - ' + $_) } }
}
