const mongoose = require('mongoose');
const passport = require('passport');
const router = require('express').Router();
const auth = require('../auth');
const User = mongoose.model('User');
const Message = mongoose.model('Message');
const config = require('../../config/main');

router.get('/latest', auth.optional, (req, res, next) => {
  var ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
  console.log('api/messages/latest: Serving messages to IP ' + ip);
  try {
    let messages;
    messages = await Message.find().populate('user');
    res.send(messages);
  } catch (err) {
    res.status(500).send(err);
  }
});
//to be continued
