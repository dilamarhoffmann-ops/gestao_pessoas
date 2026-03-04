async function testVagaProxy() {
    try {
        const res = await fetch('http://localhost:3000/api/empregare/proxy?endpoint=vaga/listar&quantidade=10');
        const data = await res.json();
        console.log('STATUS:', res.status);
        console.log('DATA KEYS:', Object.keys(data));
        if (data.vagas) {
            console.log('VAGAS FOUND:', data.vagas.length);
            console.log('TITULO DA PRIMEIRA:', data.vagas[0].Titulo);
        } else {
            console.log('VAGAS NOT FOUND');
            console.log('FULL DATA:', JSON.stringify(data).substring(0, 500));
        }
    } catch (e) {
        console.error(e);
    }
}

testVagaProxy();
