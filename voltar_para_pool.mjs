import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '.env') });

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function run() {
    const { data, error } = await supabase
        .from('candidates')
        .update({ status: 'pool' })
        .in('status', ['applied', 'interview1', 'interview2', 'offer']);

    if (error) {
        console.error('Error:', error);
    } else {
        console.log('Successfully moved candidates to pool.');
    }
}
run();
