const mongoose = require('mongoose');
const passport = require('passport');
const router = require('express').Router();
const auth = require('../auth');
const User = mongoose.model('User');
const config = require('../../config/main');


// {
//   "username":"string",
//   "password":"string"
// }
router.post('/register', auth.optional, (req, res) => {
  console.log('POST /users/register: Request received.');
  if (usernameValidation(req.body.username)) {
    if (passwordValidation(req.body.password)) {
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
  if (usernameValidation(req.body.username)) {
    if (passwordValidation(req.body.password)) {
      passport.authenticate('local', {session: false}, (err, passportUser, info) => {
        if (err) {
          console.log(err);
          next(err);
        }
        if(passportUser.alive) {
          console.log('wew lad');
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
  const {payload: {id}} = req;
  User.findById(id).populate('channels').then((user) => {
    if (user.alive) {
      console.log('GET /users/self: Info sent.');
      res.json(user);
    } else {
      console.log('GET /users/self: User not found.');
      res.status(400).send('SERVER: User not found.');
    }
  })
});

router.get('/:userId', auth.optional, (req, res) => {
  console.log('GET /users/:userId: Request received.');
  User.findById(req.params.userId).populate('channels').then((user) => {
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
  User.findById(req.params.userId).populate('channels').then((user) => {
    if (user.alive) {
      if (avatarValidation(req.body.avatar)) {
        user.avatar = req.body.avatar;
      } else {
        console.log('PATCH /users/self: Invalid avatar.');
      }
      if (handleValidation(req.body.handle)) {
        user.handle = req.body.handle;
      } else {
        console.log('PATCH /users/self: Invalid handle.');
      }
      user.save().then(() => {
        console.log('PATCH /users/self: Edited user.');
        res.sendStatus(200);
      });
    } else {
      console.log('PATCH /users/self: User not found.');
      res.status(404).send('SERVER: User not found.');
    }
  });
});

function usernameValidation(name) {
  if (name) {
    if (name.length <= config.MAX_USERNAME_LENGTH) {
      return true;
    }
  }
  return false;
}

function passwordValidation(password) {
  if (password) {
    if (password.length > config.MIN_PASSWORD_LENGTH && password.length < config.MAX_PASSWORD_LENGTH) {
      return true;
    }
  }
  return false;
}

function avatarValidation(avatar) {
  if (avatar) {
    if (avatar.length > 100) {
      return true;
    }
  }
  return false;
}

function handleValidation(handle) {
  if (handle) {
    if (handle.length <= config.MAX_HANDLE_LENGTH) {
      return true;
    }
  }
  return false;
}

module.exports = router;
