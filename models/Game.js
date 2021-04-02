let Sequelize = require('sequelize');

const sequelize = new Sequelize('boardgame', 'boardgameadmin', 'Pommedeterre', {
    host: 'localhost',
    dialect: 'mysql'
});

let Game = sequelize.define('game', {
    title: {
        type: Sequelize.STRING,
        unique: true,
        allowNull: false
    },
    description: {
        type: Sequelize.STRING,
        allowNull: false
    },
    image: {
        type: Sequelize.STRING,
        allowNull: false
    },
    maxPlayer: {
        type: Sequelize.INTEGER,
        allowNull: false
    },
    minPlayer: {
        type: Sequelize.INTEGER.UNSIGNED,
        defaultValue: 2,
        allowNull: false
    }
});

sequelize.sync()
    .then(() => console.log('Games table has been successfully created, if one doesn\'t exist'))
    .catch(error => console.log('This error occured', error));

// export User model for use in other files.
module.exports = Game;