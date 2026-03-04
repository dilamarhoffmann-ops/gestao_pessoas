import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

const url = process.env.VITE_SUPABASE_URL;
const key = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(url!, key!);

async function testInsert() {
    console.log('Testando inserção em job_openings...');
    const { data, error } = await supabase.from('job_openings').insert({
        title: 'Vaga Teste RLS',
        open_positions: 1,
        department: 'TI',
        skills: 'Teste',
        salary: 1000
    }).select();

    if (error) {
        console.error('❌ ERRO:', error.message);
        console.error('Código:', error.code);
    } else {
        console.log('✅ SUCESSO:', data);
    }
}

testInsert();
