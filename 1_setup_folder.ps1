# ============================================
# SCRIPT INSTALL OTOMATIS APLIKASI ABSENSI OCB
# Jalankan di PowerShell sebagai Administrator
# ============================================

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  INSTALLER APLIKASI ABSENSI OCB GROUP" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# 1. Cek Node.js
Write-Host "[1/5] Mengecek Node.js..." -ForegroundColor Yellow
$nodeVersion = node --version 2>$null
if ($nodeVersion) {
    Write-Host "      Node.js sudah terinstall: $nodeVersion" -ForegroundColor Green
} else {
    Write-Host "      Node.js BELUM terinstall!" -ForegroundColor Red
    Write-Host "      Download dari: https://nodejs.org/" -ForegroundColor Yellow
    Write-Host "      Install dulu, restart PC, lalu jalankan script ini lagi." -ForegroundColor Yellow
    Read-Host "Tekan Enter untuk keluar"
    exit
}

# 2. Buat folder
Write-Host "[2/5] Membuat folder C:\OCB-Absen..." -ForegroundColor Yellow
if (!(Test-Path "C:\OCB-Absen")) {
    New-Item -ItemType Directory -Path "C:\OCB-Absen" | Out-Null
    Write-Host "      Folder dibuat!" -ForegroundColor Green
} else {
    Write-Host "      Folder sudah ada." -ForegroundColor Green
}

# 3. Info untuk user
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  LANGKAH SELANJUTNYA (Manual):" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "1. Extract 'absen-ocb-be-main.zip' ke C:\OCB-Absen\" -ForegroundColor White
Write-Host "2. Extract 'absen-ocb-fe-main.zip' ke C:\OCB-Absen\" -ForegroundColor White
Write-Host "3. Copy 'backend.env' ke C:\OCB-Absen\absen-ocb-be-main\.env" -ForegroundColor White
Write-Host "4. Copy 'frontend.env' ke C:\OCB-Absen\absen-ocb-fe-main\.env" -ForegroundColor White
Write-Host ""
Write-Host "Setelah itu, jalankan script '2_jalankan_aplikasi.ps1'" -ForegroundColor Yellow
Write-Host ""
Read-Host "Tekan Enter untuk keluar"
