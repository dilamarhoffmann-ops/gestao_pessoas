import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const url = process.env.VITE_SUPABASE_URL;
const key = process.env.VITE_SUPABASE_ANON_KEY;

if (!url || !key) {
    console.error('Supabase URL or Key not found in .env');
    process.exit(1);
}

const supabase = createClient(url, key);

async function checkCompanies() {
    const { data, error } = await supabase.from('companies').select('*');
    if (error) {
        console.error('Error:', error.message);
    } else {
        console.log('Companies:', data);
    }
}

checkCompanies();
