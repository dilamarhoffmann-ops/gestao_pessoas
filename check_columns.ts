import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const url = process.env.VITE_SUPABASE_URL;
const key = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(url, key);

async function checkColumns() {
    // Querying the RPC to get table info if available, or just try to select
    const { data, error } = await supabase.from('companies').select('*').limit(0);
    if (error) {
        console.error('Error selecting from companies:', error.message);
    } else {
        console.log('Columns likely present (empty select success)');
    }
}

checkColumns();
