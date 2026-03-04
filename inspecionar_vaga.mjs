import dotenv from 'dotenv';
dotenv.config();

const EMPREGARE_TOKEN = process.env.VITE_EMPREGARE_TOKEN;
const EMPREGARE_EMPRESA_ID = process.env.VITE_EMPREGARE_EMPRESA_ID;

async function inspectVaga() {
    try {
        const authResponse = await fetch(`https://corporate.empregare.com/api/auth/token`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ Token: EMPREGARE_TOKEN, EmpresaID: EMPREGARE_EMPRESA_ID })
        });
        const { token } = await authResponse.json();

        const ID_VAGA = 150820;
        console.log(`Inspecionando Vaga ${ID_VAGA}...`);

        const res = await fetch(`https://corporate.empregare.com/api/vaga/detalhes/${ID_VAGA}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();

        console.log('CHAVES ENCONTRADAS NA VAGA:');
        console.log(Object.keys(data));

        if (data.Candidatos) {
            console.log(`Candidatos: ${data.Candidatos.length}`);
        } else {
            console.log('Propriedade Candidatos não encontrada.');
        }

    } catch (e) {
        console.error(e);
    }
}

inspectVaga();
