import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const url = process.env.VITE_SUPABASE_URL;
const key = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(url, key);

async function testInsert() {
    // This will likely fail with RLS error if we are not authenticated,
    // which is fine, but it tells us the table is there.
    const { data, error } = await supabase
        .from('companies')
        .insert({ name: 'TEST CO', cnpj: '12.345.678/0001-99' })
        .select()
        .single();

    if (error) {
        console.error('Insert error (expected with RLS/Anon):', error.message);
    } else {
        console.log('Insert success!', data);
    }
}

testInsert();
