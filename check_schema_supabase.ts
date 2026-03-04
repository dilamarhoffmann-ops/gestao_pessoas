import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const url = process.env.VITE_SUPABASE_URL;
const key = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(url, key);

async function checkSchema() {
    // This is a hacky way to check if table exists if RLS is on and we are anon
    // But we can try to GET it and see if we get a 404 or empty
    const { data, error } = await supabase.from('companies').select('*').limit(1);
    console.log('Error:', error);
    console.log('Data:', data);
}

checkSchema();
