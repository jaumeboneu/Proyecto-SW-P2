const express = require('express');
const path = require("path");
const router = express.Router();
const session = require('express-session');
const bcrypt = require('bcrypt')
const {User} = require('../models/userModel')
const {crearNuevoUsuario} = require('../models/userModel')
const {getUserByUsername} = require('../models/userModel')



router.use(session({                //para poder guardar la sesion del user
    secret: 'clave-secreta',
    resave: false,
    saveUninitialized: true,
}));

/* GET users listing. */
router.get('/login', function(req, res, next) {
     const message = req.query.message
     res.render('login', {message})
});
router.get('/register', function(req, res, next) {
    res.render('register')
});

router.post('/login', async(req, res) => {
    const { username, password } = req.body;

    // Validaciones
    if (!username || !password) {
        return res.send('Todos los campos son obligatorios.');
    }
    if (password.length < 6) {
        return res.send('La contraseña debe tener al menos 6 caracteres.');
    }

    const user = await getUserByUsername(username)

    if (user != null) {
        req.session.user = user;
        const isMatch = await bcrypt.compare(password, user.password);
        if (isMatch) {
            res.redirect('/');
        } else res.send("Contraseña incorrecta.")
    } else {
        res.send("El usuario no está registrado.")
    }

});

router.post('/register', async (req, res) => {
    const { username, password, password2 } = req.body;

    // Validaciones
    if (!username || !password || !password2) {
        return res.send('Todos los campos son obligatorios.');
    }
    if (password !== password2) {
        return res.send('Las contraseñas no coinciden.');
    }
    if (password.length < 6) {
        return res.send('La contraseña debe tener al menos 6 caracteres.');
    }

    async function isFirstUser() {
        const userCount = await User.countDocuments();
        return userCount === 0;
    }

    // Simulación de registro en base de datos (pendiente)
    const admin = await isFirstUser() ? true : false;
    try {
        crearNuevoUsuario(username, password, 0, admin, []);
        res.redirect('/users/login');
    } catch (error) {
        console.error(error);
        res.status(500).send('Error al registrar el usuario.');
    }
});

router.get('/logout', (req, res) => {
    req.session.destroy()
    res.redirect('/users/login?message=logout_success');
})

router.get('/manage', async (req, res) => {
    try {
        const users = await User.find();
        const selectedUserId = req.query.userId || null; // Captura el ID del usuario seleccionado si existe
        res.render('manage', { users, selectedUserId });
    } catch (error) {
        res.status(500).send('Error al cargar la página de gestión: ' + error.message);
    }
});

router.post('/manage', async (req, res) => {
    const { action, userId, newPassword } = req.body;

    try {
        if (action === 'showForm') {
            return res.redirect(`/users/manage?userId=${userId}`);
        } else if (action === 'changePassword') {
            if (!userId || !newPassword) {
                return res.status(400).send('Faltan datos requeridos');
            }

            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(newPassword, salt);

            const usuarioActualizado = await User.findOneAndUpdate(
                { _id: userId },      // Buscar por el ID del usuario
                { password: hashedPassword }, // Actualizar la contraseña
                { new: true }          // Retornar el documento actualizado
            );

            if (usuarioActualizado) {
                console.log('Password updated for user:', usuarioActualizado);
                return res.redirect('/users/manage');
            } else {
                return res.status(404).send('Usuario no encontrado');
            }
        }

        res.status(400).send('Acción no válida');
    } catch (error) {
        res.status(500).send('Error procesando la acción: ' + error.message);
    }
});

router.post('/submit-evidence', (req, res) => {
    if (!req.session.user) { // Verifica si el usuario está autenticado
        return res.status(401).send('No estás autenticado');
    }

    const user = req.session.user; // Obtén el usuario de la sesión
    // Aquí va el código para procesar la evidencia del usuario
    console.log('Usuario autenticado:', user.username);
});

router.post('/approve-evidence', (req, res) => {
    if (!req.session.user) { // Verifica si el usuario está autenticado
        return res.status(401).send('No estás autenticado');
    }

    const user = req.session.user; // Obtén el usuario de la sesión
    // Aquí va el código para procesar la evidencia del usuario
    console.log('Usuario autenticado:', user.username);
});

module.exports = router;
