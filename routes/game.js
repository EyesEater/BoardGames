let express = require('express');
let router = express.Router();
let Lobby = require('../models/Lobby');
let Game = require('../models/Game');
let User = require('../models/User');
let Participate = require('../models/Participate');
const sessionChecker = require('../services/sessionChecker');

let getGames = async (participates, currentUser) => {
    let parties = {};
    for (const participate of participates) {
        if (!parties[participate.gameId])
            parties[participate.gameId] = {};

        if (!parties[participate.gameId]['users'])
            parties[participate.gameId]['users'] = [];

        parties[participate.gameId]['canJoin'] = true;

        parties[participate.gameId]['isOwner'] = (currentUser.id === participate.ownerId);

        parties[participate.gameId]['participate'] = participate.id;

        if (!parties[participate.gameId]['maxPlayer']) {
            await Game.findByPk(participate.gameId).then((game) => {
                parties[game.id]['maxPlayer'] = participate.nbplayer;
            });
            parties[participate.gameId]['isFull'] = parties[participate.gameId]['maxPlayer'] - await Lobby.count({where: {gameId: participate.gameId}});
        }

        parties[participate.gameId]['owner'] = await User.findByPk(participate.ownerId);

        let lobbies = await Lobby.findAll({ where: { gameId: participate.gameId } });

        for(const lobby of lobbies) {
            let user = await User.findByPk(lobby.userId);

            if (user.id !== participate.ownerId)
                parties[participate.gameId]['users'].push(user);

            if (currentUser.id === user.id)
                parties[participate.gameId]['canJoin'] = false;
        }
    }
    return parties;
}

/* GET a joining game page. */
router.route('/join/:id').get(sessionChecker, function(req, res) {
    Participate.findAll({ include: 'game', where: {over: false, gameInProgress: false} }).then(participates => {

        if (!participates.length) {
            Game.findAll().then(games => {
                Game.findByPk(req.params.id).then(game => {
                    res.render('lobby', {title: 'Salon', page_name: 'lobby', error: `Pas de partie disponible pour ${game.title}`, user: req.session.user, games: games});
                });
            });
        } else {

            getGames(participates, req.session.user).then((parties) => {
                Participate.findOne({include: 'game', where: {id: req.params.id}}).then((participate, error) => {
                    if (error)
                        res.redirect('/lobby');

                    res.render('game', {
                        title: participate.game.title,
                        participate: participate,
                        page_name: 'lobby',
                        err: '',
                        user: req.session.user,
                        lobbies: parties,
                        participates: participates
                    });
                });
            });
        }
    });
}).post(sessionChecker, (req, res) => {
    Participate.findByPk(req.params.id).then(participate => {
        Lobby.create({
            gameId: participate.gameId,
            userId: req.session.user.id,
            participateId: participate.id
        }).then(() => {
            res.status(200).send('OK');
        });
    });
});

router.route('/create/:idGame').get(sessionChecker, (req, res) => {
    Game.findByPk(req.params.idGame).then((game) => {
        res.render('gamecreation', {title: 'Création d\'un salon de ${game.title}', game: game, page_name: 'lobby', error: '', user: req.session.user});
    });
}).post(sessionChecker, (req, res) => {

    Game.findByPk(req.params.idGame).then(game => {
        Participate.create({
            nbplayer: req.body.nbPlayer,
            over: false,
            type: req.body.type,
            ownerId: req.session.user.id,
            gameId: game.id
        }).then((participate) => {
            Lobby.create({
                gameId: req.params.idGame,
                userId: req.session.user.id,
                participateId: participate.id
            }).then(lobby => {
                res.redirect(`/game/join/${game.id}`);
            }).catch(error => {
                Game.findByPk(req.params.idGame).then(game => {
                    res.render('gamecreation', {
                        title: 'Création d\'un salon de ${game.title}',
                        game: game,
                        page_name: 'lobby',
                        error: 'Vous avez déjà une partie en cours sur ce jeu',
                        user: req.session.user
                    });
                });
            });
        });
    });
});

router.route('/launch/:participateId').post(sessionChecker, ((req, res) => {
    Participate.update({gameInProgress: true}, {where: {id: req.params.participateId}}).then(() => {
        res.send('OK');
    });
}));

module.exports = router;
