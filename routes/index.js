let express = require('express');
let router = express.Router();

/* GET home page. */
router.get('/', function(req, res) {
  res.render('index', { title: 'Accueil', page_name: 'home' });
});

module.exports = router;
