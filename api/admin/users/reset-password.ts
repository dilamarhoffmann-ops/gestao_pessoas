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
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { id, newPassword } = req.body;

    if (!id || !newPassword) {
        return res.status(400).json({ error: 'ID e nova senha são obrigatórios.' });
    }

    if (!supabaseServiceKey || supabaseServiceKey === 'dummy_key') {
        console.error('Missing SUPABASE_SERVICE_ROLE_KEY configuration.');
        return res.status(500).json({ error: 'Configuração do sistema incorreta: chave de serviço ausente na Vercel ou no arquivo .env local.' });
    }

    try {
        const { error } = await supabaseAdmin.auth.admin.updateUserById(id, {
            password: newPassword
        });

        if (error) {
            return res.status(400).json({ error: error.message });
        }

        await supabaseAdmin.from('profiles').update({
            must_change_password: true
        }).eq('id', id);

        return res.json({ success: true });
    } catch (err: any) {
        console.error('Admin reset password error:', err);
        return res.status(500).json({ error: 'Erro interno ao processar alteração de senha.' });
    }
}
