// Supabase Edge Function: empregare-proxy
// Proxies requests to the Empregare Corporate API to avoid CORS issues.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const EMPREGARE_BASE = 'https://corporate.empregare.com/api';

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
};

Deno.serve(async (req: Request) => {
    // CORS preflight
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    try {
        // --- 1. JWT Validation (Global Security Pattern) ---
        const authHeader = req.headers.get('Authorization');
        if (!authHeader) {
            return new Response(JSON.stringify({ error: 'Não autorizado: Token não providenciado' }), { 
                status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
            });
        }

        const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
        const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') || '';
        const supabaseClient = createClient(supabaseUrl, supabaseAnonKey);
        
        const token = authHeader.replace('Bearer ', '');
        const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token);
        
        if (authError || !user) {
            console.error('[empregare-proxy] Auth error:', authError);
            return new Response(JSON.stringify({ error: 'Não autorizado: Token inválido ou expirado' }), { 
                status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
            });
        }
        // --------------------------------------------------

        const EMPREGARE_TOKEN = Deno.env.get('EMPREGARE_TOKEN');
        const EMPREGARE_EMPRESA_ID = Deno.env.get('EMPREGARE_EMPRESA_ID');

        if (!EMPREGARE_TOKEN || !EMPREGARE_EMPRESA_ID) {
            throw new Error('Faltam credenciais na Edge Function');
        }

        const { url, method, body } = await req.json();

        if (!url) {
            throw new Error('URL da Empregare não providenciada');
        }

        // Append idEmpresa safely to all requests
        const targetUrl = new URL(`${EMPREGARE_BASE}${url}`);
        targetUrl.searchParams.set('idEmpresa', EMPREGARE_EMPRESA_ID);

        console.log(`[empregare-proxy] Auth to get dynamic token...`);

        const authResponse = await fetch(`${EMPREGARE_BASE}/auth/token`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
            body: JSON.stringify({
                Token: EMPREGARE_TOKEN,
                EmpresaID: EMPREGARE_EMPRESA_ID
            })
        });

        if (!authResponse.ok) {
            throw new Error('Falha na autenticação inicial com a Empregare');
        }
        const authData = await authResponse.json();
        if (!authData.sucesso || !authData.token) {
            throw new Error(`Falha de auth Empregare: ${authData.mensagem || 'token não recebido'}`);
        }
        const dynamicToken = authData.token;

        console.log(`[empregare-proxy] Executing proxy to Empregare: ${targetUrl.toString()}`);

        const fReq: RequestInit = {
            method: method || 'GET',
            headers: {
                'Authorization': `Bearer ${dynamicToken}`,
                'Content-Type': 'application/json',
                'Accept': 'application/json',
            },
        };

        if (body && (fReq.method === 'POST' || fReq.method === 'PUT')) {
            fReq.body = JSON.stringify(body);
        }

        const response = await fetch(targetUrl.toString(), fReq);
        console.log(`[empregare-proxy] Empregare returned status ${response.status}`);

        // Parse response
        let data;
        const text = await response.text();
        const contentType = response.headers.get('content-type') || '';

        try {
            if (contentType.includes('application/json')) {
                data = text ? JSON.parse(text) : {};
            } else {
                throw new Error("Not JSON");
            }
        } catch (e) {
            throw new Error(`Empregare API Error (Non-JSON): \n\n${text.slice(0, 300)}`);
        }

        if (!response.ok) {
            throw new Error(data.message || data.error || `Erro HTTP ${response.status}`);
        }

        // Filtro de nulls específico para lista de pessoas
        if (url.includes('/Pessoas') && data.pessoas && Array.isArray(data.pessoas)) {
            data.pessoas = data.pessoas.filter((p: any) => p !== null && typeof p === 'object');
        }

        return new Response(JSON.stringify(data), {
            status: 200,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    } catch (err: any) {
        // Log the actual sensitive error internally
        console.error('[empregare-proxy] Detailed Error:', err.message || err, err.stack);
        
        // Return a generic, sanitized error response to prevent Information Disclosure
        return new Response(
            JSON.stringify({ error: 'Ocorreu um erro interno ao processar a requisição no proxy corporativo.' }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }
});
