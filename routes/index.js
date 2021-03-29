let express = require('express');
let router = express.Router();

/* GET home page. */
router.get('/', function(req, res) {
  if (req.session.user) {
    res.render('index', {title: 'Accueil', page_name: 'home', error: '', user: req.session.user});
  } else {
    res.render('index', {title: 'Accueil', page_name: 'home', error: '', user: ''});
  }
});

module.exports = router;
