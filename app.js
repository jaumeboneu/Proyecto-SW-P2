const createError = require('http-errors');
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const fs = require('fs');
const mongoose = require('mongoose');
const indexRouter = require('./routes/index');
const usersRouter = require('./routes/users');
const badgeModel = require('./models/badgeModel')
const {storeSkill, deleteSkillBD} = require("./models/skillModel");
const {deleteBadgeBD, getBadgeById, getAllBadges} = require("./models/badgeModel");
const {crearNuevoUsuario, getUserByUsername, User} = require("./models/userModel");
const { Evidence } = require('./models/evidencesModel');
const session = require("express-session");
const {getEvidences} = require("./models/evidencesModel");

<!-- En tu vista principal  -->
//<%- include('partials/messages') %>
<!-- En tu layout principal  -->
//<%- include('partials/username-display') %>

const MONGODB_URI = "mongodb://127.0.0.1:27017/mibd"
//Conexión con MongoDB
const connectDB = async () => {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log('Conexión establecida a MongoDB');
    } catch (error) {
        console.error('Error de conexión:', error);
        process.exit(1);
    }
};

const app = express();

// Middleware para procesar datos JSON y formularios
app.use(express.json()); // Para procesar datos en formato JSON
app.use(express.urlencoded({ extended: true })); // Para procesar datos de formularios HTML


app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(logger('dev'));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use("/models", express.static(path.join(__dirname, "models"))); //para poder importar datos de /models

app.use(session({
    secret: 'clave-secreta',
    resave: false,
    saveUninitialized: true,
}));

connectDB().then(() => {
     console.log("Conectado correctamenete a MongoDB")
})

app.use('/' , indexRouter);
app.use('/users', usersRouter);

app.get('/api/leaderboard', async(req, res) => {

    try{

        //Usar el modelo usuario que tenemos
        const users = await User.find().sort({score: -1}) //Ordenar de mayor a menor

        //Definimos los ordenes de medalla en orden de mayor a menor
        const medalLevels = await getAllBadges()

        //Objeto para almacenar a los usuarios por nivel de medalla/puntuación
        const leaderboard = {};


        //Clasificar a los usuarios en sus respectivos niveles de medalla/puntuación
        users.forEach(user => {
            for(let medal of medalLevels){
                if(user.score >= medal.bitpoints_min){
                    if(!leaderboard[medal.level]){
                        leaderboard[medal.level] = [];
                    }
                    //Añadir sólo si no está en un nivel superior aún
                    if(!Object.keys(leaderboard).some(key => key != medal.level && leaderboard[key].some(u => u.username === user.username))){
                        leaderboard[medal.level].push({
                            id: user.id,
                            username: user.username,
                            score: user.score
                        });
                    }
                    break; //Salir después de asignar el nivel más alto
                }
            }
        });

        //Devolver los datos del leaderboard
        res.json({
            leaderboard: leaderboard,
        })
    }catch(error){
        console.error('Error en el leaderboard:', error);
        res.status(500).json({message: 'Error al obtener el leaderboard'});
    }
});

app.get('/users/leaderboard', (req, res) => {
    const filePath = path.join(__dirname, 'views', 'leaderboard.html');
    res.sendFile(filePath);
});

app.get('/views/skills_specs/:id', (req, res) => {
    const skillId = req.params.id;

    fs.readFile('public/scripts/skills_data.json', 'utf8', async (err, data) => {
        if (err) {
            console.error('Error al leer el archivo JSON:', err);
            return res.status(500).send('Error del servidor');
        }

        const skills = JSON.parse(data);
        const skill = skills.find(s => s.identifier === skillId);

        if (skill) {
            const user = req.session.user
            const evidences = await getEvidences(skill.identifier)
            res.render('skills_specs', { skill, user, evidences });
        } else {
            res.status(404).send('Skill no encontrada');
        }
    });
});


app.post('/submit-evidence', (req, res) => {
    const skillId = req.body.skillId;
    const evidenceUrl = req.body['evidence-url'];
    const username = req.session.user.username;
    try {
        fs.readFile('public/scripts/skills_data.json', 'utf8', async (err, data) => {
            if (err) {
                console.error('Error al leer el archivo JSON:', err);
                return res.status(500).send('Error al leer los datos');
            }

            let skills = JSON.parse(data);
            const skill = skills.find(s => s.identifier === skillId);

            if (!skill) {
                return res.status(404).send('Skill no encontrada');
            }

            // Actualizar el archivo JSON
            skill.evidenceCount = (parseInt(skill.evidenceCount || 0) + 1).toString();

            if (!skill.evidenceUrls) {
                skill.evidenceUrls = [];
            }

            skill.evidenceUrls.push(evidenceUrl);

            fs.writeFile('public/scripts/skills_data.json', JSON.stringify(skills, null, 2), 'utf8', async (err) => {
                if (err) {
                    console.error('Error al guardar el archivo JSON:', err);
                    return res.status(500).send('Error al guardar los datos');
                }

                try {
                    // Guardar la evidencia en la base de datos
                    const newEvidence = new Evidence({
                        skillId: skillId,
                        username: username,
                        url: evidenceUrl,
                        approved: false,
                        approvals: 0
                    });

                    await newEvidence.save();

                    console.log('Evidencia guardada en la base de datos:', newEvidence);
                    res.redirect(`/views/skills_specs/${skillId}`);
                } catch (dbErr) {
                    console.error('Error al guardar la evidencia en la base de datos:', dbErr);
                    return res.status(500).send('Error al guardar la evidencia en la base de datos');
                }
            });
        });
    } catch (err) {
        console.error('Error al obtener el usuario:', err);
        return res.status(500).send('Error al obtener el usuario');
    }
});



app.post('/approve-evidence', async (req, res) => {
    const { skillId, index } = req.body;
    const isAdmin = req.session.user.admin;
    const approverUsername = req.session.user.username;

    try {
        // Leer y actualizar el archivo JSON
        const data = await fs.promises.readFile('public/scripts/skills_data.json', 'utf8');
        let skills = JSON.parse(data);
        const skill = skills.find(s => s.identifier === skillId);

        if (!skill || !skill.evidenceUrls[index]) {
            return res.status(404).send('Evidencia no encontrada');
        }

        const evidenceUrl = skill.evidenceUrls[index];

        // Buscar la evidencia en la base de datos
        const evidence = await Evidence.findOne({ skillId: skillId, url: evidenceUrl });

        if (!evidence) {
            return res.status(404).send('Evidencia no encontrada en la base de datos');
        }

        const evidenceUploader = evidence.username; // Usuario que subió la evidencia

        if (isAdmin) {
            await Evidence.findOneAndUpdate(
                { skillId: skillId, url: evidenceUrl },
                {
                    $inc: { approvals: 1 },
                    $addToSet: { votedUsers: approverUsername },
                    approved: true
                }
            );

            skill.evidenceApproved = (parseInt(skill.evidenceApproved, 10) || 0) + 1;
            skill.evidenceCount = (skill.evidenceCount || 0) - 1;
            skill.evidenceUrls.splice(index, 1); // Eliminar la evidencia aprobada

            // Actualizar en la base de datos de usuarios
            const user = await User.findOne({ username: evidenceUploader });

            if (user) {
                if (!user.completedSkills.includes(skill.text)) {
                    user.completedSkills.push(skill.text); // Añadir la skill completada
                }
                user.score = (parseInt(user.score, 10) || 0) + (parseInt(skill.score, 10) || 0);
                await user.save();
            }

            // Guardar cambios en el archivo JSON
            await fs.promises.writeFile(
                'public/scripts/skills_data.json',
                JSON.stringify(skills, null, 2),
                'utf8'
            );

            return res.status(200).send('Evidencia aprobada');
        } else {
            // Si no es administrador, manejar las aprobaciones ordinarias
            const updatedEvidence = await Evidence.findOneAndUpdate(
                { skillId: skillId, url: evidenceUrl },
                {
                    $inc: { approvals: 1 },
                    $addToSet: { votedUsers: approverUsername }
                },
                { new: true }
            );

            if (updatedEvidence.approvals >= 3) {
                await Evidence.findOneAndUpdate(
                    { skillId: skillId, url: evidenceUrl },
                    { approved: true }
                );

                // Actualizar el JSON
                skill.evidenceApproved = (parseInt(skill.evidenceApproved, 10) || 0) + 1;
                skill.evidenceCount = (skill.evidenceCount || 0) - 1;
                skill.evidenceUrls.splice(index, 1); // Eliminar la evidencia aprobada

                // Actualizar en la base de datos de usuarios
                const user = await User.findOne({ username: evidenceUploader });

                if (user) {
                    if (!user.completedSkills.includes(skill.text)) {
                        user.completedSkills.push(skill.text); // Añadir la skill completada
                    }
                    user.score = (parseInt(user.score, 10) || 0) + (parseInt(skill.score, 10) || 0);


                    await user.save();
                }
            }

            // Guardar cambios en el archivo JSON
            await fs.promises.writeFile(
                'public/scripts/skills_data.json',
                JSON.stringify(skills, null, 2),
                'utf8'
            );

            return res.status(200).send('Evidencia aprobada tras 3 comprobaciones');
        }
    } catch (err) {
        console.error('Error al procesar la aprobación de la evidencia:', err);
        res.status(500).send('Error interno del servidor');
    }
});


// Ruta para rechazar evidencia
app.post('/reject-evidence', async (req, res) => {
    let { skillId, index } = req.body;
    console.log(index)
    const isAdmin = req.session.user.admin;
    const rejecterUsername = req.session.user.username;

    try {
        // Leer y actualizar el archivo JSON
        const data = await fs.promises.readFile('public/scripts/skills_data.json', 'utf8');
        let skills = JSON.parse(data);
        const skill = skills.find(s => s.identifier === skillId);

        if (!skill || !skill.evidenceUrls[index]) {
            return res.status(404).send('Evidencia no encontrada');
        }

        const evidenceUrl = skill.evidenceUrls[index];

        // Buscar la evidencia en la base de datos
        const evidence = await Evidence.findOne({ skillId: skillId, url: evidenceUrl });

        if (!evidence) {
            return res.status(404).send('Evidencia no encontrada en la base de datos');
        }

        if (isAdmin) {
            await Evidence.findOneAndUpdate(
                    { skillId: skillId, url: evidenceUrl },
                {
                    $inc: { rejections: 1 },
                    $addToSet: { votedUsers: rejecterUsername },
                    $set: { rejected: true }
                }
            );

            // Actualizar el JSON
            skill.evidenceRejected = (parseInt(skill.evidenceRejected, 10) || 0) + 1;
            skill.evidenceCount = (skill.evidenceCount || 0) - 1;
            skill.evidenceUrls.splice(index, 1); // Eliminar la evidencia rechazada

            // Guardar cambios en el archivo JSON
            await fs.promises.writeFile(
                'public/scripts/skills_data.json',
                JSON.stringify(skills, null, 2),
                'utf8'
            );

            return res.status(200).send('Evidencia rechazada');
        } else {
            // Si no es administrador, manejar los rechazos ordinarios
            const updatedEvidence = await Evidence.findOneAndUpdate(
                { skillId: skillId, url: evidenceUrl },
                {
                    $inc: { rejections: 1 },
                    $addToSet: { votedUsers: rejecterUsername }
                },
                { new: true }
            );

            if (updatedEvidence.rejections >= 3) {
                await Evidence.findOneAndUpdate(
                    { skillId: skillId, url: evidenceUrl },
                    { rejected: true }
                );

                // Actualizar el JSON
                skill.evidenceRejected = (parseInt(skill.evidenceRejected, 10) || 0) + 1;
                skill.evidenceCount = (skill.evidenceCount || 0) - 1;
                skill.evidenceUrls.splice(index, 1); // Eliminar la evidencia rechazada
            }

            // Guardar cambios en el archivo JSON
            await fs.promises.writeFile(
                'public/scripts/skills_data.json',
                JSON.stringify(skills, null, 2),
                'utf8'
            );

            return res.status(200).send('Evidencia rechazada tras 3 votos');
        }
    } catch (err) {
        console.error('Error al procesar el rechazo de la evidencia:', err);
        res.status(500).send('Error interno del servidor');
    }
});


app.get('/skills/add', (req, res) => {
    res.render('add_skill');
});

app.post('/skills/add',  (req, res) => {
    // Verifica si el usuario es administrador (opcional)
    const { text, description, tasks, resources, score } = req.body;

    // Ruta al archivo JSON
    const filePath = path.join(__dirname, 'public', 'scripts', 'skills_data.json');

    // Leer el archivo JSON
    fs.readFile(filePath, 'utf8', async (err, data) => {
        if (err) {
            console.error('Error reading skills_data.json:', err);
            return res.status(500).json({success: false, message: 'Error reading data'});
        }

        // Parsear los datos existentes
        let skillsData = JSON.parse(data);

        const newSkill = {
            identifier: skillsData.length + 1,
            text: text,
            icon: "",
            set: "electronics",
            tasks: tasks ? tasks.split(',') : [],
            resources: resources ? resources.split(',') : [],
            description: description,
            score: score || "1",
            evidenceCount: "0",
            evidenceApproved: "0",
            evidenceRejected: "0"
        };

        // Añadir la nueva habilidad al final del array
        skillsData.push(newSkill);

        // Escribir los nuevos datos en el archivo JSON
        fs.writeFile(filePath, JSON.stringify(skillsData, null, 2), 'utf8', (err) => {
            if (err) {
                console.error('Error writing to skills_data.json:', err);
                return res.status(500).json({success: false, message: 'Error saving data'});
            }
        });
        try {
            await storeSkill(newSkill.identifier, newSkill.text, newSkill.icon, newSkill.set, newSkill.tasks, newSkill.resources, newSkill.description, newSkill.score)
            console.log(`Skill con id ${newSkill.identifier} actualizado en la base de datos`);
            res.redirect('/');
        } catch (err) {
            console.error('Error al intentar actualizar el skill en la base de datos:', err);
            res.status(500).send("Error al actualizar el skill en la base de datos.");
        }
    });
});

app.post('/skills/:skillTree/edit/:id', async (req, res) => {
    const {text, descr, tasks, resources, score, icon} = req.body
    const id = req.params.id
    console.log(text)
    console.log(descr)
    const filePath = path.join(__dirname, 'public', 'scripts', 'skills_data.json');

    fs.readFile(filePath, 'utf8', (err, data) => {
        if (err) {
            console.error('Error reading skills_data.json:', err);
            return res.status(500).json({success: false, message: 'Error reading data'});
        }
        const skills = JSON.parse(data)
        const skill = skills.find(item => item.identifier == id)
        skill.text = text;
        skill.description = descr;
        skill.tasks = tasks.split(/\r?\n/);
        skill.resources = resources.split(/\r?\n/);
        skill.score = parseInt(score, 10);;
        skill.icon = icon.trim() === "" ? skill.icon : icon.trim();
        skill.evidenceCount = 0
        skill.evidenceApproved = 0
        skill.evidenceRejected = 0
        editSkill(skills, skill)
    })
    const editSkill = async (skills, skill) => {
        const ind = skills.findIndex(sk => sk.identifier == skill.identifier)
        skills.splice(ind, 1, skill)
        const data = JSON.stringify(skills, null, 2);
        fs.writeFile(filePath, data, "utf-8", (err) => {
            if (err) {
                console.error("Error al escribir el archivo:", err);
            } else {
                console.log("Archivo guardado exitosamente en /scripts/skills_data.json");
            }
        });
        try {
            await deleteSkillBD(skill.identifier)
            await storeSkill(skill.identifier, skill.text, skill.icon, skill.set, skill.tasks, skill.resources, skill.description, skill.score)
            console.log(`Skill con id ${skill.identifier} actualizado en la base de datos`);
            res.redirect('/');
        } catch (err) {
            console.error('Error al intentar actualizar el skill en la base de datos:', err);
            res.status(500).send("Error al actualizar el skill en la base de datos.");
        }
    }
})

app.delete('/skills/:skillTree/delete/:id',  (req, res) => {
    const { skillTree, id } = req.params;
    const filePath = path.join(__dirname, 'public', 'scripts', 'skills_data.json');
    const deleteSkill = (skills, skill) => {
        const ind = skills.findIndex(sk => sk.identifier == skill.identifier)
        skills.splice(ind, 1)
        const data = JSON.stringify(skills, null, 2);
        fs.writeFile(filePath, data, "utf-8", (err) => {
            if (err) {
                console.error("Error al escribir el archivo:", err);
            } else {
                console.log("Skill borrado exitosamente en /scripts/skills_data.json");
            }
        });
        deleteSkillBD(id).then(() => {
            res.status(200).json({ success: true });
        }).catch(err => {
            res.status(500).json({ success: false, message: 'Error deleting from database', error: err });
        });
    }

    fs.readFile(filePath, 'utf8', (err, data) => {
        if (err) {
            console.error('Error reading skills_data.json:', err);
            return res.status(500).json({success: false, message: 'Error reading data'});
        }
        const skills = JSON.parse(data)
        const skill = skills.find(item => item.identifier == id)
        deleteSkill(skills, skill)
    })
});


app.get('/admin/badges/edit/:id', async (req, res) => {
    const id = req.params.id;
    try {
        const badge = await getBadgeById(id); // Obtén la medalla por su rango
        console.log(badge.id)
        if (!badge) {
            return res.status(404).send('Medalla no encontrada');
        }
        res.render('editBadge', { badge });
    } catch (err) {
        res.status(500).send('Error al obtener la medalla');
    }
});



app.post('/admin/badges/edit/:id', async (req, res) => {
    //const oldRango = req.params.rango;  // Rango original (antes de la edición)
    const id = req.params.id;
    const { rango, bitpoints_min, bitpoints_max, png } = req.body;  // Nuevos valores

    try {
        // Buscar la medalla en la base de datos por el rango original
        const badge = await getBadgeById(id);
        if (!badge) {
            return res.status(404).send('Medalla no encontrada');
        }
        const oldRango = badge.rango
        // Actualizar los campos de la medalla en la base de datos
        badge.rango = rango;  // Actualizamos el rango
        badge.bitpoints_min = bitpoints_min;
        badge.bitpoints_max = bitpoints_max;
        badge.png = png;

        // Guardar los cambios en la base de datos
        await badge.save();

        // Actualizar badges.json
        const filePath = path.join(__dirname, 'public', 'scripts', 'badges.json');
        console.log('Ruta del archivo badges.json:', filePath);

        // Leer el archivo badges.json
        const fileData = fs.readFileSync(filePath, 'utf8');
        const badgesData = JSON.parse(fileData);

        // Buscar la medalla en el JSON por el rango original
        const badgeIndex = badgesData.findIndex(badge => badge.rango === oldRango);

        if (badgeIndex === -1) {
            console.log(`No se encontró la medalla con el rango: ${oldRango}`);
            return res.status(404).send('Medalla no encontrada en el archivo JSON');
        }

        // Actualizar los campos de la medalla correspondiente en el JSON
        badgesData[badgeIndex].rango = rango;
        badgesData[badgeIndex].bitpoints_min = bitpoints_min;
        badgesData[badgeIndex].bitpoints_max = bitpoints_max;
        badgesData[badgeIndex].png = png;

        // Verificar los datos antes de escribir
        console.log('Datos actualizados para badges.json:', badgesData);

        // Escribir los datos actualizados en el archivo badges.json
        try {
            fs.writeFileSync(filePath, JSON.stringify(badgesData, null, 2));
            console.log('Archivo badges.json actualizado correctamente.');
        } catch (err) {
            console.error('Error al escribir en badges.json:', err);
        }

        // Redirigir o responder con éxito
        res.redirect('/admin/badges');
    } catch (err) {
        console.error('Error al guardar la medalla:', err);
        res.status(500).send('Error al guardar los cambios');
    }
});



app.delete('/admin/badges/delete/:id', async(req, res) => {
    let id = req.params.id;
    const filePath = path.join(__dirname, 'public', 'scripts', 'badges.json');
    //id = parseInt(id, 10)
    const badgeElim = await getBadgeById(id)
    const deleteBadge = (badges, badge) => {
        const ind = badges.findIndex(b => b.rango === badge.rango);
        badges.splice(ind, 1);
        const data = JSON.stringify(badges, null, 2);

        fs.writeFile(filePath, data, "utf-8", (err) => {
            if (err) {
                console.error("Error writing to badges.json:", err);
            } else {
                console.log("Badge deleted successfully in /scripts/badges.json");
            }
        });

        deleteBadgeBD(badge.rango).then(() => {
            res.status(200).json({ success: true });
        }).catch(err => {
            res.status(500).json({ success: false, message: 'Error deleting from database', error: err });
        });
    };

    fs.readFile(filePath, 'utf8', (err, data) => {
        if (err) {
            console.error('Error reading badges.json:', err);
            return res.status(500).json({ success: false, message: 'Error reading data' });
        }
        const badges = JSON.parse(data);
        const badge = badges.find(item => item.rango === badgeElim.rango);

        if (!badge) {
            return res.status(404).json({ success: false, message: 'Badge not found' });
        }

        deleteBadge(badges, badge);
    });
});

app.get('/admin/badges', async (req, res) => {
    // Leer el archivo badges.json
    /*
    fs.readFile(path.join(__dirname, 'public', 'scripts', 'badges.json'), 'utf-8', (err, data) => {
        if (err) {
            return res.status(500).send('Error al leer el archivo de medallas');
        }
        const badges = JSON.parse(data);

     */
    let badges = await getAllBadges()
    badges = badges.sort((a, b) => {
        const minA = parseInt(a.bitpoints_min, 10);
        const minB = parseInt(b.bitpoints_min, 10);

        // Comparar por bitpoints_min
        if (minA < minB) return -1; // a viene antes que b
        if (minA > minB) return 1;  // b viene antes que a

        // Si bitpoints_min es igual, comparar por bitpoints_max
        const maxA = parseInt(a.bitpoints_max, 10);
        const maxB = parseInt(b.bitpoints_max, 10);
        return maxA - maxB; // Ordena por bitpoints_max si es necesario
    });

    res.render('adminBadges', { badges }); // Enviar los badges a la vista
});


app.get('/getAllBadges', async (req, res) => {
    const result = await badgeModel.getAllBadges();
    res.json(result);
});



app.use(function(req, res, next) {
    next(createError(404));
});

app.use(function(err, req, res, next) {
    res.locals.message = err.message;
    res.locals.error = req.app.get('env') === 'development' ? err : {};

    res.status(err.status || 500);
    res.render('error');
});
module.exports = app;

