import dotenv from 'dotenv';
dotenv.config();

const EMPREGARE_TOKEN = process.env.VITE_EMPREGARE_TOKEN;
const EMPREGARE_EMPRESA_ID = process.env.VITE_EMPREGARE_EMPRESA_ID;

async function test() {
  const params = new URLSearchParams({
    idEmpresa: EMPREGARE_EMPRESA_ID,
    pagina: '1',
    itensPorPagina: '10'
  });

  console.log(`Buscando: https://corporate.empregare.com/api/candidato/listar?${params}`);
  
  try {
    const response = await fetch(`https://corporate.empregare.com/api/candidato/listar?${params}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${EMPREGARE_TOKEN}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    });
    
    console.log('Status:', response.status);
    const text = await response.text();
    console.log('Response:', text.substring(0, 500));
  } catch(e) {
    console.error(e);
  }

  console.log(`\n\nTentando outro endpoint: https://corporate.empregare.com/api/Pessoas?${params}`);
  try {
    const response2 = await fetch(`https://corporate.empregare.com/api/Pessoas?${params}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${EMPREGARE_TOKEN}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    });
    
    console.log('Status Pessoas:', response2.status);
    const text2 = await response2.text();
    console.log('Response Pessoas:', text2.substring(0, 500));
  } catch(e) {
    console.error(e);
  }
}

test();
