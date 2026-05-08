const Joi = require('joi');

const createSubscriptionSchema = Joi.object({
  planSlug: Joi.string().valid('basic', 'pro', 'enterprise').required().messages({
    'any.only': 'Plan must be basic, pro, or enterprise',
    'any.required': 'Plan slug is required',
  }),
});

const upgradeSubscriptionSchema = Joi.object({
  planSlug: Joi.string().valid('pro', 'enterprise').required().messages({
    'any.only': 'Upgrade target must be pro or enterprise',
    'any.required': 'New plan slug is required',
  }),
});

const reSubscribeSchema = Joi.object({
  planSlug: Joi.string().valid('basic', 'pro', 'enterprise').required().messages({
    'any.only': 'Plan must be basic, pro, or enterprise',
    'any.required': 'Plan slug is required',
  }),
});

const verifyPaymentSchema = Joi.object({
  razorpay_payment_id: Joi.string().required(),
  razorpay_subscription_id: Joi.string().required(),
  razorpay_signature: Joi.string().required(),
});

module.exports = {
  createSubscriptionSchema,
  upgradeSubscriptionSchema,
  reSubscribeSchema,
  verifyPaymentSchema,
};
