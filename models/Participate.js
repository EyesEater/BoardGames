let Sequelize = require('sequelize');

const sequelize = new Sequelize('boardgame', 'boardgameadmin', 'Pommedeterre', {
    host: 'localhost',
    dialect: 'mysql'
});

let Participate = sequelize.define('participate', {
    nbplayer: {
        type: Sequelize.INTEGER,
        defaultValue: 1,
        allowNull: false
    },
    over: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: 0
    },
    type: {
        type: Sequelize.ENUM('public', 'private'),
        defaultValue: 'public',
        allowNull: false
    },
    gameInProgress: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
        allowNull: false
    }
});

sequelize.sync()
    .then(() => console.log('Participate table has been successfully created, if one doesn\'t exist'))
    .catch(error => console.log('This error occured', error));

// export User model for use in other files.
module.exports = Participate;