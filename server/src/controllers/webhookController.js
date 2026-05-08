const Razorpay = require('razorpay');
const Subscription = require('../models/Subscription');
const Payment = require('../models/Payment');
const SubscriptionHistory = require('../models/SubscriptionHistory');
const paymentService = require('../services/paymentService');
const logger = require('../utils/logger');

const processedEvents = new Set();

const handleWebhook = async (req, res) => {
  const signature = req.headers['x-razorpay-signature'];
  const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;

  try {
    const isValid = Razorpay.validateWebhookSignature(
      req.body.toString(),
      signature,
      webhookSecret
    );

    if (!isValid) {
      logger.warn('Invalid Razorpay webhook signature');
      return res.status(400).json({ success: false, message: 'Invalid signature' });
    }
  } catch (err) {
    logger.error('Webhook signature validation error:', err.message);
    return res.status(400).json({ success: false, message: 'Signature validation failed' });
  }

  let event;
  try {
    event = JSON.parse(req.body.toString());
  } catch {
    return res.status(400).json({ success: false, message: 'Invalid JSON payload' });
  }

  const eventId = event.event + '_' + (event.payload?.subscription?.entity?.id || event.payload?.payment?.entity?.id || '');
  if (processedEvents.has(eventId)) {
    return res.status(200).json({ success: true, message: 'Already processed' });
  }

  logger.info(`Webhook received: ${event.event}`);

  res.status(200).json({ success: true });

  try {
    processedEvents.add(eventId);
    await processWebhookEvent(event);
    setTimeout(() => processedEvents.delete(eventId), 60000);
  } catch (err) {
    logger.error(`Error processing webhook event ${event.event}:`, err.message);
  }
};

const recordStatusChange = (subscription, newStatus, reason = '') => {
  if (!subscription.statusHistory) {
    subscription.statusHistory = [];
  }
  subscription.statusHistory.push({
    from: subscription.status,
    to: newStatus,
    changedAt: new Date(),
    reason,
  });
};

const processWebhookEvent = async (event) => {
  const { entity } = event.payload.subscription || {};
  const paymentEntity = event.payload.payment?.entity;

  if (!entity && !paymentEntity) return;

  switch (event.event) {
    case 'subscription.authenticated': {
      if (!entity) break;
      const sub = await Subscription.findOneAndUpdate(
        { razorpaySubscriptionId: entity.id, status: 'created' },
        { status: 'authenticated' },
        { new: true }
      );
      if (sub) {
        recordStatusChange(sub, 'authenticated', 'Customer authenticated');
        await sub.save();
        logger.info(`Subscription authenticated: ${entity.id}`);
      }
      break;
    }

    case 'subscription.activated': {
      if (!entity) break;
      const activatedSub = await Subscription.findOneAndUpdate(
        { razorpaySubscriptionId: entity.id },
        {
          status: 'active',
          currentStart: entity.current_start ? new Date(entity.current_start * 1000) : undefined,
          currentEnd: entity.current_end ? new Date(entity.current_end * 1000) : undefined,
          chargeAt: entity.charge_at ? new Date(entity.charge_at * 1000) : undefined,
          paidCount: entity.paid_count || 0,
          remainingCount: entity.remaining_count,
        },
        { new: true }
      );
      if (activatedSub) {
        recordStatusChange(activatedSub, 'active', 'Subscription activated');
        await activatedSub.save();
        logger.info(`Subscription activated: ${entity.id}`);
      }
      break;
    }

    case 'subscription.charged': {
      if (!entity) break;
      const chargedSub = await Subscription.findOneAndUpdate(
        { razorpaySubscriptionId: entity.id },
        {
          status: 'active',
          currentStart: entity.current_start ? new Date(entity.current_start * 1000) : undefined,
          currentEnd: entity.current_end ? new Date(entity.current_end * 1000) : undefined,
          chargeAt: entity.charge_at ? new Date(entity.charge_at * 1000) : undefined,
          paidCount: entity.paid_count || 0,
          remainingCount: entity.remaining_count,
        },
        { new: true }
      );

      if (chargedSub && paymentEntity) {
        recordStatusChange(chargedSub, 'active', 'Recurring charge applied');
        await chargedSub.save();

        await paymentService.recordPayment({
          userId: chargedSub.userId,
          subscriptionId: chargedSub._id,
          razorpayPaymentId: paymentEntity.id,
          amount: paymentEntity.amount,
          currency: paymentEntity.currency,
          status: paymentEntity.status === 'captured' ? 'captured' : 'failed',
          method: paymentEntity.method,
          description: paymentEntity.description || 'Subscription charge',
          paidAt: paymentEntity.created_at ? new Date(paymentEntity.created_at * 1000) : new Date(),
          paymentType: 'renewal',
          fullPlanAmount: paymentEntity.amount,
        });

        try {
          await SubscriptionHistory.create({
            userId: chargedSub.userId,
            subscriptionId: chargedSub._id,
            event: 'renewed',
            razorpayPaymentId: paymentEntity.id,
            razorpaySubscriptionId: entity.id,
            description: `Billing cycle ${chargedSub.paidCount || 0} completed`,
          });
        } catch (e) {
          logger.error('Failed to record renewal history:', e.message);
        }
      }
      logger.info(`Subscription charged: ${entity.id}`);
      break;
    }

    case 'subscription.cancelled': {
      if (!entity) break;
      const cancelledSub = await Subscription.findOne({ razorpaySubscriptionId: entity.id });
      if (cancelledSub && cancelledSub.status !== 'cancelled') {
        recordStatusChange(cancelledSub, 'cancelled', 'Cancelled via webhook');
        cancelledSub.status = 'cancelled';
        cancelledSub.endedAt = new Date();
        cancelledSub.cancelledAt = new Date();
        cancelledSub.expiresAt = cancelledSub.currentEnd || new Date();
        cancelledSub.renewalStatus = 'stopped';
        await cancelledSub.save();

        try {
          await SubscriptionHistory.create({
            userId: cancelledSub.userId,
            subscriptionId: cancelledSub._id,
            event: 'cancelled',
            razorpaySubscriptionId: entity.id,
            description: 'Subscription cancelled via Razorpay webhook',
          });
        } catch (e) {
          logger.error('Failed to record cancel history:', e.message);
        }

        logger.info(`Subscription cancelled via webhook: ${entity.id}`);
      }
      break;
    }

    case 'subscription.completed': {
      if (!entity) break;
      const completedSub = await Subscription.findOneAndUpdate(
        { razorpaySubscriptionId: entity.id },
        { status: 'completed', endedAt: new Date(), renewalStatus: 'stopped' },
        { new: true }
      );
      if (completedSub) {
        recordStatusChange(completedSub, 'completed', 'All billing cycles completed');
        await completedSub.save();

        try {
          await SubscriptionHistory.create({
            userId: completedSub.userId,
            subscriptionId: completedSub._id,
            event: 'completed',
            razorpaySubscriptionId: entity.id,
            description: 'Subscription completed all billing cycles',
          });
        } catch (e) {
          logger.error('Failed to record complete history:', e.message);
        }
        logger.info(`Subscription completed: ${entity.id}`);
      }
      break;
    }

    case 'subscription.halted': {
      if (!entity) break;
      const haltedSub = await Subscription.findOneAndUpdate(
        { razorpaySubscriptionId: entity.id },
        { status: 'halted' },
        { new: true }
      );
      if (haltedSub) {
        recordStatusChange(haltedSub, 'halted', 'Payment failures - subscription halted');
        await haltedSub.save();
        logger.warn(`Subscription halted (payment failures): ${entity.id}`);
      }
      break;
    }

    case 'subscription.pending': {
      if (!entity) break;
      await Subscription.findOneAndUpdate(
        { razorpaySubscriptionId: entity.id },
        { status: 'pending' }
      );
      logger.info(`Subscription pending: ${entity.id}`);
      break;
    }

    case 'payment.authorized': {
      if (!paymentEntity?.order_id) break;
      const orderId = paymentEntity.order_id;
      const paySub = await Subscription.findOne({ razorpayOrderId: orderId });
      if (paySub && paymentEntity) {
        if (!paySub.paymentAttempts) paySub.paymentAttempts = [];
        paySub.paymentAttempts.push({
          razorpayPaymentId: paymentEntity.id,
          orderId,
          amount: paymentEntity.amount,
          status: 'captured',
          attemptedAt: new Date(),
        });
        await paySub.save();
      }
      break;
    }

    case 'payment.captured': {
      if (!paymentEntity) break;

      const existingPayment = await Payment.findOne({ razorpayPaymentId: paymentEntity.id });
      if (!existingPayment) {
        let paySubId = null;
        if (paymentEntity.subscription_id) {
          const subDoc = await Subscription.findOne({ razorpaySubscriptionId: paymentEntity.subscription_id });
          if (subDoc) paySubId = subDoc._id;
        }

        if (paySubId) {
          await paymentService.recordPayment({
            userId: paymentEntity.notes?.userId || (paySubId ? (await Subscription.findById(paySubId))?.userId : undefined),
            subscriptionId: paySubId,
            razorpayPaymentId: paymentEntity.id,
            razorpayOrderId: paymentEntity.order_id,
            amount: paymentEntity.amount,
            currency: paymentEntity.currency,
            status: 'captured',
            method: paymentEntity.method,
            description: paymentEntity.description || 'Payment captured',
            paidAt: paymentEntity.created_at ? new Date(paymentEntity.created_at * 1000) : new Date(),
            paymentType: paymentEntity.order_id ? 'upgrade' : 'new_subscription',
            fullPlanAmount: paymentEntity.amount,
            rawResponse: paymentEntity,
          });
        }
      }
      logger.info(`Payment captured: ${paymentEntity.id}`);
      break;
    }

    case 'payment.failed': {
      if (paymentEntity) {
        logger.warn(`Payment failed: ${paymentEntity.id}`);

        if (paymentEntity.order_id) {
          const failedPaySub = await Subscription.findOne({ razorpayOrderId: paymentEntity.order_id });
          if (failedPaySub) {
            if (!failedPaySub.paymentAttempts) failedPaySub.paymentAttempts = [];
            failedPaySub.paymentAttempts.push({
              razorpayPaymentId: paymentEntity.id,
              orderId: paymentEntity.order_id,
              amount: paymentEntity.amount,
              status: 'failed',
              attemptedAt: new Date(),
            });
            await failedPaySub.save();
          }
        }

        if (paymentEntity.subscription_id) {
          const failedSub = await Subscription.findOne({ razorpaySubscriptionId: paymentEntity.subscription_id });
          if (failedSub) {
            try {
              await SubscriptionHistory.create({
                userId: failedSub.userId,
                subscriptionId: failedSub._id,
                event: 'payment_failed',
                razorpayPaymentId: paymentEntity.id,
                razorpaySubscriptionId: paymentEntity.subscription_id,
                description: `Payment failed: ${paymentEntity.error_description || 'Unknown error'}`,
                metadata: { error: paymentEntity.error_description },
              });
            } catch (e) {
              logger.error('Failed to record payment failure:', e.message);
            }
          }
        }
      }
      break;
    }

    default:
      logger.debug(`Unhandled webhook event: ${event.event}`);
  }
};

module.exports = { handleWebhook };
