const mongoose = require('mongoose');
const passport = require('passport');
const router = require('express').Router();
const auth = require('../auth');
const User = mongoose.model('User');
const config = require('../../config/main');

// expected JSON POST input:
// {
//   'userReq': {
//     'username': 'username string',
//     'password': 'password string'
//   }
// }

//POST register a new user (optional, everyone has access)
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

//POST login route (optional, everyone has access)
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

//GET current user (required, only authenticated users have access)
router.get('/current', auth.required, (req, res, next) => {
  const {payload: {id}} = req;

  User.findById(id).then((user) => {
    if (!user) {
      console.log('api/users/current: Invalid token detected.');
      res.status(400).send('SERVER: Invalid token detected!');
    } else {
      console.log('api/users/current: Authentication JSON sent.');
      res.json({ user: user.toAuthJSON() });
    }
  });
});

module.exports = router;
