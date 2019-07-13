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
//
// }
// router.post('/joinChannel', auth.required, async (req, res) => {
//   const {payload: {id}} = req;
//   const {body: {joinChannelReq}} = req;
//   Channel.findById(channelId))
// });

module.exports = router;
