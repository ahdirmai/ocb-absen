# ============================================
# SCRIPT JALANKAN APLIKASI ABSENSI OCB
# Jalankan di PowerShell
# ============================================

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  MENJALANKAN APLIKASI ABSENSI OCB" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Cek apakah folder ada
if (!(Test-Path "C:\OCB-Absen\absen-ocb-be-main")) {
    Write-Host "ERROR: Folder backend tidak ditemukan!" -ForegroundColor Red
    Write-Host "Pastikan sudah extract absen-ocb-be-main.zip ke C:\OCB-Absen\" -ForegroundColor Yellow
    Read-Host "Tekan Enter untuk keluar"
    exit
}

if (!(Test-Path "C:\OCB-Absen\absen-ocb-fe-main")) {
    Write-Host "ERROR: Folder frontend tidak ditemukan!" -ForegroundColor Red
    Write-Host "Pastikan sudah extract absen-ocb-fe-main.zip ke C:\OCB-Absen\" -ForegroundColor Yellow
    Read-Host "Tekan Enter untuk keluar"
    exit
}

# Install dependencies backend
Write-Host "[1/4] Install dependencies Backend..." -ForegroundColor Yellow
Set-Location "C:\OCB-Absen\absen-ocb-be-main"
npm install
Write-Host "      Backend dependencies selesai!" -ForegroundColor Green

# Install dependencies frontend
Write-Host "[2/4] Install dependencies Frontend..." -ForegroundColor Yellow
Set-Location "C:\OCB-Absen\absen-ocb-fe-main"
npm install
Write-Host "      Frontend dependencies selesai!" -ForegroundColor Green

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "  INSTALASI SELESAI!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Untuk menjalankan aplikasi:" -ForegroundColor Yellow
Write-Host ""
Write-Host "1. Buka PowerShell BARU, jalankan:" -ForegroundColor White
Write-Host "   cd C:\OCB-Absen\absen-ocb-be-main" -ForegroundColor Cyan
Write-Host "   npm start" -ForegroundColor Cyan
Write-Host ""
Write-Host "2. Buka PowerShell BARU LAGI, jalankan:" -ForegroundColor White
Write-Host "   cd C:\OCB-Absen\absen-ocb-fe-main" -ForegroundColor Cyan
Write-Host "   npm run dev" -ForegroundColor Cyan
Write-Host ""
Write-Host "3. Buka browser: http://localhost:5173" -ForegroundColor White
Write-Host ""
Read-Host "Tekan Enter untuk keluar"
