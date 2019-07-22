const mongoose = require('mongoose');
const passport = require('passport');
const router = require('express').Router();
const auth = require('../auth');
const User = mongoose.model('User');
const Message = mongoose.model('Message');
const Channel = mongoose.model('Channel');
const config = require('../../config/main');
const bodyParser = require('body-parser');

// {
//   "sendMessageReq": {
//     "channel":"5d298397c8c4bc0a34d4f6d0",
//     "messageText": "test post"
//   }
// }
router.post('/sendMessage', auth.required, async (req, res) => {
  const {payload: {id}} = req;
  const {body: {sendMessageReq}} = req;
  console.log('api/messages/sendMessage: recieved a message.');
  User.findById(id).then((author) => {
    Channel.findById(sendMessageReq.channel).then((channel) => {
      if (messageTextValidation(sendMessageReq.messageText)) {
        var newMessage = new Message({
          user: author,
          time: Date.now(),
          channel: channel,
          messageText: sendMessageReq.messageText,
          alive: true
        });
        newMessage.save().then(() => {
          console.log('api/messages/sendMessage: Message posted.');
          res.sendStatus(201);
        });
      } else {
        res.sendStatus(400);
      }
    });
  });
});


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

function messageTextValidation(messageText) {
  if (messageText) {
    if (messageText.length <= config.MAX_MESSAGE_LENGTH) {
      return true;
    }
  }
  return false;
}

module.exports = router;
