const mongoose = require('mongoose');
const passport = require('passport');
const router = require('express').Router();
const auth = require('../auth');
const User = mongoose.model('User');
const config = require('../../config/main');

// {
//   'userReq': {
//     'username': 'username string',
//     'password': 'password string'
//   }
// }
router.post('/register', auth.optional, (req, res, next) => {
  console.log('api/users/register: Received a request with body: ' + JSON.stringify(req.body));
  const {body: {userReq}} = req;
  if (!userReq) {
    //reject if no body
    console.log('api/users/register: No body in request.');
    res.status(400).send('SERVER: No body in request!');
  } else if (!userReq.username || !userReq.password) {
    //reject if no username or password
    console.log('api/users/register: Missing a username or password.');
    res.status(422).send('SERVER: Missing username or password!');
  } else if (userReq.password.length < config.MIN_PASSWORD_LENGTH || userReq.password.length > config.MAX_PASSWORD_LENGTH) {
    //reject if password is invalid
    console.log('api/users/register: Password length was invalid.');
    res.status(422).send('SERVER: Password length was invalid!');
  } else {
    User.countDocuments({username: userReq.username}, (err, count) => {
      //check if username already exists
      if (count > 0) {
        console.log('api/users/register: A user with this specified username already exists.');
        res.status(409).send('SERVER: A user with this specified username already exists!');
      } else {
        //make user object
        const newUser = new User({
          username: userReq.username,
          password: userReq.password,
          handle: userReq.username,
          avatar: config.DEFAULT_AVATAR_URL,
          hash: null,
          salt: null,
          alive: true,
        });
        newUser.setPassword(userReq.password);
        //save user object, then send auth token.
        newUser.save().then(() => {
          console.log('api/users/register: Sending auth token.');
          res.json({user: newUser.toAuthJSON()});
        });
      }
    });
  }
});

// {
//   'userReq': {
//     'username': 'username string',
//     'password': 'password string'
//   }
// }
router.post('/login', auth.optional, (req, res, next) => {
  console.log('api/users/login: Received a request with body: ' + JSON.stringify(req.body));
  const { body: { userReq } } = req;

  if (!userReq) {
    //reject if no body
    console.log('api/users/login: No body in request.');
    res.status(400).send('SERVER: No body in request!');
  } else if (!userReq.username || !userReq.password) {
    //reject if no username or password
    console.log('api/users/login: Missing a username or password.');
    res.status(422).send('SERVER: Missing username or password!');
  } else {
    //make passport authenticate userReq
    passport.authenticate('local', {session: false}, (err, passportUser, info) => {
      if (err) {
        next(err);
      }
      //if authentication success, generate a token and send it
      if (passportUser) {
        const user = passportUser;
        user.token = passportUser.generateJWT();
        console.log('api/users/login: Authentication JSON sent.')
        res.json({user: user.toAuthJSON()});
      } else if (info == 'invalidUsername') {
        //reject if invalid username
        console.log('api/users/login: Username was not found.')
        res.status(400).send('SERVER: Username was not found!');
      } else if (info == 'invalidPassword') {
        //reject if invalid password
        console.log('api/users/login: Password was incorrect.')
        res.status(400).send('SERVER: Password is incorrect!');
      }
    })(req, res, next);
  }
});

router.get('/current', auth.required, (req, res, next) => {
  console.log('api/users/current: Started.');
  const {payload: {id}} = req;
  User.findById(id).then((user) => {
    if (user) {
      console.log('api/users/current: Authentication JSON sent.');
      res.json({user: user.toAuthJSON()});
    } else {
      console.log('api/users/current: User not found.');
      res.status(400).send('SERVER: User not found!');
    }
  });
});

router.get('/getSelfInfo', auth.required, (req, res) => {
  console.log('api/users/getSelfInfo: Started.');
  const {payload: {id}} = req;
  User.findById(id).then((user) => {
    if (user) {
      console.log('api/users/getSelfInfo: Info sent to client.');
      res.json({user: user.toClient()});
    } else {
      console.log('api/users/getSelfInfo: User not found.');
      res.status(400).send('SERVER: User not found!');
    }
  });
});

router.get('/getInfo/:id', auth.optional, (req, res) => {
  console.log('api/users/getInfo: Started.');
  User.findById(req.params.id).populate('channels').then((user) => {
    if (user.alive) {
      console.log('api/users/getInfo: Info sent to client.');
      res.json(user);
    } else {
      res.status(400).send('SERVER: User not found!');
    }
  })
});

module.exports = router;
