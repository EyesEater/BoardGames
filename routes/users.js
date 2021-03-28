let express = require('express');
let router = express.Router();
let bcrypt = require('bcrypt');
const saltRound = 10;

let mysql = require('mysql');

const con = mysql.createConnection({
  host: "localhost",
  database: "boardgame",
  user: "boardgameadmin",
  password: "Pommedeterre"
});

con.connect((err) => {
  if (err) throw err;
  console.log("Connecté à la base de données MySQL !");
})

/* GET users listing. */
router.get('/', function(req, res, next) {
  res.send('respond with a resource');
});

router.get('/register', (req, res) => {
  res.render('register', { title: 'Sign In', page_name: 'home', err: '' });
});

router.post('/create', (req, res) => {
  if (req.body.username && req.body.email && req.body.password) {
    let username = req.body.username;
    let email = req.body.email;
    let password = req.body.password;

    bcrypt.hash(password, saltRound, (err, hash) => {
      if (err) res.render('register', { title: 'Sign In', page_name: 'home', err: err/*"There was a problem while trying to register you... Please try again later."*/ });


      con.query("insert into user(username, email, password, role) values (?, ?, ?, ?)", [username, email, hash, 'u'], (err) => {
        if (err)
          res.render('register', { title: 'Sign In', page_name: 'home', err: err });
        res.redirect('/');
      });

    });

  } else {
    res.render('register', { title: 'Sign In', page_name: 'home', err: "Not all parameters given" });
  }
});

module.exports = router;
