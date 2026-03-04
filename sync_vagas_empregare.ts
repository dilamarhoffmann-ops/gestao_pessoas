import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

const url = process.env.VITE_SUPABASE_URL;
const key = process.env.VITE_SUPABASE_ANON_KEY;
const EMPREGARE_TOKEN = process.env.VITE_EMPREGARE_TOKEN;
const EMPREGARE_EMPRESA_ID = process.env.VITE_EMPREGARE_EMPRESA_ID;

const supabase = createClient(url!, key!);

async function syncVagas() {
    console.log('--- INICIANDO SINCRONIZAÇÃO DE VAGAS EMPREGARE -> SUPABASE ---');
    try {
        // 1. Autenticação na Empregare
        const authResponse = await fetch(`https://corporate.empregare.com/api/auth/token`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ Token: EMPREGARE_TOKEN, EmpresaID: EMPREGARE_EMPRESA_ID })
        });
        const authData = await authResponse.json();
        if (!authData.sucesso) throw new Error(`Falha na autenticação: ${authData.mensagem}`);
        const token = authData.token;

        // 2. Listar Vagas
        const vagasResponse = await fetch(`https://corporate.empregare.com/api/vaga/listar?quantidade=100&pagina=1`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const vagasData = await vagasResponse.json();
        if (!vagasData.sucesso) throw new Error(`Falha ao listar vagas: ${vagasData.mensagem}`);

        const vagas = vagasData.vagas || [];
        console.log(`Encontradas ${vagas.length} vagas na Empregare.`);

        // 3. Processar e Inserir no Supabase
        for (const v of vagas) {
            console.log(`Processando vaga: ${v.Titulo} (ID: ${v.ID})...`);

            // Obter detalhes para pegar salário e total de vagas
            const detalhesResponse = await fetch(`https://corporate.empregare.com/api/vaga/detalhes/${v.ID}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const detalhesData = await detalhesResponse.json();
            const details = detalhesData.vaga || {};

            const rawSalario = details.salario;
            const salaryValue = (typeof rawSalario === 'object' && rawSalario !== null)
                ? (rawSalario.salarioInicial || 0)
                : (parseFloat(rawSalario as any) || 0);

            const jobData = {
                title: details.titulo || v.Titulo,
                open_positions: details.totalVagas || 1,
                department: (details.setores && details.setores.length > 0) ? details.setores[0].Nome : 'Não Informado',
                skills: (details.requisito || 'Consultar descrição na Empregare').replace(/<[^>]*>/g, ''),
                salary: salaryValue,
            };

            // Inserir ou atualizar (baseado no título para evitar duplicatas simples no teste)
            // Nota: O schema atual não tem uma constraint única no título, mas vamos usar upsert se possível ou verificação manual
            const { data: existing } = await supabase
                .from('job_openings')
                .select('id')
                .eq('title', jobData.title)
                .maybeSingle();

            if (existing) {
                console.log(`  Vaga "${jobData.title}" já existe (ID: ${existing.id}). Atualizando...`);
                await supabase.from('job_openings').update(jobData).eq('id', existing.id);
            } else {
                console.log(`  Inserindo nova vaga: "${jobData.title}"`);
                await supabase.from('job_openings').insert(jobData);
            }
        }

        console.log('✅ Sincronização de vagas concluída!');

    } catch (err: any) {
        console.error('❌ Erro durante a sincronização:', err.message);
    }
}

syncVagas();
