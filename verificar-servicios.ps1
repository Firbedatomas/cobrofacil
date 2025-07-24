Write-Host "========================================" -ForegroundColor Cyan
Write-Host "   🔍 Verificando Servicios CobroFacil" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "📡 Verificando puertos..." -ForegroundColor Yellow
Write-Host ""

# Verificar puerto del backend (3001)
$backendStatus = Get-NetTCPConnection -LocalPort 3001 -ErrorAction SilentlyContinue
if ($backendStatus) {
    Write-Host "✅ Backend (puerto 3001): FUNCIONANDO" -ForegroundColor Green
} else {
    Write-Host "❌ Backend (puerto 3001): NO FUNCIONA" -ForegroundColor Red
}

# Verificar puerto del frontend (3002)
$frontendStatus = Get-NetTCPConnection -LocalPort 3002 -ErrorAction SilentlyContinue
if ($frontendStatus) {
    Write-Host "✅ Frontend (puerto 3002): FUNCIONANDO" -ForegroundColor Green
} else {
    Write-Host "❌ Frontend (puerto 3002): NO FUNCIONA" -ForegroundColor Red
}

Write-Host ""
Write-Host "🌐 URLs de acceso:" -ForegroundColor Yellow
Write-Host "   • Frontend: http://localhost:3002" -ForegroundColor White
Write-Host "   • Backend:  http://localhost:3001" -ForegroundColor White
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan

Read-Host "Presiona Enter para continuar" 