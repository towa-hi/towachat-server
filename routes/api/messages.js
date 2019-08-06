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
//     "channelId":"5d298397c8c4bc0a34d4f6d0",
//     "messageText": "test post"
//   }
// }
router.post('/sendMessage/', auth.required, async (req, res) => {
  const {payload: {id}} = req;
  const {body: {sendMessageReq}} = req;
  console.log(sendMessageReq);
  console.log('api/messages/sendMessage: recieved a message.');
  if (messageTextValidation(sendMessageReq.messageText)) {
    User.findById(id).then((author) => {
      if (user) {
        Channel.findById(sendMessageReq.channelId).then((channel) => {
          if (channel) {
            var MessageModel = mongoose.model('Message',Message.schema, sendMessageReq.channelId);
            MessageData = new messageModel({
              user: author,
              time: Date.now(),
              channel: sendMessageReq.channelId,
              messageText: sendMessageReq.messageText,
              edited: false,
              alive: true,
            });
            messageData.save();
          } else {
            console.log('api/messages/sendMessage: Channel not found.');
            res.status(400).send('SERVER: Channel not found!')
          }
        });
      } else {
        console.log('api/messages/sendMessage: User not found.');
        res.status(400).send('SERVER: User not found!');
      }
    });
  } else {
    console.log('api/messages/sendMessage: Message text too long.');
    res.status(400).send('SERVER: Message text too long!');
  }
});

router.get('/latest/:channelId', auth.optional, (req, res) => {
  console.log('api/messages/latest: Serving messages.');
  Channel.findById(req.params.channelId).then((channel) => {
    if (channel) {
      var MessageModel = mongoose.model('Message', Message.schema, req.params.channelId);
      MessageModel.find({alive: true}).sort({'time':1}).limit(50).populate('user').then((data) => {
        res.json(data);
      });
    } else {
      console.log('api/messages/latest/: Channel not found.');
      res.status(400).send('SERVER: Channel not found!');
    }
  });
});

// {
//   "deleteMessageReq": {
//     "channelId": "5d3566950afde844740cd016",
//     "messageId": "5d42950be0dbd20bb42c0cc1"
//   }
// }
router.delete('/delete/', auth.required, async (req, res) => {
  const {payload: {id}} = req;
  const {body: {deleteMessageReq}} = req;
  console.log('api/messages/delete: Deleting a message.');
  Channel.findById(deleteMessageReq.channelId).then((channel) => {
    if (channel) {
      var MessageModel = mongoose.model('Message', Message.schema, deleteMessageReq.channelId);
      MessageModel.findById(deleteMessageReq.messageId).then((message) => {
        if (message) {
          if (message.user.toString() === id || channel.officers.includes(message.user) || message.user === channel.owner) {
            message.alive = false;
            message.save();
            console.log('api/messages/delete: Deleted message.');
            res.sendStatus(200);
          } else {
            console.log('api/messages/delete: Insufficient permissions.');
            res.status(400).send('SERVER: Insufficient permissions!');
          }
        } else {
          console.log('api/messages/delete: Message not found.');
          res.status(400).send('SERVER: Message not found!');
        }
      });
    } else {
      console.log('api/messages/delete: Channel not found.');
      res.status(400).send('SERVER: Channel not found!');
    }
  });
});

// {
//   "editMessageReq": {
//     "channelId": "",
//     "messageId": "",
//     "messageText":""
//   }
// }
router.post('/edit/', auth.required, async (req, res) => {
  const {payload: {id}} = req;
  const {body: {editMessageReq}} = req;
  console.log('api/messages/edit: Editing a message.');
  if (messageTextValidation(editMessageReq.messageText)) {
    Channel.findById(editMessageReq.channelId).then((channel) => {
      if (channel) {
        var MessageModel = mongoose.model('Message', Message.Schema, editMessageReq.channelId);
        MessageModel.findById(editMessageReq.messageId).then((message) => {
          if (message) {
            if (message.user.toString() === id) {
              message.edited = true;
              message.messageText = editMessageReq.messageText;
              message.save().then(() => {
                console.log('api/messages/edit: Message edited.');
                res.sendStatus(200);
              });
            } else {
              console.log('api/messages/edit: Insufficient permissions.');
              res.status(400).send('SERVER: Insufficient permissions.');
            }
          } else {
            console.log('api/messages/edit: Message not found.');
            res.status(400).send('SERVER: Message not found!');
          }
        });
      } else {
        console.log('api/messages/edit: Channel not found.');
        res.status(400).send('SERVER: Channel not found!');
      }
    });
  } else {
    console.log('api/messages/edit: Message text too long.');
    res.status(400).send('SERVER: Message text too long!');
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
