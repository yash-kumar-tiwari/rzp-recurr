const subscriptionService = require('../services/subscriptionService');
const { sendSuccess, sendCreated } = require('../utils/response');

const getMySubscription = async (req, res, next) => {
  try {
    const subscription = await subscriptionService.getUserSubscription(req.user.id);
    if (!subscription) return sendSuccess(res, { subscription: null }, 'No subscription found');
    return sendSuccess(res, { subscription });
  } catch (error) {
    next(error);
  }
};

const getUpgradePreview = async (req, res, next) => {
  try {
    const { planSlug } = req.query;
    if (!planSlug) {
      return res.status(400).json({ success: false, message: 'planSlug query param required' });
    }
    const preview = await subscriptionService.getUpgradePreview(req.user.id, planSlug);
    return sendSuccess(res, preview, 'Upgrade preview calculated');
  } catch (error) {
    next(error);
  }
};

const createSubscription = async (req, res, next) => {
  try {
    const { planSlug } = req.body;
    const result = await subscriptionService.createUserSubscription(req.user.id, planSlug);
    return sendCreated(res, result, 'Subscription initiated. Complete payment via Razorpay.');
  } catch (error) {
    next(error);
  }
};

const upgradeSubscription = async (req, res, next) => {
  try {
    const { planSlug } = req.body;
    const result = await subscriptionService.upgradeUserSubscription(req.user.id, planSlug);

    const message = `Upgrade to ${result.newPlanName} initiated. Pay ₹${result.amountToPay} via Razorpay. ` +
      `Credit applied: ₹${result.remainingCredit}.`;

    return sendSuccess(res, result, message);
  } catch (error) {
    next(error);
  }
};

const verifyUpgradePayment = async (req, res, next) => {
  try {
    const { razorpay_payment_id, razorpay_order_id, razorpay_signature } = req.body;

    if (!razorpay_payment_id || !razorpay_order_id || !razorpay_signature) {
      return res.status(400).json({ success: false, message: 'Missing payment verification fields' });
    }

    const result = await subscriptionService.verifyUpgradePayment(req.user.id, {
      razorpayPaymentId: razorpay_payment_id,
      razorpayOrderId: razorpay_order_id,
      razorpaySignature: razorpay_signature,
    });

    return sendSuccess(res, result, 'Upgrade payment verified. New subscription activated.');
  } catch (error) {
    next(error);
  }
};

const verifyPayment = async (req, res, next) => {
  try {
    const { razorpay_payment_id, razorpay_subscription_id, razorpay_signature } = req.body;

    if (!razorpay_payment_id || !razorpay_subscription_id || !razorpay_signature) {
      return res.status(400).json({ success: false, message: 'Missing payment verification fields' });
    }

    const result = await subscriptionService.verifyPayment(req.user.id, {
      razorpayPaymentId: razorpay_payment_id,
      razorpaySubscriptionId: razorpay_subscription_id,
      razorpaySignature: razorpay_signature,
    });

    return sendSuccess(res, result, 'Payment verified. Subscription is now active.');
  } catch (error) {
    next(error);
  }
};

const cancelSubscription = async (req, res, next) => {
  try {
    const { cancelAtPeriodEnd } = req.body;
    const cancelPeriodEnd = cancelAtPeriodEnd !== undefined ? cancelAtPeriodEnd : true;
    const result = await subscriptionService.cancelUserSubscription(req.user.id, cancelPeriodEnd);
    const msg = result.cancelledAtPeriodEnd
      ? `Subscription cancelled. You have access until ${result.accessUntil?.toISOString().split('T')[0]}.`
      : 'Subscription cancelled immediately.';
    return sendSuccess(res, result, msg);
  } catch (error) {
    next(error);
  }
};

const reSubscribe = async (req, res, next) => {
  try {
    const { planSlug } = req.body;
    const result = await subscriptionService.reSubscribe(req.user.id, planSlug);
    return sendCreated(res, result, 'Re-subscription initiated. Complete payment via Razorpay.');
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getMySubscription,
  getUpgradePreview,
  createSubscription,
  upgradeSubscription,
  verifyUpgradePayment,
  cancelSubscription,
  reSubscribe,
  verifyPayment,
};
