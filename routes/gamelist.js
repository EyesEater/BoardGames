let express = require('express');
let router = express.Router();

/* GET lobby page. */
router.get('/', function(req, res) {
    if (req.session.user) {
        res.render('gamelist', {title: 'Les jeux', page_name: 'gamelist', error: '', user: req.session.user});
    } else {
        res.render('gamelist', {title: 'Les jeux', page_name: 'gamelist', error: '', user: ''});
    }
});

module.exports = router;
