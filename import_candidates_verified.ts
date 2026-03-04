import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import fs from 'fs';
dotenv.config();

const url = process.env.VITE_SUPABASE_URL;
const key = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(url!, key!);

async function importCandidates() {
    console.log("🚀 Iniciando Importação de 10 candidatos para validar...");

    try {
        // 1. Obter uma vaga válida para vincular
        const { data: job } = await supabase
            .from('job_openings')
            .select('*')
            .eq('title', 'Auxiliar Administrativo')
            .limit(1)
            .single();

        if (!job) {
            throw new Error("Vaga 'Auxiliar Administrativo' não encontrada. Execute a sincronização de vagas primeiro.");
        }
        console.log(`✅ Vinculando candidatos à vaga: ${job.title} (ID: ${job.id})`);

        // 2. Ler candidatos do mock (simulando resposta da Empregare)
        const mockFile = JSON.parse(fs.readFileSync('candidato_fake_empregare.json', 'utf8'));
        const rawPessoas = mockFile.pessoas || [];

        const candidates = rawPessoas.map((p: any) => ({
            name: p.nome,
            email: p.email,
            position: job.title,
            phone: p.celular,
            status: 'applied',
            observations: `Importado de Empregare. CID: ${p.idPessoa}. ${p.curriculo?.sintese || ''}`.replace(/<[^>]*>/g, ''),
            match_score: Math.floor(Math.random() * 40) + 60,
            raw_data: p,
            created_at: new Date().toISOString()
        }));

        const { data, error } = await supabase
            .from('candidates')
            .insert(candidates)
            .select();

        if (error) throw error;

        console.log(`✨ SUCESSO: ${data?.length} candidatos importados e vinculados!`);
    } catch (err: any) {
        console.error("❌ Erro:", err.message);
    }
}

importCandidates();
