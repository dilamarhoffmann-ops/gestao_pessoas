import dotenv from 'dotenv';
dotenv.config();

const EMPREGARE_TOKEN = process.env.VITE_EMPREGARE_TOKEN;
const EMPREGARE_EMPRESA_ID = process.env.VITE_EMPREGARE_EMPRESA_ID;

async function testPessoas() {
    console.log('--- TESTE DE INTEGRAÇÃO: /api/Pessoas ---');
    try {
        const params = new URLSearchParams({
            idEmpresa: EMPREGARE_EMPRESA_ID,
            pagina: '1',
            itensPorPagina: '10'
        });

        // Primeiro obter o token de sessão (Bearer)
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

        const response = await fetch(`https://corporate.empregare.com/api/Pessoas?${params}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${authToken}`,
                'Accept': 'application/json'
            }
        });

        console.log('Status Pessoas:', response.status);
        const data = await response.json();

        console.log('ESTRUTURA RETORNADA:');
        console.log(JSON.stringify(data, null, 2));

    } catch (e) {
        console.error('Erro:', e.message);
    }
}

testPessoas();
