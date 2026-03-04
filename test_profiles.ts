import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const url = process.env.VITE_SUPABASE_URL;
const key = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(url, key);

async function checkProfiles() {
    const { data, error } = await supabase.from('profiles').select('*');
    if (error) {
        console.error('Error:', error.message);
    } else {
        console.log('Profiles:', data);
    }
}

checkProfiles();
