import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

const url = process.env.VITE_SUPABASE_URL;
const key = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(url!, key!);

async function seedTenCandidates() {
    console.log("🚀 Iniciando seed de 10 candidatos simulados da Empregare...");

    try {
        // 1. Verificar se a vaga já existe ou criar
        let jobTitle = 'Desenvolvedor Full Stack Sênior';
        const { data: existingJob } = await supabase
            .from('job_openings')
            .select('*')
            .eq('title', jobTitle)
            .single();

        let job = existingJob;

        if (!job) {
            const { data: newJob, error: jobErr } = await supabase
                .from('job_openings')
                .insert({
                    title: jobTitle,
                    department: 'Tecnologia',
                    open_positions: 5,
                    skills: 'React, Node.js, TypeScript, Supabase',
                    salary: 12000
                })
                .select()
                .single();
            if (jobErr) throw jobErr;
            job = newJob;
            console.log(`✅ Nova vaga criada: ${job.title}`);
        } else {
            console.log(`✅ Vaga existente encontrada: ${job.title}`);
        }

        // 2. Gerar 10 candidatos simulados
        const names = [
            "Ana Clara Oliveira", "Bruno Henrique Santos", "Carla Beatriz Lima",
            "Diego Souza Ferreira", "Elena Maria Rocha", "Fabio Junior Costa",
            "Giulia Paiva", "Hugo Leonardo Silva", "Isabela Neves", "João Pedro Moraes"
        ];

        const candidates = names.map((name, i) => ({
            name,
            email: `${name.toLowerCase().replace(/ /g, '.')}@example.com`,
            position: job.title,
            phone: `(11) 9${Math.floor(10000000 + Math.random() * 90000000)}`,
            status: 'pool',
            observations: `Candidato importado via script de validação (Simulação Empregare). Registro #${i + 1}.`,
            match_score: Math.floor(60 + Math.random() * 40),
            raw_data: {
                id: 1000 + i,
                origem: 'Empregare Mock Batch',
                timestamp: new Date().toISOString()
            }
        }));

        const { data, error: insertErr } = await supabase
            .from('candidates')
            .insert(candidates)
            .select();

        if (insertErr) throw insertErr;

        console.log(`✨ SUCESSO: ${data.length} candidatos inseridos no Supabase.`);
        console.log("Acesse o dashboard (Hiring Page) para validar os dados.");

    } catch (err: any) {
        console.error("❌ Erro durante o processo:", err.message);
    }
}

seedTenCandidates();
