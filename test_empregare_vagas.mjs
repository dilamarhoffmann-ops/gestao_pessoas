import dotenv from 'dotenv';
dotenv.config();

const EMPREGARE_TOKEN = process.env.VITE_EMPREGARE_TOKEN;
const EMPREGARE_EMPRESA_ID = process.env.VITE_EMPREGARE_EMPRESA_ID;

async function testVagas() {
    console.log('--- TESTE DE AUTENTICAÇÃO E LISTAGEM DE VAGAS ---');
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
        console.log('Status Auth:', authResponse.status);

        if (!authData.sucesso) {
            console.error('Erro na autenticação:', authData.mensagem);
            return;
        }

        const authToken = authData.token;
        console.log('Token obtido com sucesso.');

        console.log('\n--- LISTANDO VAGAS ---');
        const vagasResponse = await fetch(`https://corporate.empregare.com/api/vaga/listar?quantidade=10&pagina=1`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${authToken}`,
                'Accept': 'application/json'
            }
        });

        console.log('Status Vagas:', vagasResponse.status);
        const vagasData = await vagasResponse.json();

        if (vagasData.sucesso) {
            console.log(`Sucesso! Encontradas ${vagasData.vagas ? vagasData.vagas.length : 0} vagas.`);
            if (vagasData.vagas && vagasData.vagas.length > 0) {
                vagasData.vagas.forEach(v => console.log(`- ID: ${v.idVaga} | Título: ${v.titulo}`));
            }
        } else {
            console.error('Erro ao listar vagas:', vagasData.mensagem);
        }

    } catch (e) {
        console.error('Erro técnico:', e);
    }
}

testVagas();
