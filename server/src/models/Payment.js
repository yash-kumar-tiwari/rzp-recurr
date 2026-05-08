const mongoose = require('mongoose');

const PAYMENT_TYPES = ['new_subscription', 'upgrade', 'renewal', 'retry'];

const paymentSchema = new mongoose.Schema(
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
    razorpayPaymentId: {
      type: String,
      required: true,
      unique: true,
    },
    razorpayOrderId: {
      type: String,
    },
    amount: {
      type: Number,
      required: true,
    },
    currency: {
      type: String,
      default: 'INR',
    },
    status: {
      type: String,
      enum: ['captured', 'failed', 'refunded', 'created'],
      default: 'captured',
    },
    method: {
      type: String,
      default: 'card',
    },
    description: {
      type: String,
      default: '',
    },
    paidAt: {
      type: Date,
      default: Date.now,
    },

    paymentType: {
      type: String,
      enum: PAYMENT_TYPES,
      default: 'new_subscription',
    },
    creditApplied: {
      type: Number,
      default: 0,
    },
    payableAmount: {
      type: Number,
    },
    fullPlanAmount: {
      type: Number,
    },
    upgradeReference: {
      fromPlanId: { type: mongoose.Schema.Types.ObjectId, ref: 'Plan' },
      fromPlanName: String,
      toPlanId: { type: mongoose.Schema.Types.ObjectId, ref: 'Plan' },
      toPlanName: String,
    },
    rawResponse: {
      type: mongoose.Schema.Types.Mixed,
    },
  },
  { timestamps: true }
);

paymentSchema.index({ userId: 1 });
paymentSchema.index({ subscriptionId: 1 });
paymentSchema.index({ userId: 1, paidAt: -1 });
paymentSchema.index({ razorpayPaymentId: 1 });
paymentSchema.index({ razorpayOrderId: 1 });

module.exports = mongoose.model('Payment', paymentSchema);
module.exports.PAYMENT_TYPES = PAYMENT_TYPES;
