let Sequelize = require('sequelize');
let bcrypt = require('bcrypt');

const sequelize = new Sequelize('boardgame', 'boardgameadmin', 'Pommedeterre', {
    host: 'localhost',
    dialect: 'mysql'
});

let User = sequelize.define('user', {
    username: {
        type: Sequelize.STRING,
        unique: true,
        allowNull: false
    },
    email: {
        type: Sequelize.STRING,
        unique: true,
        allowNull: false
    },
    password: {
        type: Sequelize.STRING,
        allowNull: false
    },
    role: {
        type: Sequelize.STRING,
        allowNull: false
    }
}, {
    hooks: {
        beforeCreate: (user) => {
            const salt = bcrypt.genSaltSync();
            user.password = bcrypt.hashSync(user.password, salt);
        }
    }
});

User.prototype.validPassword = function(password) {
    return bcrypt.compareSync(password, this.password);
};

User.prototype.isAdmin = function() {
    return this.role === "admin";
};

User.prototype.isModo = () => {
    return this.role === "moderator";
};

sequelize.sync()
    .then(() => console.log('users table has been successfully created, if one doesn\'t exist'))
    .catch(error => console.log('This error occured', error));

// export User model for use in other files.
module.exports = User;