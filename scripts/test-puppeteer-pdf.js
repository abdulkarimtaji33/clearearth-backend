const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });
  const page = await browser.newPage();
  await page.setContent('<html><body><h1>PDF test</h1></body></html>', { waitUntil: 'domcontentloaded' });
  const buf = Buffer.from(await page.pdf({ format: 'A4' }));
  await browser.close();
  if (!buf || buf.length < 100 || !buf.toString('ascii', 0, 5).startsWith('%PDF')) {
    throw new Error('Invalid PDF output');
  }
  console.log('Puppeteer PDF OK, bytes=' + buf.length);
})().catch((e) => {
  console.error('Puppeteer PDF FAIL:', e.message);
  process.exit(1);
});
