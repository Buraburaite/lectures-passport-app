const express        = require('express');
const path           = require('path');
const favicon        = require('serve-favicon');
const mongoose       = require('mongoose');
const logger         = require('morgan');
const cookieParser   = require('cookie-parser');
const bodyParser     = require('body-parser');
const layouts        = require('express-ejs-layouts');
const session        = require('express-session');
const bcrypt         = require('bcrypt');
const passport       = require('passport');
const LocalStrategy  = require('passport-local').Strategy;
const FBStrategy     = require('passport-facebook').Strategy;
const GoogleStrategy = require('passport-google-oauth').OAuth2Strategy;
const flash          = require('connect-flash');
const dotenv         = require('dotenv');


const User = require('./models/user-model.js');

const app = express();

dotenv.config();
mongoose.connect(process.env.MONGODB_URI);

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// default value for title local
app.locals.title = 'My Secure Site';

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(layouts);

app.use(session({
  secret: 'our passport local strategy app',
  resave: true,
  saveUninitialized: true
}));
app.use(flash());
app.use(passport.initialize());
app.use(passport.session());

passport.serializeUser((user, cb) => {
  if (user.provider) {
    cb(null, user);
  } else {
    cb(null, user._id);
  }
});

passport.deserializeUser((id, cb) => {

  if (id.provider) {
    cb(null, id);
    return;
  }

  User.findOne({ "_id": id }, (err, user) => {
    if (err) { return cb(err); }
    cb(null, user);
  });
});

passport.use(new LocalStrategy((username, password, next) => {
  User.findOne({ username : username}, (err, user) => {
    if (err) {
      return next(err);
    }
    if (!user) {
      return next(null, false, { message: "Incorrect username" });
    }
    if (!bcrypt.compareSync(password, user.encryptedPassword)) {
      return next(null, false, { message: "Incorrect password" });
    }

    return next(null, user);
  });
}));

passport.use(new FBStrategy({
  clientID: process.env.FB_CLIENT_ID,
  clientSecret: process.env.FB_CLIENT_SECRET,
  callbackURL: process.env.HOST_ADDRESS + '/auth/facebook/callback',
}, (accessToken, refreshToken, profile, done) => {
  done(null, profile);
}
));

passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackURL: process.env.HOST_ADDRESS + '/auth/google/callback',
}, (accessToken, refreshToken, profile, done) => {
  done(null, profile);
}
));


// ROUTES MUST GO HERE
const index = require('./routes/index.js');
app.use('/', index);
const authRoutes = require('./routes/auth-routes.js');
app.use('/', authRoutes);
const protRoutes = require('./routes/protected-routes.js');
app.use('/', protRoutes);
const roomRoutes = require('./routes/room-routes.js');
app.use('/', roomRoutes);

// catch 404 and forward to error handler
app.use((req, res, next) => {
  const err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handler
app.use((err, req, res, next) => {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
