import dotenv from 'dotenv';
import fetch from 'node-fetch';
dotenv.config();

async function test() {
    const supabaseUrl = process.env.VITE_SUPABASE_URL;
    const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
    const proxyUrl = `${supabaseUrl}/functions/v1/empregare-proxy?pagina=1&itensPorPagina=2`;

    console.log(`Buscando em: ${proxyUrl}`);

    try {
        const response = await fetch(proxyUrl, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${supabaseKey}`,
                'apikey': supabaseKey,
                'Content-Type': 'application/json'
            }
        });

        console.log('Status Proxy:', response.status);
        const text = await response.text();
        console.log('Response Proxy:', text.substring(0, 500));
    } catch (e) {
        console.error(e);
    }
}

test();
