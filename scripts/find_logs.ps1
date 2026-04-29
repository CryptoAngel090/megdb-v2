$patterns = @('console.log','debugger')
foreach ($p in $patterns) {
  $matches = Select-String -Path **\* -Pattern $p -SimpleMatch -ErrorAction SilentlyContinue | Select-Object -Unique Path
  $count = if ($matches) { $matches.Count } else { 0 }
  Write-Output "Pattern '$p' found in $count files"
}
