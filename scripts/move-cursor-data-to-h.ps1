# Move Cursor data from C: to H: and re-link with junctions.
# MUST run while Cursor is fully closed (check Task Manager).
#
# Usage (PowerShell):
#   powershell -ExecutionPolicy Bypass -File "H:\print8.mk\scripts\move-cursor-data-to-h.ps1"

$ErrorActionPreference = 'Stop'

$base = 'H:\CursorData'
$roamingSrc = Join-Path $env:APPDATA 'Cursor'
$roamingDst = Join-Path $base 'Roaming-Cursor'
$projSrc = Join-Path $env:USERPROFILE '.cursor\projects'
$projDst = Join-Path $base 'projects'

function Get-FolderSizeMb([string]$path) {
  if (-not (Test-Path $path)) { return 0 }
  $sum = (Get-ChildItem $path -Recurse -File -ErrorAction SilentlyContinue | Measure-Object -Property Length -Sum).Sum
  if (-not $sum) { return 0 }
  return [math]::Round($sum / 1MB, 1)
}

$cursorProcs = Get-Process -Name 'Cursor' -ErrorAction SilentlyContinue
if ($cursorProcs) {
  Write-Host "ERROR: Close Cursor completely first ($($cursorProcs.Count) process(es) still running)." -ForegroundColor Red
  Write-Host "Quit Cursor, confirm in Task Manager, then run this script again."
  exit 1
}

if (-not (Test-Path 'H:\')) {
  Write-Host "ERROR: H: drive not found." -ForegroundColor Red
  exit 1
}

New-Item -ItemType Directory -Force -Path $base | Out-Null

function Move-And-Junction([string]$src, [string]$dst) {
  if (-not (Test-Path $src)) {
    Write-Host "Skip (not found): $src"
    return
  }

  $item = Get-Item -LiteralPath $src -Force
  if ($item.LinkType -eq 'Junction') {
    Write-Host "Already a junction: $src -> $($item.Target)"
    return
  }

  if (Test-Path $dst) {
    Write-Host "ERROR: Destination already exists: $dst" -ForegroundColor Red
    exit 1
  }

  $mb = Get-FolderSizeMb $src
  Write-Host "Moving ${mb} MB: $src -> $dst"
  Move-Item -LiteralPath $src -Destination $dst

  cmd /c mklink /J "$src" "$dst" | Out-Null
  $link = Get-Item -LiteralPath $src -Force
  Write-Host "Junction created: $src -> $($link.Target)"
}

Write-Host "=== Moving Cursor Roaming data (~40 GB state.vscdb) ===" -ForegroundColor Cyan
Move-And-Junction $roamingSrc $roamingDst

Write-Host "=== Moving .cursor\projects (~3 GB assets) ===" -ForegroundColor Cyan
Move-And-Junction $projSrc $projDst

$db = Join-Path $roamingSrc 'User\globalStorage\state.vscdb'
if (Test-Path $db) {
  $gb = [math]::Round((Get-Item $db).Length / 1GB, 2)
  Write-Host "state.vscdb OK via junction: $gb GB" -ForegroundColor Green
} else {
  Write-Host "WARNING: state.vscdb not found at expected path." -ForegroundColor Yellow
}

Write-Host ""
Write-Host "Done. You can reopen Cursor - it will use H:\CursorData via junctions." -ForegroundColor Green
Write-Host "Physical data: $base"
