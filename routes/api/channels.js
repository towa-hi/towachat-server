const mongoose = require('mongoose');
const passport = require('passport');
const router = require('express').Router();
const auth = require('../auth');
const User = mongoose.model('User');
const Message = mongoose.model('Message');
const Channel = mongoose.model('Channel');
const config = require('../../config/main');
const bodyParser = require('body-parser');

router.get('/channelList', auth.optional, (req, res) => {
  console.log('api/channels/channelList')
  Channel.find({alive: true, public: true}).then((channelList) => {
    console.log(channelList);
    res.json(channelList);
  });
});

router.get('/getInfo/:channelId', auth.optional, (req, res) => {
  console.log('api/channels');
  Channel.findById(req.params.channelId).populate({path: 'members', model: 'User'}).populate({path: 'banned', model: 'User'}).populate({path: 'officers', model: 'User'}).populate({path: 'pinnedMessages', model: 'Message'}).populate('owner').then((channel) => {
    if (channel.alive && channel.public) {
      res.json(channel);
    } else {
      console.log('api/channels: Channel not found.');
      res.status(400).send('SERVER: Channel not found!');
    }
  });
});
// {
//   "createChannelReq": {
//     "name": "test channel",
//     "description": "benis",
//     "public": "true"
//   }
// }
router.post('/createChannel', auth.required, async (req, res) => {
  const {payload: {id}} = req;
  const {body: {createChannelReq}} = req;
  console.log('api/channels/createChannel: Started.');
  User.findById(id).then((owner) => {
    if (owner) {
      if (channelNameValidation(createChannelReq.name)) {
        if (channelDescriptionValidation(createChannelReq.description)) {
          var newChannel = new Channel({
            owner: owner,
            time: Date.now(),
            name: createChannelReq.name,
            description: createChannelReq.description,
            avatar: config.DEFAULT_AVATAR_URL,
            public: createChannelReq.public,
            members: [owner],
            alive: true,
          });
          newChannel.save().then(() => {
            owner.channels.push(newChannel._id);
            owner.save().then(() => {
              console.log('api/channels/createChannel: Channel created.');
              res.sendStatus(201);
            });
          });
        } else {
          console.log('api/channels/createChannel: Invalid channel description.');
          res.status(400).send('SERVER: Invalid channel description!');
        }
      } else {
        console.log('api/channels/createChannel: Invalid channel name.');
        res.status(400).send('SERVER: Invalid channel name!');
      }
    } else {
      console.log('api/channels/createChannel: User not found.');
      res.status(400).send('SERVER: User not found!');
    }
  });
});

router.post('/joinChannel/:channelId', auth.required, async (req, res) => {
  const {payload: {id}} = req;
  console.log('api/channels/joinChannel: Started');
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
                    console.log('api/channels/joinChannel:', user.username, 'joined ', channel.name);
                    res.sendStatus(200);
                  });
                });
              }
            } else {
              console.log('api/channels/joinChannel: User already in channel.');
              res.status(400).send('SERVER: User already in channel');
            }
          } else {
            console.log('api/channels/joinChannel: Channel has been deleted.');
            res.status(400).send('SERVER: Channel has been deleted');
          }
        } else {
          console.log('api/channels/joinChannel: Channel not found.');
          res.status(400).send('SERVER: Channel not found!');
        }
      });
    } else {
      console.log('api/channels/joinChannel: User not found.');
      res.status(400).send('SERVER: User not found!');
    }
  });
});

router.post('/leaveChannel/:channelId', auth.required, async (req, res) => {
  const {payload: {id}} = req;
  console.log('api/channels/leaveChannel: Started.');
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
                console.log('api/channels/leaveChannel:', user.username, 'left channel', channel.name);
                res.sendStatus(200);
              });
            });
          } else {
            console.log('api/channels/leaveChannel: The owner cannot leave their channel.');
            res.status(400).send('SERVER: The owner cannot leave their channel. Set another user to owner before leaving.');
          }
        } else {
          console.log('api/channels/leaveChannel: Channel not found.');
          res.status(400).send('SERVER: Channel not found!');
        }
      });
    } else {
      console.log('api/channels/leaveChannel: User not found.');
      res.status(400).send('SERVER: User not found!');
    }
  });
});

router.post('/deleteChannel/:channelId', auth.required, async (req, res) => {
  const {payload: {id}} = req;
  console.log('api/channels/deleteChannel: Started.');
  User.findById(id).then((user) => {
    if (user) {
      Channel.findById(req.params.channelId).then((channel) => {
        if (channel) {
          if (channel.owner.toString() === id) {
            channel.alive = false;
            channel.save().then(() => {
              console.log('api/channels/deleteChannel: deleted channel.');
              res.sendStatus(200);
            });
          } else {
            console.log('api/channels/deleteChannel: User is not the owner of this channel.');
            res.status(422).send('SERVER: User is not the owner of this channel!');
          }
        } else {
          console.log('api/channels/deleteChannel: Channel not found.');
          res.status(400).send('SERVER: Channel not found!');
        }
      });
    } else {
      console.log('api/channels/deleteChannel: User not found.');
      res.status(400).send('SERVER: User not found!');
    }
  });
});
// {
//   "transferOwnershipReq": {
//     "userId": "String",
//     "channelId": "String",
//   }
// }
router.post('/transferOwnership', auth.required, async (req, res) => {
  const {payload: {id}} = req;
  const {body: {transferOwnershipReq}} = req;
  console.log('api/channels/transferOwnership: Started.');
  User.findById(id).then((user) => {
    if (user) {
      Channel.findById(transferOwnershipReq.channelId).then ((channel) => {
        if (channel) {
          if (channel.owner.toString() === id) {
            User.findById(transferOwnershipReq.userId).then ((newOwner) => {
              console.log(transferOwnershipReq.userId);
              console.log(newOwner);
              if (newOwner) {
                channel.owner = newOwner;
                channel.save().then(() => {
                  console.log('api/channels/transferOwnership: New owner is', channel.owner.username);
                  res.sendStatus(200);
                });
              } else {
                console.log('api/channels/transferOwnership: New owner id is invalid.');
                res.status(400).send('SERVER: New owner id is invalid!');
              }
            })
          } else {
            console.log('api/channels/transferOwnership: User is not the owner of this channel.');
            res.status(400).send('SERVER: User is not the owner of this channel!');
          }
        } else {
          console.log('api/channels/transferOwnership: Channel not found.');
          res.status(400).send('SERVER: Channel not found!');
        }
      });
    } else {
      console.log('api/channels/transferOwnership: User not found.');
      res.status(400).send('SERVER: User not found!');
    }
  });
});
// {
//   "editChannelReq": {
//     "channelId": "String",
//     "name": "String",
//     "description": "String",
//     "avatar": "String",
//     "public": "Boolean"
//   }
// }
router.post('/editChannel', auth.required, async (req, res) => {
  const {payload: {id}} = req;
  const {body: {editChannelReq}} = req;
  console.log('api/channels/editChannel: Started.');
  User.findById(id).then((user) => {
    if (user) {
      Channel.findById(editChannelReq.channelId).then((channel) => {
        if (channel) {
          if (channel.owner.toString() === id) {
            console.log(editChannelReq);
            if (channelNameValidation(editChannelReq.name)) {
              channel.name = editChannelReq.name;
            } else {
              console.log('api/channels/editChannel: name not found or failed validation.');
            }
            if (channelDescriptionValidation(editChannelReq.description)) {
              channel.description = editChannelReq.description;
            } else {
              console.log('api/channels/editChannel: description not found or failed validation.');
            }
            if (channelAvatarValidation(editChannelReq.avatar)) {
              channel.avatar = editChannelReq.avatar;
            } else {
              console.log('api/channels/editChannel: avatar not found or failed validation.');
            }
            if (editChannelReq.public) {
              channel.public = editChannelReq.public;
            }
            console.log(channel);
            channel.save().then(() => {
              console.log('api/channels/editChannel: settings saved.');
              res.sendStatus(200);
            });
          } else {
            console.log('api/channels/editChannel: User is not the owner of this channel.');
            res.status(422).send('SERVER: User is not the owner of this channel!');
          }
        } else {
          console.log('api/channels/editChannel: Channel not found.');
          res.status(400).send('SERVER: Channel not found!');
        }
      });
    } else {
      console.log('api/channels/editChannel: User not found.');
      res.status(400).send('SERVER: User not found!');
    }
  });
});

// router.get('/getInfo/:channelId', auth.optional, (req, res) => {
//   Channel.findById(req.params.channelId).populate('members').then((channel) => {
//     if (channel.public === true) {
//       console.log('api/channels/getInfo/: Info sent to client.');
//       res.json(channel);
//     } else {
//       res.status(400).send('SERVER: Channel not found!');
//     }
//     //else if for id for private channels here later
//   });
// });
// //need a route to add or remove officers

function channelNameValidation(name) {
  if (name) {
    if (name.length <= config.MAX_CHANNEL_NAME_LENGTH) {
      return true;
    }
  }
  return false;
}

function channelDescriptionValidation(description) {
  if (description) {
    if (description.length <= config.MAX_CHANNEL_DESCRIPTION_LENGTH) {
      return true;
    }
  }
  return false;
}

function channelAvatarValidation(avatar) {
  if (avatar) {
    return true;
  }
  return false;
}
module.exports = router;
