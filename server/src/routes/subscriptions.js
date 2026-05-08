const express = require('express');
const router = express.Router();
const subscriptionController = require('../controllers/subscriptionController');
const { verifyToken } = require('../middlewares/auth');
const validate = require('../middlewares/validate');
const {
  createSubscriptionSchema,
  upgradeSubscriptionSchema,
  reSubscribeSchema,
} = require('../validators/subscriptionValidators');

router.use(verifyToken);

router.get('/me', subscriptionController.getMySubscription);
router.get('/upgrade-preview', subscriptionController.getUpgradePreview);
router.post('/', validate(createSubscriptionSchema), subscriptionController.createSubscription);
router.post('/verify-payment', subscriptionController.verifyPayment);
router.patch('/upgrade', validate(upgradeSubscriptionSchema), subscriptionController.upgradeSubscription);
router.post('/verify-upgrade-payment', subscriptionController.verifyUpgradePayment);
router.post('/cancel', subscriptionController.cancelSubscription);
router.post('/resubscribe', validate(reSubscribeSchema), subscriptionController.reSubscribe);

module.exports = router;
