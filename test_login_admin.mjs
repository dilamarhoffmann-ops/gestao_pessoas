import puppeteer from 'puppeteer';

(async () => {
    console.log('Starting puppeteer...');
    const browser = await puppeteer.launch({ headless: 'new' });
    const page = await browser.newPage();

    page.on('console', msg => console.log('BROWSER LOG:', msg.text()));
    page.on('pageerror', err => console.log('BROWSER ERROR:', err.toString()));

    try {
        await page.goto('http://localhost:3000', { waitUntil: 'networkidle0' });
    } catch (e) {
        console.log('Failed to connect to 3000:', e);
    }

    try {
        await page.waitForSelector('input[type="email"]', { timeout: 5000 });
        const inputs = await page.$$('input');
        console.log('Typing credentials admin@apoio.com ...');
        await inputs[0].type('admin@apoio.com');
        await inputs[1].type('admin123');
        console.log('Clicking login...');
        const loginBtn = await page.$('button[type="submit"]');
        if (loginBtn) {
            await loginBtn.click();
            console.log('Waiting for URL change or loading spinner...');
            await new Promise(r => setTimeout(r, 6000));
            const html = await page.content();
            if (html.includes('Carregando...')) {
                console.log('Still shows Carregando...');
            } else if (html.includes('Painel de')) {
                console.log('Dashboard loaded!');
            } else if (html.includes('Invalid login credentials')) {
                console.log('Invalid login credentials!');
            } else {
                console.log('Something else happened. HTML snapshot:');
                console.log(html.substring(0, 1000));
            }
        }
    } catch (e) {
        console.error('Error during automation:', e);
    }

    await browser.close();
})();
