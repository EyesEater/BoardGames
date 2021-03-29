let express = require('express');
let router = express.Router();

/* GET lobby page. */
router.get('/', function(req, res) {
    if (req.session.user) {
        res.render('currentgame', {title: 'Parties en cours', page_name: 'currentgame', error: '', user: req.session.user});
    } else {
        res.render('currentgame', {title: 'Parties en cours', page_name: 'currentgame', error: '', user: ''});
    }
});

module.exports = router;
