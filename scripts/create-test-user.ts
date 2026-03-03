import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const supabase = createClient(
    process.env.VITE_SUPABASE_URL!,
    process.env.VITE_SUPABASE_ANON_KEY!
);

async function createTestUser() {
    console.log('Creating test user...');

    // Sign up
    const { data, error } = await supabase.auth.signUp({
        email: 'admin@gestorgn.com',
        password: 'Admin123!',
        options: {
            data: { name: 'Admin Teste', role: 'Administrador', allowed: true }
        }
    });

    if (error) {
        console.error('Signup error:', error.message);
        // Try to just login if user exists
        const { data: loginData, error: loginErr } = await supabase.auth.signInWithPassword({
            email: 'admin@gestorgn.com',
            password: 'Admin123!'
        });
        if (loginErr) {
            console.error('Login also failed:', loginErr.message);
            return;
        }
        console.log('User already exists, logged in:', loginData.user?.id);

        // Auto-approve
        const { error: updateErr } = await supabase
            .from('profiles')
            .update({ allowed: true, role: 'Administrador', name: 'Admin Teste' })
            .eq('id', loginData.user!.id);

        if (updateErr) console.error('Profile update error:', updateErr);
        else console.log('Profile approved!');
        return;
    }

    console.log('User created:', data.user?.id);

    // Auto-approve the profile
    if (data.user) {
        // Wait a bit for the trigger to create the profile
        await new Promise(r => setTimeout(r, 2000));

        const { error: updateErr } = await supabase
            .from('profiles')
            .update({ allowed: true, role: 'Administrador', name: 'Admin Teste' })
            .eq('id', data.user.id);

        if (updateErr) console.error('Profile update error:', updateErr);
        else console.log('Profile approved!');
    }
}

createTestUser();
