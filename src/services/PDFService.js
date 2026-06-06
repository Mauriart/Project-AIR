const puppeteer = require('puppeteer');

async function generarPDF(html) {
    const browser = await puppeteer.launch({ 
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox'] // necesario en algunos entornos
    });
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0' });
    const pdf = await page.pdf({ format: 'A4', printBackground: true, margin: { top: '1cm', bottom: '1cm' } });
    await browser.close();
    return pdf;
}

module.exports = { generarPDF };