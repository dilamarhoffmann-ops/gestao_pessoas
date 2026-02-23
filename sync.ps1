# sync.ps1 - AgilPulse Dashboard Sync Script
# Script premium para sincronização total: GitHub, Supabase e Vercel

$ErrorActionPreference = "Stop"
$StartTime = Get-Date

function Write-Header($text) {
    Write-Host "`n" + ("=" * 50) -ForegroundColor Cyan
    Write-Host ">>> $text" -ForegroundColor Cyan -Bold
    Write-Host ("=" * 50) -ForegroundColor Cyan
}

function Write-Success($text) {
    Write-Host "✅ $text" -ForegroundColor Green
}

function Write-Error-Custom($text) {
    Write-Host "❌ $text" -ForegroundColor Red
}

try {
    Clear-Host
    Write-Host "🚀 Iniciando Sincronização AgilPulse Dashboard" -ForegroundColor Yellow -BackgroundColor Blue
    Write-Host "Data/Hora: $(($StartTime).ToString('dd/MM/yyyy HH:mm:ss'))"

    # --- 1. GITHUB / GIT ---
    Write-Header "Etapa 1: Sincronização GitHub"
    
    $status = git status --short
    if ([string]::IsNullOrWhiteSpace($status)) {
        Write-Host "Nenhuma alteração pendente no Git." -ForegroundColor Gray
    }
    else {
        Write-Host "Alterações detectadas:" -ForegroundColor DarkGray
        Write-Host $status
        
        $commitMsg = Read-Host "`nDigite a mensagem do commit (ou pressione Enter para 'Auto-sync: [data]') "
        if ([string]::IsNullOrWhiteSpace($commitMsg)) {
            $commitMsg = "Auto-sync: $(Get-Date -Format 'yyyy-MM-dd HH:mm')"
        }
        
        Write-Host "Executando Git..." -ForegroundColor Gray
        git add .
        git commit -m "$commitMsg"
        
        $branch = git rev-parse --abbrev-ref HEAD
        Write-Host "Enviando para o branch '$branch'..." -ForegroundColor Gray
        git push origin $branch
        Write-Success "Código enviado para o GitHub com sucesso!"
    }

    # --- 2. SUPABASE ---
    Write-Header "Etapa 2: Sincronização Supabase"
    
    # Verifica se a CLI do Supabase está disponível
    if (Get-Command supabase -ErrorAction SilentlyContinue) {
        Write-Host "Verificando migrações locais..." -ForegroundColor Gray
        if (Test-Path "supabase/migrations") {
            try {
                Write-Host "Enviando migrações (db push)..." -ForegroundColor Gray
                supabase db push
                Write-Success "Banco de Dados/Migrações sincronizadas!"
            }
            catch {
                Write-Host "Aviso: 'supabase db push' falhou. Verifique se o projeto está linkado ou se há conflitos." -ForegroundColor Yellow
            }
        }
        else {
            Write-Host "Nenhuma migração local pendente (pasta 'supabase/migrations' não encontrada)." -ForegroundColor DarkGray
        }

        # Deploy de Edge Functions (se existirem)
        if (Test-Path "supabase/functions") {
            try {
                Write-Host "Fazendo deploy de Edge Functions..." -ForegroundColor Gray
                supabase functions deploy --all
                Write-Success "Edge Functions sincronizadas!"
            }
            catch {
                Write-Host "Aviso: 'supabase functions deploy' falhou." -ForegroundColor Yellow
            }
        }
    }
    else {
        Write-Host "Info: CLI do Supabase não encontrada. Pulando sincronização de DB e Functions (Uso opcional)." -ForegroundColor Gray
    }

    # --- 3. VERCEL ---
    Write-Header "Etapa 3: Deploy Vercel"
    Write-Host "Iniciando deploy de produção..." -ForegroundColor Gray
    
    if (Get-Command vercel -ErrorAction SilentlyContinue) {
        vercel --prod --yes
        Write-Success "Deploy na Vercel concluído com sucesso!"
    }
    else {
        Write-Error-Custom "CLI da Vercel não encontrada. Pulando esta etapa."
    }

    # --- FINALIZAÇÃO ---
    $EndTime = Get-Date
    $Duration = $EndTime - $StartTime
    Write-Header "Sincronização Concluída!"
    Write-Host "Tempo total: $($Duration.Minutes)m $($Duration.Seconds)s" -ForegroundColor Green
    Write-Host "Seu projeto está atualizado em todas as plataformas! 🚀`n" -ForegroundColor Cyan

}
catch {
    Write-Error-Custom "Ocorreu um erro crítico durante a sincronização:"
    Write-Host $_.Exception.Message -ForegroundColor Red
    exit 1
}
