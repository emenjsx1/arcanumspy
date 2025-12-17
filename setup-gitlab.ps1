# Script PowerShell para configurar GitLab
# Execute: .\setup-gitlab.ps1

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Configuração do GitLab" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Solicitar URL do GitLab
$gitlabUrl = Read-Host "Digite a URL do seu repositório GitLab (ex: https://gitlab.com/usuario/projeto.git)"

if ([string]::IsNullOrWhiteSpace($gitlabUrl)) {
    Write-Host "URL inválida. Operação cancelada." -ForegroundColor Red
    exit 1
}

# Verificar se o remote gitlab já existe
$existingRemote = git remote get-url gitlab 2>$null

if ($LASTEXITCODE -eq 0) {
    Write-Host "Remote 'gitlab' já existe: $existingRemote" -ForegroundColor Yellow
    $replace = Read-Host "Deseja substituir? (s/n)"
    if ($replace -eq "s" -or $replace -eq "S") {
        git remote remove gitlab
        Write-Host "Remote 'gitlab' removido." -ForegroundColor Green
    } else {
        Write-Host "Operação cancelada." -ForegroundColor Yellow
        exit 0
    }
}

# Adicionar GitLab como remote
Write-Host ""
Write-Host "Adicionando GitLab como remote..." -ForegroundColor Yellow
git remote add gitlab $gitlabUrl

if ($LASTEXITCODE -eq 0) {
    Write-Host "✓ GitLab adicionado com sucesso!" -ForegroundColor Green
} else {
    Write-Host "✗ Erro ao adicionar GitLab." -ForegroundColor Red
    exit 1
}

# Mostrar remotes configurados
Write-Host ""
Write-Host "Remotes configurados:" -ForegroundColor Cyan
git remote -v

# Perguntar se deseja fazer push
Write-Host ""
$push = Read-Host "Deseja fazer push para o GitLab agora? (s/n)"

if ($push -eq "s" -or $push -eq "S") {
    Write-Host ""
    Write-Host "Fazendo push para GitLab..." -ForegroundColor Yellow
    git push gitlab main
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host ""
        Write-Host "✓ Push realizado com sucesso!" -ForegroundColor Green
    } else {
        Write-Host ""
        Write-Host "✗ Erro ao fazer push. Verifique suas credenciais." -ForegroundColor Red
        Write-Host "  Dica: Configure um Personal Access Token no GitLab" -ForegroundColor Yellow
    }
} else {
    Write-Host ""
    Write-Host "Para fazer push depois, execute:" -ForegroundColor Cyan
    Write-Host "  git push gitlab main" -ForegroundColor White
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Configuração concluída!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan







