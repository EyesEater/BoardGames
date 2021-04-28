module.exports = (app) => {
    let express = require('express');
    let router = express.Router();
    const fs = require('fs');
    let Lobby = require('../models/Lobby');
    let Game = require('../models/Game');
    let User = require('../models/User');
    let Participate = require('../models/Participate');
    const sessionChecker = require('../services/sessionChecker');

    const server = require('http').createServer(app);
    const io = require('socket.io')(server, {
        cors: {
            origin: "http://localhost:3000",
            methods: ["GET", "POST"]
        }
    });
    server.listen(3001, "127.0.0.1");

    function rollDices(config) {
        let userId = config.playerTurn.id;
        for (let key in config.users[`${userId}`].des) {
            if (config.users[`${userId}`].des.hasOwnProperty(key))
                config.users[`${userId}`].des[`${key}`].dice = (Math.floor((Math.random() * 6) + 1));
        }
        return config;
    }

    function calculateScores(config) {
        //TODO calculate scores for each users

        return config;
    }

    function nextManche(config) {
        config = calculateScores(config);

        for (let key in config.users) {
            if (config.users.hasOwnProperty(key)) {
                config.users[key].isReady = false;
            }
        }

        config.manche++;
        config.mancheOver = false;
        let i = Math.floor(Math.random() * Object.keys(config.users).length) + 1;
        config.playerTurn = {};
        config.playerTurn = config.users[i].user;

        config = rerollAllDices(config, config.users);

        config = rerollColumns(config);

        Participate.findOne({where: {id: config.participateId}, include: 'game'}).then(participate => {
            const path = `saves/${participate.game.title.replace(/\s/g, '')}_${config.participateId}.json`;
            fs.writeFileSync(path, JSON.stringify(config));
        });
    }

    function rerollAllDices(config, users) {
        let colors = ['White', 'Black', 'Blue', 'Green', 'Magenta', 'Red', 'Yellow'];

        if (Array.isArray(users)) {
            users.forEach(user => {
                if (!config.users[`${user.id}`]) {
                    config.users[`${user.id}`] = {};
                    config.users[`${user.id}`].user = user;
                    config.nbUsers = config.users.length;
                    config.users[`${user.id}`].des = {};
                }
                config.users[`${user.id}`].des['0'] = {};
                config.users[`${user.id}`].des['0'].dice = (Math.floor((Math.random() * 6) + 1) * 2);
                config.users[`${user.id}`].des['0'].user = user;

                config.users[`${user.id}`].isReady = false;

                let colorIndex = Math.floor(Math.random() * colors.length);

                for (let i = 0; i < 8; i++) {
                    config.users[`${user.id}`].des[`${i}`] = {};
                    config.users[`${user.id}`].des[`${i}`].dice = (Math.floor((Math.random() * 6) + 1));
                    config.users[`${user.id}`].des[`${i}`].user = user;
                    config.users[`${user.id}`].des[`${i}`].color = colors[colorIndex];
                    config.users[`${user.id}`].des[`${i}`].doubleDice = false;
                }
                config.users[`${user.id}`].des['0'].doubleDice = true;
                colors = colors.slice(0, colorIndex).concat(colors.slice(colorIndex + 1, colors.length));
            });
        } else {
            for (let key in users) {
                if (users.hasOwnProperty(key)) {
                    config.users[`${config.users[key].user.id}`].des['0'].dice = (Math.floor((Math.random() * 6) + 1) * 2);
                    config.users[`${config.users[key].user.id}`].des['0'].user = config.users[key].user;

                    config.users[`${config.users[key].user.id}`].isReady = false;

                    for (let i = 0; i < 8; i++) {
                        config.users[`${config.users[key].user.id}`].des[`${i}`].dice = (Math.floor((Math.random() * 6) + 1));
                        config.users[`${config.users[key].user.id}`].des[`${i}`].doubleDice = false;
                    }
                    config.users[`${config.users[key].user.id}`].des['0'].doubleDice = true;
                }
            }
        }

        return config;
    }

    function rerollColumns(config) {
        let cartes = [90000, 80000, 70000, 60000, 50000, 40000, 30000, 20000, 10000];

        config.columns = {};
        let nbCartes = Math.floor(Math.random() * (12 - 6) + 6);
        for (let i=0; i<6; i++) {
            if (nbCartes >= (6-i))
                if (config.columns[`${i}`])
                    if (Math.floor(Math.random() * 3) > 1) {
                        config.columns[`${i}`].cartes.push(cartes[Math.floor(Math.random() * cartes.length)]);
                        i--;
                        nbCartes--;
                    } else
                        config.columns[`${i}`].cartes.sort((a, b) => b - a);
                else {
                    config.columns[`${i}`] = {};
                    config.columns[`${i}`].cartes = [];
                    config.columns[`${i}`].dices = [];
                    config.columns[`${i}`].cartes.push(cartes[Math.floor(Math.random() * cartes.length)]);
                    i--;
                    nbCartes--;
                }
            else if (config.columns[`${i}`])
                config.columns[`${i}`].cartes.sort((a, b) => b - a);
        }

        return config;
    }

    async function getLasVegasConfig(participate) {
        const game = await Game.findByPk(participate.gameId);

        let path = `saves/${game.title.replace(/\s/g, '')}_${participate.id}.json`;

        let config = {};

        if (!fs.existsSync('saves'))
            fs.mkdirSync('saves')

        if (fs.existsSync(path)) {
            config = JSON.parse(fs.readFileSync(path, 'utf8'));
        } else {
            const users = await User.findAll({ include: { model: Lobby, where: { participateID: participate.id }}});

            config.users = {};
            config.participateId = participate.id;

            config.gameOver = false;

            config.scores = [];

            config.logs = [];

            config.score = {};

            config.manche = 1;

            config.mancheOver = false;

            config = rerollAllDices(config, users);

            let i = Math.floor(Math.random() * users.length);
            config.playerTurn = {};
            config.playerTurn = users[i];

            config = rerollColumns(config);

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
                res.send({config: config, user: req.session.user});
            });
        });
    }));

    io.on("connection", async (socket) => {
        socket.on('joinParticipate', (participateId) => {
            socket.join("participate:" + participateId);
        });
        socket.on('someoneReady', (data) => {
            let participateId = data.config.participateId;
            let user = data.user;
            let config = data.config;
            let users = config.users;
            let everyoneReady = true;

            for (let key in users) {
                if (users.hasOwnProperty(key) && !users[key].isReady && everyoneReady)
                    everyoneReady = false;
            }

            if (everyoneReady) {
                nextManche(config);
            }

            Participate.findOne({where: {id: participateId}, include: 'game'}).then((participate) => {
                const path = `saves/${participate.game.title.replace(/\s/g, '')}_${participateId}.json`;
                fs.writeFileSync(path, JSON.stringify(config));

                io.to("participate:" + participateId).emit("someoneReady", { user: user, everyoneReady: everyoneReady, config: config });
            });
        });
        socket.on("nextManche", config => {

        });
        socket.on("gameChange", config => {
            let participateId = config.participateId;

            let over = false;
            let firstUser;
            let firstIteration = true;
            let gameOver = true;

            for (let userId in config.users) {
                if (config.users.hasOwnProperty(userId) && !over) {
                    if (firstIteration && Object.keys(config.users[userId].des).length !== 0) {
                        firstUser = config.users[userId].user;
                        firstIteration = false;
                    }

                    if (config.users[userId].user.id === config.playerTurn.id) {
                        let isNext = false;

                        for (let userId2 in config.users) {
                            if (config.users.hasOwnProperty(userId2) && !over) {
                                if (isNext && Object.keys(config.users[userId2].des).length !== 0) {
                                    config.playerTurn = config.users[userId2].user;
                                    over = true;
                                }
                                if (gameOver && Object.keys(config.users[userId2].des).length !== 0)
                                    gameOver = false
                                if (userId === userId2)
                                    isNext = true;
                            }
                        }
                    }
                }
            }

            if (!gameOver) {
                if (!over && !gameOver)
                    config.playerTurn = firstUser;
                config = rollDices(config);
            } else {
                config.playerTurn = null;
                if (config.manche === 4) {
                    config.gameOver = true;
                } else {
                    config.mancheOver = true;
                }
            }


            Participate.findOne({where: {id: participateId}, include: 'game'}).then(participate => {
                const path = `saves/${participate.game.title.replace(/\s/g, '')}_${participateId}.json`;
                fs.writeFileSync(path, JSON.stringify(config));

                io.to("participate:" + participateId).emit("configChanged", config)
            });

        });
    });

    return router;
}
