const Plan = require('../models/Plan');
const Subscription = require('../models/Subscription');
const SubscriptionHistory = require('../models/SubscriptionHistory');
const Payment = require('../models/Payment');
const razorpayService = require('./razorpayService');
const User = require('../models/User');

const calcProration = (subscription, currentPrice) => {
  const now = new Date();

  let cycleStart = subscription.currentStart;
  let cycleEnd = subscription.currentEnd;

  if (!cycleStart || !cycleEnd || cycleEnd <= now) {
    cycleStart = subscription.createdAt;
    cycleEnd = new Date(subscription.createdAt.getTime() + 30 * 24 * 60 * 60 * 1000);
  }

  const MS_PER_DAY = 1000 * 60 * 60 * 24;
  const totalDays = Math.max(1, (cycleEnd - cycleStart) / MS_PER_DAY);
  const daysRemaining = Math.max(0, (cycleEnd - now) / MS_PER_DAY);

  const remainingCredit = Math.round((daysRemaining / totalDays) * currentPrice);

  return {
    remainingCredit,
    daysRemaining: Math.ceil(daysRemaining),
    totalDays: Math.round(totalDays),
    cycleStart,
    cycleEnd,
  };
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

const recordHistoryEvent = async ({
  userId,
  subscriptionId,
  event,
  planId,
  planName,
  price,
  metadata = {},
  previousPlanName,
  previousPrice,
  creditApplied,
  amountPaid,
  razorpayPaymentId,
  razorpaySubscriptionId,
  orderId,
  description,
}) => {
  try {
    await SubscriptionHistory.create({
      userId,
      subscriptionId,
      event,
      planId,
      planName,
      price,
      metadata,
      previousPlanName,
      previousPrice,
      creditApplied,
      amountPaid,
      razorpayPaymentId,
      razorpaySubscriptionId,
      orderId,
      description,
    });
  } catch (err) {
    console.error('Failed to record history event:', err.message);
  }
};

const getUserSubscription = async (userId) => {
  return Subscription.findOne({ userId })
    .sort({ createdAt: -1 })
    .populate('planId', 'name slug price features description');
};

const getUpgradePreview = async (userId, targetPlanSlug) => {
  const subscription = await Subscription.findOne({
    userId,
    status: { $in: ['active', 'authenticated'] },
  }).populate('planId', 'slug sortOrder price name');

  if (!subscription) {
    const err = new Error('No upgradeable subscription found');
    err.statusCode = 404;
    throw err;
  }

  const targetPlan = await Plan.findOne({ slug: targetPlanSlug, isActive: true });
  if (!targetPlan) {
    const err = new Error('Plan not found');
    err.statusCode = 404;
    throw err;
  }

  if (targetPlan.sortOrder <= subscription.planId.sortOrder) {
    const err = new Error('Target plan is not higher than current plan');
    err.statusCode = 400;
    throw err;
  }

  const currentPrice = subscription.planId.price;
  const newPrice = targetPlan.price;

  const { remainingCredit, daysRemaining, totalDays } = calcProration(subscription, currentPrice);
  const amountToPay = Math.max(0, newPrice - remainingCredit);

  return {
    currentPlan: subscription.planId.name,
    currentPrice,
    newPlan: targetPlan.name,
    newPrice,
    remainingCredit,
    amountToPay,
    daysRemaining,
    totalDays,
  };
};

const createUserSubscription = async (userId, planSlug) => {
  const existing = await Subscription.findOne({
    userId,
    status: { $in: ['created', 'authenticated', 'active', 'pending'] },
  });

  if (existing) {
    const err = new Error('You already have an active subscription. Please upgrade instead.');
    err.statusCode = 400;
    throw err;
  }

  const plan = await Plan.findOne({ slug: planSlug, isActive: true });
  if (!plan) {
    const err = new Error('Plan not found');
    err.statusCode = 404;
    throw err;
  }

  const user = await User.findById(userId).select('name email');

  const razorpaySub = await razorpayService.createSubscription({
    razorpayPlanId: plan.razorpayPlanId,
    totalCount: 12,
    customerName: user.name,
    customerEmail: user.email,
  });

  const subscription = await Subscription.create({
    userId,
    planId: plan._id,
    razorpaySubscriptionId: razorpaySub.id,
    status: razorpaySub.status || 'created',
    totalCount: razorpaySub.total_count,
    remainingCount: razorpaySub.remaining_count,
    renewalStatus: 'active',
    statusHistory: [
      { from: null, to: razorpaySub.status || 'created', changedAt: new Date(), reason: 'New subscription created' },
    ],
  });

  await recordHistoryEvent({
    userId,
    subscriptionId: subscription._id,
    event: 'subscribed',
    planId: plan._id,
    planName: plan.name,
    price: plan.price,
    razorpaySubscriptionId: razorpaySub.id,
    description: `Subscribed to ${plan.name} plan`,
  });

  return {
    subscription: await subscription.populate('planId', 'name slug price features'),
    razorpaySubscriptionId: razorpaySub.id,
    razorpayKeyId: process.env.RAZORPAY_KEY_ID,
  };
};

const upgradeUserSubscription = async (userId, newPlanSlug) => {
  const subscription = await Subscription.findOne({
    userId,
    status: { $in: ['active', 'authenticated'] },
  }).populate('planId', 'slug sortOrder price name');

  if (!subscription) {
    const err = new Error('No active subscription found to upgrade');
    err.statusCode = 404;
    throw err;
  }

  const newPlan = await Plan.findOne({ slug: newPlanSlug, isActive: true });
  if (!newPlan) {
    const err = new Error('Target plan not found');
    err.statusCode = 404;
    throw err;
  }

  if (newPlan.sortOrder <= subscription.planId.sortOrder) {
    const err = new Error('You can only upgrade to a higher plan');
    err.statusCode = 400;
    throw err;
  }

  const currentPrice = subscription.planId.price;
  const newPrice = newPlan.price;

  const { remainingCredit, daysRemaining, totalDays } = calcProration(subscription, currentPrice);
  const amountToPay = Math.max(0, newPrice - remainingCredit);

  const amountInPaise = Math.round(amountToPay * 100);

  const user = await User.findById(userId).select('name email');

  const receipt = `upg_${userId.toString().slice(-8)}_${Date.now()}`;

  const razorpayOrder = await razorpayService.createOrder({
    amountInPaise,
    currency: 'INR',
    receipt,
    notes: {
      type: 'upgrade',
      userId: userId.toString(),
      currentPlan: subscription.planId.slug,
      newPlan: newPlan.slug,
      remainingCredit: remainingCredit.toString(),
    },
  });

  subscription.razorpayOrderId = razorpayOrder.id;
  subscription.orderAmount = amountInPaise;
  subscription.nextPlan = newPlan._id;
  subscription.nextPlanName = newPlan.name;
  await subscription.save();

  return {
    razorpayOrderId: razorpayOrder.id,
    razorpayKeyId: process.env.RAZORPAY_KEY_ID,
    amountToPay,
    amountInPaise,
    remainingCredit,
    daysRemaining,
    totalDays,
    currentPlan: subscription.planId.name,
    currentPrice,
    newPlanName: newPlan.name,
    newPrice,
    subscriptionId: subscription._id,
  };
};

const verifyUpgradePayment = async (userId, { razorpayPaymentId, razorpayOrderId, razorpaySignature }) => {
  const crypto = require('crypto');

  const text = `${razorpayOrderId}|${razorpayPaymentId}`;
  const expected = crypto
    .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
    .update(text)
    .digest('hex');

  if (expected !== razorpaySignature) {
    const err = new Error('Payment signature verification failed');
    err.statusCode = 400;
    throw err;
  }

  const subscription = await Subscription.findOne({
    userId,
    razorpayOrderId,
    status: { $in: ['active', 'authenticated'] },
  }).populate('planId', 'slug sortOrder price name');

  if (!subscription) {
    const err = new Error('Subscription not found for this upgrade');
    err.statusCode = 404;
    throw err;
  }

  const newPlan = await Plan.findById(subscription.nextPlan);
  if (!newPlan) {
    const err = new Error('Target plan not found');
    err.statusCode = 404;
    throw err;
  }

  const currentPrice = subscription.planId.price;
  const newPrice = newPlan.price;
  const { remainingCredit, daysRemaining } = calcProration(subscription, currentPrice);
  const amountToPay = Math.max(0, newPrice - remainingCredit);

  let razorpayPayment;
  try {
    razorpayPayment = await razorpayService.fetchPayment(razorpayPaymentId);
  } catch (e) {
    console.error('Could not fetch payment details:', e.message);
  }

  const oldPlanName = subscription.planId.name;
  const oldPlanId = subscription.planId._id;

  try {
    await razorpayService.cancelSubscription(subscription.razorpaySubscriptionId);
  } catch (err) {
    if (!err.message?.includes('already cancelled')) throw err;
  }

  recordStatusChange(subscription, 'cancelled', 'Upgraded to new plan');
  subscription.status = 'cancelled';
  subscription.endedAt = new Date();
  subscription.cancelledAt = new Date();
  subscription.previousPlan = oldPlanId;
  subscription.previousPlanName = oldPlanName;

  if (!subscription.upgradeHistory) subscription.upgradeHistory = [];
  subscription.upgradeHistory.push({
    fromPlanId: oldPlanId,
    fromPlanName: oldPlanName,
    toPlanId: newPlan._id,
    toPlanName: newPlan.name,
    amountPaid: amountToPay,
    creditApplied: remainingCredit,
    orderId: razorpayOrderId,
    upgradedAt: new Date(),
  });

  await subscription.save();

  const user = await User.findById(userId).select('name email');

  const newRazorpaySub = await razorpayService.createSubscription({
    razorpayPlanId: newPlan.razorpayPlanId,
    totalCount: subscription.remainingCount || 12,
    customerName: user.name,
    customerEmail: user.email,
  });

  const newSubscription = await Subscription.create({
    userId,
    planId: newPlan._id,
    razorpaySubscriptionId: newRazorpaySub.id,
    status: newRazorpaySub.status || 'created',
    totalCount: newRazorpaySub.total_count,
    remainingCount: newRazorpaySub.remaining_count,
    renewalStatus: 'active',
    previousPlan: oldPlanId,
    previousPlanName: oldPlanName,
    statusHistory: [
      { from: null, to: newRazorpaySub.status || 'created', changedAt: new Date(), reason: 'Upgraded from ' + oldPlanName },
    ],
    upgradeHistory: [
      {
        fromPlanId: oldPlanId,
        fromPlanName: oldPlanName,
        toPlanId: newPlan._id,
        toPlanName: newPlan.name,
        amountPaid: amountToPay,
        creditApplied: remainingCredit,
        orderId: razorpayOrderId,
        upgradedAt: new Date(),
      },
    ],
  });

  await Payment.create({
    userId,
    subscriptionId: newSubscription._id,
    razorpayPaymentId,
    razorpayOrderId,
    amount: amountToPay * 100,
    currency: 'INR',
    status: 'captured',
    method: razorpayPayment?.method || 'card',
    description: `Upgrade: ${oldPlanName} → ${newPlan.name}`,
    paidAt: new Date(),
    paymentType: 'upgrade',
    creditApplied: remainingCredit,
    payableAmount: amountToPay,
    fullPlanAmount: newPrice,
    upgradeReference: {
      fromPlanId: oldPlanId,
      fromPlanName: oldPlanName,
      toPlanId: newPlan._id,
      toPlanName: newPlan.name,
    },
    rawResponse: razorpayPayment || {},
  });

  await recordHistoryEvent({
    userId,
    subscriptionId: newSubscription._id,
    event: 'upgraded',
    planId: newPlan._id,
    planName: newPlan.name,
    price: newPrice,
    previousPlanName: oldPlanName,
    previousPrice: currentPrice,
    creditApplied: remainingCredit,
    amountPaid: amountToPay,
    razorpayPaymentId,
    razorpaySubscriptionId: newRazorpaySub.id,
    orderId: razorpayOrderId,
    metadata: { daysRemaining },
    description: `Upgraded from ${oldPlanName} (₹${currentPrice}) to ${newPlan.name} (₹${newPrice})`,
  });

  const populatedNewSub = await newSubscription.populate('planId', 'name slug price features');

  return {
    subscription: populatedNewSub,
    razorpaySubscriptionId: newRazorpaySub.id,
    razorpayKeyId: process.env.RAZORPAY_KEY_ID,
    previousPlan: oldPlanName,
    previousPrice: currentPrice,
    newPlanName: newPlan.name,
    newPrice,
    remainingCredit,
    amountToPay,
    daysRemaining,
  };
};

const cancelUserSubscription = async (userId, cancelAtPeriodEnd = true) => {
  const subscription = await Subscription.findOne({
    userId,
    status: { $in: ['active', 'authenticated', 'created'] },
  });

  if (!subscription) {
    const err = new Error('No active subscription to cancel');
    err.statusCode = 404;
    throw err;
  }

  if (cancelAtPeriodEnd && subscription.currentEnd) {
    await razorpayService.cancelSubscription(subscription.razorpaySubscriptionId, true);

    subscription.cancelAtPeriodEnd = true;
    subscription.cancelledAt = new Date();
    subscription.expiresAt = subscription.currentEnd;
    subscription.renewalStatus = 'stopped';
    recordStatusChange(subscription, 'cancelled', 'Cancelled at period end');
    subscription.status = 'cancelled';
    subscription.endedAt = subscription.currentEnd;
    await subscription.save();

    await recordHistoryEvent({
      userId,
      subscriptionId: subscription._id,
      event: 'cancelled',
      planId: subscription.planId,
      planName: subscription.planId?.name,
      description: `Cancelled at period end. Access until ${subscription.currentEnd?.toISOString().split('T')[0]}`,
    });

    return {
      subscription: await subscription.populate('planId', 'name slug price features'),
      accessUntil: subscription.currentEnd,
      cancelledAtPeriodEnd: true,
    };
  }

  await razorpayService.cancelSubscription(subscription.razorpaySubscriptionId, false);

  recordStatusChange(subscription, 'cancelled', 'Cancelled immediately');
  subscription.status = 'cancelled';
  subscription.endedAt = new Date();
  subscription.cancelledAt = new Date();
  subscription.expiresAt = new Date();
  subscription.renewalStatus = 'stopped';
  await subscription.save();

  await recordHistoryEvent({
    userId,
    subscriptionId: subscription._id,
    event: 'cancelled',
    planId: subscription.planId,
    planName: subscription.planId?.name,
    description: 'Cancelled immediately',
  });

  return {
    subscription: await subscription.populate('planId', 'name slug price features'),
    accessUntil: new Date(),
    cancelledAtPeriodEnd: false,
  };
};

const reSubscribe = async (userId, planSlug) => {
  const existingLive = await Subscription.findOne({
    userId,
    status: { $in: ['created', 'authenticated', 'active', 'pending'] },
  });

  if (existingLive) {
    const err = new Error('You already have an active subscription');
    err.statusCode = 400;
    throw err;
  }

  const plan = await Plan.findOne({ slug: planSlug, isActive: true });
  if (!plan) {
    const err = new Error('Plan not found');
    err.statusCode = 404;
    throw err;
  }

  const user = await User.findById(userId).select('name email');

  const razorpaySub = await razorpayService.createSubscription({
    razorpayPlanId: plan.razorpayPlanId,
    totalCount: 12,
    customerName: user.name,
    customerEmail: user.email,
  });

  const subscription = await Subscription.create({
    userId,
    planId: plan._id,
    razorpaySubscriptionId: razorpaySub.id,
    status: razorpaySub.status || 'created',
    totalCount: razorpaySub.total_count,
    remainingCount: razorpaySub.remaining_count,
    renewalStatus: 'active',
    statusHistory: [
      { from: null, to: razorpaySub.status || 'created', changedAt: new Date(), reason: 'Re-subscribed' },
    ],
  });

  await recordHistoryEvent({
    userId,
    subscriptionId: subscription._id,
    event: 'resubscribed',
    planId: plan._id,
    planName: plan.name,
    price: plan.price,
    razorpaySubscriptionId: razorpaySub.id,
    description: `Re-subscribed to ${plan.name} plan`,
  });

  return {
    subscription: await subscription.populate('planId', 'name slug price features'),
    razorpaySubscriptionId: razorpaySub.id,
    razorpayKeyId: process.env.RAZORPAY_KEY_ID,
  };
};

const verifyPayment = async (userId, { razorpayPaymentId, razorpaySubscriptionId, razorpaySignature }) => {
  const crypto = require('crypto');

  const text = `${razorpayPaymentId}|${razorpaySubscriptionId}`;
  const expected = crypto
    .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
    .update(text)
    .digest('hex');

  if (expected !== razorpaySignature) {
    const err = new Error('Payment signature verification failed');
    err.statusCode = 400;
    throw err;
  }

  let razorpayPayment;
  try {
    razorpayPayment = await razorpayService.fetchPayment(razorpayPaymentId);
  } catch (e) {
    console.error('Could not fetch payment details:', e.message);
  }

  const subscription = await Subscription.findOneAndUpdate(
    {
      razorpaySubscriptionId,
      userId,
      status: { $in: ['created', 'authenticated'] },
    },
    { status: 'authenticated' },
    { new: true }
  ).populate('planId', 'name slug price features');

  if (!subscription) {
    const err = new Error('Subscription not found');
    err.statusCode = 404;
    throw err;
  }

  if (subscription.statusHistory) {
    subscription.statusHistory.push({
      from: 'created',
      to: 'authenticated',
      changedAt: new Date(),
      reason: 'Payment verified',
    });
    await subscription.save();
  }

  const existingPayment = await Payment.findOne({ razorpayPaymentId });
  if (!existingPayment) {
    await Payment.create({
      userId,
      subscriptionId: subscription._id,
      razorpayPaymentId,
      amount: razorpayPayment?.amount || 0,
      currency: razorpayPayment?.currency || 'INR',
      status: razorpayPayment?.status === 'captured' ? 'captured' : 'failed',
      method: razorpayPayment?.method || 'card',
      description: `New subscription - ${subscription.planId?.name || ''}`,
      paidAt: razorpayPayment?.created_at ? new Date(razorpayPayment.created_at * 1000) : new Date(),
      paymentType: 'new_subscription',
      fullPlanAmount: subscription.planId?.price || 0,
      rawResponse: razorpayPayment || {},
    });
  }

  await recordHistoryEvent({
    userId,
    subscriptionId: subscription._id,
    event: 'authenticated',
    planId: subscription.planId?._id,
    planName: subscription.planId?.name,
    price: subscription.planId?.price,
    razorpayPaymentId,
    razorpaySubscriptionId,
    description: `Payment verified for ${subscription.planId?.name || ''} plan`,
  });

  return { subscription };
};

module.exports = {
  getUserSubscription,
  getUpgradePreview,
  createUserSubscription,
  upgradeUserSubscription,
  verifyUpgradePayment,
  cancelUserSubscription,
  reSubscribe,
  verifyPayment,
};
