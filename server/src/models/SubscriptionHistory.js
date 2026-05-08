const mongoose = require('mongoose');

const HISTORY_EVENT_TYPES = [
  'subscribed',
  'upgraded',
  'downgraded',
  'cancelled',
  'resubscribed',
  'expired',
  'renewed',
  'payment_failed',
  'paused',
  'resumed',
  'completed',
  'activated',
  'authenticated',
];

const subscriptionHistorySchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    subscriptionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Subscription',
      required: true,
    },
    event: {
      type: String,
      enum: HISTORY_EVENT_TYPES,
      required: true,
    },
    planId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Plan',
    },
    planName: String,
    price: Number,

    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },

    previousPlanName: String,
    previousPrice: Number,

    creditApplied: Number,
    amountPaid: Number,

    razorpayPaymentId: String,
    razorpaySubscriptionId: String,
    orderId: String,

    description: { type: String, default: '' },
  },
  { timestamps: true }
);

subscriptionHistorySchema.index({ userId: 1, createdAt: -1 });
subscriptionHistorySchema.index({ subscriptionId: 1 });
subscriptionHistorySchema.index({ event: 1 });

module.exports = mongoose.model('SubscriptionHistory', subscriptionHistorySchema);
module.exports.HISTORY_EVENT_TYPES = HISTORY_EVENT_TYPES;
