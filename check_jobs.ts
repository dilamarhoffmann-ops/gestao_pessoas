import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

const url = process.env.VITE_SUPABASE_URL;
const key = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(url, key);

async function checkJobs() {
    const { data, error } = await supabase.from('job_openings').select('id, title').limit(10);
    if (error) {
        console.error("Error:", error.message);
    } else {
        console.log(`Found ${data.length} job openings.`);
        data.forEach(c => console.log(`- ${c.title} (${c.id})`));
    }
}

checkJobs();
