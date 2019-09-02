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

//{"channels":["channelId","channelId"]}
router.post('/getChannelsById', auth.optional, (req, res) => {
  console.log('POST /db/getChannelsById: Request received.');
  Channel.find().where('_id').in(Object.values(req.body.channels)).then((results) => {
    console.log('POST /db/getChannelsById: Channels sent.');
    res.json(results);
  });
});

//{"messages":["messageId, "messageId"]}
router.post('/getMessagesById', auth.optional, (req, res) => {
  console.log('POST /db/getMessagesById: Request received.');
  Message.find().where('_id').in(Object.values(req.body.messages)).then((results) => {
    console.log('POST /db/getMessagesById: Messages sent.');
    res.json(results);
  });
});

router.post('/getUsersById', auth.optional, (req, res) => {
  console.log('POST /db/getUsersById: Request received.');
  User.find().where('_id').in(Object.values(req.body.users)).then((results) => {
    console.log('POST /db/getUsersById: Users sent.');
    res.json(results);
  });
});







module.exports = router;
