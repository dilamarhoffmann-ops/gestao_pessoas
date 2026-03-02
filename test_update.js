import fetch from 'node-fetch'; // Wait, node-fetch might not be installed. 
// I'll use node's built-in fetch if possible (Node 18+)
async function test() {
    try {
        const res = await fetch('http://localhost:3000/api/users/2', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                password: '123',
                requiresPasswordChange: true
            }),
        });
        const data = await res.json();
        console.log(data);
    } catch (e) {
        console.error(e);
    }
}
test();
