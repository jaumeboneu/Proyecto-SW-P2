const mongoose = require('mongoose');
const bcrypt = require('bcrypt')
const userSchema = new mongoose.Schema({
    username : {
        type: String,
        required: true,
        minlength: 3,
        maxLength: 20,
        unique: true
    },
    password: {
        type: String,
        required: true,
        minlength: 6,
    },
    score: {
        type: Number,
        required: true,
    },
    admin: {
        type: Boolean,
        required: true,
    },
    completedSkills: {
        type: Array,
        required: true,

    }
})

// Middleware para encriptar la contraseña antes de guardar

userSchema.pre('save', async function(next) {
    if (!this.isModified('password')) {
        return next(); // Si no se modificó, continuar sin cifrar
    }
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
});

const crearNuevoUsuario = async (us, ps, sc, role, cs ) => {
    try {
        const nuevoUsuario = new User({
            username: us,
            password: ps,
            score: sc,
            admin: role,
            completedSkills: cs
        });
        const usuarioGuard = await nuevoUsuario.save();
        console.log('User added:', usuarioGuard);
    } catch (error) {
        console.error(error);
    }
};


const getUserByUsername = async (username) => {
    try {
        const user = await User.findOne({ username: username })
        if (!user) {
            console.log("No se encontro ningun usuario");
        }
        console.log('Usuario encontrado:', user);
        return user;
    } catch (err) {
        console.error(err);
        throw err;
    }
}


const User = mongoose.model('User', userSchema);

module.exports = {User, crearNuevoUsuario, getUserByUsername}