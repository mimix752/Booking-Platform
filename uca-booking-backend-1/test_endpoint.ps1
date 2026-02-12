#!/usr/bin/env pwsh
# Script de test pour l'endpoint getHistory

Write-Host "=== Test de l'endpoint /api/admin/reservations/history ===" -ForegroundColor Cyan

# URL de l'API
$url = "http://localhost:8000/api/admin/reservations/history"

# Essai 1: Sans authentification (devrait retourner 401)
Write-Host "`nTest 1: Sans authentification" -ForegroundColor Yellow
$response = curl -s -w "%{http_code}" -o /tmp/response1.txt "$url" -H "Accept: application/json"
Write-Host "Code HTTP: $response"
if ($response -eq "200") {
    Write-Host "✅ Endpoint accessible!" -ForegroundColor Green
    Get-Content /tmp/response1.txt | ConvertFrom-Json | ConvertTo-Json -Depth 5
} elseif ($response -eq "401") {
    Write-Host "⚠️ Authentification requise (401)" -ForegroundColor Yellow
} else {
    Write-Host "❌ Erreur HTTP $response" -ForegroundColor Red
    Get-Content /tmp/response1.txt
}

Write-Host "`n=== Test terminé ===" -ForegroundColor Cyan

