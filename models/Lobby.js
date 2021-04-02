let Sequelize = require('sequelize');

const sequelize = new Sequelize('boardgame', 'boardgameadmin', 'Pommedeterre', {
    host: 'localhost',
    dialect: 'mysql'
});

let Lobby = sequelize.define('lobby', {
    id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
    }
});

sequelize.sync()
    .then(() => console.log('Lobby table has been successfully created, if one doesn\'t exist'))
    .catch(error => console.log('This error occured', error));

// export User model for use in other files.
module.exports = Lobby;