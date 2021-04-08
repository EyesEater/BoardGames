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

    let path = `saves/${game.title.replace(/\s/g, '')}_${participate.id}.json`;

    let config = {};

    if (!fs.existsSync('saves'))
        fs.mkdirSync('saves')

    if (fs.existsSync(path)) {
        config = JSON.parse(fs.readFileSync(path, 'utf8'));
    } else {
        config.users = {};
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

        let cartes = [90000, 80000, 70000, 60000, 50000, 40000, 30000, 20000, 10000];

        config.columns = {};
        let nbCartes = Math.floor(Math.random() * (12 - 6) + 6);
        for (let i=0; i<6; i++) {
            if (nbCartes >= (6-i)) {
                if (config.columns[`${i}`]) {
                    if (Math.floor(Math.random() * 3) > 1) {
                        config.columns[`${i}`].cartes.push(cartes[Math.floor(Math.random() * cartes.length)]);
                        i--;
                        nbCartes--;
                    } else {
                        config.columns[`${i}`].cartes.sort((a, b) => b - a);
                    }
                } else {
                    config.columns[`${i}`] = {};
                    config.columns[`${i}`].cartes = [];
                    config.columns[`${i}`].dices = {};
                    config.columns[`${i}`].cartes.push(cartes[Math.floor(Math.random() * cartes.length)]);
                    i--;
                    nbCartes--;
                }
            }
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
router.route('/:participateId').get(sessionChecker, (req, res) => {
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
            config.user = req.session.user;
            res.send(config);
        });
    });
}));

router.route('/:participateId/update').post(sessionChecker, (req, res) => {
    let participateId = req.params.participateId;
    let config = req.body.config;

    console.log(participateId)
    console.log(config)
});

module.exports = router;
