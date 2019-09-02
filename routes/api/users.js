const mongoose = require('mongoose');
const passport = require('passport');
const router = require('express').Router();
const auth = require('../auth');
const User = mongoose.model('User');
const config = require('../../config/main');
const Validator = require('validator');

// {
//   "username":"string",
//   "password":"string"
// }
router.post('/register', auth.optional, (req, res) => {
  console.log('POST /users/register: Request received.');

  if (validateUsername(req.body.username)) {
    if (validatePassword(req.body.password)) {
      User.findOne({username: req.body.username}).then((result) => {
        if (!result) {
          var newUser = new User({
            username: req.body.username,
            password: req.body.password,
            handle: req.body.username,
            avatar: config.DEFAULT_AVATAR_URL,
            hash: null,
            salt: null,
            alive: true
          });
          newUser.setPassword(req.body.password);
          newUser.save().then(() => {
            console.log('POST /users/register: User created.');
            res.json(newUser.toAuthJSON());
          });
        } else {
          console.log('POST /users/register: Username already exists.');
          res.status(400).send('SERVER: Username already exists.');
        }
      });
    } else {
      console.log('POST /users/register: Invalid password.');
      res.status(400).send('SERVER: Invalid password.');
    }
  } else {
    console.log('POST /users/register: Invalid username.');
    res.status(400).send('SERVER: Invalid username.');
  }
});

// {
//   "username":"string",
//   "password":"string"
// }
router.post('/login', auth.optional, (req, res, next) => {
  console.log('POST /users/login: Request received.');
  if (validateUsername(req.body.username)) {
    if (validatePassword(req.body.password)) {
      passport.authenticate('local', {session: false}, (err, passportUser, info) => {
        if (err) {
          console.log(err);
          next(err);
        }
        if (passportUser.alive) {
          console.log('POST /users/login: Authentication JSON sent.');
          res.json(passportUser.toAuthJSON());
        } else if (info == 'invalidUsername') {
          console.log('POST /users/login: Username not found.')
          res.status(404).send('SERVER: Username not found.');
        } else if (info == 'invalidPassword') {
          console.log('POST /users/login: Password is incorrect.')
          res.status(404).send('SERVER: Password is incorrect.');
        }
      })(req, res, next);
    } else {
      console.log('POST /users/login: Invalid password.');
      res.status(400).send('SERVER: Invalid password.');
    }
  } else {
    console.log('POST /users/login: Invalid username.');
    res.status(400).send('SERVER: Invalid username.');
  }
});

router.get('/self', auth.required, (req, res) => {
  console.log('GET /users/self: Request received.');
  console.time('getSelf');
  const {payload: {id}} = req;
  User.findById(id).populate('channels').then((user) => {

    if (user.alive) {
      console.log('GET /users/self: Info sent.');
      res.json(user.toAuthJSON());
      console.timeEnd('getSelf');
    } else {
      console.log('GET /users/self: User not found.');
      res.status(400).send('SERVER: User not found.');
    }
  })
});

router.get('/:userId', auth.optional, (req, res) => {
  console.log('GET /users/:userId: Request received.');
  User.findById(req.params.userId).then((user) => {
    if (user.alive) {
      console.log('GET /users/:userId: Info sent.');
      res.json(user);
    } else {
      console.log('GET /users/:userId: User not found.');
      res.status(404).send('SERVER: User not found.');
    }
  });
});

// {
//   "avatar":"string",
//   "handle":"string"
// }
router.patch('/self', auth.required, (req, res) => {
  console.log('PATCH /users/self: Request received.');
  const {payload: {id}} = req;
  User.findById(id).populate('channels').then((user) => {
    if (user.alive) {
      if (validateAvatar(req.body.avatar)) {
        user.avatar = req.body.avatar;
      } else {
        console.log('PATCH /users/self: Invalid avatar.');
      }
      if (validateHandle(req.body.handle)) {
        user.handle = req.body.handle;
      } else {
        console.log('PATCH /users/self: Invalid handle.');
      }
      user.save().then(() => {
        console.log('PATCH /users/self: Edited user.');
        res.json(user.toAuthJSON());
      });
    } else {
      console.log('PATCH /users/self: User not found.');
      res.status(404).send('SERVER: User not found.');
    }
  });
});

router.patch('/prune', auth.required, (req, res) => {
  console.log('PATCH /users/prune: Request received.');
  const {payload: {id}} = req;
  User.findById(id).populate('channels').then((user) => {
    if (user) {
      for (key in user.channels) {
        console.log(user.channels[key]);
        channel = user.channels[key];
        if (channel.alive == false) {
          user.channels.remove(channel._id);
        }
      }
      user.save().then(() => {
        console.log(user);
        res.sendStatus(200);
      });
    }
  });
  res.status(200);
});

function validateUsername(username) {
  if (Validator.isAlphanumeric(username)) {
    if (Validator.isLength(username, config.MIN_USERNAME_LENGTH, config.MAX_USERNAME_LENGTH)) {
      return true;
    }
  }
  return false;
}

function validatePassword(password) {
  if (Validator.isLength(password, config.MIN_PASSWORD_LENGTH, config.MAX_PASSWORD_LENGTH)) {
    return true;
  }
  return false;
}

function validateAvatar(avatar) {
  if (Validator.isURL(avatar)) {
    return true;
  }
  return false;
}

function validateHandle(handle) {
  if (Validator.isLength(handle, config.MIN_HANDLE_LENGTH, config.MAX_HANDLE_LENGTH)) {
    return true;
  }
  return false;
}

module.exports = router;
