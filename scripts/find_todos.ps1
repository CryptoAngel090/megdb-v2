$patterns = @('TODO','FIXME')
foreach ($p in $patterns) {
  $matches = Select-String -Path **\* -Pattern $p -SimpleMatch -ErrorAction SilentlyContinue
  $count = if ($matches) { $matches.Count } else { 0 }
  Write-Output "Pattern '$p' occurrences: $count"
  $matches | Select-Object -First 20 | ForEach-Object { Write-Output $_.Path + ':' + $_.LineNumber + ' -> ' + $_.Line }
}
