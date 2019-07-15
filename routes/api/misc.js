const mongoose = require('mongoose');
const passport = require('passport');
const router = require('express').Router();
const auth = require('../auth');
const User = mongoose.model('User');
const Message = mongoose.model('Message');
const Channel = mongoose.model('Channel');
const config = require('../../config/main');
const bodyParser = require('body-parser');

router.get('/repairUser', auth.required, async (req, res) => {
  const {payload: {id}} = req;
  console.log(id);
  console.log('api/misc/repairUser: recieved request');
  User.findById(id).then((user) => {
    console.log(user.channels)
    var newChannels = [];
    for (channelId in user.channels) {
      Channel.findById(channelId).then((channel) => {
        if (channel) {
          newChannels.push(channel);
        }
      });
    }
    user.channels = newChannels;
    user.save().then(() => {
      console.log('api/misc/repairUser: dead channels removed');
    });
  });
  res.sendStatus(200);
});

module.exports = router;
