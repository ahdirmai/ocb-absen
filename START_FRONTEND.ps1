# JALANKAN FRONTEND
# Double-click file ini untuk start frontend

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  STARTING FRONTEND..." -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Jangan tutup window ini!" -ForegroundColor Yellow
Write-Host "Tekan Ctrl+C untuk stop" -ForegroundColor Yellow
Write-Host ""
Write-Host "Setelah muncul URL, buka browser:" -ForegroundColor Green
Write-Host "http://localhost:5173" -ForegroundColor Green
Write-Host ""

Set-Location "C:\OCB-Absen\absen-ocb-fe-main"
npm run dev
