// models/badgeModel.js
const mongoose = require('mongoose');

// Definir el esquema para las medallas (badges)
const badgeSchema = new mongoose.Schema({
    rango: { type: String, required: true },
    bitpoints_min: { type: Number, required: true },
    bitpoints_max: { type: Number, required: true },
    png: { type: String, required: true }
});

// Crear el modelo de Badge si no ha sido definido previamente
const Badge = mongoose.models.Badge || mongoose.model('Badge', badgeSchema);

// Función para obtener una medalla por rango
const getBadgeById = async (id) => {
    try {
        const badge = await Badge.findOne({ _id: id });
        if (!badge) {
            console.log(`No hay ninguna medalla con el id: ${id}`);
            return null;
        }
        console.log('Medalla encontrada:', badge);
        return badge;
    } catch (err) {
        console.error('Error al buscar la medalla por rango:', err);
        throw err;
    }
};

// Función para almacenar una medalla nueva
const storeBadge = async (id, rango, bitpoints_min, bitpoints_max, png) => {
    try {
        const existingBadge = await Badge.findOne({ id });
        if (existingBadge) {
            console.log(`Ya existe una medalla con el id: ${id}`);
            return;
        }
        const newBadge = new Badge({ rango, bitpoints_min, bitpoints_max, png });
        const savedBadge = await newBadge.save();
        console.log('Medalla añadida:', savedBadge);
    } catch (error) {
        console.error('Error al guardar la medalla:', error);
    }
};

// Función para almacenar varias medallas
const storeBadges = async (badges) => {
    try {
        if (!badges || badges.length === 0) {
            console.log("El arreglo de medallas está vacío.");
            return;
        }
        await Badge.insertMany(badges);
        console.log("Medallas guardadas correctamente.");
    } catch (error) {
        console.error('Error al intentar guardar las medallas:', error);
    }
};

// Función para eliminar una medalla por rango
const deleteBadgeBD = async (rango) => {
    try {
        const result = await Badge.deleteOne({ rango });
        if (result.deletedCount > 0) {
            console.log('Medalla borrada exitosamente de la base de datos.');
        } else {
            console.log('No se encontró ninguna medalla con el rango proporcionado.');
        }
    } catch (err) {
        console.error('Error al borrar la medalla:', err);
    }
};

const getAllBadges = async () => {
    try {
        const badges = await Badge.find({});
        //console.log('Badges:', badges);
        return badges;
    } catch (err) {
        console.error(err);
        throw err;
    }
};


module.exports = {
    Badge,
    getBadgeById,
    storeBadge,
    storeBadges,
    deleteBadgeBD,
    getAllBadges
};


