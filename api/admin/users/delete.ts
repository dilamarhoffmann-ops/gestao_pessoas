import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const supabaseAdminUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || '';

const supabaseAdmin = createClient(supabaseAdminUrl, supabaseServiceKey || 'dummy_key', {
    auth: { autoRefreshToken: false, persistSession: false }
});

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'DELETE') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { id } = req.query;

    if (!id || typeof id !== 'string') {
        return res.status(400).json({ error: 'ID do usuário é obrigatório.' });
    }

    if (!supabaseServiceKey || supabaseServiceKey === 'dummy_key') {
        console.error('Missing SUPABASE_SERVICE_ROLE_KEY configuration.');
        return res.status(500).json({ error: 'Configuração do sistema incorreta: chave de serviço ausente na Vercel ou no arquivo .env local.' });
    }

    try {
        // Deletar da tabela profiles primeiro
        const { error: deleteProfileError } = await supabaseAdmin.from('profiles').delete().eq('id', id);
        
        // Deletar do Auth do Supabase
        const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(id);

        if (authError) {
            return res.status(400).json({ error: authError.message });
        }

        return res.json({ success: true });
    } catch (err: any) {
        console.error('Admin delete user error:', err);
        return res.status(500).json({ error: 'Erro interno ao processar a exclusão do usuário.' });
    }
}
