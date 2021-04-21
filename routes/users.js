let express = require('express');
let router = express.Router();
let moment = require('moment');
let User = require('../models/User');
const sessionChecker = require('../services/sessionChecker');

moment.locale('fr');

/* GET users listing. */
router.route('/').get(sessionChecker, function(req, res, next) {
    User.findAll().then((users, error) => {
        if (error)
            res.render('users', {title: 'Utilisateurs', page_name: 'users', err: error, user: req.session.user, users: '', moment: moment});
        else
            res.render('users', {title: 'Utilisateurs', page_name: 'users', err: '', user: req.session.user, users: users, moment: moment});
    });
});

router.route('/register').get((req, res) => {
    res.render('register', { title: 'Sign In', page_name: 'home', err: '', user: '' });
});

router.post('/create', (req, res) => {
    if (req.body.username && req.body.email && req.body.password) {

        User.create({
            username: req.body.username,
            email: req.body.email,
            password: req.body.password,
            role: 'user'
        }).then(user => {
            req.session.user = user.dataValues;
            res.redirect('/');
        }).catch(error => {
            console.log(error);
            if (error.fields["users.username"])
                res.render('register', { title: 'Sign In', page_name: 'home', err: "Username already exists", user: '' });
            else if (error.fields["users.email"])
                res.render('register', { title: 'Sign In', page_name: 'home', err: "Email already used by another account", user: '' });
            else
                res.render('register', { title: 'Sign In', page_name: 'home', err: error, user: '' });
        });

    } else {
        res.render('register', { title: 'Sign In', page_name: 'home', err: "Not all parameters given", user: '' });
    }
});

router.route('/login').get(((req, res) => {
    res.render('login', {title: 'Login', page_name: 'home', error: '', user: '', redirect: req.query.redirect});
})).post((req, res) => {
    User.findOne({ where: { username: req.body.username } }).then((user) => {
        if (!user) {
            res.render(req.url.substring(1), { title: 'Accueil', page_name: 'home', error: 'Username not found', user: '' });
        } else if (!user.validPassword(req.body.password)) {
            res.render(req.url.substring(1), { title: 'Accueil', page_name: 'home', error: 'Wrong password', user: '' });
        } else {
            req.session.user = user.dataValues;
            let backUrl = req.query.redirect || '/';
            res.redirect(backUrl);
        }
    });
});

router.post('/logout', (req, res) => {
    if (req.session.user && req.cookies.user_sid) {
        res.clearCookie('user_sid');
        res.redirect('/');
    } else {
        res.redirect('/');
    }
});

router.post('/moderator', (req, res) => {
    let idUser = req.body.idUser;

    User.findOne({ where: { id: req.session.user.id }}).then((user) => {
        if (user && user.isAdmin())
            User.findOne({ where: { id: idUser } }).then((user) => {
                if (user)
                    user.update({
                        role: 'moderator'
                    }).then((result, error) => {
                        if (error)
                            res.render('users', {
                                title: 'Utilisateurs',
                                page_name: 'users',
                                err: error,
                                user: req.session.user,
                                users: '',
                                moment: moment
                            });
                        res.send(200);
                    })
            });
    });
});

router.post('/user', (req, res) => {
    let idUser = req.body.idUser;

    User.findOne({ where: { id: req.session.user.id }}).then((user) => {
        if (user && user.isAdmin())
            User.findOne({ where: { id: idUser } }).then((user) => {
                if (user)
                    user.update({
                        role: 'user'
                    }).then((result, error) => {
                        if (error)
                            res.render('users', {
                                title: 'Utilisateurs',
                                page_name: 'users',
                                err: error,
                                user: req.session.user,
                                users: '',
                                moment: moment
                            });
                        res.send(200);
                    })
            });
    });
});

module.exports = router;
