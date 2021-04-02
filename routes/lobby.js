let express = require('express');
let router = express.Router();
let Game = require('../models/Game');
const Participate = require('../models/Participate');

/* GET lobby page. */
router.get('/', function(req, res) {
    Game.findAll().then((games) => {
        if (req.session.user) {
            res.render('lobby', {title: 'Salon', page_name: 'lobby', error: '', user: req.session.user, games: games});
        } else {
            res.render('lobby', {title: 'Salon', page_name: 'lobby', error: '', user: '', games: games});
        }
    });
});

module.exports = router;
