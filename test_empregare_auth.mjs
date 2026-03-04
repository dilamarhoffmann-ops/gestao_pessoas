import dotenv from 'dotenv';
import fetch from 'node-fetch'; // if needed, or in node 18 fetch is global
dotenv.config();

const EMPREGARE_TOKEN = process.env.VITE_EMPREGARE_TOKEN;
const EMPREGARE_EMPRESA_ID = process.env.VITE_EMPREGARE_EMPRESA_ID;

async function test() {
    console.log('Tentando autenticar em POST /api/auth/token');
    try {
        const response = await fetch(`https://corporate.empregare.com/api/auth/token`, {
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

        console.log('Status auth:', response.status);
        const text = await response.text();
        console.log('Response auth:', text.substring(0, 1000));

        // Agora tenta listar candidatos da vaga
        const authToken = JSON.parse(text).token;

        console.log('\nTentando buscar candidatos da vaga 1...');
        // A API só permite buscar Vagas. Ou talvez candidatos da vaga. 
        // Empregare tem /api/vaga/listar e /api/pessoa/detalhes/{id}
        // E um /api/candidaturas ? Wait.
        const responseVagas = await fetch(`https://corporate.empregare.com/api/vaga/listar`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });
        console.log('Status vagas:', responseVagas.status);
        const vagasData = await responseVagas.text();
        console.log('Vagas:', vagasData.substring(0, 500));

    } catch (e) {
        console.error(e);
    }
}

test();
