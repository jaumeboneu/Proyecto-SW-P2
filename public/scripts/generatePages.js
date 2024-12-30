const fs = require('fs');
const path = require('path');

// Leer el archivo skills_data.json
const skillsData = JSON.parse(fs.readFileSync('skills_data.json', 'utf8'));

// Función para crear una carpeta si no existe
function createDirIfNotExists(directory) {
    if (!fs.existsSync(directory)) {
        fs.mkdirSync(directory, { recursive: true });
    }
}

function generatePage(skill, index) {
    // Ruta donde guardaremos los archivos HTML
    const fileDir = path.join(__dirname, '..', 'html', 'skills');

    // Crear las carpetas si no existen
    createDirIfNotExists(fileDir);

    // Crear el contenido HTML para cada skill
    const content = `
        <!DOCTYPE html>
        <html lang="es">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>${skill.text}</title>
            <link rel="stylesheet" href="/css/only_skill.css">
            <script src="https://cdn.jsdelivr.net/npm/canvas-confetti@1.4.0/dist/confetti.browser.min.js"></script>
        </head>
        <body>
            <div class="skill-container">
                <h1>Skill: ${skill.text}</h1>
                <h2>Skill Score: 1 points</h2>

                <!-- Hexágono -->
                <div class="hexagon-container">
                    <div class="hexagon">
                        <!-- Puedes agregar el icono o la imagen dentro del hexágono si lo deseas -->
                    </div>
                </div>

                <!-- Descripción de la habilidad -->
                <h3>Description</h3>
                <p>${skill.description}</p>

                <!-- Tareas -->
                <h3>Tasks to Complete</h3>
                <ul id="task-list">
                    ${skill.tasks.map(task => `<li><input type="checkbox" class="task-checkbox"> ${task}</li>`).join('')}
                </ul>

                <!-- Proveer evidencia (antes de Recursos) -->
                <div id="evidence-container" style="display: none;">
                    <h3>Provide Evidence</h3>
                    <textarea id="evidence-text" placeholder="Describe your evidence here..."></textarea>
                    <button id="submit-evidence">Submit Evidence</button>
                </div>

                <!-- Recursos -->
                <h3>Resources</h3>
                <ul>
                    ${skill.resources.map(resource => `<li>resource</li>`).join('')}
                </ul>
            </div>

            <div class="description-container">
                Descripción adicional sobre la habilidad.
            </div>

            <script>
                document.addEventListener('DOMContentLoaded', () => {
                    const checkboxes = document.querySelectorAll('.task-checkbox');
                    const evidenceContainer = document.getElementById('evidence-container');
                    const submitEvidenceButton = document.getElementById('submit-evidence');
                    const evidenceText = document.getElementById('evidence-text');

                    function checkAllCheckboxes() {
                        const anyChecked = Array.from(checkboxes).some(checkbox => checkbox.checked);
                        if (anyChecked) {
                            evidenceContainer.style.display = 'block'; // Muestra el contenedor de evidencia
                            launchConfetti(); // Lanza el confeti cuando todos los checkboxes estén marcados
                        } else {
                            evidenceContainer.style.display = 'none'; // Oculta el contenedor si no hay ningún checkbox marcado
                        }
                    }

                    checkboxes.forEach(checkbox => {
                        checkbox.addEventListener('change', checkAllCheckboxes);
                    });

                    function launchConfetti() {
                        console.log('Lanzando confeti...');
                        confetti({
                            particleCount: 100,
                            spread: 70,
                            origin: { y: 0.6 }
                        });
                    }

                    // Lógica para el botón "Submit Evidence"
                    submitEvidenceButton.addEventListener('click', () => {
                        const evidence = evidenceText.value.trim();
                        if (evidence) {
                            alert('Evidence Submitted: ' + evidence);
                            evidenceText.value = ''; // Limpia el campo después de enviar
                        } else {
                            alert('Please provide evidence before submitting.');
                        }
                    });
                });
            </script>
        </body>
        </html>
    `;

    // Generar la ruta donde guardar el archivo HTML con el identificador de la habilidad
    const filePath = path.join(fileDir, `skill${index + 1}.html`);

    // Escribir el archivo en el directorio correspondiente
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Página generada para la habilidad ${skill.text} en ${filePath}`);
}

// Generar las páginas para todas las habilidades en skillsData
skillsData.forEach((skill, index) => {
    const urlPath = `/html/skills/skill${index + 1}.html`;
    skill.url = urlPath;

    generatePage(skill, index);
});
