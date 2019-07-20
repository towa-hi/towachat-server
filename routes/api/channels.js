const mongoose = require('mongoose');
const passport = require('passport');
const router = require('express').Router();
const auth = require('../auth');
const User = mongoose.model('User');
const Message = mongoose.model('Message');
const Channel = mongoose.model('Channel');
const config = require('../../config/main');
const bodyParser = require('body-parser');

router.get('/allPublicChannels', auth.optional, async (req, res) => {


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
    new Channel({
      owner: owner,
      time: Date.now(),
      name: createChannelReq.name,
      description: createChannelReq.description,
      avatar: config.DEFAULT_AVATAR_URL,
      public: createChannelReq.public,
      members: [owner],
      alive: true,
    }).save().then(() => {
      if (!owner) {
        console.log('api/channels/createCHannel: Invalid token detected.');
        res.status(400).send('SERVER: Invalid token detected!');
      }
      console.log('api/channels/createChannel: Channel created');
      res.sendStatus(201);
    });
  });
});

// {
//   "joinChannelReq": {
//     "channelId": "String",
//   }
// }
router.post('/joinChannel', auth.required, async (req, res) => {
  const {payload: {id}} = req;
  const {body: {joinChannelReq}} = req;
  console.log('api/channels/joinChannel: Started');
  User.findById(id).then((user) => {
    if (user) {
      Channel.findById(joinChannelReq.channelId).then((channel) => {
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
// {
//   "leaveChannelReq": {
//     "channelId": "String",
//   }
// }
router.post('/leaveChannel', auth.required, async (req, res) => {
  const {payload: {id}} = req;
  const {body: {leaveChannelReq}} = req;
  console.log('api/channels/leaveChannel: Started.');
  User.findById(id).then((user) => {
    if (user) {
      Channel.findById(leaveChannelReq.channelId).then((channel) => {
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
// {
//   "deleteChannelReq": {
//     "channelId": "String",
//   }
// }
router.post('/deleteChannel', auth.required, async (req, res) => {
  const {payload: {id}} = req;
  const {body: {deleteChannelReq}} = req;
  console.log('api/channels/deleteChannel: Started.');
  User.findById(id).then((user) => {
    if (user) {
      Channel.findById(deleteChannelReq.channelId).then((channel) => {
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
router.post('/transferOwnership', auth.required, async(req, res) => {
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

module.exports = router;
