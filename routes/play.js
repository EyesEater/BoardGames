let express = require('express');
let router = express.Router();
const fs = require('fs');
let Lobby = require('../models/Lobby');
let Game = require('../models/Game');
let User = require('../models/User');
let Participate = require('../models/Participate');
const sessionChecker = require('../services/sessionChecker');

async function getLasVegasConfig(participate, user) {
    const game = await Game.findByPk(participate.gameId);
    const users = await User.findAll({ include: { model: Lobby, where: { gameId: game.id }}});

    let path = `saves/${game.title.replace(/\s/g, '')}_${participate.id}.bck`;

    let config = {};

    if (fs.existsSync(path)) {
        config = fs.readFileSync(path, 'utf8');
    } else {
        config.users = {};
        config.user = user;
        let colors = ['White', 'Black', 'Blue', 'Green', 'Magenta', 'Red', 'Yellow'];

        users.forEach(user => {
            if (!config.users[`${user.id}`]) {
                config.users[`${user.id}`] = {};
                config.users[`${user.id}`].user = user;
                config.users[`${user.id}`].des = {};
            }
            config.users[`${user.id}`].des['0'] = {};
            config.users[`${user.id}`].des['0'].dice = (Math.floor((Math.random() * 6) + 1) * 2);
            config.users[`${user.id}`].des['0'].user = user;

            let colorIndex = Math.floor(Math.random() * colors.length);

            for(let i=0; i<8; i++) {
                config.users[`${user.id}`].des[`${i}`] = {};
                config.users[`${user.id}`].des[`${i}`].dice = (Math.floor((Math.random() * 6) + 1));
                config.users[`${user.id}`].des[`${i}`].user = user;
                config.users[`${user.id}`].des[`${i}`].color = colors[colorIndex];
                config.users[`${user.id}`].des[`${i}`].doubleDice = false;
            }
            config.users[`${user.id}`].des['0'].doubleDice = true;
            colors = colors.slice(0,colorIndex).concat(colors.slice(colorIndex+1, colors.length));
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
        getLasVegasConfig(participate, req.session.user).then(config => {
            res.send(config);
        });
    });
}));

module.exports = router;
