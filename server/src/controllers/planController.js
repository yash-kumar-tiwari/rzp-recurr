const Plan = require('../models/Plan');
const { sendSuccess, sendNotFound } = require('../utils/response');

// GET /api/plans - list all active plans
const getPlans = async (req, res, next) => {
  try {
    const plans = await Plan.find({ isActive: true })
      .sort({ sortOrder: 1 })
      .select('-__v -createdAt -updatedAt');
    return sendSuccess(res, { plans });
  } catch (error) {
    next(error);
  }
};

// GET /api/plans/:slug - single plan detail
const getPlanBySlug = async (req, res, next) => {
  try {
    const plan = await Plan.findOne({ slug: req.params.slug, isActive: true });
    if (!plan) return sendNotFound(res, 'Plan not found');
    return sendSuccess(res, { plan });
  } catch (error) {
    next(error);
  }
};

module.exports = { getPlans, getPlanBySlug };
