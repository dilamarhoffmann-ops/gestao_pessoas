import dotenv from 'dotenv';
dotenv.config();

const EMPREGARE_TOKEN = process.env.VITE_EMPREGARE_TOKEN;
const EMPREGARE_EMPRESA_ID = process.env.VITE_EMPREGARE_EMPRESA_ID;

async function checkSalary() {
    try {
        const authRes = await fetch('https://corporate.empregare.com/api/auth/token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ Token: EMPREGARE_TOKEN, EmpresaID: EMPREGARE_EMPRESA_ID })
        });
        const { token } = await authRes.json();

        // Vaga selecionada anteriormente: 150820
        const idVaga = 150820;
        const res = await fetch(`https://corporate.empregare.com/api/vaga/detalhes/${idVaga}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();
        const details = data.vaga || {};
        console.log(`VAGA ${idVaga} SALARIO TYPE:`, typeof details.salario);
        console.log(`VAGA ${idVaga} SALARIO VALUE:`, JSON.stringify(details.salario));
    } catch (e) {
        console.error(e);
    }
}

checkSalary();
