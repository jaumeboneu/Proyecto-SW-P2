const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require("path");
const axios = require("axios");


function crearDirectorio() {
  const iconsDir = path.join(__dirname, '../badges');
  if (!fs.existsSync(iconsDir)) {
    fs.mkdirSync(iconsDir, {recursive: true});
    console.log(`Directorio creado: ${iconsDir}`);
  }
  return iconsDir
}

async function getBadges() {
  const browser = await puppeteer.launch({headless: true});
  const page = await browser.newPage();
  await page.goto('https://github.com/Obijuan/digital-electronics-with-open-FPGAs-tutorial/wiki#listado-de-rangos', {waitUntil: 'domcontentloaded'});


  const badges = await page.evaluate(() => {
    const badgesData = []
    const tables = Array.from(document.querySelectorAll('table')).slice(6, 11)
    let min = 0
    let max = 9
    tables.forEach((table) => {
      const rows = Array.from(table.querySelectorAll('tbody tr'));
      for (const row of rows) {
        const cols = Array.from(row.querySelectorAll("td"))
        if (cols.length >= 3) {
          const rango = cols[2] ? cols[2].textContent.trim() : "d"
          const bitpoints_min = min
          const bitpoints_max = max
          min += 10
          max += 10
          const archivo = cols[1] ? cols[1].querySelector('img') : "d"
          const arch = archivo ? archivo.getAttribute('src').split("/").pop() : "d"
          const png = arch ? arch.replace('.png', '-min.png') : "d"

          badgesData.push({
            rango: rango,
            bitpoints_min: bitpoints_min,
            bitpoints_max: bitpoints_max,
            png: png
          })
        }
      }
    })
    return badgesData
  })
  console.log(`Número de badges extraídas: ${badges.length}`);
  console.log(badges);

  fs.writeFileSync('badges.json', JSON.stringify(badges, null, 2), 'utf-8');

  console.log('Los datos se han guardado en badges.json');
  await browser.close();
  return badges

}

async function añadirImagenes(badges) {
  const dir = crearDirectorio()
  for (const badge of badges) {
    const png = badge.png
    const filePath = path.join(dir, png);
    const url = `https://raw.githubusercontent.com/Obijuan/digital-electronics-with-open-FPGAs-tutorial/master/rangos/png/${png}`
    try {
      const response = await axios.get(url, {responseType: 'arraybuffer'});
      fs.writeFileSync(filePath, response.data);
      console.log(`Badge ${png} descargado con éxito`);
    } catch (error) {
      console.error(`Error al descargar el badge ${png}:`, error.message);
    }
  }
}

async function ejecutar() {
  const badges = await getBadges();
  const badgesArray = Array.isArray(badges) ? badges : Object.values(badges);
  await añadirImagenes(badgesArray).then(console.log("Imagenes descargadas"))
}
ejecutar()
