$dirs = @('node_modules','theme/generated','apps/web/.next','_lh_tmp','.cursor')
foreach ($d in $dirs) {
  if (Test-Path $d) {
    $sum = (Get-ChildItem -Path $d -Recurse -Force -ErrorAction SilentlyContinue | Where-Object { -not $_.PSIsContainer } | Measure-Object -Property Length -Sum).Sum
    Write-Output "{0} => {1:N0} bytes" -f $d,($sum)
  } else {
    Write-Output "{0} => NOT FOUND" -f $d
  }
}
