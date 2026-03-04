import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function checkData() {
    const { data: jobs, error: errJobs } = await supabase.from('job_openings').select('*');
    console.log('Jobs:', jobs || 'Error: ' + errJobs?.message);

    const { data: candidates, error: errCandidates } = await supabase.from('candidates').select('*');
    console.log('Candidates:', candidates || 'Error: ' + errCandidates?.message);
}

checkData();
