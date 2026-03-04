import dotenv from 'dotenv';
dotenv.config();

const EMPREGARE_TOKEN = process.env.VITE_EMPREGARE_TOKEN;
const EMPREGARE_EMPRESA_ID = process.env.VITE_EMPREGARE_EMPRESA_ID;

async function testVagas() {
    console.log('--- VALIDANDO API E ID DA EMPRESA ---');
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
            console.error('❌ ERRO NA AUTENTICAÇÃO:', authData.mensagem);
            console.log('Verifique se o Token e o EmpresaID no .env estão exatamente como fornecidos pela Empregare.');
            return;
        }

        const authToken = authData.token;
        console.log('✅ Autenticação realizada com sucesso.');

        console.log('\n--- BUSCANDO VAGAS ATIVAS ---');
        const vagasResponse = await fetch(`https://corporate.empregare.com/api/vaga/listar?quantidade=10&pagina=1`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${authToken}`,
                'Accept': 'application/json'
            }
        });

        const vagasData = await vagasResponse.json();

        if (vagasData.sucesso) {
            console.log(`✅ Sucesso! Conexão estabelecida e ${vagasData.vagas ? vagasData.vagas.length : 0} vagas listadas.`);
            if (vagasData.vagas && vagasData.vagas.length > 0) {
                console.log('\nÚltimas vagas encontradas:');
                vagasData.vagas.forEach(v => console.log(`- ID: ${v.ID} | Título: ${v.Titulo}`));
            }
        } else {
            console.error('❌ ERRO AO LISTAR DADOS:', vagasData.mensagem);
        }

    } catch (e) {
        console.error('❌ ERRO TÉCNICO:', e.message);
    }
}

testVagas();
