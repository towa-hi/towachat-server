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
  User.findById(id).then((owner) => {
    new Channel({
      owner: owner,
      time: Date.now(),
      name: createChannelReq.name,
      description: createChannelReq.description,
      avatar: config.DEFAULT_AVATAR_URL,
      public: createChannelReq.public,
      members: [owner],
    }).save().then(() => {
      if (!owner) {
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
//
//   }
// }
router.post('/joinChannel', auth.required, async (req, res) => {
  const {payload: {id}} = req;
  const {body: {joinChannelReq}} = req;
  User.findById(id).then((user) => {
    if (user) {
      Channel.findById(joinChannelReq.channelId).then((channel) => {
        if (channel) {
          if (user.channels.indexOf(channel._id) === -1) {
            user.channels.push(channel._id);
            if (channel.members.indexOf(user._id) === -1) {
              channel.members.push(user._id);
              user.save().then(() => {
                channel.save().then(() => {
                  console.log(user.username, 'joined ', channel.name);
                  res.status(200);
                });
              });
            }
          } else {
            res.status(400).send('SERVER: user already in channel');
          }
        } else {
          res.status(400).send('SERVER: channel not found!');
        }
      });
    } else {
      res.status(400).send('SERVER: user not found!');
    }
  });
});

// {
//   "deleteChannelReq": {
//     "channelId": "String",
//
//   }
// }
// router.post('/deleteChannel', auth.required, async (req, res) => {
//   const {payload: {id}} = req;
//   const {body: {deleteChannelReq}} = req;
//   User.findById(id).then((user) => {
//     if (user) {
//       Channel.findById(deleteChannelReq.channelId).then( (channel) => {
//         console.log(channel);
//         for (index in channel.members) {
//           console.log(channel.members[index]);
//           User.findById(channel.members[index]).then((member) => {
//             console.log(member);
//             var newChannels = []
//             for (index in member.channels) {
//               if (member.channels[index] !== deleteChannelReq.channelId) {
//                 newChannels.push(member.channels[index]);
//               }
//             }
//             member.channels = newChannels;
//             member.save().then(() => {
//               console.log('channels list refreshed for', user.username);
//             })
//           })
//         }
//       }).catch((error) => {
//         console.log('FUG');
//       });
//     }
//   }).catch((error) => {
//     console.log('FUCK');
//   });
//   req.sendStatus(200);
// })












module.exports = router;
