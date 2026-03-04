import dotenv from 'dotenv';
dotenv.config();

const EMPREGARE_TOKEN = process.env.VITE_EMPREGARE_TOKEN;
const EMPREGARE_EMPRESA_ID = process.env.VITE_EMPREGARE_EMPRESA_ID;

async function testVagas() {
    console.log('--- TESTE DE INSPEÇÃO DE RETORNO (VAGAS) ---');
    try {
        const authResponse = await fetch(`https://corporate.empregare.com/api/auth/token`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify({
                Token: EMPREGARE_TOKEN,
                EmpresaID: EMPREGARE_EMPRESA_ID
            })
        });

        const authData = await authResponse.json();
        if (!authData.sucesso) {
            console.error('Erro na autenticação:', authData.mensagem);
            return;
        }

        const authToken = authData.token;

        const vagasResponse = await fetch(`https://corporate.empregare.com/api/vaga/listar?quantidade=1&pagina=1`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${authToken}`,
                'Accept': 'application/json'
            }
        });

        const vagasData = await vagasResponse.json();
        console.log('ESTRUTURA DA PRIMEIRA VAGA:');
        if (vagasData.vagas && vagasData.vagas.length > 0) {
            console.log(JSON.stringify(vagasData.vagas[0], null, 2));
        } else {
            console.log('Nenhuma vaga encontrada ou estrutura diferente:', JSON.stringify(vagasData, null, 2));
        }

    } catch (e) {
        console.error('Erro técnico:', e);
    }
}

testVagas();
