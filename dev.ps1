# Script que garante limpeza das portas antes de iniciar o servidor
Write-Host "🔍 Verificando portas em uso..." -ForegroundColor Cyan

$ports = @(3000, 24678)
foreach ($port in $ports) {
    $pids = Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue | 
            Select-Object -ExpandProperty OwningProcess | 
            Where-Object { $_ -gt 4 } | 
            Sort-Object -Unique
    foreach ($pid in $pids) {
        try {
            taskkill /F /PID $pid 2>&1 | Out-Null
            Write-Host "  ✅ Porta $port liberada (PID $pid encerrado)" -ForegroundColor Green
        } catch {}
    }
}

Write-Host "🚀 Iniciando servidor..." -ForegroundColor Cyan
npx tsx server.ts
