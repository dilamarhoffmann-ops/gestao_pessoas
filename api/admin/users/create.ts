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

    const { email, password, name, role, allowed, area, allowed_menus, approver } = req.body;

    if (!email || !password || !name) {
        return res.status(400).json({ error: 'E-mail, senha e nome são obrigatórios.' });
    }

    if (!supabaseServiceKey || supabaseServiceKey === 'dummy_key') {
        console.error('Missing SUPABASE_SERVICE_ROLE_KEY configuration.');
        return res.status(500).json({ error: 'Configuração do sistema incorreta: chave de serviço ausente na Vercel ou no arquivo .env local.' });
    }

    try {
        const { data, error } = await supabaseAdmin.auth.admin.createUser({
            email,
            password,
            email_confirm: true,
            user_metadata: { name, role, allowed }
        });

        if (error) {
            return res.status(400).json({ error: error.message });
        }

        if (data.user) {
            await supabaseAdmin.from('profiles').upsert({
                id: data.user.id,
                email: email,
                name: name,
                role: role,
                allowed: allowed,
                area: area,
                allowed_menus: allowed_menus,
                approver: approver,
                must_change_password: true
            });
        }

        return res.json({ success: true });
    } catch (err: any) {
        console.error('Admin create user error:', err);
        return res.status(500).json({ error: 'Erro interno ao processar registro.' });
    }
}
