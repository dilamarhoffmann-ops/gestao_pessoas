import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const supabase = createClient(
    process.env.VITE_SUPABASE_URL!,
    process.env.VITE_SUPABASE_ANON_KEY!
);

async function runTests() {
    console.log('=== TESTE COMPLETO DO APLICATIVO ===\n');

    // 1. TEST LOGIN
    console.log('[1] TESTE DE LOGIN...');
    try {
        const { data, error } = await supabase.auth.signInWithPassword({
            email: 'admin@apoio.com',
            password: 'admin123'
        });
        if (error) {
            console.log('   ❌ FALHA:', error.message);
        } else {
            console.log('   ✅ LOGIN OK. User ID:', data.user?.id);
        }
    } catch (e: any) {
        console.log('   ❌ ERRO:', e.message);
    }

    // 2. TEST PROFILE
    console.log('\n[2] TESTE DE PERFIL...');
    try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            console.log('   ❌ Sem user autenticado');
        } else {
            const { data: profile, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', user.id)
                .single();
            if (error) {
                console.log('   ❌ FALHA:', error.message);
            } else {
                console.log('   ✅ PERFIL OK:', JSON.stringify({ name: profile.name, role: profile.role, allowed: profile.allowed }));
            }
        }
    } catch (e: any) {
        console.log('   ❌ ERRO:', e.message);
    }

    // 3. TEST CANDIDATES
    console.log('\n[3] TESTE DE CANDIDATOS (Hiring)...');
    try {
        const { data, error } = await supabase.from('candidates').select('*').limit(5);
        if (error) {
            console.log('   ❌ FALHA:', error.message);
        } else {
            console.log(`   ✅ OK. ${data.length} candidatos encontrados.`);
        }
    } catch (e: any) {
        console.log('   ❌ ERRO:', e.message);
    }

    // 4. TEST JOB OPENINGS
    console.log('\n[4] TESTE DE VAGAS (Job Openings)...');
    try {
        const { data, error } = await supabase.from('job_openings').select('*').limit(5);
        if (error) {
            console.log('   ❌ FALHA:', error.message);
        } else {
            console.log(`   ✅ OK. ${data.length} vagas encontradas.`);
        }
    } catch (e: any) {
        console.log('   ❌ ERRO:', e.message);
    }

    // 5. TEST LAWSUITS
    console.log('\n[5] TESTE DE PROCESSOS (Lawsuits)...');
    try {
        const { data, error } = await supabase.from('lawsuits').select('*').limit(5);
        if (error) {
            console.log('   ❌ FALHA:', error.message);
        } else {
            console.log(`   ✅ OK. ${data.length} processos encontrados.`);
        }
    } catch (e: any) {
        console.log('   ❌ ERRO:', e.message);
    }

    // 6. TEST DISCOUNTS
    console.log('\n[6] TESTE DE DESCONTOS...');
    try {
        const { data, error } = await supabase.from('discounts').select('*').limit(5);
        if (error) {
            console.log('   ❌ FALHA:', error.message);
        } else {
            console.log(`   ✅ OK. ${data.length} descontos encontrados.`);
        }
    } catch (e: any) {
        console.log('   ❌ ERRO:', e.message);
    }

    // 7. TEST COMPANIES
    console.log('\n[7] TESTE DE EMPRESAS...');
    try {
        const { data, error } = await supabase.from('companies').select('*').limit(5);
        if (error) {
            console.log('   ❌ FALHA:', error.message);
        } else {
            console.log(`   ✅ OK. ${data.length} empresas encontradas.`);
        }
    } catch (e: any) {
        console.log('   ❌ ERRO:', e.message);
    }

    // 8. TEST RECEIPT CONFIGURATIONS
    console.log('\n[8] TESTE DE RECIBOS (Receipt Configs)...');
    try {
        const { data, error } = await supabase.from('receipt_configurations').select('*').limit(5);
        if (error) {
            console.log('   ❌ FALHA:', error.message);
        } else {
            console.log(`   ✅ OK. ${data.length} configurações encontradas.`);
        }
    } catch (e: any) {
        console.log('   ❌ ERRO:', e.message);
    }

    // 9. TEST USERS/PROFILES
    console.log('\n[9] TESTE DE USUÁRIOS...');
    try {
        const { data, error } = await supabase.from('profiles').select('*').limit(5);
        if (error) {
            console.log('   ❌ FALHA:', error.message);
        } else {
            console.log(`   ✅ OK. ${data.length} perfis encontrados.`);
        }
    } catch (e: any) {
        console.log('   ❌ ERRO:', e.message);
    }

    // 10. TEST CRUD - Create and Delete a test discount
    console.log('\n[10] TESTE DE CRUD (Create/Delete)...');
    try {
        const { data: created, error: createErr } = await supabase
            .from('discounts')
            .insert({ employee_name: 'Teste Automatizado', type: 'Teste', value: 1.00 })
            .select()
            .single();

        if (createErr) {
            console.log('   ❌ CREATE FALHA:', createErr.message);
        } else {
            console.log('   ✅ CREATE OK. ID:', created.id);

            // Delete it
            const { error: deleteErr } = await supabase
                .from('discounts')
                .delete()
                .eq('id', created.id);

            if (deleteErr) {
                console.log('   ❌ DELETE FALHA:', deleteErr.message);
            } else {
                console.log('   ✅ DELETE OK.');
            }
        }
    } catch (e: any) {
        console.log('   ❌ ERRO:', e.message);
    }

    console.log('\n=== TESTES CONCLUÍDOS ===');

    await supabase.auth.signOut();
}

runTests();
