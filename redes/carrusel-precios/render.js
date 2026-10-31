// Exporta las 8 diapositivas de index.html a PNG de 1080 x 1350 en ./png
// Uso: node redes/carrusel-precios/render.js
const path = require('path');
const fs = require('fs');
const { chromium } = require('playwright');

(async () => {
  const dir = __dirname;
  const out = path.join(dir, 'png');
  fs.mkdirSync(out, { recursive: true });

  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1080, height: 1350 } });
  await page.goto('file://' + path.join(dir, 'index.html') + '#export');
  await page.evaluate(() => document.fonts.ready);
  await page.waitForLoadState('networkidle');

  const slides = await page.$$('.slide');
  for (let i = 0; i < slides.length; i++) {
    const file = path.join(out, `precios-${String(i + 1).padStart(2, '0')}.png`);
    await slides[i].screenshot({ path: file });
    console.log(file);
  }
  await browser.close();
})();
