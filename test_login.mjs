import puppeteer from 'puppeteer';

(async () => {
    console.log('Starting puppeteer...');
    const browser = await puppeteer.launch({ headless: 'new' });
    const page = await browser.newPage();

    page.on('console', msg => console.log('BROWSER LOG:', msg.text()));
    page.on('pageerror', err => console.log('BROWSER ERROR:', err.toString()));

    console.log('Going to localhost:5173...');
    try {
        await page.goto('http://localhost:5173');
    } catch (e) {
        console.log('Failed to connect to 5173, trying 3000...');
        await page.goto('http://localhost:3000');
    }

    try {
        await page.waitForSelector('input[type="email"]', { timeout: 5000 });
        const inputs = await page.$$('input');
        console.log('Typing credentials...');
        await inputs[0].type('dilamar.hoffmann@redesaoroque.com.br');
        await inputs[1].type('Rh123456@');
        console.log('Clicking login...');
        const loginBtn = await page.$('#login-submit-btn');
        if (loginBtn) {
            await loginBtn.click();
            console.log('Waiting for URL change or loading spinner...');
            await new Promise(r => setTimeout(r, 3000));
            const html = await page.content();
            if (html.includes('Carregando...')) {
                console.log('Still shows Carregando...');
            } else if (html.includes('Dashboard')) {
                console.log('Dashboard loaded!');
            } else {
                console.log('Something else happened. HTML snapshot:');
                console.log(html.substring(0, 500));
            }
        }
    } catch (e) {
        console.error('Error during automation:', e);
    }

    await browser.close();
})();
