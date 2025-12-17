# Script de limpeza completa do Next.js
Write-Host "🧹 Limpando cache do Next.js..." -ForegroundColor Yellow

# Remover .next
if (Test-Path .next) {
    Remove-Item -Recurse -Force .next
    Write-Host "✅ Pasta .next removida" -ForegroundColor Green
}

# Remover cache do node_modules
if (Test-Path node_modules\.cache) {
    Remove-Item -Recurse -Force node_modules\.cache
    Write-Host "✅ Cache do node_modules removido" -ForegroundColor Green
}

# Limpar cache do npm
npm cache clean --force
Write-Host "✅ Cache do npm limpo" -ForegroundColor Green

# Remover arquivos temporários do TypeScript
Get-ChildItem -Path . -Filter "*.tsbuildinfo" -Recurse -ErrorAction SilentlyContinue | Remove-Item -Force
Write-Host "✅ Arquivos TypeScript temporários removidos" -ForegroundColor Green

Write-Host "`n✅ Limpeza completa!" -ForegroundColor Green
Write-Host "Agora execute: npm run dev" -ForegroundColor Cyan







