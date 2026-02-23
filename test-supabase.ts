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
    console.log(`📡 Inciando teste de conexão com Supabase: ${url}`);
    try {
        // Tenta fazer uma query simples apenas para testar se há resposta do Supabase
        const { data, error } = await supabase.from('discounts').select('*').limit(1);

        if (error) {
            if (error.code === '42P01') {
                console.log("✅ Conexão estabelecida com SUCESSO!");
                console.log("Tabela 'discounts' ainda não existe. O próximo passo será fazer a migração dos dados.");
            } else {
                console.error("❌ A conexão foi estabelecida, mas ocorreu um erro:", error.message);
            }
        } else {
            console.log("✅ Conexão estabelecida com SUCESSO!");
            console.log("Tabela acessada:", data);
        }
    } catch (e: any) {
        console.error("❌ Falha na conexão com Supabase. Verifique sua chave de API e URL.");
        console.error(e.message);
    }
}

testConnection();
