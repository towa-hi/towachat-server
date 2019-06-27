const mongoose = require('mongoose');
const passport = require('passport');
const router = require('express').Router();
const auth = require('../auth');
const User = mongoose.model('User');
const Message = mongoose.model('Message');
const config = require('../../config/main');
const bodyParser = require('body-parser');

router.get('/latest', auth.optional, async (req, res) => {
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

router.post('/sendMessage', auth.optional, async (req, res) => {
  var ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
  console.log('api/messages/sendMessage: recieved a message from IP ' + ip);
  let newMessage;
  await User.findOne({username: req.body.user}).then((author) => {
    newMessage = new Message({
      user: author,
      time: Date.now(),
      messageText: req.body.messageText,
    })
  });
});


//to be continued
module.exports = router;
