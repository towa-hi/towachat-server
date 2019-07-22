const mongoose = require('mongoose');
const passport = require('passport');
const router = require('express').Router();
const auth = require('../auth');
const User = mongoose.model('User');
const Message = mongoose.model('Message');
const Channel = mongoose.model('Channel');
const config = require('../../config/main');
const bodyParser = require('body-parser');

router.get('/removeDeadChannels', auth.required, async (req, res) => {
  console.log('api/misc/removeDeadChannels: Received request.');
  const {payload: {id}} = req;
  User.findById(id).populate('channels', 'alive').then((user) => {
    console.log(user.channels);
    var newChannels = user.channels.filter((value, index, arr) => {
      return value.alive;
    });
    user.channels = newChannels;
    user.save().then(() => {
      console.log('api/misc/removeDeadChannels: Dead channels removed.');
    });
  });
  res.sendStatus(200);
});

module.exports = router;
