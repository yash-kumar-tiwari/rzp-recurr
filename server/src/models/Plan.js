const mongoose = require('mongoose');

const planSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      // e.g. "Basic", "Pro", "Enterprise"
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      // e.g. "basic", "pro", "enterprise"
    },
    description: {
      type: String,
      default: '',
    },
    // Price in INR (rupees, not paise — stored as rupees for display)
    price: {
      type: Number,
      required: true,
    },
    currency: {
      type: String,
      default: 'INR',
    },
    interval: {
      type: String,
      enum: ['monthly', 'yearly'],
      default: 'monthly',
    },
    features: [String],
    // Razorpay plan ID (created via seed script)
    razorpayPlanId: {
      type: String,
      required: true,
    },
    // Billing cycles (period for Razorpay: "monthly")
    period: {
      type: String,
      default: 'monthly',
    },
    // Sorting order for display
    sortOrder: {
      type: Number,
      default: 0,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

planSchema.index({ slug: 1 });
planSchema.index({ isActive: 1, sortOrder: 1 });

module.exports = mongoose.model('Plan', planSchema);
