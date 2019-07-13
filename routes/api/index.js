const express = require('express')
const router = express.Router();

router.use('/users', require('./users'));
router.use('/messages', require('./messages'));
router.use('/channels', require('./channels'));
module.exports = router;
