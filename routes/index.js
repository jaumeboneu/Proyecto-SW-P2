const express = require('express');
const path = require("path");
const session = require('express-session');
const router = express.Router();
const {getSkillById} = require('../models/skillModel')
const mongoose = require("mongoose");


router.use(session({
  secret: 'clave-secreta',
  resave: false,
  saveUninitialized: true,
}));

/* GET home page. */
router.get('/', function(req, res, next) {
    if (req.session.user) {
        //console.log(req.session.user)

      res.render(path.join(__dirname, "../views/index"), {usuario : req.session.user })
    } else {
        res.redirect("/users/login")
    }
});

router.get('/skills/:skillTree/edit/:id', async (req, res) => {
  let {skillTree, id} = req.params
    id = parseInt(id)
   //id = new mongoose.Types.ObjectId(id);
  const skill = await getSkillById(id)
  res.render(path.join(__dirname, "../views/edit_skill"), {skill})
})



module.exports = router;
