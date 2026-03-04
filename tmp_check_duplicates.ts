import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const url = process.env.VITE_SUPABASE_URL!;
const key = process.env.VITE_SUPABASE_ANON_KEY!;
const supabase = createClient(url, key);

async function checkDuplicates() {
    console.log('Fetching candidates...');
    const { data, error } = await supabase
        .from('candidates')
        .select('id, name, email, position, created_at')
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching candidates:', error);
        return;
    }

    if (!data) {
        console.log('No candidates found.');
        return;
    }

    const seen = new Map<string, any[]>();
    const duplicatesToRemove: number[] = [];

    data.forEach(c => {
        const email = c.email ? c.email.toLowerCase().trim() : 'null';
        const name = c.name.toLowerCase().trim();
        const position = c.position ? c.position.toLowerCase().trim() : 'null';
        const key = `${name}|${email}|${position}`;

        if (seen.has(key)) {
            // This is a duplicate (since we ordered by created_at DESC, the first one is the newest)
            duplicatesToRemove.push(c.id);
        } else {
            seen.set(key, c);
        }
    });

    console.log(`Total candidates: ${data.length}`);
    console.log(`Unique candidates: ${seen.size}`);
    console.log(`Duplicates to remove: ${duplicatesToRemove.length}`);

    if (duplicatesToRemove.length > 0) {
        console.log('Example duplicates IDs:', duplicatesToRemove.slice(0, 10));

        // Uncomment to actually remove
        /*
        const { error: delError } = await supabase
            .from('candidates')
            .delete()
            .in('id', duplicatesToRemove);
        
        if (delError) console.error('Error deleting:', delError);
        else console.log('Successfully removed duplicates.');
        */
        console.log('Run the DELETE script at the bottom of the thinking block to remove them.');
    }
}

checkDuplicates();
