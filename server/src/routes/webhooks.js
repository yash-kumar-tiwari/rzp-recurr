const express = require('express');
const router = express.Router();
const webhookController = require('../controllers/webhookController');

// IMPORTANT: This route must receive RAW body (configured in app.js)
// Do NOT add express.json() here
router.post('/razorpay', express.raw({ type: 'application/json' }), webhookController.handleWebhook);

module.exports = router;
