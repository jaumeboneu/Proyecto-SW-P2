    const express = require('express');
    const app = express();
    app.use(express.static('public'));
    const fs = require('fs').promises
    const {storeSkill} = require("../../models/skillModel");
    const {storeSkills} = require("../../models/skillModel")
    const {Skill} = require("../../models/skillModel")
    const {read} = require("fs");
    const path = require("path");
    const mongoose = require("mongoose");

    const MONGODB_URI = "mongodb://127.0.0.1:27017/mibd"
    const connectDB = async () => {
        try {
            await mongoose.connect(MONGODB_URI);
            console.log('Conexión establecida a MongoDB');
        } catch (error) {
            console.error('Error de conexión:', error);
            process.exit(1);
        }
    };


    async function store_skills(skills) {
        try {
            await Promise.all(skills.map(skill => {
                const id = parseInt(skill.identifier)
                console.log(mongoose.Types.ObjectId.isValid(id))
                console.log(id)
                const existingSkill = Skill.findOne({ identifier: id });
                if (existingSkill)  console.log(`El skill con id ${id} ya existe.`);

                storeSkill(id, skill.text, skill.icon, skill.set, skill.tasks, skill.resources, skill.description, skill.score);
                console.log("Skill con id " + skill.id + " guardado");
            }))
            console.log("Los skill se han guardado correctamente")
        } catch(err) {
            console.error('Error al intentar guardar los skills:', err);
        }
    }
/*
    async function store_skills(skills) {
        try {
            skills.forEach(skill => {
                //skill.id = new mongoose.Types.ObjectId(skill.id)
               // skill.identifier = skill.identifier
                storeSkill(skill.identifier, skill.text, skill.icon, skill.set, skill.tasks, skill.resources, skill.description, skill.score)
            })
            //await storeSkills(skills);
            console.log("Los skill se han guardado correctamente")
        } catch(err) {
            console.error('Error al intentar guardar los skills:', err);
        }
    }
*/
    async function readSkillsData() {
        try {
            const filePath = path.join(__dirname, 'skills_data.json');
            const data = await fs.readFile(filePath, 'utf-8');
            const skills = JSON.parse(data);
            await store_skills(skills);
        } catch (error) {
            console.error('Error al cargar el archivo JSON:', error);
        }
    }

    connectDB()
    readSkillsData()

