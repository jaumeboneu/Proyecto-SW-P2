// store_badges.js
const express = require('express');
const app = express();
app.use(express.static('public'));
const fs = require('fs').promises;
const path = require('path');
const mongoose = require('mongoose');
const { Badge } = require("../../models/badgeModel");

const MONGODB_URI = "mongodb://127.0.0.1:27017/mibd";

// Conectar a MongoDB
const connectDB = async () => {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log('Conexión establecida a MongoDB');
    } catch (error) {
        console.error('Error de conexión:', error);
        process.exit(1);
    }
};

// Función para almacenar las medallas
async function storeBadges(badges) {
    try {
        await Promise.all(badges.map(async (badge) => {
            // Verificar si la medalla ya existe por el rango
            const existingBadge = await Badge.findOne({ rango: badge.rango });
            if (existingBadge) {
                console.log(`La medalla con rango ${badge.rango} ya existe.`);
            } else {
                // Crear una nueva medalla
                const newBadge = new Badge({
                    rango: badge.rango,
                    bitpoints_min: badge.bitpoints_min,
                    bitpoints_max: badge.bitpoints_max,
                    png: badge.png
                });
                await newBadge.save();
                console.log(`Medalla con rango ${badge.rango} guardada.`);
            }
        }));
        console.log("Las medallas se han guardado correctamente.");
    } catch (err) {
        console.error('Error al intentar guardar las medallas:', err);
    }
}

// Función para leer el archivo badges.json
async function readBadgesData() {
    try {
        const filePath = path.join(__dirname, 'badges.json');
        const data = await fs.readFile(filePath, 'utf-8');
        const badges = JSON.parse(data);
        await storeBadges(badges);
    } catch (error) {
        console.error('Error al cargar el archivo JSON:', error);
    }
}

// Conectar a la base de datos y cargar las medallas
connectDB()
    .then(() => readBadgesData())
    .catch(err => console.error('Error al conectar a MongoDB:', err));
