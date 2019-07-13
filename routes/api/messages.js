const mongoose = require('mongoose');
const passport = require('passport');
const router = require('express').Router();
const auth = require('../auth');
const User = mongoose.model('User');
const Message = mongoose.model('Message');
const Channel = mongoose.model('Channel');
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

router.post('/sendMessage', auth.required, async (req, res) => {
  var ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
  const {payload: {id}} = req;
  const {body: {sendMessageReq}} = req;
  console.log('api/messages/sendMessage: recieved a message from IP ' + ip);
  //do channels stuff
  User.findById(id).then((author) => {
    new Message({
      user: author,
      time: Date.now(),
      messageText: sendMessageReq.messageText,
    }).save().then(() => {
      if (!author) {
        console.log('api/messages/sendMessage: Invalid token detected.');
        res.status(400).send('SERVER: Invalid token detected!');
      }
      console.log('api/messages/sendMessage: Message posted.');
      res.sendStatus(201);
    });
  });
});


module.exports = router;
