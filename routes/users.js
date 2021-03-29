let express = require('express');
let router = express.Router();
let moment = require('moment');
let User = require('../models/User');

moment.locale('fr');

let sessionChecker = (req, res, next) => {
  console.log(req.session.user);
  console.log(req.cookies.user_sid);
  if (req.session.user && req.cookies.user_sid) {
    res.redirect('/');
  } else {
    next();
  }
};

/* GET users listing. */
router.get('/', function(req, res, next) {
  if (req.session.user && req.cookies.user_sid) {

    User.findAll().then((users, error) => {
      if (error)
        res.render('users', {title: 'Utilisateurs', page_name: 'users', err: error, user: req.session.user, users: '', moment: moment});
      else
        res.render('users', {title: 'Utilisateurs', page_name: 'users', err: '', user: req.session.user, users: users, moment: moment});
    });
  } else {
    res.redirect('/');
  }
});

router.route('/register').get(sessionChecker, (req, res) => {
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

router.route('/login').post(sessionChecker, (req, res) => {
  User.findOne({ where: { username: req.body.username } }).then((user) => {
    if (!user) {
      res.render('/', { title: 'Accueil', page_name: 'home', error: 'Username not found', user: '' });
    } else if (!user.validPassword(req.body.password)) {
      res.render('/', { title: 'Accueil', page_name: 'home', error: 'Wrong password', user: '' });
    } else {
      req.session.user = user.dataValues;
      res.redirect('/');
    }
  })
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
