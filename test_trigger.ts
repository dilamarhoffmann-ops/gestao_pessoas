import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const url = process.env.VITE_SUPABASE_URL!;
const key = process.env.VITE_SUPABASE_ANON_KEY!;
const supabase = createClient(url, key);

async function testSignupAndProfile() {
    const email = `test_${Date.now()}@example.com`;
    const password = 'password123';

    console.log(`Attempting signup for ${email}...`);
    const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
            data: { name: 'Test User', role: 'Usuario' }
        }
    });

    if (error) {
        console.error('Signup Error:', error);
        return;
    }

    console.log('Signup success. User ID:', data.user?.id);

    console.log('Checking if profile was created by trigger...');
    // Wait a bit for the trigger
    await new Promise(r => setTimeout(r, 2000));

    const { data: profile, error: pError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', data.user?.id)
        .single();

    if (pError) {
        console.error('Profile Fetch Error:', pError);
        console.log('This confirms the Trigger handle_new_user() is NOT working or was not applied.');
    } else {
        console.log('Profile found:', profile);
    }

    // Cleanup - we can't delete user easily without service key, but we know now.
}

testSignupAndProfile();
