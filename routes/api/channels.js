const mongoose = require('mongoose');
const passport = require('passport');
const router = require('express').Router();
const auth = require('../auth');
const User = mongoose.model('User');
const Message = mongoose.model('Message');
const Channel = mongoose.model('Channel');
const Validator = require('validator');
const config = require('../../config/main');
const bodyParser = require('body-parser');

router.get('/', auth.optional, (req, res) => {
  console.log('GET /channels: Request received.');
  console.time('getChannels');
  Channel.find({alive: true, public: true}).then((channelList) => {
    console.timeEnd('getChannels');
    res.json(channelList);
  });
});

router.get('/:channelId', auth.optional, (req, res) => {
  console.log('GET /channels/:channelId: Request received.');
  Channel.findById(req.params.channelId).populate({path: 'members', model: 'User'}).populate({path: 'banned', model: 'User'}).populate({path: 'officers', model: 'User'}).populate({path: 'pinnedMessages', model: 'Message'}).populate('owner').then((channel) => {
    if (channel.alive && channel.public) {
      console.log('GET channels/:channelId: Channel info sent.');
      res.json(channel);
    } else {
      console.log('GET channels/:channelId/: Channel not found.');
      res.status(400).send('SERVER: Channel not found.');
    }
  });
});

// {
//   "name":"string",
//   "description":"string",
//   "public":"boolean"
// }
router.post('/', auth.required, async (req, res) => {
  console.log('POST /channels: Request received.');
  const {payload: {id}} = req;
  User.findById(id).then((owner) => {
    if (owner) {
      if (channelNameValidation(req.body.name)) {
        if (channelDescriptionValidation(req.body.description)) {
          var newChannel = new Channel({
            owner: owner,
            time: Date.now(),
            name: req.body.name,
            description: req.body.description,
            avatar: config.DEFAULT_AVATAR_URL,
            public: req.body.public,
            members: [owner],
            alive: true
          });
          newChannel.save().then(() => {
            owner.channels.push(newChannel._id);
            owner.save().then(() => {
              console.log('POST /channels: Channel created.');
              res.sendStatus(201);
            });
          });
        } else {
          console.log('POST /channels: Invalid channel description.');
          res.status(400).send('SERVER: Invalid channel description.');
        }
      } else {
        console.log('POST /channels: Invalid channel name.');
        res.status(404).send('SERVER: Invalid channel name.');
      }
    } else {
      console.log('POST /channels: User not found.');
      res.status(404).send('SERVER: User not found.');
    }
  });
});

router.post('/:channelId/membership', auth.required, async (req, res) => {
  console.log('POST /channels/:channelId/membership: Request received.');
  const {payload: {id}} = req;
  User.findById(id).then((user) => {
    if (user) {
      Channel.findById(req.params.channelId).then((channel) => {
        if (channel) {
          if (channel.alive === true) {
            if (user.channels.indexOf(channel._id) === -1) {
              user.channels.push(channel._id);
              if (channel.members.indexOf(user._id) === -1) {
                channel.members.push(user._id);
                user.save().then(() => {
                  channel.save().then(() => {
                    console.log('POST /channels/:channelId/membership:', user.username, 'joined ', channel.name);
                    res.sendStatus(200);
                  });
                });
              }
            } else {
              console.log('POST /channels/:channelId/membership: User already in channel.');
              res.status(400).send('SERVER: User already in channel.');
            }
          } else {
            console.log('POST /channels/:channelId/membership: Channel has been deleted.');
            res.status(404).send('SERVER: Channel has been deleted.');
          }
        } else {
          console.log('POST /channels/:channelId/membership: Channel not found.');
          res.status(404).send('SERVER: Channel not found.');
        }
      });
    } else {
      console.log('POST /channels/:channelId/membership: User not found.');
      res.status(404).send('SERVER: User not found.');
    }
  });
});

router.delete('/:channelId/membership', auth.required, async (req, res) => {
  console.log('DELETE /channels/:channelId/membership: Request received.');
  const {payload: {id}} = req;
  User.findById(id).then((user) => {
    if (user) {
      Channel.findById(req.params.channelId).then((channel) => {
        if (channel) {
          if (channel.owner.toString() !== id) {
            var membersIndex = channel.members.indexOf(user._id);
            if (membersIndex !== -1) {
              channel.members.splice(membersIndex, 1);
            }
            var channelsIndex = user.channels.indexOf(channel._id);
            if (channelsIndex !== -1) {
              user.channels.splice(channelsIndex, 1);
            }
            user.save().then(() => {
              channel.save().then(() => {
                console.log('DELETE /channels/:channelId/membership:', user.username, 'left channel', channel.name,'.');
                res.sendStatus(200);
              });
            });
          } else {
            console.log('DELETE /channels/:channelId/membership: The owner cannot leave their channel.');
            res.status(400).send('SERVER: The owner cannot leave their channel.');
          }
        } else {
          console.log('DELETE /channels/:channelId/membership: Channel not found.');
          res.status(404).send('SERVER: Channel not found.');
        }
      });
    } else {
      console.log('DELETE /channels/:channelId/membership: The owner cannot leave their channel: User not found.');
      res.status(404).send('SERVER: User not found.');
    }
  });
});

router.delete('/:channelId', auth.required, (req, res) => {
  console.log('DELETE /channels/:channelId: Request received.');
  const {payload: {id}} = req;
  User.findById(id).then((user) => {
    if (user) {
      Channel.findById(req.params.channelId).populate({path: 'members', model: 'User'}).then((channel) => {
        if (channel) {
          if (channel.owner.toString() === id) {
            channel.alive = false;
            channel.owner = null;
            channel.save().then(() => {
              res.sendStatus(200);
            });
            // channel.save().then(() => {
            //   console.log('DELETE /channels/:channelId: Deleted channel.');
            //   for (key in channel.members) {
            //     var member = channel.members[key];
            //     User.updateOne({_id: member._id}, {$pull: {'channels': channel._id}}, () => {
            //       console.log('DELETE /channels/:channelId: ' + member + ' updated.');
            //     });
            //   }
            //   res.sendStatus(200);
            // });
          } else {
            console.log('DELETE /channels/:channelId: User is not the owner of this channel.');
            res.status(401).send('SERVER: User is not the owner of this channel.');
          }
        } else {
          console.log('DELETE /channels/:channelId: Channel not found.');
          res.status(404).send('SERVER: Channel not found.');
        }
      });
    } else {
      console.log('DELETE /channels/:channelId: User not found.');
      res.status(404).send('SERVER: User not found.');
    }
  });
});

router.patch('/:channelId/transferOwnership/:userId', auth.required, async (req, res) => {
  console.log('PATCH /channels/:channelId/transferOwnership: Request received.');
  const {payload: {id}} = req;
  User.findById(id).then((user) => {
    if (user) {
      Channel.findById(req.params.channelId).then ((channel) => {
        if (channel) {
          if (channel.owner.toString() === id) {
            User.findById(req.params.userId).then ((newOwner) => {
              if (newOwner) {
                channel.owner = newOwner;
                channel.save().then(() => {
                  console.log('PATCH /channels/:channelId/transferOwnership: New owner is', channel.owner.username,'.');
                  res.sendStatus(200);
                });
              } else {
                console.log('PATCH /channels/:channelId/transferOwnership: New owner not found.');
                res.status(404).send('SERVER: New owner not found.');
              }
            })
          } else {
            console.log('PATCH /channels/:channelId/transferOwnership: User is not the owner of this channel.');
            res.status(401).send('SERVER: User is not the owner of this channel.');
          }
        } else {
          console.log('PATCH /channels/:channelId/transferOwnership: Channel not found.');
          res.status(404).send('SERVER: Channel not found.');
        }
      });
    } else {
      console.log('PATCH /channels/:channelId/transferOwnership: User not found.');
      res.status(404).send('SERVER: User not found.');
    }
  });
});

// {
//   "name":"string",
//   "description":"string",
//   "avatar":"string",
//   "public":"boolean"
// }
router.patch('/:channelId', auth.required, async (req, res) => {
  console.log('PATCH /channels/:channelId: Request received.');
  const {payload: {id}} = req;
  User.findById(id).then((user) => {
    if (user) {
      Channel.findById(req.params.channelId).then((channel) => {
        if (channel) {
          if (channel.owner.toString() === id) {
            if (validateChannelName(req.body.name)) {
              channel.name = req.body.name;
            } else {
              console.log('PATCH /channels/:channelId: Name not found or failed validation.');
            }
            if (validateChannelDescription(req.body.description)) {
              channel.description = req.body.description;
            } else {
              console.log('PATCH /channels/:channelId: Description not found or failed validation.');
            }
            if (validateChannelAvatar(req.body.avatar)) {
              channel.avatar = req.body.avatar;
            } else {
              console.log('PATCH /channels/:channelId: Avatar not found or failed validation.');
            }
            if (req.body.public) {
              channel.public = req.body.public;
            }
            console.log(channel);
            channel.save().then(() => {
              console.log('PATCH /channels/:channelId: Settings saved.');
              res.sendStatus(200);
            });
          } else {
            console.log('PATCH /channels/:channelId: User is not the owner of this channel.');
            res.status(401).send('SERVER: User is not the owner of this channel.');
          }
        } else {
          console.log('PATCH /channels/:channelId: Channel not found.');
          res.status(404).send('SERVER: Channel not found.');
        }
      });
    } else {
      console.log('PATCH /channels/:channelId: User not found.');
      res.status(404).send('SERVER: User not found.');
    }
  });
});

// {
//   "messageText":"string"
// }
router.post('/:channelId/message', auth.required, async (req, res) => {
  console.log('POST /channels/:channelId/message: Request received.');
  const {payload: {id}} = req;
  if (validateMessage(req.body.messageText)) {
    User.findById(id).then((user) => {
      if (user) {
        Channel.findById(req.params.channelId).then((channel) => {
          if (channel) {
            var MessageModel = mongoose.model('Message', Message.schema, req.params.channelId);
            MessageData = new MessageModel({
              user: user,
              time: Date.now(),
              channel: req.params.channelId,
              messageText: req.body.messageText,
              edited: false,
              alive: true
            });
            MessageData.save().then(() => {
              console.log('POST /channels/:channelId/message: Post made.');
              res.sendStatus(201);
            });
          } else {
            console.log('POST /channels/:channelId/message: Channel not found.');
            res.status(404).send('SERVER: Channel not found.');
          }
        });
      } else {
        console.log('POST /channels/:channelId/message: User not found.');
        res.status(404).send('SERVER: User not found.');
      }
    });
  }
});
//change this to do 50 at a time later
router.get('/:channelId/message', auth.optional, async (req, res) => {
  console.log('GET /channels/:channelId/message: Request received.');
  Channel.findById(req.params.channelId).then((channel) => {
    if (channel) {
      getMessageModel(req.params.channelId).find({alive: true}).sort({'time':1}).limit(50).populate('user').then((data) => {
        console.log('GET /channels/:channelId/message: Sending messages.')
        res.json(data);
      });
    } else {
      console.log('GET /channels/:channelId/message: Channel not found.');
      res.status(404).send('SERVER: Channel not found.');
    }
  });
});

router.delete('/:channelId/message/:messageId', auth.required, async (req, res) => {
  console.log('DELETE /channels/:channelId/message/:messageId: Request received.');
  const {payload: {id}} = req;
  Channel.findById(req.params.channelId).then((channel) => {
    if (channel) {
      getMessageModel(req.params.channelId).findById(req.params.messageId).then((message) => {
        if (message) {
          if (message.user.toString() === id || channel.officers.includes(message.user) || message.user === channel.owner) {
            message.alive = false;
            message.save();
            console.log('DELETE /channels/:channelId/message/:messageId: Deleted message.');
            res.sendStatus(200);
          } else {
            console.log('DELETE /channels/:channelId/message/:messageId: Insufficient permissions.');
            res.status(401).send('SERVER: Insufficient permissions.');
          }
        } else {
          console.log('DELETE /channels/:channelId/message/:messageId: Message not found.');
          res.status(404).send('SERVER: Message not found.');
        }
      });
    } else {
      console.log('DELETE /channels/:channelId/message/:messageId: Channel not found.');
      res.status(404).send('SERVER: Channel not found.');
    }
  });
});

router.patch('/:channelId/message/:messageId', auth.required, async (req, res) => {
  console.log('PATCH /channels/:channelId/message/:messageId: Request received.');
  const {payload: {id}} = req;
  if (messageTextValidation(req.body.messageText)) {
    Channel.findById(req.params.channelId).then((channel) => {
      if (channel) {
        getMessageModel(req.params.channelId).findById(req.params.messageId).then((message) => {
          if (message.alive) {
            if (message.user.toString() === id) {
              message.edited = true;
              message.messageText = req.body.messageText;
              message.save().then(() => {
                console.log('PATCH /channels/:channelId/message/:messageId: Message edited.');
                res.sendStatus(200);
              });
            } else {
              console.log('PATCH /channels/:channelId/message/:messageId: Insufficient permissions.');
              res.status(401).send('SERVER: Insufficient permissions.');
            }
          } else {
            console.log('PATCH /channels/:channelId/message/:messageId: Message not found.');
            res.status(404).send('SERVER: Message not found.');
          }
        });
      } else {
        console.log('PATCH /channels/:channelId/message/:messageId: Channel not found.');
        res.status(404).send('SERVER: Channel not found.');
      }
    })
  } else {
    console.log('PATCH /channels/:channelId/message/:messageId: Invalid message text.');
    res.status(400).send('SERVER: Invalid message text.');
  }
});

function getMessageModel(channelId) {
  return mongoose.model('Message', Message.schema, channelId);
}

function validateChannelName(channelName) {
  if (Validator.isLength(channelName, config.MIN_CHANNEL_NAME_LENGTH, config.MAX_CHANNEL_NAME_LENGTH)) {
    if (Validator.isAlphanumeric(channelName)) {
      return true;
    }
  }
  return false;
}

function validateChannelDescription(channelDescription) {
  if (Validator.isLength(channelDescription, config.MIN_CHANNEL_DESCRIPTION_LENGTH, config.MAX_CHANNEL_DESCRIPTION_LENGTH)) {
    return true;
  }
  return false;
}

function validateChannelAvatar(avatar) {
  if (Validator.isURL(avatar)) {
    return true;
  }
  return false;
}

function validateMessage(messageText) {
  if (Validator.isLength(messageText, 0, config.MAX_MESSAGE_LENGTH)) {
    return true;
  }
  return false;
}

module.exports = router;
