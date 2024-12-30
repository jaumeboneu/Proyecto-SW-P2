const mongoose = require('mongoose');
const url = require("url");

const skillScheme = new mongoose.Schema({
    identifier : {
        type: Number,
        required: true,
        unique: true
    },
    text: {
        type: String,
        required: true,
        minlength: 6,
    },
    icon: {
        type: String,
        required: false,
    },
    set: {
        type: String,
        required: true,
    },
    tasks: {
        type: Array,
        required: true,
        minlength: 1,
    },
    resources: {
        type: Array,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    score: {
        type: Number,
        required: true,
        default: 1
    }
})

const Skill = mongoose.model('Skill', skillScheme);
const getSkillById = async (id) => {
    try {
        const ident = parseInt(id)
        const skill = await Skill.findOne({ identifier: ident })
        if (!skill) {
            console.log("No hay ningun skill con ese id");
        } else {
            console.log('skill encontrado:', skill);
            return skill;
        }
    } catch (err) {
        console.error(err);
        throw err;
    }
}

const storeSkill = async (id, text, icon, set, tasks, resources, description, score ) => {
    try {
        const newSkill = new Skill({
            identifier: id,
            text: text,
            icon: icon,
            set: set,
            tasks: tasks,
            resources: resources,
            description: description,
            score: score,
        });
        const skillGuard = await newSkill.save();
        console.log('Skill added:', skillGuard);
    } catch (error) {
        console.error(error);
    }
};

const storeSkills = async (skills) => {
    try {
        if (skills.length > 0) {
            await Skill.insertMany(skills);
            console.log("Skills guardados correctamente");
        }
    } catch (error) {
        console.error('Error al intentar guardar los skills:', error);
    }
};

const deleteSkillBD = async (id) => {
    try {
        const result = await Skill.deleteOne({ identifier: id });
        if (result.deletedCount > 0) {
            console.log('Skill borrado exitosamente de la base de datos');
        } else {
            console.log('No se encontró ningún Skill con el ID proporcionado.');
        }
    } catch (err) {
        console.error('Error al borrar el Skill:', err);
    }
};



module.exports = {
    skillScheme,
    getSkillById,
    storeSkill,
    storeSkills,
    deleteSkillBD,
    Skill
}