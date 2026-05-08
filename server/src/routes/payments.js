const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');
const { verifyToken } = require('../middlewares/auth');

router.use(verifyToken);

router.get('/history', paymentController.getPaymentHistory);

module.exports = router;
