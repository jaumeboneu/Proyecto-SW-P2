const puppeteer = require('puppeteer');
const fs = require('fs');

async function scrapeData() {
    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();
    await page.goto('https://tinkererway.dev/web_skill_trees/electronics_skill_tree', { waitUntil: 'domcontentloaded' });

    await page.waitForSelector('.svg-container');

    const skills = await page.evaluate(() => {
        const skillsData = [];

        const skillElements = document.querySelectorAll('.svg-container .svg-wrapper');

        skillElements.forEach((element) => {
            const identifier = element.getAttribute('data-id');

            const textNodes = element.querySelectorAll('text tspan');
            let text = '';
            textNodes.forEach(tspan => {
                text += tspan.textContent.trim() + ' ';
            });

            if (!text.trim()) {
                text = "Texto no disponible";
            }

            const iconHref = element.querySelector('image') ? element.querySelector('image').getAttribute('href') : '';
            const iconName = iconHref.split('/').pop();

            const iconPath = `/electronics/icons/${iconName}`;

            skillsData.push({
                identifier: identifier,
                text: text.trim(),
                icon: iconPath,
                set: 'electronics',
                tasks: [],
                resources: [],
                description: 'Descripcion del skill',
                score: '1',
                evidenceCount: '0',
                evidenceApproved: '0',
                evidenceRejected: '0'
            });
        });

        return skillsData;
    });

    console.log(`Número de competencias extraídas: ${skills.length}`);
    console.log(skills);

    fs.writeFileSync('public/scripts/skills_data.json', JSON.stringify(skills, null, 2), 'utf-8');

    console.log('Los datos se han guardado en skills_data.json');
    await browser.close();
}

scrapeData();
