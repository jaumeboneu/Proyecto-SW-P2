const axios = require('axios');
const fs = require('fs');
const path = require('path');

async function downloadIcons() {
    const iconsDir = path.join(__dirname, '../public/electronics/icons');
    if (!fs.existsSync(iconsDir)) {
        fs.mkdirSync(iconsDir, { recursive: true });
        console.log(`Directorio creado: ${iconsDir}`);
    }

    for (let i = 1; i <= 68; i++) {
        const url = `https://tinkererway.dev/web_skill_trees_resources/svg/electronics_icons/icon${i}.svg`;
        const filePath = path.join(iconsDir, `icon${i}.svg`);

        try {
            const response = await axios.get(url, { responseType: 'arraybuffer' });
            fs.writeFileSync(filePath, response.data);
            console.log(`Icono icon${i}.svg descargado con éxito`);
        } catch (error) {
            console.error(`Error al descargar el icono icon${i}:`, error.message);
        }
    }

    console.log('Todos los iconos han sido descargados.');
}

downloadIcons();
