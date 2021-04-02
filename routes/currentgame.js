let express = require('express');
let router = express.Router();
const Lobby = require('../models/Lobby');
const User = require('../models/User');
const Game = require('../models/Game');
const Participate = require('../models/Participate');
const sessionChecker = require('../services/sessionChecker');
const { Op } = require('sequelize');

let getGames = async (currentUser) => {
    let parties = {};

    const lobbies = await Lobby.findAll({
        include: [{
            model: Participate,
            where:
                { over: 0, [Op.or]: { gameInProgress: 1, ownerId: currentUser.id }}
        }]
    });

    for (const lobby of lobbies) {
        const owner = await User.findByPk(lobby.participate.ownerId);
        const game = await Game.findByPk(lobby.gameId);

        if (!parties[game.id])
            parties[game.id] = {};
        parties[game.id]['game'] = game;
        parties[game.id]['owner'] = owner;
        parties[game.id]['participate'] = lobby.participate;

        const users = await User.findAll({ where: { [Op.not]: [ { id: owner.id } ] }, include: { model: Lobby, where: { gameId: game.id } } });

        parties[game.id]['users'] = [];
        parties[game.id]['users'].push(users);
    }

    return parties;
}

/* GET lobby page. */
router.route('/').get(sessionChecker, function(req, res) {
    getGames(req.session.user).then(parties => {
        res.render('currentgame', { title: 'Parties en cours', page_name: 'currentgame', user: req.session.user, games: parties, error: '' });
    })
});

module.exports = router;
