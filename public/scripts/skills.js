function renderSkills(skills, admin) {
    const svgContainer = document.querySelector('.svg-container');
    const descriptionBox = document.getElementById('description-box');
    const descriptionText = document.getElementById('description-text');
    skills.forEach(skill => {
        const svgWrapper = document.createElement('div');
        svgWrapper.classList.add('svg-wrapper');
        svgWrapper.dataset.id = skill.identifier;
        svgWrapper.dataset.custom = "false";

        const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
        svg.setAttribute("width", "160");
        svg.setAttribute("height", "160");
        svg.setAttribute("viewBox", "0 0 100 100");

        const polygon = document.createElementNS("http://www.w3.org/2000/svg", "polygon");
        polygon.setAttribute("points", "50,10 90,30 90,70 50,90 10,70 10,30");
        polygon.classList.add("hexagon");

        const text = document.createElementNS("http://www.w3.org/2000/svg", "text");
        text.setAttribute("x", "50%");
        text.setAttribute("y", "40%");
        text.setAttribute("text-anchor", "middle");
        text.setAttribute("fill", "black");
        text.setAttribute("font-size", "1");

        const maxWordsPerLine = 3;
        const titleLines = skill.text ? skill.text.split(" ") : ["Título no disponible"];
        let line = "";
        let wordCount = 0;

        titleLines.forEach((word, index) => {
            line += word + " ";
            wordCount++;

            if (wordCount >= maxWordsPerLine || index === titleLines.length - 1) {
                const tspan = document.createElementNS("http://www.w3.org/2000/svg", "tspan");
                tspan.setAttribute("x", "50%");
                tspan.setAttribute("dy", "1.1em");
                tspan.setAttribute("font-weight", "bold");
                tspan.textContent = line.trim();
                text.appendChild(tspan);
                line = "";
                wordCount = 0;
            }
        });

        const image = document.createElementNS("http://www.w3.org/2000/svg", "image");
        image.setAttribute("x", "35%");
        image.setAttribute("y", "55%");
        image.setAttribute("width", "30");
        image.setAttribute("height", "30");
        image.setAttribute("href", skill.icon);

        const iconNotebook = document.createElement('img');
        iconNotebook.src = 'images/notebook.png';
        iconNotebook.classList.add('icon-notebook');
        iconNotebook.style.display = 'none';
        iconNotebook.style.position = 'absolute';
        iconNotebook.style.top = '80%';

        iconNotebook.addEventListener('click', () => {
            window.location.href = `/views/skills_specs/${skill.identifier}`;
        });

        svgWrapper.addEventListener('mouseover', () => {
            polygon.style.transform = 'scale(1.08)';
            iconNotebook.style.display = 'inline';
            descriptionText.textContent = "Descripción de la skill";
            descriptionBox.style.display = 'block';
        });

        svgWrapper.addEventListener('mouseout', () => {
            polygon.style.transform = 'scale(1)';
            iconNotebook.style.display = 'none';
            descriptionBox.style.display = 'none';
        });

        if (admin) {
            const iconPencil = document.createElement('img');
            iconPencil.src = 'images/pencil.png';
            iconPencil.classList.add('icon-pencil');
            iconPencil.style.display = 'none';
            iconPencil.style.position = 'absolute';
            iconPencil.style.top = '80%';

            iconPencil.addEventListener("click", () => {
               window.location.href = `/skills/electronics/edit/${skill.identifier}`
            })

            svgWrapper.addEventListener('mouseover', () => {
                polygon.style.transform = 'scale(1.08)';
                iconPencil.style.display = 'inline';
                iconNotebook.style.display = 'inline';
                descriptionText.textContent = "Descripción de la skill";
                descriptionBox.style.display = 'block';
            });

            svgWrapper.addEventListener('mouseout', () => {
                polygon.style.transform = 'scale(1)';
                iconPencil.style.display = 'none';
                iconNotebook.style.display = 'none';
                descriptionBox.style.display = 'none';
            });

            svgWrapper.appendChild(iconPencil);

        }
        svgWrapper.appendChild(iconNotebook);
        if (skill.evidenceCount > 0) {
            const evidenceCounter = document.createElement('div');
            evidenceCounter.classList.add('evidence-counter');    
            // Añadimos la imagen del círculo rojo
            evidenceCounter.style.backgroundImage = "url('images/red_circle.png')";
            evidenceCounter.textContent = skill.evidenceCount;

            svgWrapper.appendChild(evidenceCounter);
        }

        if (skill.evidenceApproved > 0) {
            const evidenceCounter = document.createElement('div');
            evidenceCounter.classList.add('evidence-approved');
            evidenceCounter.style.backgroundImage = "url('images/green_circle.webp')";
            evidenceCounter.textContent = skill.evidenceApproved;

            svgWrapper.appendChild(evidenceCounter);
        }

        if (skill.evidenceRejected > 0) {
            const evidenceCounter = document.createElement('div');
            evidenceCounter.classList.add('evidence-rejected');    
            // Añadimos la imagen del círculo rojo
            evidenceCounter.style.backgroundImage = "url('images/red_circle.png')";
            evidenceCounter.textContent = skill.evidenceRejected;
            svgWrapper.appendChild(evidenceCounter);
        }

        if (skill.evidenceApproved > skill.evidenceRejected) {
            polygon.classList.add("hexagon-green");
        }

        if (skill.evidenceRejected > skill.evidenceApproved) {
            polygon.classList.add("hexagon-red");
        }

        svgWrapper.addEventListener('mouseover', () => {
            polygon.style.transform = 'scale(1.08)';
            descriptionText.textContent = "Descripción de la skill";
            descriptionBox.style.display = 'block';
        });

        svgWrapper.addEventListener('mouseout', () => {
            polygon.style.transform = 'scale(1)';
            descriptionBox.style.display = 'none';
        });

        svg.appendChild(polygon);
        svg.appendChild(text);
        svg.appendChild(image);
        svgWrapper.appendChild(svg);
        svgContainer.appendChild(svgWrapper);
    });
}
/*
document.addEventListener('DOMContentLoaded', () => {
    //const user = JSON.parse(localStorage.getItem('user'))
    const user = window.user
    console.log(user)
    if (user) {
        fetch('scripts/skills_data.json')
            .then(response => response.json())
            .then(data => {
                renderSkills(data, user); // Pasar el usuario al renderizar skills
            })
            .catch(error => console.error('Error al cargar el archivo JSON:', error));
    } else {
        console.error("Datos del usuario no están disponibles aún.");
    }
});
*/
