import puppeteer from 'puppeteer';

(async () => {
    try {
        const browser = await puppeteer.launch();
        const page = await browser.newPage();

        page.on('console', msg => console.log('PAGE LOG:', msg.text()));
        page.on('pageerror', err => console.log('PAGE ERROR:', err.toString()));
        page.on('requestfailed', request => console.log('REQUEST FAILED:', request.url(), request.failure()?.errorText));

        console.log('Navigating to localhost:3000...');
        await page.goto('http://localhost:3000', { waitUntil: 'networkidle0', timeout: 15000 });

        const bodyContent = await page.evaluate(() => document.body.innerText);
        console.log('--- BODY TEXT ---');
        console.log(bodyContent);

        const bodyHTML = await page.evaluate(() => document.body.innerHTML);
        if (bodyHTML.includes('animate-spin')) {
            console.log('SPINNER DETECTED IN HTML.');
        }

        await browser.close();
    } catch (e) {
        console.error('Script Error:', e.message);
        process.exit(1);
    }
})();
