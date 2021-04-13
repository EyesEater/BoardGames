let createError = require('http-errors');
let express = require('express');
let path = require('path');
let cookieParser = require('cookie-parser');
let logger = require('morgan');
let stylus = require('stylus');
let bodyParser = require('body-parser');
let session = require('express-session');

let app = express();

const Game = require('./models/Game');
const User = require('./models/User');
const Lobby = require('./models/Lobby');
const Participate = require('./models/Participate');

Game.belongsToMany(User, { through: Lobby });
User.belongsToMany(Game, { through: Lobby });
User.hasMany(Lobby);
Participate.belongsTo(User, { as: 'owner' });
Participate.belongsTo(Game, { as: 'game' });
Participate.hasMany(Lobby);
Lobby.belongsTo(Participate);

let indexRouter = require('./routes/index');
let usersRouter = require('./routes/users');
let lobbyRouter = require('./routes/lobby');
let gamelistRouter = require('./routes/gamelist');
let currentgame = require('./routes/currentgame');
let gameRouter = require('./routes/game');
let playRouter = require('./routes/play')(app);


// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use(cookieParser());
app.use(session({
  key: 'user_sid',
  secret: 'BoardGameSecretForUserConnexionTokens',
  resave: false,
  saveUninitialized: false,
  cookie: {
    expires: 600000
  }
}));

app.use((req, res, next) => {
  if (req.cookies.user_sid && !req.session.user) {
    res.clearCookie('user_sid');
  }
  next();
});

app.use(stylus.middleware(path.join(__dirname, 'public')));
app.use(express.static(path.join(__dirname, 'public')));

app.use(bodyParser.json()); // support json encoded bodies
app.use(bodyParser.urlencoded({ extended: true })); // support encoded bodies

app.use('/', indexRouter);
app.use('/users', usersRouter);
app.use('/lobby', lobbyRouter);
app.use('/gamelist', gamelistRouter);
app.use('/currentgame', currentgame);
app.use('/game', gameRouter);
app.use('/play', playRouter);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

app.listen(3000, 'localhost');

module.exports = app;
