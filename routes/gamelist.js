let express = require('express');
let router = express.Router();
const Lobby = require('../models/Lobby');
const User = require('../models/User');
const Game = require('../models/Game');
const Participate = require('../models/Participate');
const sessionChecker = require('../services/sessionChecker');

let getGames = async (currentUser) => {
    let parties = {};

    const lobbies = await Lobby.findAll({ where: { userId: currentUser.id }, include: { model: Participate, where: { over: true } }  });

    for (const lobby of lobbies) {
        const game = await Game.findByPk(lobby.gameId);
        if (!parties[game.id])
            parties[game.id] = {};
        parties[game.id]['game'] = game;

        const users = await User.findAll({ include: { model: Lobby, where: { gameId: game.id } } });

        parties[game.id]['users'] = [];
        parties[game.id]['users'].push(users);
    }

    return parties;
}

/* GET lobby page. */
router.route('/').get(sessionChecker, function(req, res) {
    getGames(req.session.user).then(parties => {
        res.render('gamelist', { title: 'Mes Parties', page_name: 'gamelist', user: req.session.user, games: parties, error: '' });
    })
});

module.exports = router;
