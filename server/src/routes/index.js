const express = require('express');
const router = express.Router();

router.use('/auth', require('./auth'));
router.use('/plans', require('./plans'));
router.use('/subscriptions', require('./subscriptions'));
router.use('/payments', require('./payments'));

module.exports = router;
