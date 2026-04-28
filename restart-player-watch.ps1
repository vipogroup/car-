# Dev: default bind + Python auto-reload on save (UNBLOCKED_AUTO_RELOAD=1).
# Stop: Ctrl+C
$ErrorActionPreference = 'SilentlyContinue'
Set-Location -LiteralPath $PSScriptRoot
if ($env:UNBLOCKED_NO_CLEAR -ne '1') { Clear-Host }

if (-not $env:OPEN_BROWSER) { $env:OPEN_BROWSER = '0' }
$env:PYTHONUNBUFFERED = '1'
if (-not $env:PYTHONUTF8) { $env:PYTHONUTF8 = '1' }
$env:UNBLOCKED_AUTO_RELOAD = '1'

try {
  [int]$script:ListenPort = [int]($env:UNBLOCKED_PLAYER_PORT)
  if ($script:ListenPort -lt 1 -or $script:ListenPort -gt 65535) { $script:ListenPort = 5600 }
} catch { $script:ListenPort = 5600 }

function Stop-ListenerOnPort {
  param([int]$Port)
  for ($i = 0; $i -lt 8; $i++) {
    $any = $false
    try {
      $conns = Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction SilentlyContinue
      foreach ($c in $conns) {
        if ($c.OwningProcess) {
          $any = $true
          Stop-Process -Id $c.OwningProcess -Force -ErrorAction SilentlyContinue
        }
      }
    } catch {}
    if (-not $any) { break }
    Start-Sleep -Milliseconds 350
  }
}

Stop-ListenerOnPort $script:ListenPort
Write-Host "[watch] UNBLOCKED_AUTO_RELOAD=1 - Python restarts when unblocked_player.py is saved. Port $script:ListenPort" -ForegroundColor Cyan
python -u unblocked_player.py
exit $LASTEXITCODE
