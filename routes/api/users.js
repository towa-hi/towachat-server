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
  const { body: { userReq } } = req;
  //reject if no body
  if (!userReq) {
    console.log('api/users/register: No body in request.');
    return res.status(400).send('SERVER: No body in request!');
  }
  //reject if no username or password
  if (!userReq.username || !userReq.password) {
    console.log('api/users/register: Missing a username or password.');
    return res.status(422).send('SERVER: Missing username or password!');
  }
  //reject if password is invalid
  if (userReq.password.length < config.MIN_PASSWORD_LENGTH || userReq.password.length > config.MAX_PASSWORD_LENGTH) {
    console.log('api/users/register: Password length was invalid.');
    return res.status(422).send('SERVER: Password length was invalid!');
  }
  //check if username already exists
  User.countDocuments({username: userReq.username}, (err, count) => {
    if (count > 0) {
      console.log('api/users/register: A user with this specified username already exists.');
      return res.status(409).send('SERVER: A user with this specified username already exists!');
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
      return newUser.save().then(() => {
        console.log('api/users/register: Sending auth token.');
        res.json({user: newUser.toAuthJSON()});
      });
    }
  });
});

//POST login route (optional, everyone has access)
router.post('/login', auth.optional, (req, res, next) => {
  console.log('api/users/login: Received a request with body: ' + JSON.stringify(req.body));
  const { body: { userReq } } = req;
  //reject if no body
  if (!userReq) {
    console.log('api/users/login: No body in request.');
    return res.status(400).send('SERVER: No body in request!');
  }
  //reject if no username or password
  if (!userReq.username || !userReq.password) {
    console.log('api/users/login: Missing a username or password.');
    return res.status(422).send('SERVER: Missing username or password!');
  }
  //make passport authenticate userReq
  return passport.authenticate('local', {session: false}, (err, passportUser, info) => {
    if (err) {
      return next(err);
    }
    //if authentication success, generate a token and send it
    if (passportUser) {
      const user = passportUser;
      user.token = passportUser.generateJWT();
      console.log('api/users/login: Authentication JSON sent.')
      return res.json({user: user.toAuthJSON()});
    }
    //reject if invalid username
    if (info == 'invalidUsername') {
      console.log('api/users/login: Username was not found.')
      return res.status(400).send('SERVER: Username was not found!');
    }
    //reject if invalid password
    if (info == 'invalidPassword') {
      console.log('api/users/login: Password was incorrect.')
      return res.status(400).send('SERVER: Password is incorrect!');
    }
  })(req, res, next);
});

//GET current user (required, only authenticated users have access)
router.get('/current', auth.required, (req, res, next) => {
  const { payload: { id } } = req;

  return User.findById(id)
    .then((user) => {
      if(!user) {
        console.log('api/users/current: Invalid token detected.')
        return res.status(400).send('SERVER: Invalid token detected!');
      }
      console.log('api/users/current: Authentication JSON sent.')
      return res.json({ user: user.toAuthJSON() });
    });
});

module.exports = router;
