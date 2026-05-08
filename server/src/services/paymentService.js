const Payment = require('../models/Payment');

const getUserPaymentHistory = async (userId, { page = 1, limit = 10 } = {}) => {
  const skip = (page - 1) * limit;

  const [payments, total] = await Promise.all([
    Payment.find({ userId })
      .sort({ paidAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('subscriptionId', 'razorpaySubscriptionId')
      .lean(),
    Payment.countDocuments({ userId }),
  ]);

  return {
    payments,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
};

const recordPayment = async ({
  userId,
  subscriptionId,
  razorpayPaymentId,
  razorpayOrderId,
  amount,
  currency = 'INR',
  status = 'captured',
  method = 'card',
  description = '',
  paidAt,
  paymentType = 'new_subscription',
  creditApplied = 0,
  payableAmount,
  fullPlanAmount,
  upgradeReference,
  rawResponse,
}) => {
  const existing = await Payment.findOne({ razorpayPaymentId });
  if (existing) return existing;

  return Payment.create({
    userId,
    subscriptionId,
    razorpayPaymentId,
    razorpayOrderId,
    amount,
    currency,
    status,
    method,
    description,
    paidAt: paidAt ? new Date(paidAt) : new Date(),
    paymentType,
    creditApplied,
    payableAmount,
    fullPlanAmount,
    upgradeReference,
    rawResponse,
  });
};

module.exports = { getUserPaymentHistory, recordPayment };
