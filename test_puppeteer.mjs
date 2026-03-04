import puppeteer from 'puppeteer';

(async () => {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();

    page.on('console', msg => {
        console.log('PAGE LOG:', msg.text());
    });

    page.on('pageerror', err => {
        console.log('PAGE ERROR:', err.toString());
    });

    page.on('requestfailed', request => {
        if (request.url().includes('supabase')) {
            console.log('REQUEST FAILED:', request.url(), request.failure()?.errorText);
        }
    });

    page.on('response', response => {
        if (response.url().includes('supabase')) {
            console.log('SUPABASE RESPONSE:', response.status(), response.url());
        }
    });

    await page.goto('http://localhost:3000', { waitUntil: 'networkidle0' });

    try {
        const inputs = await page.$$('input');
        if (inputs.length >= 2) {
            await inputs[0].type('dilamar.hoffmann@redesaoroque.com.br');
            await inputs[1].type('Rh123456@');
            await page.click('button[type="submit"]');
            await page.waitForNavigation({ waitUntil: 'networkidle0', timeout: 5000 });
            console.log('Login success');
        }
    } catch (e) { console.error('Login wait error', e.message); }

    console.log('Going to recrutamento...');
    await page.goto('http://localhost:3000/pessoas/recrutamento', { waitUntil: 'networkidle0' });

    await new Promise(r => setTimeout(r, 2000));

    try {
        const buttons = await page.$$('button');
        for (const btn of buttons) {
            const text = await page.evaluate(el => el.textContent, btn);
            if (text && text.includes('Empregare')) {
                console.log('Found Empregare button and clicking it...');
                await btn.click();
                await new Promise(r => setTimeout(r, 5000));
                break;
            }
        }
    } catch (e) { console.error('Click error', e); }

    console.log('Done script');
    await browser.close();
})();
