const express = require('express')
const router = express.Router();

router.use('/users', require('./users'));
router.use('/messages', require('./messages'));
router.use('/channels', require('./channels'));
router.use('/misc', require('./misc'));
router.use('/db', require('./db'));
module.exports = router;
