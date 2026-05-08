const mongoose = require('mongoose');

const SUBSCRIPTION_STATUSES = [
  'created',
  'authenticated',
  'active',
  'paused',
  'halted',
  'cancelled',
  'completed',
  'expired',
  'pending',
  'failed',
];

const statusChangeSchema = new mongoose.Schema(
  {
    from: { type: String },
    to: { type: String, required: true },
    changedAt: { type: Date, default: Date.now },
    reason: { type: String, default: '' },
  },
  { _id: false }
);

const upgradeEntrySchema = new mongoose.Schema(
  {
    fromPlanId: { type: mongoose.Schema.Types.ObjectId, ref: 'Plan' },
    fromPlanName: String,
    toPlanId: { type: mongoose.Schema.Types.ObjectId, ref: 'Plan' },
    toPlanName: String,
    amountPaid: Number,
    creditApplied: Number,
    orderId: String,
    upgradedAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const paymentAttemptSchema = new mongoose.Schema(
  {
    razorpayPaymentId: String,
    orderId: String,
    amount: Number,
    status: { type: String, enum: ['captured', 'failed', 'refunded', 'created'] },
    attemptedAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const subscriptionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    planId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Plan',
      required: true,
    },
    razorpaySubscriptionId: {
      type: String,
      required: true,
      unique: true,
    },
    status: {
      type: String,
      enum: SUBSCRIPTION_STATUSES,
      default: 'created',
    },
    currentStart: { type: Date },
    currentEnd: { type: Date },
    chargeAt: { type: Date },
    totalCount: { type: Number, default: 12 },
    paidCount: { type: Number, default: 0 },
    remainingCount: { type: Number },
    endedAt: { type: Date },

    cancelledAt: { type: Date },
    cancelAtPeriodEnd: { type: Boolean, default: false },
    expiresAt: { type: Date },

    previousPlan: { type: mongoose.Schema.Types.ObjectId, ref: 'Plan' },
    previousPlanName: String,
    nextPlan: { type: mongoose.Schema.Types.ObjectId, ref: 'Plan' },
    nextPlanName: String,

    renewalStatus: {
      type: String,
      enum: ['pending', 'active', 'failed', 'stopped'],
      default: 'active',
    },

    upgradeHistory: [upgradeEntrySchema],
    statusHistory: [statusChangeSchema],
    paymentAttempts: [paymentAttemptSchema],

    razorpayOrderId: { type: String },
    orderAmount: { type: Number },
  },
  { timestamps: true }
);

subscriptionSchema.index({ userId: 1 });
subscriptionSchema.index({ razorpaySubscriptionId: 1 });
subscriptionSchema.index({ userId: 1, status: 1 });
subscriptionSchema.index({ razorpayOrderId: 1 });
subscriptionSchema.index({ expiresAt: 1 });

module.exports = mongoose.model('Subscription', subscriptionSchema);
module.exports.SUBSCRIPTION_STATUSES = SUBSCRIPTION_STATUSES;
