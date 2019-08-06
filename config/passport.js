const mongoose = require('mongoose');
const passport = require('passport');
const LocalStrategy = require('passport-local');

const User = mongoose.model('User');

passport.use(new LocalStrategy({
  usernameField: 'username',
  passwordField: 'password',
}, (username, password, done) => {
  User.findOne({username}).then((user) => {
    if (!user) {
      return done(null, false, 'invalidUsername');
    }
    if (!user.validatePassword(password)) {
      return done(null, false, 'invalidPassword');
    }
    return done(null, user);
  }).catch(done);
}));
