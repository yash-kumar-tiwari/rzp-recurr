const paymentService = require('../services/paymentService');
const { sendSuccess } = require('../utils/response');

// GET /api/payments/history?page=1&limit=10
const getPaymentHistory = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = Math.min(parseInt(req.query.limit) || 10, 50); // max 50 per page

    const result = await paymentService.getUserPaymentHistory(req.user.id, { page, limit });
    return sendSuccess(res, result);
  } catch (error) {
    next(error);
  }
};

module.exports = { getPaymentHistory };
