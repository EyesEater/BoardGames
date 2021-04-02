let express = require('express');
let router = express.Router();
const fs = require('fs');
let Lobby = require('../models/Lobby');
let Game = require('../models/Game');
let User = require('../models/User');
let Participate = require('../models/Participate');
const sessionChecker = require('../services/sessionChecker');

async function getLasVegasConfig(participate) {
    const game = await Game.findByPk(participate.gameId);
    const users = await User.findAll({ include: { model: Lobby, where: { gameId: game.id }}});

    let path = `saves/${game.title.replace(/\s/g, '')}_${participate.id}.bck`;

    let config = {};

    if (fs.existsSync(path)) {
        config = fs.readFileSync(path, 'utf8');
    } else {
        config.users = {};
        let colors = ['White', 'Black', 'Blue', 'Green', 'Magenta', 'Red', 'Yellow'];

        users.forEach(user => {
            if (!config.users[`${user.id}`]) {
                config.users[`${user.id}`] = {};
                config.users[`${user.id}`].user = user;
                let i = Math.floor(Math.random() * colors.length);
                config.users[`${user.id}`].color = colors[i];
                colors = colors.slice(0,i).concat(colors.slice(i+1, colors.length));
                config.users[`${user.id}`].des = [];
            }
            config.users[`${user.id}`].des.push(Math.floor((Math.random() * 6) + 1) * 2);
            for(let i=0; i<7; i++) {
                config.users[`${user.id}`].des.push(Math.floor((Math.random() * 6) + 1));
            }
        });

        let cartes = [100000, 90000, 80000, 60000, 40000, 20000];

        config.cartes = [];
        let nbCartes = Math.floor((Math.random() + 6) * 2);
        for (let i=0; i<nbCartes; i++) {
            config.cartes.push(cartes[Math.floor(Math.random() * cartes.length)]);
        }

        try {
            fs.writeFileSync(path, JSON.stringify(config));
        } catch (e) {
            throw e;
        }
    }

    return config;
}

/* GET a Participate to a game page. */
router.route('/:participateId').get(sessionChecker, function(req, res) {
    Participate.findByPk(req.params.participateId).then((participate) => {
        Game.findByPk(participate.gameId).then(game => {
            User.findAll({ include: { model: Lobby, where: { participateID: participate.id }}}).then(users => {
                switch (game.title) {
                    case 'Las Vegas':
                        res.render('lasvegas', {title: game.title , page_name: 'lobby', users: users, game: game, participate: participate, user: req.session.user});
                        break;
                    default:
                }
            });
        });
    });
}).post(sessionChecker, ((req, res) => {
    Participate.findByPk(req.params.participateId).then((participate) => {
        getLasVegasConfig(participate).then(config => {
            res.send(config);
        });
    });
}));

module.exports = router;
