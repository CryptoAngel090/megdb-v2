try {
  $f = (Get-ChildItem -Recurse -Force -File -ErrorAction SilentlyContinue | Measure-Object).Count
  $d = (Get-ChildItem -Recurse -Force -Directory -ErrorAction SilentlyContinue | Measure-Object).Count
  $s = (Get-ChildItem -Recurse -Force -File -ErrorAction SilentlyContinue | Measure-Object -Property Length -Sum).Sum
  Write-Output "FILES:$f DIRS:$d SIZE_BYTES:$s"
} catch {
  Write-Output "ERROR: $_"
}
