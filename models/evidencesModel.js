const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const evidenceSchema = new Schema({
    skillId: { type: String, required: true },
    username: { type: String, required: true }, // Cambiado de userId a username
    url: { type: String, required: true },
    approved: { type: Boolean, default: false },
    rejected: { type: Boolean, default: false },
    approvals: { type: Number, default: 0 },
    rejections: { type: Number, default: 0 },
    votedUsers: { type: [String], default: [] }
});

const getEvidences = async (skillId) => {
    try {
        // Buscar todas las evidencias relacionadas con el id de la skill
        const evidences = await Evidence.find({ skillId: skillId });

        if (evidences.length === 0) {
            console.log("No se encontraron evidencias para la skill.");
            return [];
        }

        console.log('Evidencias encontradas:', evidences);
        return evidences;
    } catch (err) {
        console.error('Error al obtener las evidencias:', err);
        throw err;
    }
};


const Evidence = mongoose.model('Evidence', evidenceSchema);
module.exports = {Evidence, getEvidences};