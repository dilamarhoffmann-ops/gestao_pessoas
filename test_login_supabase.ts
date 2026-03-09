import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

const url = process.env.VITE_SUPABASE_URL;
const key = process.env.VITE_SUPABASE_ANON_KEY;

if (!url || !key) {
    console.error("Erro: VITE_SUPABASE_URL ou VITE_SUPABASE_ANON_KEY não estão definidos no arquivo .env");
    process.exit(1);
}

const supabase = createClient(url, key);

async function testConnection() {
    console.log(`📡 Inciando teste de login com Supabase...`);
    try {
        console.time('login');
        const res = await supabase.auth.signInWithPassword({
            email: 'admin@apoio.com',
            password: 'admin123'
        });
        console.timeEnd('login');
        console.log("Login result:", res.data?.user ? "Success" : "Failed", res.error?.message);

        if (res.data?.user) {
            console.time('getProfile');
            const prof = await supabase.from('profiles').select('*').eq('id', res.data.user.id).single();
            console.timeEnd('getProfile');
            console.log("Profile result:", prof.data || prof.error);
        }
    } catch (e: any) {
        console.error("❌ Falha:", e);
    }
}

testConnection();
