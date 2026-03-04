import dotenv from 'dotenv';
dotenv.config();

const EMPREGARE_TOKEN = process.env.VITE_EMPREGARE_TOKEN;
const EMPREGARE_EMPRESA_ID = process.env.VITE_EMPREGARE_EMPRESA_ID;

async function test() {
    try {
        console.log('--- AUTENTICANDO ---');
        const authResponse = await fetch(`https://corporate.empregare.com/api/auth/token`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ Token: EMPREGARE_TOKEN, EmpresaID: EMPREGARE_EMPRESA_ID })
        });
        const authData = await authResponse.json();
        if (!authData.sucesso) throw new Error(authData.mensagem);
        const token = authData.token;
        console.log('✅ Token obtido.');

        console.log('\n--- BUSCANDO VAGAS ---');
        const vagasRes = await fetch(`https://corporate.empregare.com/api/vaga/listar?quantidade=5`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const vagasData = await vagasRes.json();

        if (!vagasData.vagas || vagasData.vagas.length === 0) {
            console.log('Nenhuma vaga encontrada.');
            return;
        }

        const firstVaga = vagasData.vagas[0];
        console.log(`Vaga selecionada: ${firstVaga.Titulo} (ID: ${firstVaga.ID})`);

        // Tentar listar candidatos dessa vaga
        console.log('\n--- TENTANDO LISTAR CANDIDATOS DA VAGA ---');
        // Testando endpoint provável: /api/vaga/detalhes/{id} (pode conter candidatos)
        const detalhesRes = await fetch(`https://corporate.empregare.com/api/vaga/detalhes/${firstVaga.ID}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const detalhesData = await detalhesRes.json();
        console.log('Status Detalhes:', detalhesRes.status);

        // Se houver candidatos nos detalhes
        if (detalhesData.Candidaturas) {
            console.log(`Encontradas ${detalhesData.Candidaturas.length} candidaturas nos detalhes.`);
        } else {
            console.log('Dados de candidaturas não encontrados nos detalhes da vaga.');
        }

        // Tentar endpoint universal de busca de pessoas se existir
        console.log('\n--- TENTANDO LISTAR TODAS AS PESSOAS ---');
        const pessoasRes = await fetch(`https://corporate.empregare.com/api/pessoa/listar?quantidade=10&idEmpresa=${EMPREGARE_EMPRESA_ID}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        console.log('Status /api/pessoa/listar:', pessoasRes.status);
        if (pessoasRes.status === 200) {
            const text = await pessoasRes.text();
            console.log('Response /api/pessoa/listar:', text.substring(0, 200));
        }

    } catch (e) {
        console.error('Erro:', e.message);
    }
}

test();
